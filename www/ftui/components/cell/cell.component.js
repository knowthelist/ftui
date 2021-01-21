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
        if (this.tagName === 'FTUI-COLUMN') {
          this.style.flex = `0 0 ${value}`;
        } else {
          this.style.width = value;
        }
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
        const direction = this.tagName === 'FTUI-COLUMN' ? 'col' : 'row';

        switch (`${direction}-${value}`) {
          case 'row-left':
          case 'col-top':
            this.style.justifyContent = 'flex-start';
            break;
          case 'row-right':
          case 'col-bottom':
            this.style.justifyContent = 'flex-end';
            break;
          case 'row-top':
          case 'col-left':
            this.style.alignItems = 'flex-start';
            break;
          case 'row-bottom':
          case 'col-right':
            this.style.alignItems = 'flex-end';
            break;
        }
      }
    }
  }

}

window.customElements.define('ftui-cell', FtuiCell);
