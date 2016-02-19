/**
 * Module declaration
 */
angular.module('ngLazyRender', []);
angular.module('ngLazyRender').directive('ngLazyModule', [
    '$animate',
    '$compile',
    '$rootScope',
    '$timeout',
    'inViewDirective',
    function ($animate, $compile, $rootScope, $timeout, inViewDirective) {
        'use strict';

        return {
            priority: 500,
            terminal: true,
            transclude: 'element',
            link: function ($scope, $element, $attr, ctrl, $transclude) {
                var visible = true;
                var el = angular.element('<div class="cenas" style="position:relative;height:' + $attr.lazyTemplate + 'px"><div class="spinner center"></div></div>')
                var isolateScope = $rootScope.$new();

                isolateScope.update = function (inView) {
                    // return;
                    if (inView) {
                        // $timeout(function () {
                            
                        
                        var newEl = $transclude(function(clone, newScope) {
                            $animate.leave(el);
                            el = null;
                            isolateScope.$destroy();
                            isolateScope = null;
                            
                            $animate.enter(clone, $element.parent(), $element);
                        });
                        console.log('loaded', newEl);
                        // }, 1000);
                    }
                };

                $animate.enter(el, $element.parent(), $element);
                
                $compile(el)(isolateScope);

                $timeout(function () {
                    inViewDirective[0].compile()(isolateScope, el, {
                        inView: "update($inview)"
                    });
                }, 1000);
            }
        }
    }]);