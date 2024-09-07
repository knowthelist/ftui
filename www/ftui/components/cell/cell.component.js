/*
* Cell component

* for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { isNumeric } from '../../modules/ftui/ftui.helper.js';

export class FtuiCell extends FtuiElement {

  constructor(properties) {
    super(Object.assign(FtuiCell.properties, properties));
  }

  template() {
    return `
    <style>
      :host([shape="round"]) {
        border-radius: 1.5em;
      }
      :host {
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        align-items: center;
        background: var(--color-base);
        color: var(--color-contrast);
        flex: 1;
      }
      :host(:not(ftui-row)[align-items~=top])    { justify-content: start; }
      :host(:not(ftui-row)[align-items~=bottom]) { justify-content: end; }
      :host(:not(ftui-row)[align-items~=left])   { align-items: flex-start; }
      :host(:not(ftui-row)[align-items~=right])  { align-items: flex-end; }
      :host([align-items~=center]) { justify-content: center; }
      :host([align-items~=stretch]) { justify-content: space-between; }
      :host([align-items~=around]) { justify-content: space-around; }
      :host([align-items~=baseline])  { align-items: baseline; }
    </style>
    <slot></slot>`;
  }

  static get properties() {
    return {
      height: '',
      width: '',
      gap: '',
      grow: '',
      color: 'transparent',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiCell.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, value) {
    switch (name) {
      case 'width':
        if (this.tagName === 'FTUI-COLUMN') {
          this.style.flex = `0 0 ${value}`;
        } else {
          this.style.width = isNumeric(value) ? value + 'px' : value;
          this.style.maxWidth = isNumeric(value) ? value + 'px' : value;
          this.style.minWidth = isNumeric(value) ? value + 'px' : value;
        }
        break;
      case 'height':
        if (this.tagName === 'FTUI-ROW') {
          this.style.flex = `0 0 ${value}`;
        } else {
          this.style.height = isNumeric(value) ? value + 'px' : value;
          this.style.maxHeight = isNumeric(value) ? value + 'px' : value;
          this.style.minHeight = isNumeric(value) ? value + 'px' : value;
        }
        break;
      case 'gap':
        this.style.gap = isNumeric(value) ? value + 'px' : value;
        break;
      case 'grow':
        this.style.flexGrow = this.calculateFlexValue(value);
        break;
    }
  }

  calculateFlexValue(value) {
    // Check if the value is a number
    if (!value) {
      return 1
    }

    // Check if the value is in percentage
    if (value.endsWith('%')) {
      const percentage = parseFloat(value);
      return percentage / 10; // Converts 25% to 2.5 for flex
    }
    
    // Check if the value is in pixels
    if (value.endsWith('px')) {
      const pixels = parseFloat(value.endsWith('px') ? value : value + 'px');
      return pixels / 100;
    }

    // Check if the value is in em
    if (value.endsWith('em')) {
      const ems = parseFloat(value);
      return ems * 16 / 100; // Assuming 1em = 16px for conversion
    }

    // Default case if the value format is not recognized
    return value;
  }

}

window.customElements.define('ftui-cell', FtuiCell);
