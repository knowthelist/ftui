/*
* ViewToolbar component
*
* for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiViewToolbar extends FtuiElement {

  constructor(properties) {
    super(properties);
  }

  template() {
    return `<style> @import "components/view/view-toolbar.component.css"; </style>
            <div class="container">
              <slot name="start"></slot>
              <slot name="secondary"></slot>
              <div class="content">
                <slot></slot>
              </div>
              <slot name="primary"></slot>
              <slot name="end"></slot>
            </div>`;
  }
}

window.customElements.define('ftui-view-toolbar', FtuiViewToolbar);
