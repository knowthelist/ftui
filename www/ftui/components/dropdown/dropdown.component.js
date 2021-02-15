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
    if (this.list.length > 0) {
      this.fillList();
    }
    this.shadowRoot.addEventListener('slotchange', () => {
      const node = this.querySelector('option')
      node && this.selectElement.append(node)
    })
    this.selectElement.addEventListener('change', () => this.onChange());
  }

  template() {
    return `
      <style> @import "components/dropdown/dropdown.component.css"; </style>
      <select></select>
      <slot></slot>
      `;
  }

  static get properties() {
    return {
      list: '',
      value: '',
      delimiter: '[;,:|]',
      width: '',
      height: ''
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiDropdown.properties), ...super.observedAttributes];
  }

  onConnected() {
    this.style.width = this.width;
    this.style.height = this.height;
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
    this.emitChangeEvent('value', this.value);
  }

  fillList() {
    const splitter = this.delimiter.length === 1 ? this.delimiter : new RegExp(this.delimiter);
    const list = String(this.list).split(splitter);
    console.log(list, this.list)
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
