/*
* View component

* for FTUI version 3
*
* Copyright (c) 2020-2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiView extends FtuiElement {

  constructor() {
    super();

    const header = this.querySelector('ftui-view-toolbar');
    header && header.setAttribute('slot', 'header');
  }

  template() {
    return `
          <style>
            :host {
              background: var(--view-background-color);
              will-change: transform;
              width: 100%;
              height: 100%;
              position: fixed;
              left: 0;
              top: 0;
              transform: translateX(0);
              transition: transform 0.3s cubic-bezier(0.465, 0.183, 0.153, 0.946);
              display: flex;
              flex-direction: column;
              overflow: hidden;
            }
            :host([outside]) {
              transform: translateX(100%);
            }
            .content {
              padding-top: 44px;
              height: 100vh;
              overflow: scroll;
            }
            </style>
            <slot name="header"></slot>
            <div class="content">
              <slot></slot>
            </div>`;
  }
}

window.customElements.define('ftui-view', FtuiView);
