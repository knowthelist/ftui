/*
* ViewSheet component
*
* for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { isNumeric, capitalize } from '../../modules/ftui/ftui.helper.js';

export class FtuiViewSheet extends FtuiElement {

  constructor() {
    super(FtuiViewSheet.properties);

    this.element = this.shadowRoot.querySelector('.content');
    console.log(this.element)
  }

  template() {
    return `<style> @import "components/view/view-sheet.component.css"; </style>
            <div class="content">

                  <slot></slot>

            </div>`;
  }

  static get properties() {
    return {
      height: '10em',
      width: '100%',
      color: 'transparent',
      margin: '2em',
      shape: 'round',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiViewSheet.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, value) {
    console.log(this.element, name , value)
    switch (name) {
      case 'width':
        this.element.style.width = value;
        break;
      case 'height':
        this.element.style.height = value;
        break;
      case 'margin': {
        this.element.style[`margin${capitalize(this.alignItems)}`] = isNumeric(value) ? value + 'em' : value;
        break;
      }
    }
  }

}

window.customElements.define('ftui-view-sheet', FtuiViewSheet);
