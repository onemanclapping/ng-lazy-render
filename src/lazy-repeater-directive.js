angular.module('ngLazyRender').directive('lazyRepeater', [
    '$animate',
    '$compile',
    '$rootScope',
    function ($animate, $compile, $rootScope) {
        'use strict';

        return {
            restrict: 'A',
            priority: 2000,

            compile: function (tElement, tAttrs) {
                //delete tAttrs.lazyRepeater;
                var trackByIndex = tAttrs.ngRepeat.indexOf('track by');
                // var bufferIndex = 

                if (trackByIndex === -1) {
                    tAttrs.ngRepeat += "| limitTo: getLazyLimit()";
                } else {
                    tAttrs.ngRepeat = tAttrs.ngRepeat.substr(0, trackByIndex) +
                        "| limitTo: getLazyLimit() " + tAttrs.ngRepeat.substr(trackByIndex);
                }

                var rabo = tAttrs.ngRepeat.match(/in (.*?)?([ |\n|]|$)/)[1];

                tElement.after('<div in-view="$inview && increaseLimit()"></div>');

                return function ($scope, el, attrs) {
                    var limit = attrs.lazyRepeater;

                    var maxLimit = $scope.$eval(rabo).length;

                    $scope.getLazyLimit = function () {
                        return limit;
                    };

                    $scope.increaseLimit = function (i) {
                        console.log(i);
                        limit = Math.min(limit * 2, maxLimit);

                        console.log('now', limit)
                    };
                };
            }
        };
    }]);