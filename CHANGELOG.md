# 1.1.0
### Bug Fixes
lazy-module directive was not working.

# 1.1.0
### Features
$interval delay is now configurable.

# 1.0.1
### Breaking changes
Removed angular-inview dependency. We're now polling for updates instead of reacting to scroll events. Looks better in most browsers.

# 0.2.2
### Bug Fixes
Fix magic numbers and hopefully fix weird scenarios where checkInView event was not trigerred correctly.

# 0.2.1
### Bug Fixes
Fix situation where extreme scrolling throws an error.

# 0.2.0
### Bug Fixes
Fix lazyRepeater and lazyModule to automatic trigger inView until all the elements in the viewPort are visible.

### Features
Add lazyIf parameter on lazyRepeater directive.

# 0.1.1
### Bug Fixes
Fix fickering of the placeholder on lazy-repeater when number of items is smaller than threshold.

# 0.1.0
First release. Everything should work as expected. Pray for no bugs.
