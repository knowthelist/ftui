
/*
* ViewStage component

* for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
// eslint-disable-next-line no-unused-vars
import { FtuiView } from '../view/view.component.js';

export class FtuiViewStage extends FtuiElement {

  constructor() {
    super(FtuiViewStage.properties);

    this.initialX = null;
    this.initialY = null;

    this.addEventListener('click', this.onClicked);
    this.addEventListener('touchstart', this.startTouch, false);
    this.addEventListener('touchmove', this.moveTouch, false);

  }

  template() {
    return `
          <style>
            :host {
              width: 100%;
              height: 100%;
           /*    max-width: 400px;
              max-height: 600px; */
              overflow: hidden;
              display: block;
              position: relative;
            }
            :host ::slotted(ftui-view) {
              transform: translateX(calc((var(--view-stage-level) - var(--view-level)) * -100%));
            }
            </style>
            <slot></slot>`;
  }

  static get properties() {
    return {
      level: 0,
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiViewStage.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, newValue) {
    switch (name) {
      case 'level':
        this.style.setProperty('--view-stage-level', newValue);
        break;
    }
  }

  onClicked(event) {
    const target = event.target.getAttribute('target');
    console.dir(event.target)
    console.log(target)
    if (target) {
      this.level = target;
    }
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

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const diffX = this.initialX - currentX;
    const diffY = this.initialY - currentY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // sliding horizontally
      if (diffX > 0) {
        // swiped left
        console.log('swiped left');

        if (this.level < 1) {
          this.level = this.level + 1
        }
      } else {
        // swiped right
        console.log('swiped right');
        if (this.level > 0) {
          this.level = this.level - 1
        }
      }
    } else {
      // sliding vertically
      if (diffY > 0) {
        // swiped up
        console.log('swiped up');
      } else {
        // swiped down
        console.log('swiped down');
      }
    }

    this.initialX = null;
    this.initialY = null;

    e.preventDefault();
  }
}

window.customElements.define('ftui-view-stage', FtuiViewStage);
