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
 * <any lazy-module="myModulePlaceholder.html" lazy-if="ctrl.acceleratePageLoad">
 *  <!-- lots of code -->
 * </any>
 */
angular.module(`ngLazyRender`).directive(`lazyModule`, [
    `$animate`,
    `$compile`,
    `$parse`,
    `$q`,
    `$templateCache`,
    `VisibilityService`,
    ($animate, $compile, $parse, $q, $templateCache, VisibilityService) => {
        `use strict`

        const removePlaceholder = ($transclude, scope, placeholderElem, moduleElem, finallyCb) => {
            // If the function is called after the scope is destroyed (more than once),
            // we should do nothing.
            if (scope === null) {
                return
            }

            // It is important to destroy the old scope or we'll never kill VisibilityService
            scope.$destroy()
            scope = null

            $transclude((clone) => {
                const enterPromise = $animate.enter(clone, moduleElem.parent(), moduleElem)
                const leavePromise = $animate.leave(placeholderElem)

                var promise = $q.all([enterPromise, leavePromise]).then(() => {
                    placeholderElem = null
                })

                if (finallyCb) {
                    promise.finally(finallyCb)
                }
            })
        }

        return {
            // 500 because is less than ngIf and ngRepeat
            priority: 500,
            terminal: true,
            transclude: `element`,
            link: function ($scope, $element, $attr, ctrl, $transclude) {
                // If the expression in lazyIf is false, skip the directive's action
                if ($parse($attr.lazyIf)($scope) === false) {
                    $transclude((clone) => {
                        $animate.enter(clone, $element.parent(), $element)
                    })
                    return
                }

                const el = angular.element($templateCache.get($attr.lazyModule))
                const isolateScope = $scope.$new(true)
                let watcher;

                if ($attr.lazyHide) {
                    //load the placeholder
                    $animate.enter(el, $element.parent(), $element).then(() => {
                        $compile(el)(isolateScope)
                    })

                    //watch lazyHide attribute, when true remove the placeholder, show the module and remove the watch
                    watcher = $scope.$watch($attr.lazyHide, (value) => {
                        if (!!value) {
                            removePlaceholder($transclude, isolateScope, el, $element, watcher)
                        }
                    })
                } else {
                    // Callback for VisibilityService to be called when the module becomes visible.
                    // This will destroy the scope of the placeholder and replace it with
                    // the actual transcluded content.
                    isolateScope.showModule = () => {
                        $scope.$applyAsync(() => {
                            removePlaceholder($transclude, isolateScope, el, $element)
                        })
                    }

                    $animate.enter(el, $element.parent(), $element).then(() => {
                        $compile(el)(isolateScope)
                        VisibilityService.whenVisible(el, isolateScope, isolateScope.showModule)
                    })
                }
            }
        }
    }])
