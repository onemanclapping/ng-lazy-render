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
            priority: 500,
            terminal: true,
            transclude: 'element',
            link: function ($scope, $element, $attr, ctrl, $transclude) {
                if ($parse($attr.lazyIf)($scope) === false) {
                    $transclude(function (clone) {
                        $animate.enter(clone, $element.parent(), $element);
                    });
                    return;
                }

                var el = angular.element($templateCache.get($attr.lazyModule));
                var isolateScope = $rootScope.$new();

                isolateScope.update = function (inView) {
                    if (inView) {
                        isolateScope.$destroy();
                        isolateScope = null;

                        $transclude(function (clone) {
                            $animate.enter(clone, $element.parent(), $element);
                            $animate.leave(el);
                            el = null;
                        });
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