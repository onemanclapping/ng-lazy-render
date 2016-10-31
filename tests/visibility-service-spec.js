describe('VisibilityService', () => {
	const $intervalMock = jasmine.createSpy('$interval').and.returnValue({})
	$intervalMock.cancel = jasmine.createSpy('$intervalCancel').and.stub()

	let $rootScope, VisibilityService

	beforeEach(() => {
		module('ngLazyRender')
		module(['$provide', ($provide) => {
			$provide.value('$interval', $intervalMock)
		}])

		inject([
			'$rootScope',
			'VisibilityService',
			(_$rootScope_, _VisibilityService_) => {
				$rootScope = _$rootScope_
				VisibilityService = _VisibilityService_
			}])
	})

	describe('_startWatching', () => {
		it('should call $interval, but only once', () => {
			expect($intervalMock).not.toHaveBeenCalled()
			VisibilityService._startWatching()
			expect($intervalMock.calls.count()).toBe(1)
			VisibilityService._startWatching()
			expect($intervalMock.calls.count()).toBe(1)
		})
	})

	describe('_stopWatching', () => {
		it('should call $interval.cancel but only once', () => {
			VisibilityService._startWatching()
			expect($intervalMock.cancel.calls.count()).toBe(0)
			VisibilityService._stopWatching()
			expect($intervalMock.cancel.calls.count()).toBe(1)
			VisibilityService._stopWatching()
			expect($intervalMock.cancel.calls.count()).toBe(1)
		})
	})

	describe('whenVisible', () => {
		it('should register that element and deregister upon scope destruction', () => {
			const element1 = angular.element('<div></div>')
			const scope1 = $rootScope.$new(true)
			const callbackSpy1 = jasmine.createSpy('callbackSpy')

			const element2 = angular.element('<div></div>')
			const scope2 = $rootScope.$new(true)
			const callbackSpy2 = jasmine.createSpy('callbackSpy')

			spyOn(VisibilityService, '_startWatching').and.callThrough()
			spyOn(VisibilityService, '_stopWatching').and.callThrough()

			VisibilityService.whenVisible(element1, scope1, callbackSpy1)

			expect(VisibilityService._startWatching).toHaveBeenCalled()
			expect(VisibilityService._stopWatching).not.toHaveBeenCalled()

			VisibilityService.whenVisible(element2, scope2, callbackSpy2)

			scope1.$destroy()

			expect(VisibilityService._stopWatching).not.toHaveBeenCalled()

			scope2.$destroy()

			expect(VisibilityService._stopWatching).toHaveBeenCalled()
		})
	})
})