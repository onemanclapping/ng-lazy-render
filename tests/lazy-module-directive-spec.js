describe('lazyModule directive', function () {
    var $compile, $rootScope, $templateCache, $timeout, inViewDirective;

    beforeEach(function () {
        module('ngLazyRender');

        inject(['$compile',
            '$rootScope',
            '$templateCache',
            '$timeout',
            'inViewDirective',
            function (_$compile_, _$rootScope_, _$templateCache_, _$timeout_, _inViewDirective_) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $timeout = _$timeout_;
                $templateCache = _$templateCache_;
                inViewDirective = _inViewDirective_[0];
            }]);
    });

    it('should show a placeholder (instead of the module) until it becomes visible', function () {
        $templateCache.put('templateUrl', '<placeholder></placeholder>')

        var initialScope = $rootScope.$new();
        var el = $compile('<div><module lazy-module="templateUrl"></module></div>')(initialScope);

        // After compiling the directive we should no longer be able to see the content
        expect(el.find('module').length).toBe(0);

        // Also, we should now see the placeholder (article) and it should have its own scope
        var lazyScope = el.find('placeholder').scope();
        expect(lazyScope).not.toBe(initialScope);

        // inView's compile function should only be called after the small delay
        spyOn(inViewDirective, 'compile').and.callThrough();
        expect(inViewDirective.compile).not.toHaveBeenCalled();

        $timeout.flush()

        expect(inViewDirective.compile).toHaveBeenCalled();

        // When the placeholder becomes visible, its update function is called.
        // Let us pretend it happened!
        lazyScope.update();

        // Now the placeholder should not be visible anymore
        expect(el.find('placeholder').length).toBe(0);

        // And the module should be visivle again
        expect(el.find('module').length).not.toBe(0);
    });

    it('should show the module immediately if the lazy-if parameter is false', function () {
        $templateCache.put('templateUrl', '<placeholder></placeholder>')

        var initialScope = $rootScope.$new();
        var el = $compile('<div><module lazy-module="templateUrl" lazy-if="false"></module></div>')(initialScope);

        // After compiling the directive we should no longer be able to see the content
        expect(el.find('module').length).not.toBe(0);
    });
})