/*
* Navigation menu component
*
* for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiMenu extends FtuiElement {

  constructor() {
    super(FtuiMenu.properties);

    this.element = this.shadowRoot.querySelector('.box-menu');
    this.addEventListener('click', () => { this.open = false; });
  }

  template() {
    return `<style> @import "components/menu/menu.component.css"; </style>
    <div class="box-menu"><slot></slot></div>`;
  }

  static get properties() {
    return {
      height: '33%',
      width: '50%',
      open: false,
      autoHide: true,
      timeout: 10,
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiMenu.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, newValue) {
    switch (name) {
      case 'open':
        this.setState(newValue !== null);
        break;
    }
  }

  setState(value) {
    if (value) {
      this.element.classList.add('open');
      this.startTimeout();
    } else {
      this.element.classList.remove('open');
    }
    this.emitChangeEvent('open', this.open);
  }

  startTimeout() {
    clearTimeout(this.timer);
    if (this.timeout) {
      this.timer = setTimeout(() => this.open = false, this.timeout * 1000);
    }
  }
}

window.customElements.define('ftui-menu', FtuiMenu);
