/*
* Button widget for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { isEqual, isNumeric, supportsPassive } from '../../modules/ftui/ftui.helper.js';

export class FtuiButton extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiButton.properties, properties));

    const usePassive = supportsPassive();

    this.addEventListener('touchstart', this.onDownEvent, usePassive ? { passive: true } : false);
    this.addEventListener('mousedown', this.onDownEvent);
    this.addEventListener('touchend', this.onUpEvent);
    this.addEventListener('mouseup', this.onUpEvent);
    this.addEventListener('mouseout', this.onUpEvent);
    this.addEventListener('click', this.onClickEvent);
  }

  template() {
    return `
      <style> @import "components/button/button.component.css"; </style>
      <style>:host .button-inner { gap: ${isNumeric(this.gap) ? this.gap + 'px' : this.gap}; } </style>
      <span class="button-inner">
        <slot></slot>
      </span>
      `;
  }

  static get properties() {
    return {
      states: 'on,off',
      fill: 'solid',
      color: 'primary',
      size: 'normal',
      shape: 'normal',
      direction: 'horizontal',
      value: 'off',
      debounce: 0,
      gap: 0,
      height: null,
      width: null,
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiButton.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, newValue) {
    switch (name) {
      case 'width':
      case 'height':
        this.style.setProperty(`--button-${name}`, newValue);
        break;
    }
  }

  onDownEvent() {
    this.classList.add('activated');
    this.longPressTimer = setTimeout(() => {
      this.emitEvent('hold');
    }, 500);
  }

  onUpEvent() {
    setTimeout(() => {
      this.classList.remove('activated');
    }, 300)
    clearTimeout(this.longPressTimer);
  }

  onClickEvent() {
    this.playEffect();
    this.submitChange('value', this.getNextValue());
  }

  getNextValue() {
    const states = String(this.states).split(/[;,:]/).map(item => item.trim());
    let currentIndex = states.findIndex((pattern) => isEqual(pattern, this.value));
    // increase the index to the next value in the array of possible values
    currentIndex = ++currentIndex % states.length;
    return states[currentIndex].replace('$value', this.value);
  }

  playEffect() {
    this.onDownEvent();
    setTimeout(() => {
      this.onUpEvent();
    }, 100);
  }
}

window.customElements.define('ftui-button', FtuiButton);
