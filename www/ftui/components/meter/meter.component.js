/*
* Meter component
*
* for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiMeter extends FtuiElement {

  constructor() {
    super(FtuiMeter.properties);

    this.progress = this.shadowRoot.querySelector('.progress');
    this.bar = this.shadowRoot.querySelector('.progress-bar');

  }

  template() {
    return `
          <style>
          .container {
            width: 100%;
            text-align: center;
          }
          .progress {
            width: ${this.width};
            height: ${this.height};
            padding: 0.15em 0 0.07em 0.1em;
            background: var(--dark-color);
            border-radius: var(--meter-border-radius, 1em);
            -webkit-box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25), 0 1px rgba(255, 255, 255, 0.08);
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25), 0 1px rgba(255, 255, 255, 0.08);
          }
          .progress-bar {
            height: 100%;
            background-color: var(--color-base, #20639b);
            border-radius: var(--meter-border-radius, 1em);
            -webkit-transition: 0.4s linear;
            transition: 0.4s linear;
            -webkit-transition-property: width, background-color;
            transition-property: width, background-color;
            -webkit-box-shadow: 0 0 1px 1px rgba(0, 0, 0, 0.25), inset 0 1px rgba(255, 255, 255, 0.1);
            box-shadow: 0 0 1px 1px rgba(0, 0, 0, 0.25), inset 0 1px rgba(255, 255, 255, 0.1);
          }
            </style>
            <div class="container">
              <div class="progress">
                <div class="progress-bar"></div>
                <slot></slot>
              </div>
            </div>`;

  }

  static get properties() {
    return {
      height: '1em',
      width: '10em',
      color: 'primary',
      value: 0,
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiMeter.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'value':
        this.bar.style.width = this.value + '%';
        break;
    }
  }

}

window.customElements.define('ftui-meter', FtuiMeter);
