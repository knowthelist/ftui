/*
* ViewSection component
*
* for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
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
            <div class="container">
              <div class="content">
                <div class="inner">
                  <slot name="start"></slot>
                  <slot></slot>
                </div>
                <slot name="end"></slot>
              </div>
            </div>`;
  }
}

window.customElements.define('ftui-view-section', FtuiViewSection);
