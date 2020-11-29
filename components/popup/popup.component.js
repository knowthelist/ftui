/*
* Popup component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiPopup extends FtuiElement {

  constructor() {
    super(FtuiPopup.properties);

    this.element = this.shadowRoot.querySelector('.overlay');
    this.window = this.shadowRoot.querySelector('.window');
    document.addEventListener('click', event => this.onClickOutside(event));
    this.element.addEventListener('click', event => this.onClickInside(event));

    this.resize();
  }

  template() {
    return `
      <style> @import "components/popup/popup.component.css"; </style>
      <div class="overlay">
        <div class="window">
            <span class="close">&times;</span>
            <slot></slot>
        </div>
      </div>`;
  }

  static get properties() {
    return {
      height: '33%',
      width: '50%',
    };
  }

  onClickOutside(event) {
    const target = event.target;
    if (target.hasAttribute('popup-target')) {
      const targetId = target.getAttribute('popup-target');
      if (this.id === targetId) {
        this.element.classList.add('open');
      }
      event.preventDefault();
    }
  }

  onClickInside(event) {
    const target = event.target;
    // Close window with 'close'  or when the backdrop is clicked
    if (target.classList.contains('close') || target.classList.contains('overlay')) {
      this.element.classList.remove('open');
      event.preventDefault();
    }
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'width':
      case 'height':
        this.resize();
        break;
    }
  }

  resize() {
    this.window.style.width = this.width;
    this.window.style.height = this.height;
  }

}

window.customElements.define('ftui-popup', FtuiPopup);
