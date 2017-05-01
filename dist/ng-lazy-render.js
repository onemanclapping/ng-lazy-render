'use strict';

/**
 * Module declaration
 */
angular.module('ngLazyRender', []);
/**
 * Use this directive as an attribute if you want to delay the rendering of a module until visible
 * in the viewport.
 *
 * Attributes:
 * - lazyModule: templateUrl of a placeholder to render while the module is not visible or while being
 *               rendered.
 * - lazyIf: use an angular expression here to set a condition on whether you want this directive to
 *           take action or be ignored.
 *
 * Example:
 * <any lazy-module="myModulePlaceholder.html" lazy-if="ctrl.acceleratePageLoad">
 *  <!-- lots of code -->
 * </any>
 */
angular.module('ngLazyRender').directive('lazyModule', ['$animate', '$compile', '$parse', '$q', '$templateCache', 'VisibilityService', function ($animate, $compile, $parse, $q, $templateCache, VisibilityService) {
    'use strict';

    var removePlaceholder = function removePlaceholder($transclude, scope, placeholderElem, moduleElem, finallyCb) {
        // If the function is called after the scope is destroyed (more than once),
        // we should do nothing.
        if (scope === null) {
            return;
        }

        // It is important to destroy the old scope or we'll never kill VisibilityService
        scope.$destroy();
        scope = null;

        $transclude(function (clone) {
            var enterPromise = $animate.enter(clone, moduleElem.parent(), moduleElem);
            var leavePromise = $animate.leave(placeholderElem);

            var promise = $q.all([enterPromise, leavePromise]).then(function () {
                placeholderElem = null;
            });

            if (finallyCb) {
                promise.finally(finallyCb);
            }
        });
    };

    return {
        // 500 because is less than ngIf and ngRepeat
        priority: 500,
        terminal: true,
        transclude: 'element',
        link: function link($scope, $element, $attr, ctrl, $transclude) {
            // If the expression in lazyIf is false, skip the directive's action
            if ($parse($attr.lazyIf)($scope) === false) {
                $transclude(function (clone) {
                    $animate.enter(clone, $element.parent(), $element);
                });
                return;
            }

            var el = angular.element($templateCache.get($attr.lazyModule));
            var isolateScope = $scope.$new(true);
            var watcher = void 0;

            if ($attr.lazyHide) {
                //load the placeholder
                $animate.enter(el, $element.parent(), $element).then(function () {
                    $compile(el)(isolateScope);
                });

                //watch lazyHide attribute, when true remove the placeholder, show the module and remove the watch
                watcher = $scope.$watch($attr.lazyHide, function (value) {
                    if (!!value) {
                        removePlaceholder($transclude, isolateScope, el, $element, watcher);
                    }
                });
            } else {
                // Callback for VisibilityService to be called when the module becomes visible.
                // This will destroy the scope of the placeholder and replace it with
                // the actual transcluded content.
                isolateScope.showModule = function () {
                    $scope.$applyAsync(function () {
                        removePlaceholder($transclude, isolateScope, el, $element);
                    });
                };

                $animate.enter(el, $element.parent(), $element).then(function () {
                    $compile(el)(isolateScope);
                    VisibilityService.whenVisible(el, isolateScope, isolateScope.showModule);
                });
            }
        }
    };
}]);

/**
 * Use this directive as an attribute if you want a repeater (ng-repeat) to grow as the user scrolls down.
 * 
 * Attributes:
 * - lazyRepeater: number of initially shown items. This number is doubled every time the user sees the end of the list.
 * - lazyTemplate: template (or templateUrl) to be shown at the end of the list.
 * - lazyIf: use an angular expression here to set a condition on whether you want this directive to
 *           take action or be ignored.
 *
 * Example:
 * <ul>
 *     <li ng-repeat="obj in data track by obj.index" 
 *      lazy-repeater="10"
 *      lazy-placeholder="templateUrl"
 *      lazy-if="ctrl.acceleratePageLoad">
 *          {{obj.data}}
 *     </li>
 * </ul>
 */
