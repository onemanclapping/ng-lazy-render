# ng-lazy-render

A set of directives to help using lazy-rendering techniques easily.

## lazy-module directive
Use this directive as an attribute if you want to delay the rendering of a module until visible in the viewport.

Attributes:

- lazyModule: templateUrl of a placeholder to render while the module is not visible or while being rendered.

- lazyIf: use an angular expression here to set a condition on whether you want this directive to take action or be ignored.

Example:

```html
<any lazy-module="myModulePlaceholder.html" lazy-if="ctrl.acceleratePageLoad">
    <!-- lots of code -->
</any>
```

## lazy-repeater directive
Use this directive as an attribute if you want a repeater (ng-repeat) to grow as the user scrolls down.

Attributes:

- lazyRepeater: number of initially shown items. This number is doubled every time the user sees the end of the list.

- lazyTemplate: template (or templateUrl) to be shown at the end of the list.

- lazyIf: use an angular expression here to set a condition on whether you want this directive to take action or be ignored.

Example:
```html
<ul>
    <li ng-repeat="obj in data track by obj.index" 
        lazy-repeater="10"
        lazy-placeholder="templateUrl"
        lazy-if="ctrl.acceleratePageLoad">
          {{obj.data}}
    </li>
</ul>
```

## Contribute
Please! PRs are much welcome.
