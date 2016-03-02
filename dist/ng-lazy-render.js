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