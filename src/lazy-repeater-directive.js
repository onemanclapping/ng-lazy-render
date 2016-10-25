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
angular.module('ngLazyRender').directive('lazyRepeater', [
    '$animate',
    '$compile',
    '$parse',
    '$templateCache',
    '$timeout',
    function ($animate, $compile, $parse, $templateCache, $timeout) {
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
                    var delay = parseInt(attrs.lazyDelay);
                    var waiting = false;

                    var placeholderVisible = false;

                    function getBufferLength() {
                        return $scope.$eval(bufferProp).length;
                    }

                    function addPlaceholder() {
                        var placeholder = attrs.lazyPlaceholder ? $templateCache.get(attrs.lazyPlaceholder) || attrs.lazyPlaceholder : '';
                        var placeholderEl = angular.element('<div in-view="$inview && increaseLimit()">' + placeholder + '</div>');
                        var isolateScope = $scope.$new(true);

                        function increaseLimit() {
                            var bufferLength = getBufferLength();

                            limit *= 2;
                            
                            if (limit >= bufferLength) {
                                isolateScope.$destroy();
                                $animate.leave(placeholderEl);
                                placeholderVisible = false;
                            }

                            waiting = false;
                        }

                        isolateScope.increaseLimit = function () {
                            if (waiting) {
                                return;
                            }
                            waiting = true;

                            if (delay) {
                                $timeout(increaseLimit, delay);
                            } else {
                                increaseLimit();
                            }
                        };

                        var elSiblings = el.parent().children();
                        var elLastSibling = elSiblings.length === 0 ? el : elSiblings.eq(-1);

                        $animate.enter(placeholderEl, el.parent(), elLastSibling).then(function () {
                            // trigger in-view for other listeners
                            angular.element(window).triggerHandler('checkInView');
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
