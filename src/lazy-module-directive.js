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
    '$q',
    '$rootScope',
    '$templateCache',
    '$timeout',
    'inViewDirective',
    function ($animate, $compile, $parse, $q, $rootScope, $templateCache, $timeout, inViewDirective) {
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
                    // If the function is called after the scope is destroyed (more than once),
                    // we should do nothing.
                    if (isolateScope === null) {
                        return;
                    }
                    // It is important to destroy the old scope or we'll get unwanted calls from
                    // the inView directive.
                    isolateScope.$destroy();
                    isolateScope = null;

                    $transclude(function (clone) {
                        var enterPromise = $animate.enter(clone, $element.parent(), $element);
                        var leavePromise = $animate.leave(el);

                        $q.all([enterPromise, leavePromise]).then(function () {
                            el = null;

                            // This triggers inview again to make sure everything is checked again
                            angular.element(window).triggerHandler('checkInView');
                        });
                    });
                };

                $animate.enter(el, $element.parent(), $element).then(function () {
                    $compile(el)(isolateScope);
                    inViewDirective[0].compile()(isolateScope, el, {
                        inView: "$inview && update()"
                    });
                });
            }
        };
    }]);
