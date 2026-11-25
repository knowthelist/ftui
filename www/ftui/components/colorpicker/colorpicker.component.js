/*
* colorpicker component for FTUI version 3
*
* Copyright (c) 2020-2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* uses github.com/jaames/iro.js
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import iro from '../../modules/iro.js/iro.min.js';

export class FtuiColorpicker extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiColorpicker.properties, properties));

    this.layoutMap = new Map;
    this.colorPicker = new iro.ColorPicker(this, this.options);
    this.updateOptions();

    this.colorPicker.on('input:change', (color, changes) => this.onColorChange(color, changes));
    this.colorPicker.on('color:change', color => this.emitChangeEvent('preview', color));
  }

  static get properties() {
    return {
      width: 150,
      hex: '',
      hue: '',
      saturation: '',
      brightness: '',
      separatebrightness: false,
      swapgradients: false,
      sliderlabels: false,
      slidersize: 0,
      handleradius: 8,
      kelvin: '',
      direction: 'vertical',
      debounce: 300,
      layout: 'wheel',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiColorpicker.properties), ...super.observedAttributes];
  }

  get options() {
    return {
      width: this.width,
      layoutDirection: this.direction,
      sliderLabels: this.sliderlabels,
      sliderSize: this.slidersize || null,
      handleRadius: this.handleradius,
      layout: [...this.layoutMap.values()],
    }
  }

  get sliderTypes() {
    return ['hue', 'value', 'saturation', 'red', 'green', 'blue', 'alpha', 'kelvin'];
  }

  connectedCallback() {
    // set default layout if nothing is set
    if (this.layoutMap.size === 0) {
      this.layout = 'wheel,valueSlider';
    }
  }

  onAttributeChanged(name, newValue, oldValue) {
    if (oldValue !== newValue) {
      switch (name) {
        case 'layout':
        case 'swapgradients':
          this.updateOptions();
          break;
        case 'slidersize':
        case 'handleradius':
          this.colorPicker.setOptions(this.options);
          break;
        case 'hex': {
          const hex = this.hex && this.hex.match(/^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/);
          if (hex && hex.length > 1 && hex[1]) {
            if (this.separatebrightness) {
              const incomingColor = new iro.Color('#' + hex[1]);
              this.colorPicker.color.hsv = { h: incomingColor.hue, s: incomingColor.saturation };
            } else {
              this.colorPicker.color.hexString = '#' + hex[1];
            }
          }
          break;
        }
        case 'kelvin':
          this.colorPicker.color.kelvin = this.kelvin;
          break;
        case 'hue':
          this.colorPicker.color.hue = this.hue;
          break;
        case 'saturation':
          this.colorPicker.color.saturation = this.saturation;
          break;
        case 'brightness':
          this.colorPicker.color.value = this.brightness;
          break;
        case 'direction':
        case 'sliderlabels':
          this.colorPicker.setOptions(this.options);
          break;
      }
    }
  }

  onColorChange(color, changes) {
    let hex = color.hexString;
    if (this.separatebrightness) {
      const fullBrightnessColor = color.clone();
      fullBrightnessColor.value = 100;
      hex = fullBrightnessColor.hexString;
    }
    if ((!this.separatebrightness || changes.h || changes.s) && this.hex != hex) {
      this.submitChange('hex', hex);
    }
    if (this.layoutMap.has('kelvin') && this.kelvin != color.kelvin) {
      this.submitChange('kelvin', color.kelvin);
    }
    if (this.hue != color.hue) {
      this.submitChange('hue', color.hue);
    }
    if (this.saturation != color.saturation) {
      this.submitChange('saturation', color.saturation);
    }
    if ((!this.separatebrightness || changes.v) && this.brightness != color.value) {
      this.submitChange('brightness', color.value);
    }
    this.emitChangeEvent('color', color);
  }

  updateOptions() {
    const layoutItems = String(this.layout).split(/[;,:]/).map(item => item.trim());
    this.layoutMap.clear();

    if (layoutItems.indexOf('wheel') > -1) {
      this.layoutMap.set('hasWheel', { component: iro.ui.Wheel, options: { wheelLightness: false } });
    } else if (layoutItems.indexOf('box') > -1) {
      this.layoutMap.set('hasBox', { component: iro.ui.Box, options: { wheelLightness: false } });
    }

    layoutItems.forEach(layoutItem => {
      const suffix = 'Slider';
      if (layoutItem.slice(-suffix.length) === suffix) {
        const layoutType = layoutItem.slice(0, -suffix.length);
        const sliderType = layoutType === 'brightness' ? 'value' : layoutType;
        if (this.sliderTypes.indexOf(sliderType) > -1) {
          const gradientType = this.swapgradients && sliderType === 'saturation' ? 'value'
            : this.swapgradients && sliderType === 'value' ? 'saturation' : sliderType;
          this.layoutMap.set(sliderType, { component: iro.ui.Slider, options: { sliderType, gradientType } });
        }
      }
    });
    this.colorPicker.setOptions(this.options);
  }

}

window.customElements.define('ftui-colorpicker', FtuiColorpicker);
