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
      position: 'center',
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
        switch (this.position) {
          case 'left':
            this.style.marginLeft = isNumeric(value) ? value + 'em' : value;
            break;
          case 'right':
            this.style.marginRight = isNumeric(value) ? value + 'em' : value;
            break;
        }
      }
        break;
      case 'position': {
        const alignValue = (value === 'left') ? 'flex-start' : (value === 'right') ? 'flex-end' : value;
        this.style.alignItems = alignValue;
      }
    }
  }

}

window.customElements.define('ftui-cell', FtuiCell);
