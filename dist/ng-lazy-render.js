/**
 * Module declaration
 */
angular.module('ngLazyRender', []);
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
        console.log('oix')

        return {
            priority: 500,
            terminal: true,
            transclude: 'element',
            link: function ($scope, $element, $attr, ctrl, $transclude) {
                if ($parse($attr.lazyIf)($scope) === false) {
                    console.log('skip');
                    $transclude(function (clone) {
                        $animate.enter(clone, $element.parent(), $element);
                    });
                    return;
                }

                var el = angular.element($templateCache.get($attr.lazyModule));
                var isolateScope = $rootScope.$new();

                isolateScope.update = function (inView) {
                    if (inView) {
                        console.log('rendering');
                        isolateScope.$destroy();
                        isolateScope = null;

                        // $timeout(function () {

                        $transclude(function (clone) {
                            $animate.enter(clone, $element.parent(), $element);
                            $animate.leave(el);
                            el = null;
                        });
                        // }, 1000);
                    }
                };

                $animate.enter(el, $element.parent(), $element);
                $compile(el)(isolateScope);

                $timeout(function () {
                    inViewDirective[0].compile()(isolateScope, el, {
                        inView: "update($inview)"
                    });
                }, 100);
            }
        };
    }]);
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