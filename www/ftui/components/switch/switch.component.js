/*
* Switch component for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiCheckbox } from '../checkbox/checkbox.component.js';
import { getLocalCssPath } from '../../modules/ftui/ftui.helper.js';

export class FtuiSwitch extends FtuiCheckbox {

  constructor(properties) {

    super(Object.assign(FtuiSwitch.properties, properties));

    const texts = this.texts.split(/[;,:]/).map(item => item.trim());
    const inner = this.shadowRoot.querySelector('.inner');
    inner.setAttribute('data-text-off', texts[0]);
    inner.setAttribute('data-text-on', texts[1]);
  }


  template() {
    return `
    <style> @import "${getLocalCssPath(import.meta.url)}"; </style>

      <span class="checkbox">
          <span class="inner"></span>
          <span class="switch"></span>
      </span>
    `;
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiSwitch.properties), ...super.observedAttributes];
  }
}

window.customElements.define('ftui-switch', FtuiSwitch);
