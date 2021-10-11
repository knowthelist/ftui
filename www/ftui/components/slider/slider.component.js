/*
* Slider component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import * as ftui from '../../modules/ftui/ftui.helper.js';
import { Rangeable } from '../../modules/rangeable/rangeable.min.js';


export class FtuiSlider extends FtuiElement {

  constructor(properties) {

    super(Object.assign(FtuiSlider.properties, properties));

    this.input = this.shadowRoot.querySelector('input');
    this.ticksElement = this.shadowRoot.querySelector('.ticks');
    this.minElement = this.shadowRoot.querySelector('.numbers #min');
    this.maxElement = this.shadowRoot.querySelector('.numbers #max');
    this.tickCount = Math.ceil(Math.abs(this.max - this.min) / this.tick) + 1;

    this.rangeable = new Rangeable(this.input, {
      vertical: this.isVertical,
      tooltips: this.hasTooltips,
      min: this.min,
      max: this.max,
      step: this.step,
      onStart: () => this.onSliderStart(),
      onChange: (value) => this.onSliderChanged(Number(value)),
      onEnd: (value) => this.onSliderEnd(Number(value))
    });

    this.updateRangable();
    this.drawTicks();


    // force re-render if visible
    document.addEventListener('ftuiVisibilityChanged', () => {
      if (ftui.isVisible(this)) {
        this.rangeable.update();
      }
    }, false);
  }

  template() {
    return `
    <style> @import "modules/rangeable/rangeable.min.css"; </style>
    <style> @import "components/slider/slider.component.css"; </style>

    <div class="wrapper">
      <input type="range" orient="vertical">
      <div class="ruler">
        <div class="ticks">
        </div>
        <div class="numbers">
          <span id="min"></span>
          <span id="max"></span>
        </div>
      </div>
    </div>`;
  }

  static get properties() {
    return {
      debounce: 300,
      step: 1,
      tick: 100,
      wideTick: 100,
      min: 0,
      max: 100,
      value: -99,
      isVertical: false,
      hasTooltips: true,
      handle: 'default',
      type: 'single',
      color: 'primary',
    }
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiSlider.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, newValue, oldValue) {
    if (oldValue !== newValue && !this.isDragging) {
      this.updateRangable();
    }
  }

  onSliderStart() {
    this.isDragging = true;
  }

  onSliderChanged(value) {
    if (this.value !== null && this.value !== value) {
      if (this.isDragging) {
        this.submitChange('value', value);
      }
    }
  }

  onSliderEnd(value) {
    this.isDragging = false;
    if (this.value !== null && this.value !== value) {
      this.submitChange('value', value);
    }
  }

  captureTime(target, name, descriptor) {
    const original = descriptor.value;
    descriptor.value = function (...args) {
      console.time(name);
      const result = original.apply(this, args);
      console.timeEnd(name);
      return result;
    };
  }

  updateRangable() {
    this.minElement.innerHTML = this.min;
    this.input.min = this.min;
    this.maxElement.innerHTML = this.max;
    this.input.max = this.max;
    this.rangeable.setValue(Number(this.value));
    this.rangeable.update();
  }

  drawTicks() {
    this.ticksElement.innerHTML = '';
    for (let i = 0; i < this.tickCount; i++) {
      const elem = document.createElement('span');
      if ((i * this.tick) % this.wideTick !== 0) {
        elem.classList.add('small');
      }
      this.ticksElement.appendChild(elem);
    }
  }

}

window.customElements.define('ftui-slider', FtuiSlider);
