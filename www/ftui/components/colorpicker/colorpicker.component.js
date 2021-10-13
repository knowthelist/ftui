/*
* colorpicker component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* uses github.com/jaames/iro.js
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import * as ftuiHelper from '../../modules/ftui/ftui.helper.js';
import iro from '../../modules/iro.js/iro.min.js';

export class FtuiColorpicker extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiColorpicker.properties, properties));

    this.layout = new Map;

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
      direction: 'vertical',
      hasWheel: false,
      hasHueSlider: false,
      hasSaturationSlider: false,
      hasValueSlider: false,
      hasRedSlider: false,
      hasGreenSlider: false,
      hasBlueSlider: false,
      hasAlphaSlider: false,
      hasKelvinSlider: false,
      debounce: 300
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiColorpicker.properties), ...super.observedAttributes];
  }

  get options() {
    return {
      width: this.width,
      layoutDirection: this.direction,
      layout: [...this.layout.values()]
    }
  }

  get sliderTypes() {
    return ['hue', 'value', 'saturation', 'red', 'green', 'blue', 'alpha', 'kelvin'];
  }

  connectedCallback() {
    if (this.layout.size === 0) {
      this.hasWheel = true;
      this.hasValueSlider = true;
    }
  }

  onAttributeChanged(name, newValue, oldValue) {
    if (oldValue !== newValue) {
      switch (name) {
        case 'has-wheel':
        case 'has-hue-slider':
        case 'has-value-slider':
        case 'has-saturation-slider':
        case 'has-red-slider':
        case 'has-green-slider':
        case 'has-blue-slider':
        case 'has-alpha-slider':
        case 'has-kelvin-slider':
          this.updateOptions();
          break;
        case 'hex':
          this.colorPicker.color.hexString = `#${this.hex.replace('#', '')}`;
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
    if (this.hasWheel) {
      this.layout.set('hasWheel', { component: iro.ui.Wheel, options: { wheelLightness: false } });
    } else {
      this.layout.delete('hasWheel');
    }
    this.sliderTypes.forEach(sliderType => {
      if (this['has' + ftuiHelper.capitalize(sliderType) + 'Slider']) {
        this.layout.set(sliderType, { component: iro.ui.Slider, options: { sliderType } });
      } else {
        this.layout.delete(sliderType);
      }
    })
    this.colorPicker.setOptions(this.options);
  }

}

window.customElements.define('ftui-colorpicker', FtuiColorpicker);
