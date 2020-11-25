/*
* Column component

* for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiColumn extends FtuiElement {

  constructor() {
    super(FtuiColumn.properties);
  }

  template() {
    return `
    <style>
      :host {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        align-items: center;
        height: 100%;
        width: 100%;
        background: var(--color-base);
        color: var(--color-contrast);
      }
    </style>
    <slot></slot>`;
  }

  static get properties() {
    return {
      height: '',
      width: '',
      space: 'around',
      color: 'transparent',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiColumn.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, oldValue, newValue) {
    switch (name) {
      case 'width':
        this.style.width = newValue;
        break;
      case 'height':
        this.style.height = newValue;
        break;
      case 'space':
        this.style.justifyContent = 'space-' + newValue;
        break;
    }
  }

}

window.customElements.define('ftui-column', FtuiColumn);
