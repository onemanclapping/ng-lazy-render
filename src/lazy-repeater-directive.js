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
    '$rootScope',
    '$templateCache',
    '$timeout',
    function ($animate, $compile, $parse, $rootScope, $templateCache, $timeout) {
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
                    // Only apply lazyRepeater if the threshold is smaller then the number of items and if the
                    // parameter lazy-if is true
                    if (limit < bufferLength && $parse(attrs.lazyIf)($scope) !== false) {
                        placeholder = attrs.lazyPlaceholder ?
                                $templateCache.get(attrs.lazyPlaceholder) || attrs.lazyPlaceholder : '';
                        placeholderEl = angular.element('<div in-view="$inview && increaseLimit()">' + placeholder +
                            '</div>');

                        isolateScope = $rootScope.$new();
                        isolateScope.increaseLimit = function () {
                            limit = Math.min(limit * 2, bufferLength);
                            // This triggers inview until all the element in the viewport are visible
                            $timeout(function () {
                                angular.element(window).triggerHandler('checkInView');
                            }, 0);
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
