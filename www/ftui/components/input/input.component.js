/*
* Input component
*
* for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiInput extends FtuiElement {

  constructor() {
    super(FtuiInput.properties);

    this.input = this.shadowRoot.querySelector('input');
    this.input.addEventListener('keyup', (e) => this.onEnter(e));
    this.input.addEventListener('change', () => this.onChange());
  }

  template() {
    return `
          <style>
            input {
              border-radius: 0.75em;
              border: 2px solid var(--border-color);
              background: transparent;
              padding: 0.4em;
              -webkit-appearance: none;
              -moz-appearance: none;
              appearance: none;
              font-size: 1em;
              color: var(--text-color);  
              outline: none;
              cursor: pointer;
              height: ${this.height};
              width: ${this.width};
            }
            input:invalid { border: solid 2px var(--red); }
          </style>
          <input type="${this.type}"
            min="${this.min}" 
            minLength="${this.minLength}" 
            max="${this.max}" 
            maxLength="${this.maxLength}" 
            value="${this.value}" 
            placeholder="${this.placeholder}" 
            pattern="${this.pattern}">`;
  }

  static get properties() {
    return {
      value: '',
      type: 'text',
      min: '',
      minLength: '',
      max: '',
      maxLength: '',
      step: 1,
      placeholder: '',
      pattern: '.*',
      height: '',
      width: '',
      debounce: 400,
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiInput.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, value) {
    this.input[name] = value;
  }

  onEnter(event) {
    if (event.keyCode === 13 && this.input.validity.valid) {
      this.submitChange('value', this.input.value);
      if (this.hasAttribute('autoclear')) {
        this.input.value = '';
      }
    }
  }

  onChange() {
    this.submitChange('value', this.input.value);
  }
}

window.customElements.define('ftui-input', FtuiInput);
