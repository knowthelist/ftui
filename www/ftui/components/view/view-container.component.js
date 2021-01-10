
/*
* View component

* for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiViewContainer extends FtuiElement {

  constructor(properties) {
    super(properties);
  }

  template() {
    return `
          <style>
            :host {
              width: 100%;
              height: 100%;
              max-width: 400px;
              max-height: 600px;
              overflow: hidden;
              position: relative;
              display: inline-block;
            }
            </style>
            <slot></slot>`;
  }
}

window.customElements.define('ftui-view-container', FtuiViewContainer);
