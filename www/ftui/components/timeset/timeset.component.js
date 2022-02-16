/*
* TimeSet component for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
*     initial by mr_petz
*
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';


export class FtuiTimeSet extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiTimeSet.properties, properties));

    this.leftSelect = this.shadowRoot.querySelector('select[id="0"]');
    this.rightSelect = this.shadowRoot.querySelector('select[id="1"]');
    this.container = this.shadowRoot.querySelector('.container');

    if (this.hasButtons) {
      this.buttonLeftMinus = this.shadowRoot.querySelector('button[id="left-minus"]');
      this.buttonLeftPlus = this.shadowRoot.querySelector('button[id="left-plus"]');
      this.buttonRightMinus = this.shadowRoot.querySelector('button[id="right-minus"]');
      this.buttonRightPlus = this.shadowRoot.querySelector('button[id="right-plus"]');
      this.buttonLeftMinus.addEventListener('click', () => this.onButtonLeftMinusClick());
      this.buttonLeftPlus.addEventListener('click', () => this.onButtonLeftPlusClick());
      this.buttonRightMinus.addEventListener('click', () => this.onButtonRightMinusClick());
      this.buttonRightPlus.addEventListener('click', () => this.onButtonRightPlusClick());
    }

    this.fillLists();
    this.selectValue();
    this.leftSelect.addEventListener('change', () => this.onChange());
    this.rightSelect.addEventListener('change', () => this.onChange());
  }

  template() {
    return `
      <style>
      .container, .divider, .hours, .minutes {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      .container {
        flex-direction: row;
      }
      select {
        border: none;
        background: transparent;
        padding: 2px;
        appearance: none;
        font-size: 1em;
        color: var(--text-color);  
        outline: none;
        cursor: pointer;
        overflow-y: scroll;
        scrollbar-width: thin;
        overflow-x: hidden;
      }
      button {
        border: none;
        background: transparent;
        font-size: 1em;
        color: var(--text-color);  
        outline: none;
        cursor: pointer;
        margin: 0 0.15em;
      }
      :host(:not([has-buttons])) button {
        display: none;
      }
      select option {
        color: var(--text-color);
      }
      select::-webkit-scrollbar {
        width: 0.5em;
      }
      select::-webkit-scrollbar-thumb {
        background-color: var(--border-color);
      }
      </style>
      <div class="container">
      <div class="hours"><button id="left-plus">&#708;</button><select id="0"></select><button id="left-minus">&#709;</button></div>
      <div class="divider">:</div>
      <div class="minutes"><button id="right-plus">&#708;</button><select id="1"></select><button id="right-minus">&#709;</button></div>
      <slot></slot>
      </div>
      `;
  }

  static get properties() {
    return {
      value: '',
      color: '',
      width: '',
      height: '',
      hasButtons: false,
      debounce: 300,
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiTimeSet.properties), ...super.observedAttributes];
  }

  onConnected() {
    if (this.color) {
      this.container.style.color = this.color;
      this.leftSelect.style.color = this.color;
      this.rightSelect.style.color = this.color;
    }
    this.style.width = this.width;
    this.style.height = this.height;
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'value':
        this.selectValue();
        break;
    }
  }

  onButtonLeftMinusClick() {
    const index = this.leftSelect.selectedIndex - 1;
    this.leftSelect.selectedIndex = index > 0 ? index : 23;
    this.onChange();
  }

  onButtonLeftPlusClick() {
    const index = this.leftSelect.selectedIndex + 1;
    this.leftSelect.selectedIndex = index < 24 ? index : 0;
    this.onChange();
  }

  onButtonRightMinusClick() {
    const index = this.rightSelect.selectedIndex - 1;
    this.rightSelect.selectedIndex = index > 0 ? index : 59;
    this.onChange();
  }

  onButtonRightPlusClick() {
    const index = this.rightSelect.selectedIndex + 1;
    this.rightSelect.selectedIndex = index < 60 ? index : 0;
    this.onChange();
  }

  onChange() {
    this.submitChange('value', this.leftSelect.value + ':' + this.rightSelect.value);
  }

  selectValue() {
    if (this.value.length === 5 && this.value.includes(':')) {
      const value = this.value.split(':');
      this.leftSelect.value = value[0];
      this.rightSelect.value = value[1];
    }
  }

  fillLists() {
    let i = 0;
    while (i < 24) {
      const opt = document.createElement('option');
      const hour = String(i).padStart(2, '0');
      opt.value = hour;
      opt.textContent = hour;
      this.leftSelect.appendChild(opt);
      i++;
    }
    i = 0;
    while (i < 60) {
      const opt = document.createElement('option');
      const min = String(i).padStart(2, '0');
      opt.value = min;
      opt.textContent = min;
      this.rightSelect.appendChild(opt);
      i++;
    }
  }

}

window.customElements.define('ftui-timeset', FtuiTimeSet);
