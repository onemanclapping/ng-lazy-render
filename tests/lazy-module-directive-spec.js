describe(`lazyModule directive`, () => {
    let $animate, $compile, $rootScope, $templateCache, $timeout, inViewDirective, VisibilityService

    beforeEach(() => {
        module(`ngLazyRender`)
        module(`ngAnimateMock`)

        inject([
            `$animate`,
            `$compile`,
            `$rootScope`,
            `$templateCache`,
            `$timeout`,
            `VisibilityService`,
            (_$animate_, _$compile_, _$rootScope_, _$templateCache_, _$timeout_, _VisibilityService_) => {
                $animate = _$animate_
                $compile = _$compile_
                $rootScope = _$rootScope_
                $timeout = _$timeout_
                $templateCache = _$templateCache_
                VisibilityService = _VisibilityService_
            }])

        spyOn(VisibilityService, `whenVisible`).and.callThrough()
    })

    it(`should show a placeholder (instead of the module) until it becomes visible`, () => {
        $templateCache.put(`templateUrl`, `<placeholder></placeholder>`)

        let initialScope = $rootScope.$new()
        let el = $compile(`<div><module lazy-module="templateUrl"></module></div>`)(initialScope)

        // After compiling the directive we should no longer be able to see the content
        expect(el.find(`module`).length).toBe(0)

        // VisibilityService should only be called after the animation is done
        expect(VisibilityService.whenVisible).not.toHaveBeenCalled()

        // flush animations
        $animate.flush()

        expect(VisibilityService.whenVisible).toHaveBeenCalled()

        // Also, we should now see the placeholder (article) and it should have its own scope
        let lazyScope = el.find(`placeholder`).scope()
        expect(lazyScope).not.toBe(initialScope)

        // When the placeholder becomes visible, its update function is called.
        // Let us pretend it happened!
        lazyScope.showModule()
        $rootScope.$digest()

        // Now the placeholder should not be visible anymore
        expect(el.find(`placeholder`).length).toBe(0)

        // And the module should be visivle again
        expect(el.find(`module`).length).not.toBe(0)
    })

    it(`should show the module immediately if the lazy-if parameter is false`, () => {
        $templateCache.put(`templateUrl`, `<placeholder></placeholder>`)

        let initialScope = $rootScope.$new()
        let el = $compile(`<div><module lazy-module="templateUrl" lazy-if="false"></module></div>`)(initialScope)

        // After compiling the directive we should no longer be able to see the content
        expect(el.find(`module`).length).not.toBe(0)
    })

    it('should show the placeholder only when we tell it to', function () {
        $templateCache.put('templateUrl', '<placeholder></placeholder>')
        $rootScope.hidePlaceholder = false

        var initialScope = $rootScope.$new()
        var el = $compile('<div><module lazy-module="templateUrl" lazy-hide="hidePlaceholder"></module></div>')(initialScope)

        // After compiling the directive we should no longer be able to see the content
        expect(el.find('module').length).toBe(0)

        // Also, we should now see the placeholder (article) and it should have its own scope
        var lazyScope = el.find('placeholder').scope()
        expect(lazyScope).not.toBe(initialScope)

        $rootScope.hidePlaceholder = true
        initialScope.$digest()
        // Now the placeholder should not be visible anymore
        expect(el.find('placeholder').length).toBe(0)

        // And the module should be visible again
        expect(el.find('module').length).not.toBe(0)
    })
})
