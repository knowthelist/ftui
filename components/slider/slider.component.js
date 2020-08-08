/* 
* Slider widget for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { Rangeable } from '../../modules/rangeable/rangeable.min.js';
import { decorate } from '../../modules/ftui/ftui.decorate.js';
import { action } from '../../modules/ftui/ftui.decorators.js';


export class FtuiSlider extends FtuiElement {

  constructor(attributes) {

    super(Object.assign(FtuiSlider.defaults, attributes));

    this.input = this.shadowRoot.querySelector('input');
    this.minElement = this.shadowRoot.querySelector('.numbers #min');
    this.maxElement = this.shadowRoot.querySelector('.numbers #max');

    this.rangeable = new Rangeable(this.input, {
      vertical: this.vertical,
      tooltips: this.tooltips,
      min: this.min,
      max: this.max,
      step: this.step,
      onChange: (value) => this.onSliderChanged(value)
    });


    // force re-render if visible 
    document.addEventListener('tabVisiblityChanged', () => {
      if (ftui.isVisible(this)) {
        this.rangeable.update();
      }
    }, false);
  }

  template() {
    return `
    <style> @import "libs/rangeable/rangeable.min.css"; </style>
    <style> @import "components/slider/slider.component.css"</style>

    <div class="mapper">
      <input type="range" orient="vertical">
      <div class="ruler">
        <div class="ticks">
          <span id="min"></span>
          <span id="max"></span>
        </div>
        <div class="numbers">
          <span id="min"></span>
          <span id="max"></span>
        </div>
      </div>
    </div>`;
  }

  static get defaults() {
    return {
      debounce: 200,
      step: 1,
      min: 0,
      max: 100,
      value: 0,
      vertical: false,
      tooltips: true,
      type: 'single',
      color: 'primary',
    }
  }

  static get observedAttributes() {
    return [...Object.keys(FtuiSlider.defaults), ...super.observedAttributes];
  }

  onAttributeChanged(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.updateRangable();
    }
  }

  updateRangable() {
    this.minElement.innerHTML = this.min;
    this.input.min = this.min;
    this.maxElement.innerHTML = this.max;
    this.input.max = this.max;
    this.rangeable.setValue(this.value);
    this.rangeable.update();
  }

  // @action
  onSliderChanged(value) {
    if (this.value !== value) {
      this.value = value;
    }
  }
}

decorate(FtuiSlider, {
  onSliderChanged: [action],
});

window.customElements.define('ftui-slider', FtuiSlider);
