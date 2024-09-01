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
    this.options = []; // empty the list before filling it
    const list = this.parseList();
    this.options = list; // update the options array
    if (this.placeholder) {
      this.options.unshift({ value: '', text: this.placeholder });
    }
    this.selectElement.innerHTML = ''; // clear the select element
    this.options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.text = option.text;
      this.selectElement.appendChild(optionElement);
    });

    this.selectElement.value = this.value; // Set the selected value
  }

  parseList() {
    const list = this.list;
    const delimiter = this.delimiter;

    if (delimiter) {
      // use custom delimiter
      const parts = list.split(delimiter);
      return parts.map(part => {
        if (part.includes(':')) {
          const [value, text] = part.split(':');
          return { value, text };
        } else {
          return { value: part, text: part };
        }
      });
    } else {
      // auto-detect delimiter
      const delimiterRegex = /[,:;|]/; // common delimiters
      const matches = list.match(delimiterRegex);
      if (matches) {
        const detectedDelimiter = matches[0];
        const parts = list.split(detectedDelimiter);
        return parts.map(part => {
          if (part.includes(':')) {
            const [value, text] = part.split(':');
            return { value, text };
          } else {
            return { value: part, text: part };
          }
        });
      } else {
        // no delimiter detected, assume simple value list
        return list.split(',').map(value => ({ value, text: value }));
      }
    }
  }

}

window.customElements.define('ftui-dropdown', FtuiDropdown);
