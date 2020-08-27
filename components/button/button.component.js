/* 
* Button widget for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { ftui } from '../../modules/ftui/ftui.module.js';
import { decorate } from '../../modules/ftui/ftui.decorate.js';
import { action } from '../../modules/ftui/ftui.decorators.js';


export class FtuiButton extends FtuiElement {
  constructor(attributes) {

    super(Object.assign(FtuiButton.defaults, attributes));

    this.addEventListener('touchstart', this.onDownEvent);
    this.addEventListener('mousedown', this.onDownEvent);
    this.addEventListener('touchend', this.onUpEvent);
    this.addEventListener('mouseup', this.onUpEvent);
    this.addEventListener('mouseout', this.onUpEvent);
    this.addEventListener('click', this.onClickEvent);
  }

  template() {
    return `
      <style> @import "components/button/button.component.css"; </style>

      <span class="button-inner">
        <slot></slot>
      </span>
      `;
  }

  static get defaults() {
    return {
      states: 'on,off',
      fill: 'solid',
      color: 'primary',
      size: 'normal',
      shape: 'normal',
      direction: 'horizontal',
      value: 'off'
    };
  }

  static get observedAttributes() {
    return [...Object.keys(FtuiButton.defaults), ...super.observedAttributes];
  }

  onDownEvent() {
    this.classList.add('activated');
  }

  onUpEvent() {
    this.classList.remove('activated');
  }

  // @action
  onClickEvent() {
    this.playEffect();
    this.value = this.getNextValue();
  }

  getNextValue() {
    const states = String(this.states).split(/[;,:]/).map(item => item.trim());
    let currentIndex = states.findIndex((pattern) => ftui.isEqual(pattern, this.value));
    // increase the index to the next value in the array of possible values
    currentIndex = ++currentIndex % states.length;
    return states[currentIndex];
  }

  playEffect() {
    this.classList.add('activated');
    setTimeout(() => {
      this.classList.remove('activated');
    }, 100);
  }
}

decorate(FtuiButton, {
  onClickEvent: [action],
});

window.customElements.define('ftui-button', FtuiButton);
