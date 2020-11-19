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

export class FtuiView extends FtuiElement {

  constructor(properties) {
    super(properties);
  }

  template() {
    return `
          <style>
            :host {
              display: inline-block;
              width: 100%;
              height: 100%;
            }
            </style>
            <slot></slot>`;
  }
}

window.customElements.define('ftui-view', FtuiView);
