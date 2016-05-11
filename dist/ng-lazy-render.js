/**
 * Module declaration
 */
angular.module('ngLazyRender', ['angular-inview']);
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
 * <my-module lazy-module="myModulePlaceholder.html" lazy-if="ctrl.acceleratePageLoad">
 *  <!-- lots of code -->
 * </my-module>
 */
angular.module('ngLazyRender').directive('lazyModule', [
    '$animate',
    '$compile',
    '$parse',
    '$rootScope',
    '$templateCache',
    '$timeout',
    'inViewDirective',
    function ($animate, $compile, $parse, $rootScope, $templateCache, $timeout, inViewDirective) {
        'use strict';

        return {
            // 500 because is less than ngIf and ngRepeat
            priority: 500,
            terminal: true,
            transclude: 'element',
            link: function ($scope, $element, $attr, ctrl, $transclude) {
                // If the expression in lazyIf is false, skip the directive's action
                if ($parse($attr.lazyIf)($scope) === false) {
                    $transclude(function (clone) {
                        $animate.enter(clone, $element.parent(), $element);
                    });
                    return;
                }

                var el = angular.element($templateCache.get($attr.lazyModule));
                var isolateScope = $rootScope.$new();

                // Callback for inViewDirective to be called when the module becomes visible.
                // This will destroy the scope of the placeholder with inView and replace it with
                // the actual transcluded content.
                isolateScope.update = function () {
                    // It is important to destroy the old scope or we'll get unwanted calls from
                    // the inView directive.
                    isolateScope.$destroy();
                    isolateScope = null;

                    $transclude(function (clone) {
                        $animate.enter(clone, $element.parent(), $element);
                        $animate.leave(el);
                        el = null;
                    });
                };

                $animate.enter(el, $element.parent(), $element);
                $compile(el)(isolateScope);

                // The number 100 here is a bit magic. We need to give the app some time to expand
                // other directives in the page before we detect if our module is in the viewport.
                // Postponing this to the next digest cycle should be enough but for some reason
                // it's not enough on some slower environments. 100ms seems to be enough.
                //
                // TODO: investigate why this happens
                $timeout(function () {
                    inViewDirective[0].compile()(isolateScope, el, {
                        inView: "$inview && update()"
                    });
                }, 100);
            }
        };
    }]);
/**
 * Use this directive as an attribute if you want a repeater (ng-repeat) to grow as the user scrolls down.
 * 
 * Attributes:
 * - lazyRepeater: number of initially shown items. This number is doubled every time the user sees the end of the list.
 * - lazyTemplate: template (or templateUrl) to be shown at the end of the list.
 *
 * Example:
 * <my-module lazy-module="myModulePlaceholder.html" lazy-if="ctrl.acceleratePageLoad">
 *  <!-- lots of code -->
 * </my-module>
 */
angular.module('ngLazyRender').directive('lazyRepeater', [
    '$animate',
    '$compile',
    '$rootScope',
    '$templateCache',
    '$timeout',
    function ($animate, $compile, $rootScope, $templateCache, $timeout) {
        'use strict';

        return {
            restrict: 'A',
            priority: 2000,

            compile: function (tElement, tAttrs) {
                var trackByIndex = tAttrs.ngRepeat.indexOf('track by');

                if (trackByIndex === -1) {
                    tAttrs.ngRepeat += "| limitTo: getLazyLimit()";
                } else {
                    tAttrs.ngRepeat = tAttrs.ngRepeat.substr(0, trackByIndex) +
                        "| limitTo: getLazyLimit() " + tAttrs.ngRepeat.substr(trackByIndex);
                }

                var bufferProp = tAttrs.ngRepeat.match(/in (.*?)?([ |\n|]|$)/)[1];

                return function ($scope, el, attrs) {
                    var limit = attrs.lazyRepeater;
                    var bufferLength = $scope.$eval(bufferProp).length;
                    var placeholder;
                    var placeholderEl;
                    var isolateScope;
                    if (limit < bufferLength) {
                        placeholder = attrs.lazyPlaceholder ?
                                $templateCache.get(attrs.lazyPlaceholder) || attrs.lazyPlaceholder : '';
                        placeholderEl = angular.element('<div in-view="$inview && increaseLimit()">' + placeholder +
                            '</div>');

                        isolateScope = $rootScope.$new();
                        isolateScope.increaseLimit = function () {
                            limit = Math.min(limit * 2, bufferLength);

                            if (limit === bufferLength) {
                                $timeout(function () {
                                    isolateScope.$destroy();
                                    $animate.leave(placeholderEl);
                                }, 0);
                            }
                        };

                        $animate.enter(placeholderEl, el.parent(), el);
                        $compile(placeholderEl)(isolateScope);

                        $scope.getLazyLimit = function () {
                            return limit;
                        };
                    }
                };
            }
        };
    }]);
