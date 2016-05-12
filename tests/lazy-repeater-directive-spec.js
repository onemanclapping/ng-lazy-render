describe('lazyRepeater directive', function () {
    var $compile, $rootScope, $templateCache, $timeout;

    beforeEach(function () {
        module('ngLazyRender');

        inject(['$compile',
            '$rootScope',
            '$templateCache',
            '$timeout',
            function (_$compile_, _$rootScope_, _$templateCache_, _$timeout_) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $templateCache = _$templateCache_;
                $timeout = _$timeout_;
            }]);
    });

    it('should increase the number of shown elements of a repeater as we see the last one', function () {
        $templateCache.put('templateUrl', '<placeholder></placeholder>');

        var initialScope = $rootScope.$new();
        initialScope.data = [];

        for (var i = 0; i < 30; i += 1) {
            initialScope.data.push({
                index: i,
                data: 'such data'
            });
        }

        var el = $compile('<ul><li ng-repeat="obj in data track by obj.index" lazy-repeater="10" lazy-placeholder="templateUrl">{{obj.data}}</li></ul>')(initialScope);
        $rootScope.$apply();

        // After compiling the directive we should only see 10 elements
        expect(el.find('li').length).toBe(10);
        // And the placeholder
        expect(el.find('placeholder').length).toBe(1);

        // Let's now play god and simulate that the placeholder is now visible
        el.find('placeholder').scope().increaseLimit();
        $rootScope.$apply();

        // We should now be able to see 20 elements
        expect(el.find('li').length).toBe(20);
        // But still the placeholder
        expect(el.find('placeholder').length).toBe(1);

        // Let's now play god again
        el.find('placeholder').scope().increaseLimit();
        $rootScope.$apply();

        // We should now be able to see all elements (30)
        expect(el.find('li').length).toBe(30);
        // And, on the next digest cycle, no placeholder
        $timeout.flush();
        expect(el.find('placeholder').length).toBe(0);
    });

    it('should not render the placeholder when the object length is less then the lazy-repeater parameter', function () {
        $templateCache.put('templateUrl', '<placeholder></placeholder>');

        var initialScope = $rootScope.$new();
        initialScope.data = [];

        for (var i = 0; i < 8; i += 1) {
            initialScope.data.push({
                index: i,
                data: 'such data'
            });
        }

        var el = $compile('<ul><li ng-repeat="obj in data track by obj.index" lazy-repeater="10" lazy-placeholder="templateUrl">{{obj.data}}</li></ul>')(initialScope);
        $rootScope.$apply();

        // After compiling the directive we should see all the 8 elements
        expect(el.find('li').length).toBe(8);
        // The placeholder doesn't exist
        expect(el.find('placeholder').length).toBe(0);
        
    });

    it('should show all the elements when lazy-if parameter is false', function () {
        $templateCache.put('templateUrl', '<placeholder></placeholder>');

        var initialScope = $rootScope.$new();
        initialScope.data = [];

        for (var i = 0; i < 10; i += 1) {
            initialScope.data.push({
                index: i,
                data: 'such data'
            });
        }

        var el = $compile('<ul><li ng-repeat="obj in data track by obj.index" lazy-repeater="2" lazy-placeholder="templateUrl" lazy-if="false">{{obj.data}}</li></ul>')(initialScope);
        $rootScope.$apply();

        // After compiling the directive we should see all the 8 elements
        expect(el.find('li').length).toBe(10);
        // The placeholder doesn't exist
        expect(el.find('placeholder').length).toBe(0);

    });

    it('should render the placeholder when lazy-if parameter is true', function () {
        $templateCache.put('templateUrl', '<placeholder></placeholder>');

        var initialScope = $rootScope.$new();
        initialScope.data = [];

        for (var i = 0; i < 30; i += 1) {
            initialScope.data.push({
                index: i,
                data: 'such data'
            });
        }

        var el = $compile('<ul><li ng-repeat="obj in data track by obj.index" lazy-repeater="5" lazy-placeholder="templateUrl" lazy-if="true">{{obj.data}}</li></ul>')(initialScope);
        $rootScope.$apply();

        // After compiling the directive we should see all the 8 elements
        expect(el.find('li').length).toBe(5);
        // The placeholder doesn't exist
        expect(el.find('placeholder').length).toBe(1);

    });

    it('Should trigger checkInView', function () {
        $templateCache.put('templateUrl', '<placeholder></placeholder>');

        var initialScope = $rootScope.$new();
        var triggerHandler = jasmine.createSpy();

        initialScope.data = [];
        angular.element(window).bind('checkInView', triggerHandler);

        for (var i = 0; i < 30; i += 1) {
            initialScope.data.push({
                index: i,
                data: 'such data'
            });
        }

        var el = $compile('<ul><li ng-repeat="obj in data track by obj.index" lazy-repeater="5" lazy-placeholder="templateUrl" lazy-if="true">{{obj.data}}</li></ul>')(initialScope);

        el.find('placeholder').scope().increaseLimit();

        expect(triggerHandler).not.toHaveBeenCalled();
        $rootScope.$apply();
        $timeout.flush();

        expect(triggerHandler).toHaveBeenCalled();

        // After compiling the directive we should see all the 20 elements
        expect(el.find('li').length).toBe(20);
        // The placeholder doesn't exist
        expect(el.find('placeholder').length).toBe(1);

    });

})