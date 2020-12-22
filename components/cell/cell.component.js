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
import { isNumeric, capitalize } from '../../modules/ftui/ftui.helper.js';

export class FtuiCell extends FtuiElement {

  constructor(properties) {
    super(Object.assign(FtuiCell.properties, properties));
  }

  template() {
    return `
    <style>
      :host {
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        align-items: center;
        background: var(--color-base);
        color: var(--color-contrast);
      }
    </style>
    <slot></slot>`;
  }

  static get properties() {
    return {
      height: '',
      width: '',
      alignItems: 'center',
      space: 'evenly',
      color: 'transparent',
      margin: '0',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiCell.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, value) {
    switch (name) {
      case 'width':
        this.style.width = value;
        break;
      case 'height':
        this.style.height = value;
        break;
      case 'space':
        this.style.justifyContent = ('space-' + value);
        break;
      case 'margin': {
        this.style[`margin${capitalize(this.alignItems)}`] = isNumeric(value) ? value + 'em' : value;
      }
        break;
      case 'align-items': {
        const alignValue =
          (value === 'left' || value === 'top')
            ? 'flex-start'
            : (value === 'right' || value === 'bottom')
              ? 'flex-end' : value;
        const property = this.tagName === 'FTUI-COLUMN' ? 'justifyContent' : 'alignItems';
        this.style[property] = alignValue;

      }
    }
  }

}

window.customElements.define('ftui-cell', FtuiCell);
