
/*
* ViewStage component

* for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { Stack, supportsPassive } from '../../modules/ftui/ftui.helper.js';
import { FtuiElement } from '../element.component.js';

export class FtuiViewStage extends FtuiElement {

  constructor() {
    super(FtuiViewStage.properties);

    this.stack = new Stack();
    this.initialX = null;
    this.initialY = null;

    this.startElement = this.start
      ? document.querySelector(`#${this.start}`)
      : this.querySelector('ftui-view:first-of-type');

    const usePassive = supportsPassive();

    this.addEventListener('touchstart', this.startTouch, usePassive ? { passive: true } : false);
    this.addEventListener('touchmove', this.moveTouch, usePassive ? { passive: true } : false);

    // move all views out
    const allViews = this.querySelectorAll('ftui-view');
    allViews.forEach((view) => {
      view.setAttribute('outside', '');
    });

    // start view
    this.showStartView();
  }

  template() {
    return `<style>
              :host {
                width: 100%;
                height: 100%;
                overflow: hidden;
                display: block;
                position: relative; 
              }
            </style>
            <slot></slot>`;
  }

  static get properties() {
    return {
      start: '',
    };
  }

  // Stack operations

  goForward(viewId) {
    const view = document.querySelector(`#${viewId}`);
    if (view) {
      this.stack.push(view);
      view.removeAttribute('outside');
    }
  }

  goBack() {
    const view = this.stack.pop();
    if (view) {
      view.setAttribute('outside', '');
    }
  }

  showStartView() {
    if (this.startElement) {
      while (!this.stack.isEmpty()) {
        const view = this.stack.pop()
        view.setAttribute('outside', '');
      }
      this.startElement.removeAttribute('outside');
    }
  }

  // slide back gesture

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
      if (this.initialX < 20 && diffX < -100) {
        // swiped right
        this.goBack();
        this.initialX = null;
        this.initialY = null;
      }
    } else {
      this.initialX = null;
      this.initialY = null;
    }
  }
}

window.customElements.define('ftui-view-stage', FtuiViewStage);
