fhem-tablet-ui
========

UI builder framework for FHEM — http://fhem.de/fhem.html
with a clear intention: Keep it short and simple!

Version 3 

FTUI >3.0 uses Web Components technologies https://developer.mozilla.org/en-US/docs/Web/Web_Components

Caution! 
 * This version is not compatible with older fhem-tablet-ui versions.
 * This version is under construction.


![](http://knowthelist.github.io/fhem-tablet-ui/ftui3.png)

Requires
-------
* FTUI >3.0 uses pure ES2020 javascript only

Install
-------
 * copy the whole tree into the corresponding folder of your FHEM server /\<fhem-path\>/www/tablet
 * call http://\<fhem-url\>:8083/fhem/tablet/index.html
 
Usage
------
* Just add some of the FTUI web components to your HTML code

```html
<ftui-button (value)="dummy1">on/off</ftui-button>
```

```html
<ftui-label [value]="dummy1"></ftui-label>
```

```html
<ftui-icon 
    [name]="dummy1 | map('on: lightbulb-on-outline, off: lightbulb-outline')"
    [color]="ftuitest | map('0: success, 50: warning, 80: danger')">
</ftui-icon>
```

Binding
------

no binding - fix value

```html
<ftui-label color="danger">demo</ftui-label>
```

Input binding
--------

bind a FHEM reading to a attribute. Changes of the reading changes the attribute

```html
<ftui-label bind:color="dummy1:color">demo</ftui-label>
```

short format
```html
<ftui-label [color]="dummy1:color">demo</ftui-label>
```

Output binding
--------

on attribute changes set the FHEM reading

```html
<ftui-button on:value="dummy1"></ftui-button>
```

short format
```html
<ftui-button (value)="dummy1"></ftui-button>
```

Two way binding

```html
<ftui-button bindon:value="dummy1"></ftui-button>
```

short syntax ("banana in a box")
```html
<ftui-button [(value)]="dummy1"></ftui-button>
```


Components
------

- Tab
- Grid
- Label
- Icon
- [Button](#button)
- Knob
- Slider
- Checkbox
- Circlemenu
- Weather
- Dropdown
- Colorpicker
- [Image](#image)
- [Badge](#badge)

 ... to be continued

### Button

| Attribute | Description | Type | Default |
|-----------|-------------|-------|---------|
| <b>color</b> |The color to use from color palette.|<code>"primary" \| "secondary" \| "success" \| "warning" \| "danger" \| "light" \| "medium" \| "dark"</code>| <code>"primary"</code>|
| <b>fill</b> |.|<code>"clear" \| "outline" \| "solid" </code>| <code>"solid"</code>|
| <b>size</b> |.|<code>"small" \| "normal" \| "large" </code>| <code>"normal"</code>|
| <b>shape</b> |.|<code>"round" \| "normal" \| "circle" </code>| <code>"normal"</code>|
| <b>value</b> |.|String| <code>"off"</code> |
| <b>states</b> |.|String list comma separated| <code>"on,off"</code>|

### Image

| Attribute | Description | Type | Default |
|-----------|-------------|-------|---------|
| <b>base</b> |Front part of the URL.|String| <code>""</code>|
| <b>src</b> |Image part of the URL or full URL.|String| <code>""</code>|
| <b>width</b> |Force a certain image width.|Number \| "auto"</code>| <code>"auto"</code>|
| <b>height</b> |Force a certain image height.|Number \| "auto"| <code>"auto"</code>|
| <b>interval</b> |Reloading every x secondes.|Number| <code>0</code> |
| <b>refresh</b> |Changes of this attribute triggers a reload.|String list comma separated| <code>""</code>|
| <b>nocache</b> |Bypass cache on next reload.|Boolean| <code>false</code>|

### Badge

Badges can be used as a notification that contain a number or other characters. They show that there are additional items associated with an element and indicate how many items there are.
The element disappears if the value is 0 or empty.

| Attribute | Description | Type | Default |
|-----------|-------------|-------|---------|
| <b>color</b> |The color to use from color palette.|<code>"primary" \| "secondary" \| "success" \| "warning" \| "danger" \| "light" \| "medium" \| "dark"</code>| <code>"primary"</code>|
| <b>text</b> |Text to display inside.|String| <code>""</code>|

  ... to be continued

  #### Icon

  [List of all icons](https://knowthelist.github.io/ftui/icons/demo.html)

Examples
------

- [Tab](https://knowthelist.github.io/ftui/examples/tab.html) 
- [Grid](https://knowthelist.github.io/ftui/examples/grid.html)
- [Label](https://knowthelist.github.io/ftui/examples/label.html)
- [Icon](https://knowthelist.github.io/ftui/examples/icon.html)
- [Button](https://knowthelist.github.io/ftui/examples/button.html)
- [Knob](https://knowthelist.github.io/ftui/examples/knob.html)
- [Slider](https://knowthelist.github.io/ftui/examples/slider.html)
- [Checkbox](https://knowthelist.github.io/ftui/examples/checkbox.html)
- [Circlemenu](https://knowthelist.github.io/ftui/examples/circlemenu.html)
- [Dropdown](https://knowthelist.github.io/ftui/examples/dropdown.html)
- [Colorpicker](https://knowthelist.github.io/ftui/examples/colorpicker.html)
- [Image](https://knowthelist.github.io/ftui/examples/image.html)
- [Badge](https://knowthelist.github.io/ftui/examples/badge.html)


HOCON
-----------

HOCON (Human-Optimized Config Object Notation)

The primary goal of HOCON is: keep the semantics (tree structure; set of types; encoding/escaping) from JSON, but make it more convenient as a human-editable config file format.

Informal spec:
https://github.com/lightbend/config/blob/master/HOCON.md

playground to check syntax:
https://hocon-playground.herokuapp.com

 ... to be continued

Donation
--------
You can thank the creator of this versatile UI:

<a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=PD4C2XM2VTD9A"><img src="https://www.paypalobjects.com/de_DE/DE/i/btn/btn_donateCC_LG.gif" alt="[paypal]" /></a>

Many many thanks to all donators!

License
-------
This project is licensed under [MIT](http://www.opensource.org/licenses/mit-license.php).
  
