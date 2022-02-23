/*
* ViewToolbar component
*
* for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { getLocalCssPath } from '../../modules/ftui/ftui.helper.js';

export class FtuiViewToolbar extends FtuiElement {

  constructor() {
    super();
  }

  template() {
    return `<style> @import "${getLocalCssPath(import.meta.url)}"; </style>
            <div class="container">
              <div class="link left">
                <slot name="start"></slot>
              </div>
              <div class="title">
                <slot></slot>
              </div>
              <div class="link right">
                <slot name="end"></slot>
              </div>
            </div>`;
  }
}

window.customElements.define('ftui-view-toolbar', FtuiViewToolbar);