angular.module('ngLazyRender').directive('lazyRepeater', ['$animate', '$compile', '$parse', '$templateCache', 'VisibilityService', function ($animate, $compile, $parse, $templateCache, VisibilityService) {
    return {
        restrict: 'A',
        priority: 2000,
        compile: function compile(tElement, tAttrs) {
            var trackByIndex = tAttrs.ngRepeat.indexOf('track by');

            if (trackByIndex === -1) {
                tAttrs.ngRepeat += '| limitTo: getLazyLimit()';
            } else {
                tAttrs.ngRepeat = tAttrs.ngRepeat.substr(0, trackByIndex) + '| limitTo: getLazyLimit() ' + tAttrs.ngRepeat.substr(trackByIndex);
            }

            var bufferProp = tAttrs.ngRepeat.match(/in (.*?)?([ |\n|]|$)/)[1];

            return function ($scope, el, attrs) {
                var limit = attrs.lazyRepeater;
                var placeholderVisible = false;

                function getBufferLength() {
                    return $scope.$eval(bufferProp).length;
                }

                function addPlaceholder() {
                    var placeholder = attrs.lazyPlaceholder ? $templateCache.get(attrs.lazyPlaceholder) || attrs.lazyPlaceholder : '';
                    var placeholderEl = angular.element('<div>' + placeholder + '</div>');
                    var isolateScope = $scope.$new(true);

                    isolateScope.increaseLimit = function () {
                        $scope.$apply(function () {
                            var bufferLength = getBufferLength();

                            limit *= 2;

                            if (limit >= bufferLength) {
                                isolateScope.$destroy();
                                $animate.leave(placeholderEl);
                                placeholderVisible = false;
                            }
                        });
                    };

                    var elSiblings = el.parent().children();
                    var elLastSibling = elSiblings.length === 0 ? el : elSiblings.eq(-1);

                    $animate.enter(placeholderEl, el.parent(), elLastSibling).then(function () {
                        VisibilityService.whenVisible(placeholderEl, isolateScope, isolateScope.increaseLimit);
                    });
                    $compile(placeholderEl)(isolateScope);
                    placeholderVisible = true;
                }

                // Only apply lazyRepeater if the threshold is smaller then the number of items and if the
                // parameter lazy-if is true
                if (limit < getBufferLength() && $parse(attrs.lazyIf)($scope) !== false) {
                    addPlaceholder();

                    $scope.getLazyLimit = function () {
                        return limit;
                    };

                    $scope.$watch(getBufferLength, function (bufferLength) {
                        if (limit < bufferLength && !placeholderVisible) {
                            addPlaceholder();
                        }
                    });
                }
            };
        }
    };
}]);

angular.module('ngLazyRender').provider('VisibilityService', [function () {
    var delay = 500;

    this.setDelay = function (newDelay) {
        delay = newDelay;
    };

    this.$get = ['$interval', '$q', function ($interval, $q) {
        var intervalPromise = void 0;
        var watchingItems = [];
        var idCounter = 0;

        // Code fully stolen from angular-inview. Thanks thenikso!
        function getViewportHeight() {
            var height, mode, ref;
            height = window.innerHeight;
            if (height) {
                return height;
            }
            mode = document.compatMode;
            if (mode || !(typeof $ !== "undefined" && $ !== null ? (ref = $.support) != null ? ref.boxModel : void 0 : void 0)) {
                height = mode === 'CSS1Compat' ? document.documentElement.clientHeight : document.body.clientHeight;
            }
            return height;
        }

        // Code fully stolen from angular-inview. Thanks thenikso!
        function getBoundingClientRect(element) {
            var el, parent, top;
            if (element.getBoundingClientRect != null) {
                return element.getBoundingClientRect();
            }
            top = 0;
            el = element;
            while (el) {
                top += el.offsetTop;
                el = el.offsetParent;
            }
            parent = element.parentElement;
            while (parent) {
                if (parent.scrollTop != null) {
                    top -= parent.scrollTop;
                }
                parent = parent.parentElement;
            }
            return {
                top: top,
                bottom: top + element.offsetHeight
            };
        }

        function _startWatching() {
            if (!intervalPromise && delay) {
                intervalPromise = $interval(this.checkInView, delay, 0, false);
            }
        }

        function _stopWatching() {
            if (intervalPromise) {
                $interval.cancel(intervalPromise);
                intervalPromise = null;
            }
        }

        // Code partially stolen from angular-inview. Thanks thenikso!
        function checkInView() {
            var viewport = {
                top: 0,
                bottom: getViewportHeight()
            };
            var callbacks = [];

            watchingItems.forEach(function (item) {
                var bounds = getBoundingClientRect(item.element[0]);

                if (bounds.top < viewport.bottom && bounds.bottom >= viewport.top) {
                    callbacks.push(item.callback);
                }
            });

            callbacks.forEach(function (callback) {
                callback();
            });
        }

        function whenVisible(element, scope, callback) {
            var _this = this;

            var itemId = idCounter++;

            watchingItems.push({
                element: element,
                callback: callback,
                scope: scope,
                id: itemId
            });

            scope.$on('$destroy', function () {
                watchingItems = watchingItems.filter(function (item) {
                    return item.id !== itemId;
                });

                if (watchingItems.length === 0) {
                    _this._stopWatching();
                }
            });

            this._startWatching();
        }

        return {
            _startWatching: _startWatching,
            _stopWatching: _stopWatching,
            checkInView: checkInView,
            whenVisible: whenVisible
        };
    }];
}]);