/*
* ViewSection component
*
* for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiViewSection extends FtuiElement {

  constructor(properties) {
    super(properties);
  }

  template() {
    return `<style> @import "components/view/view-section.component.css"; </style>
            <div class="header">
              <slot name="header"></slot>
            </div>         
            <div class="inner">
              <slot></slot>
            </div>
            <div class="footer">
              <slot name="footer"></slot>
            </div>`;
  }
}

window.customElements.define('ftui-view-section', FtuiViewSection);
