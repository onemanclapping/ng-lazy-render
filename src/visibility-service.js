angular.module(`ngLazyRender`).service(`VisibilityService`, [
  `$interval`,
  `$q`,
  function ($interval, $q) {
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

    this._startWatching = function () {
      if (!intervalPromise) {
        intervalPromise = $interval(this._checkInView, 500, 0, false)
      }
    }

    this._stopWatching = function () {
      if (intervalPromise) {
        $interval.cancel(intervalPromise)
        intervalPromise = null
      }
    }

    // Code partially stolen from angular-inview. Thanks thenikso!
    this._checkInView = function () {
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

    this.whenVisible = function (element, scope, callback) {
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
  }])