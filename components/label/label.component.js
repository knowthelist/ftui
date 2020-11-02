/*
* Label component for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiLabel extends FtuiElement {

  constructor(properties) {
    super(Object.assign(FtuiLabel.properties, properties));

    this.mainSlotElement = this.shadowRoot.querySelector('slot[name="content"]');
  }

  template() {
    return `
      <style> @import "components/label/label.component.css"; </style>
      <slot></slot><slot name="start"></slot><slot name="content"></slot><slot name="end"></slot>
    `;
  }

  static get properties() {
    return {
      text: '',
      color: ''
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiLabel.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'text':
        this.mainSlotElement.innerText = this.text;
        break;
    }
  }
}

window.customElements.define('ftui-label', FtuiLabel);
