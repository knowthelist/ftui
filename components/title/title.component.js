/*
* Title component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiLabel } from '../label/label.component.js';

export class FtuiTitle extends FtuiLabel {

  constructor() {
    super();
  }

  template() {
    return `<style> :host { font-size: 2em; } </style>`
            + super.template();
  }
}

window.customElements.define('ftui-title', FtuiTitle);
