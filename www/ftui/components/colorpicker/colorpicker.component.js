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

    this.colorPicker.on('input:change', (color) => this.onColorChange(color));
  }

  static get properties() {
    return {
      width: 150,
      hex: '',
      hue: '',
      saturation: '',
      brightness: '',
      kelvin: '',
      direction: 'vertical',
      debounce: 300,
      layout: 'wheel'
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiColorpicker.properties), ...super.observedAttributes];
  }

  get options() {
    return {
      width: this.width,
      layoutDirection: this.direction,
      layout: [...this.layoutMap.values()]
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
          this.updateOptions();
          break;
        case 'hex': {
          const hex = this.hex && this.hex.match(/^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/);
          if (hex && hex.length > 1 && hex[1]) {
            this.colorPicker.color.hexString = '#' + hex[1];
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
          this.colorPicker.setOptions(this.options);
          break;
      }
    }
  }

  onColorChange(color) {
    if (this.hex != color.hexString) {
      this.submitChange('hex', color.hexString);
    }
    if (this.kelvin != color.kelvin) {
      this.submitChange('kelvin', color.kelvin);
    }
    if (this.hue != color.hue) {
      this.submitChange('hue', color.hue);
    }
    if (this.saturation != color.saturation) {
      this.submitChange('saturation', color.saturation);
    }
    if (this.brightness != color.value) {
      this.submitChange('brightness', color.value);
    }
    this.emitChangeEvent('color', color);
  }

  updateOptions() {
    if (this.layout.includes('wheel')) {
      this.layoutMap.set('hasWheel', { component: iro.ui.Wheel, options: { wheelLightness: false } });
    } else if (this.layout.includes('box')) {
      this.layoutMap.set('hasBox', { component: iro.ui.Box, options: { wheelLightness: false } });
    } else {
      this.layoutMap.delete('hasWheel');
    }
    this.sliderTypes.forEach(sliderType => {
      if (this.layout.includes(sliderType + 'Slider')) {
        this.layoutMap.set(sliderType, { component: iro.ui.Slider, options: { sliderType } });
      } else {
        this.layoutMap.delete(sliderType);
      }
    })
    this.colorPicker.setOptions(this.options);
  }

}

window.customElements.define('ftui-colorpicker', FtuiColorpicker);
