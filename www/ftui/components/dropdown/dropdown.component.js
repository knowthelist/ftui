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
      vallist: '',
      value: '',
      delimiter: '', // optional, will be auto-detected if not set
      width: '',
      height: '',
      placeholder: '',
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
      case 'vallist':
        this.fillList();
        break;
      case 'value':
        this.selectElement.value = this.value;
        break;
    }
  }

  onChange() {
    this.submitChange('value', this.selectElement.value);
  }

  fillList() {
    this.options = [];
    this.options = this.parseList();
    if (this.placeholder) {
      this.options.unshift({ value: '', text: this.placeholder });
    }
    this.selectElement.innerHTML = '';
    this.options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.text = option.text;
      this.selectElement.appendChild(optionElement);
    });

    this.selectElement.value = this.value;
  }

  parseList() {
    const textParts = this.splitList(this.list);
    const valueParts = this.vallist ? this.splitList(this.vallist) : [];
    const hasValueList = valueParts.length === textParts.length;
    const listDelimiter = this.getDelimiter(String(this.list || ''));

    return textParts.map((part, index) => {
      const option = this.parseOption(part, listDelimiter);
      if (hasValueList) {
        option.value = valueParts[index];
      }

      return option;
    });
  }

  splitList(list) {
    const source = String(list || '');
    const delimiter = this.getDelimiter(source);
    return source.split(delimiter).map(part => part.trim());
  }

  getDelimiter(list) {
    if (this.delimiter) {
      return this.delimiter;
    }

    if (list.indexOf(',') > -1) {
      return ',';
    }
    if (list.indexOf(';') > -1) {
      return ';';
    }
    if (list.indexOf('|') > -1) {
      return '|';
    }
    if (list.indexOf(':') > -1) {
      return ':';
    }

    return ',';
  }

  parseOption(part, listDelimiter) {
    const textSeparatorIndex = part.indexOf(':');
    if (textSeparatorIndex > -1 && listDelimiter !== ':') {
      return {
        value: part.slice(0, textSeparatorIndex).trim(),
        text: part.slice(textSeparatorIndex + 1).trim(),
      };
    }

    return { value: part, text: part };
  }

}

window.customElements.define('ftui-dropdown', FtuiDropdown);
