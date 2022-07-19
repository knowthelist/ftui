/*
* Label component for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { isNumeric } from '../../modules/ftui/ftui.helper.js';

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
      :host([text-align=left])   { text-align: left; width: 100%;}
      :host([text-align=right])  { text-align: right; width: 100%;}
      :host([text-align=center])   { text-align: center; width: 100%;}
        :host {
          --color-base: currentColor;
          color: var(--color-base);
          white-space: nowrap;
        }
        :host(:empty:not([text])) slot[name="unit"],
        :host([text=""]) slot[name="unit"] { visibility: hidden; }
        :host([scroll]) { overflow: auto; white-space: normal; }
        :host([bold]) { font-weight: bold; }
        :host(:empty[text=""][placeholder]) { display: inline-block;
          background-color: var(--medium-color);
          height: .75em; border-radius: 2em;
          opacity: .3; animation: fading 1.5s infinite;
          min-width: 4em; }
        :host([size="10"]),:host([size="11"]),:host([size="12"]) {
          font-family: "HelveticaNeue-UltraLight", "Segoe UI", "Roboto Light", sans-serif;
          line-height: 0.8em; }
        @keyframes fading { 
          0% { opacity: .3; }
          50% { opacity: .5; }
          100% { opacity: .3; }}
      </style>
      <slot name="start"></slot><slot></slot><slot name="content"></slot><slot name="unit">${this.unit}</slot><slot name="end"></slot>`;
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
      top: '',
      left: '',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiLabel.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, value) {
    switch (name) {
      case 'text':
        this.mainSlotElement.innerHTML = value;
        this.checkInterval();
        break;
      case 'unit':
        this.unitSlotElement.textContent = this.unit;
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
      case 'top':
        this.style.top = isNumeric(value) ? value + 'em' : value;
        break;
      case 'left':
        this.style.left = isNumeric(value) ? value + 'em' : value;
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
      this.intervalTimer = setInterval(() => this.refresh(), this.interval * 1000);
    }
  }

  refresh() {
    this.binding && this.binding.forceUpdate('text');
  }
}

window.customElements.define('ftui-label', FtuiLabel);
