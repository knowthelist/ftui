/*
* Tab-Title component for FTUI version 3
*
* Copyright (c) 2022 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiLabel } from '../label/label.component.js';

export class FtuiTabTitle extends FtuiLabel {

  constructor() {
    super(FtuiTabTitle.properties);
  }

  static get properties() {
    return {
      group: 'default',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiTabTitle.properties), ...super.observedAttributes];
  }

}

window.customElements.define('ftui-tab-title', FtuiTabTitle);
