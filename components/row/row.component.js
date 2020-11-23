/*
* Row component

* for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiRow extends FtuiElement {

  constructor() {
    super(FtuiRow.properties);
  }

  template() {
    return `
    <style>
      :host {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        align-items: center;
        width: 100%;
        height: 100%;
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
      color: 'transparent',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiRow.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, oldValue, newValue) {
    switch (name) {
      case 'width':
        this.style.width = newValue;
        break;
      case 'height':
        this.style.height = newValue;
        break;
    }
  }

}

window.customElements.define('ftui-row', FtuiRow);
