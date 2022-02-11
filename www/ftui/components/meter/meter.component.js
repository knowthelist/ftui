/*
* Meter component
*
* for FTUI version 3
*
* Copyright (c) 2021-2022 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { limit, scale } from '../../modules/ftui/ftui.helper.js';

export class FtuiMeter extends FtuiElement {

  constructor() {
    super(FtuiMeter.properties);

    this.progress = this.shadowRoot.querySelector('.progress');
    this.bar = this.shadowRoot.querySelector('.progress-bar');
    this.minElement = this.shadowRoot.querySelector('.min');
    this.maxElement = this.shadowRoot.querySelector('.max');

    this.progress.style.width = this.width || (this.isVertical ? '1em' : '10em');
    this.progress.style.height = this.height || (this.isVertical ? '10em' : '1em');
  }

  template() {
    return `<style> @import "components/meter/meter.component.css";</style>
            <div class="container">
              <slot></slot>
              <div class="progress">
                <div class="progress-bar"></div>
              </div>
              <div class="scale">
                <div class="min"></div>
                <slot name="scale"></slot>
                <div class="max"></div>
              </div>
            </div>`;
  }

  static get properties() {
    return {
      height: '',
      width: '',
      color: 'primary',
      min: 0,
      max: 100,
      value: 0,
      isVertical: false,
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiMeter.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'value':
      case 'min':
      case 'max':
        this.updateBar();
        break;
    }
  }

  updateBar() {
    const limitedValue = limit(this.value, this.min, this.max);
    const value = scale(limitedValue, this.min, this.max, 0, 100);
    const direction = this.isVertical ? 'height' : 'width';
    this.bar.style[direction] = value + '%';
    this.minElement.innerHTML = this.min;
    this.maxElement.innerHTML = this.max;
  }
}

window.customElements.define('ftui-meter', FtuiMeter);
