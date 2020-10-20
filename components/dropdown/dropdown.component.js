/*
* Dropdown component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';


export class FtuiDropdown extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiDropdown.properties, properties));

    this.selectElement = this.shadowRoot.querySelector('select');
    this.fillList();
    this.selectElement.addEventListener('change', () => this.onChange());
  }

  template() {
    return `
      <style> @import "components/dropdown/dropdown.component.css"; </style>

      <select></select>
      `;
  }

  static get properties() {
    return {
      list: '',
      value: ''
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiDropdown.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'list':
        this.fillList();
        break;
      case 'value':
        this.selectElement.value = this.value;
        break;
    }
  }

  onChange() {
    this.value = this.selectElement.value;
    this.emitChangeEvent('value', this.value );
  }

  fillList() {
    const list = String(this.list).split(/[;,:]/);
    this.selectElement.length = 0;
    list.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.innerHTML = item;
      this.selectElement.appendChild(opt);
    });
    this.selectElement.value = this.value;
  }

}

window.customElements.define('ftui-dropdown', FtuiDropdown);
