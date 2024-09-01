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
      color: 'transparent',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiCell.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, value) {
    switch (name) {
      case 'width':
        this.style.width = isNumeric(value) ? value + 'px' : value;
        break;
      case 'height':
        this.style.flex = this.calculateFlexValue(value);;
        //this.style.height = isNumeric(value) ? value + 'px' : value;
        break;
      case 'gap':
        this.style.gap = isNumeric(value) ? value + 'px' : value;
        break;
    }
  }

  calculateFlexValue(height) {
    // Check if the height is in percentage
    if (height.endsWith('%')) {
      const percentage = parseFloat(height);
      return percentage / 10; // Converts 25% to 2.5 for flex
    }
    
    // Check if the height is in pixels or numeric (assumed to be pixels)
    if (height.endsWith('px') || /^\d+$/.test(height)) {
      const pixels = parseFloat(height.endsWith('px') ? height : height + 'px');
      return pixels / 100; // Adjust this divisor based on your layout needs
    }

    // Check if the height is in em
    if (height.endsWith('em')) {
      const ems = parseFloat(height);
      return ems * 16 / 100; // Assuming 1em = 16px for conversion, adjust as needed
    }

    // Default case if the height format is not recognized
    return 1; // Fallback to a default flex value
  }

}

window.customElements.define('ftui-cell', FtuiCell);
