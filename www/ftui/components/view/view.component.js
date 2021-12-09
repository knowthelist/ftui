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
    this.content = this.shadowRoot.querySelector('.content');
    header && header.setAttribute('slot', 'header');

    this.addEventListener('touchstart', this.startTouch, false);
    this.addEventListener('touchmove', this.moveTouch, false);
  }

  template() {
    return `
          <style>
            :host {
              background: var(--view-background-color);
              will-change: transform;
              width: 100vw;
              height: 100vh;
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
              transform: translateX(100vw);
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
  startTouch(e) {
    this.initialX = e.touches[0].clientX;
    this.initialY = e.touches[0].clientY;
  }

  moveTouch(e) {
    if (this.initialX === null) {
      return;
    }

    if (this.initialY === null) {
      return;
    }

    const currentY = e.touches[0].clientY;

    const diffY = this.initialY - currentY;

    if (this.isPullDown(this.content.scrollTop, diffY)) {
      //alert('Swipe Down!');
    }

  }

  isPullDown(Y, dY) {
    console.log( Y, dY)
    // methods of checking slope, length, direction of line created by swipe action
    return (
      Y == 0 && dY < 0 && Math.abs(dY) > 300
    );
  }
}

window.customElements.define('ftui-view', FtuiView);
