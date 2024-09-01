/*
* Popup component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import * as ftui from '../../modules/ftui/ftui.helper.js';

export class FtuiPopup extends FtuiElement {

  constructor() {
    super(FtuiPopup.properties);

    this.overlay = this.shadowRoot.querySelector('.overlay');
    this.window = this.shadowRoot.querySelector('.window');
    const header = this.querySelector('header, ftui-popup-header');
    header && header.setAttribute('slot', 'header');
    // check for popup-close attribute
    this.window.addEventListener('click', event => this.onClickInside(event));
    this.overlay.addEventListener('click', event => this.onClickOverlay(event));

    this.arrangeWindow();
  }


  template() {
    return `
      <style> @import "components/popup/popup.component.css"; </style>
      <style> 
        .overlay {
          position: fixed;
          top: 0; left: 0; bottom: 0; right: 0;
          overflow: auto;
          background-color:var(--popup-overlay-color, #000);
          z-index: 99;
          opacity: ${this.opacity};
        }
      </style>
      <div class="overlay">

      </div>
      <div class="window">
      <slot name="header"></slot>
      <span class="box-close">
        <slot name="close">
          <span class="close" popup-close>&times;</span>
        </slot>
      </span>
      <div class="content">
        <slot></slot>
      </div>
    </div>`;
  }

  static get properties() {
    return {
      height: '33%',
      width: '50%',
      left: '',
      top: '',
      active: false,
      trigger: '',
      timeout: 10,
      hidden: true,
      opacity: 0.5,
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiPopup.properties), ...super.observedAttributes];
  }

  onClickOverlay(event) {
    this.setState(false);
    event.preventDefault();
  }

  onClickInside(event) {
    if (event.target.hasAttribute('popup-close')) {
      this.setState(false);
      event.preventDefault();
    }
    this.startTimeout();
  }

  onAttributeChanged(name, newValue) {
    switch (name) {
      case 'width':
      case 'height':
      case 'left':
      case 'top':
        this.arrangeWindow();
        break;
      case 'active':
        this.setState(newValue !== null);
        break;
      case 'trigger':
        if (this.isInitialized && !this.disabled) {
          this.setState(true);
        }
        this.isInitialized = true;
        break;
    }
  }

  arrangeWindow() {
    this.window.style.width = this.width;
    this.window.style.height = this.height;
    this.window.style.left = this.left;
    this.window.style.top = this.top;
  }

  setState(value) {
    if (value) {
      this.removeAttribute('hidden');
      ftui.triggerEvent('ftuiVisibilityChanged');
      this.startTimeout();
    } else {
      this.setAttribute('hidden', '');
      this.emitEvent('close');
    }
  }

  open() {
    this.setState(true);
  }

  close() {
    this.setState(false);
  }

  startTimeout() {
    clearTimeout(this.timer);
    if (this.timeout) {
      this.timer = setTimeout(() => this.setState(false), this.timeout * 1000);
    }
  }
}

window.customElements.define('ftui-popup', FtuiPopup);
