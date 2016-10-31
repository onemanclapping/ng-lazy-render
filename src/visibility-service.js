angular.module(`ngLazyRender`).provider(`VisibilityService`, [function () {
  let delay = 500

  this.setDelay = function (newDelay) {
    delay = newDelay
  }

  this.$get = [`$interval`, `$q`, function ($interval, $q) {
    let intervalPromise
    let watchingItems = []
    let idCounter = 0

    // Code fully stolen from angular-inview. Thanks thenikso!
    function getViewportHeight() {
      var height, mode, ref;
      height = window.innerHeight;
      if (height) {
        return height;
      }
      mode = document.compatMode;
      if (mode || !(typeof $ !== "undefined" && $ !== null ? (ref = $.support) != null ? ref.boxModel : void 0 : void 0)) {
        height = mode === 'CSS1Compat' ? document.documentElement.clientHeight : document.body.clientHeight;
      }
      return height;
    }

    // Code fully stolen from angular-inview. Thanks thenikso!
    function getBoundingClientRect(element) {
      var el, parent, top;
      if (element.getBoundingClientRect != null) {
        return element.getBoundingClientRect();
      }
      top = 0;
      el = element;
      while (el) {
        top += el.offsetTop;
        el = el.offsetParent;
      }
      parent = element.parentElement;
      while (parent) {
        if (parent.scrollTop != null) {
          top -= parent.scrollTop;
        }
        parent = parent.parentElement;
      }
      return {
        top: top,
        bottom: top + element.offsetHeight
      };
    }

    function _startWatching() {
      if (!intervalPromise) {
        intervalPromise = $interval(this._checkInView, delay, 0, false)
      }
    }

    function _stopWatching() {
      if (intervalPromise) {
        $interval.cancel(intervalPromise)
        intervalPromise = null
      }
    }

    // Code partially stolen from angular-inview. Thanks thenikso!
    function _checkInView() {
      const viewport = {
        top: 0,
        bottom: getViewportHeight()
      }
      const callbacks = []

      watchingItems.forEach((item) => {
        const bounds = getBoundingClientRect(item.element[0])

        if (bounds.top < viewport.bottom && bounds.bottom >= viewport.top) {
          callbacks.push(item.callback)
        }
      })

      callbacks.forEach((callback) => {
        callback()
      })
    }

    function whenVisible(element, scope, callback) {
      const itemId = idCounter++

      watchingItems.push({
        element: element,
        callback: callback,
        scope: scope,
        id: itemId
      })

      scope.$on(`$destroy`, () => {
        watchingItems = watchingItems.filter((item) => item.id !== itemId)

        if (watchingItems.length === 0) {
          this._stopWatching()
        }
      })

      this._startWatching()
    }

    return {
      _startWatching,
      _stopWatching,
      _checkInView,
      whenVisible
    }
  }]
}])