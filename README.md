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
* FTUI >3.0 uses pure ES7 javascript only

Install
-------
 * copy the whole tree into the corresponding folder of your FHEM server /\<fhem-path\>/www/tablet
 * call http://\<fhem-url\>:8083/fhem/tablet/test_all.html
 
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
---

bind a FHEM reading to a attribute. Changes of the reading changes the attribute

```html
<ftui-label bind:color="dummy1:color">demo</ftui-label>
```

short format
```html
<ftui-label [color]="dummy1:color">demo</ftui-label>
```

Output binding
---

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
- Symbol
- [Button](#button)
- Knob
- Slider
- Checkbox

 ... to be continued

#### Button
<!-- 
| Attribute     | Type | Default | Description | Example |
| ------------- |------|------------|---------|---------|
| cmd | string | "set" | FHEM command| cmd="setreading"|
| states | object | '["on", "off"]' | reading to state mapping | states='["play", "stop"]' |
| icon | string | "mdi mdi-lightbulb-outline" | css classes to create icon | icon="fa fa-car"|
| icon-class | string | "" | css classes to style icon | icon-class="tomato"|
| text | string | "" | css classes to create icon | icon="fa fa-car"|
| text-class | string | "" | css classes to style icon | icon-class="tomato"| -->

  ... to be continued

Configuration
-----------

The get and set parameter of all components are in

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
  
