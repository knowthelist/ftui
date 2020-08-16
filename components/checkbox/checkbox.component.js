/* 
* Checkbox widget for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { decorate } from '../../modules/ftui/ftui.decorate.js';
import { action } from '../../modules/ftui/ftui.decorators.js';

class FtuiCheckbox extends FtuiElement {

  constructor(attributes) {

    super(Object.assign(FtuiCheckbox.defaults, attributes));

    this.parentElement.addEventListener('click', () => this.onClicked());

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

  static get defaults() {
    return {
      states: 'off,on',
      texts: ',',
      color: 'primary',
      value: 'off'
    };
  }

  static get observedAttributes() {
    return [...Object.keys(FtuiCheckbox.defaults), ...super.observedAttributes];
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
    console.log(this.id, this.value, index)
    if (index > -1) {
      this.elementInput.checked = index === 1 ? true : false;
    }
  }

  // @action
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

decorate(FtuiCheckbox, {
  onClicked: [action],
});

window.customElements.define('ftui-checkbox', FtuiCheckbox);
