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

  constructor(attributes) {
    super(Object.assign(FtuiLabel.defaults, attributes));

    this.mainSlotElement = this.shadowRoot.querySelector('slot:not([name])');
  }

  template() {
    return `
      <style> @import "components/label/label.component.css"; </style>
      <slot name="start"></slot><slot></slot><slot name="end"></slot>
    `;
  }

  static get defaults() {
    return {
      text: '',
      color: ''
    };
  }

  static get observedAttributes() {
    return [...Object.keys(FtuiLabel.defaults), ...super.observedAttributes];
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'text':
        this.mainSlotElement.innerHTML = this.text;
        break;
    }
  }
}

window.customElements.define('ftui-label', FtuiLabel);
