angular.module('ngLazyRender').directive('lazyRepeater', [
    function () {
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

                tElement.after('<div in-view="$inview && increaseLimit()"></div>');

                return function ($scope, el, attrs) {
                    var limit = attrs.lazyRepeater;
                    var bufferLength = $scope.$eval(bufferProp).length;

                    $scope.getLazyLimit = function () {
                        return limit;
                    };

                    $scope.increaseLimit = function () {
                        limit = Math.min(limit * 2, bufferLength);
                    };
                };
            }
        };
    }]);