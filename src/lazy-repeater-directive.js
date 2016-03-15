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
                };
            }
        };
    }]);
