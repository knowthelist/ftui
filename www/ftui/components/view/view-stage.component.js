
/*
* ViewStage component

* for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { Stack } from '../../modules/ftui/ftui.helper.js';
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

    this.addEventListener('touchstart', this.startTouch, false);
    this.addEventListener('touchmove', this.moveTouch, false);

    // move all views right
    const allViews = this.querySelectorAll('ftui-view');
    allViews.forEach((view) => {
      view.style.zIndex = 0;
      view.style.transform = 'translateX(100%)';
    });

    // start view
    this.showStartView();
  }

  template() {
    return `
          <style>
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
      view.style.zIndex = this.stack.size();
      view.style.transform = 'translateX(0)';
    }
  }

  goBack() {
    const view = this.stack.pop();
    if (view) {
      view.style.zIndex = this.stack.size();
      view.style.transform = 'translateX(100%)';
    }
  }

  showStartView() {
    if (this.startElement) {
      while (!this.stack.isEmpty()) {
        const view = this.stack.pop()
        view.style.zIndex = this.stack.size();
        view.style.transform = 'translateX(100%)';
      }
      this.startElement.style.zIndex = 0;
      this.startElement.style.transform = 'translateX(0)';
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
      if (diffX < -50) {
        // swiped right
        this.goBack();
        this.initialX = null;
        this.initialY = null;
      }
    } else {
      this.initialX = null;
      this.initialY = null;
    }

    e.preventDefault();
  }
}

window.customElements.define('ftui-view-stage', FtuiViewStage);
