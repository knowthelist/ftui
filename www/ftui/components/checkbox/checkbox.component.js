/*
* Checkbox component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

class FtuiCheckbox extends FtuiElement {

  constructor(properties) {

    super(Object.assign(FtuiCheckbox.properties, properties));

    this.elementInput = this.shadowRoot.querySelector('input');
    this.elementInput.addEventListener('click', () => this.onClicked());

    const texts = this.texts.split(/[;,:]/).map(item => item.trim());
    const inner = this.shadowRoot.querySelector('.inner');
    inner.setAttribute('data-text-off', texts[0]);
    inner.setAttribute('data-text-on', texts[1]);
  }


  template() {
    return `
    <style> @import "components/checkbox/checkbox.component.css"; </style>
    
      <input type="checkbox" class="checkbox" id="${this.id}">
      <label class="label" for="${this.id}">
          <span class="inner"></span>
          <span class="switch"></span>
      </label>
    `;
  }

  static get properties() {
    return {
      states: 'off,on',
      texts: ',',
      color: 'primary',
      value: 'off'
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiCheckbox.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'value':
        this.changeState();
        break;
    }
  }

  changeState() {
    const index = this.getStates().indexOf(this.value);
    if (index > -1) {
      this.elementInput.checked = index === 1 ? true : false;
      this.emitChangeEvent('value', this.value );
    }
  }

  onClicked() {
    const stateIndex = this.elementInput.checked ? 1 : 0;
    const value = this.getStates()[stateIndex];
    if (this.value !== value) {
      this.value = value;
    }
  }

  getStates() {
    return this.states.split(/[;,:]/).map(item => item.trim());
  }
}

window.customElements.define('ftui-checkbox', FtuiCheckbox);
