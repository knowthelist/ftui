/*
* Label component for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

const sizes = [0.75, 0.875, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 6, 8];
export class FtuiLabel extends FtuiElement {

  constructor(properties) {
    super(Object.assign(FtuiLabel.properties, properties));

    this.mainSlotElement = this.shadowRoot.querySelector('slot[name="content"]');
    this.unitSlotElement = this.shadowRoot.querySelector('slot[name="unit"]');
  }

  template() {
    return `
      <style>
        :host {
          --color-base: currentColor;
          color: var(--color-base);
        }
        :host(.is-empty) { display: none; }
        :host([scroll]) { overflow: auto; }
        :host([size="10"]),:host([size="11"]),:host([size="12"]) {
          font-family: "HelveticaNeue-UltraLight", "Segoe UI", "Roboto Light", sans-serif;
          line-height: 0.8em;
        }
      </style>
      <slot name="start"></slot><slot></slot><slot name="content"></slot><slot name="unit"></slot>`;
  }

  static get properties() {
    return {
      text: '',
      color: '',
      unit: '',
      size: -1,
      interval: 0,
      width: '',
      height: '',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiLabel.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, value) {
    switch (name) {
      case 'text':
        this.mainSlotElement.innerHTML = this.text;
        if (this.unitSlotElement) {        
          this.unitSlotElement.innerHTML = this.unit;
          if (this.text.length==0) {
            this.unitSlotElement.innerHTML = '';
          }
        }
        this.checkInterval();
        break;
      case 'interval':
        this.checkInterval();
        break;
      case 'size':
        if (this.size > -1) {
          this.style.fontSize = sizes[this.size] + 'rem';
        }
        if (this.size >= 6) {
          this.style.letterSpacing = '-0.05em';
        }
        if (this.size >= 10) {
          this.style.fontFamily = '"HelveticaNeue-UltraLight", "Segoe UI", "Roboto Light", sans-serif';
        }
        break;
      case 'width':
        this.style.width = value;
        break;
      case 'height':
        this.style.height = value;
        break;
    }
  }

  checkInterval() {
    clearInterval(this.intervalTimer);
    if (this.interval) {
      this.intervalTimer = setInterval(() => this.binding.forceUpdate('text'), this.interval * 1000);
    }
  }
}

window.customElements.define('ftui-label', FtuiLabel);
