/* 
* Button widget for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { FtuiIcon } from '../icon/icon.component.js';
import { FtuiButton } from '../button/button.component.js';

export class FtuiButtonNice extends FtuiElement {
  constructor() {
    super();
  }

  template() {
    return `
      <style> @import "themes/color-attribute.css"; </style>
      <ftui-button shape="circle" color="dark" 
          [value]="${this.get}" 
          (value)="${this.set || this.get}" 
          [color]="${this.get} | map('${this.getOn || 'on'}:primary, ${this.getOff || 'off'}:dark')"
          states="${this.states || 'on,off'}">
        <ftui-icon name="lightbulb" color="transparent"></ftui-icon>
      </ftui-button>
      `;
  }
}

window.customElements.define('ftui-button-nice', FtuiButtonNice);
