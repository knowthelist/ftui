/*
* Badge component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiLabel } from '../label/label.component.js';


export class FtuiBadge extends FtuiLabel {
  constructor() {
    super();
  }

  template() {
    return `
      <style> @import "components/badge/badge.component.css"; </style>
      <slot></slot><slot name="content"></slot>
      `;
  }

}

window.customElements.define('ftui-badge', FtuiBadge);
