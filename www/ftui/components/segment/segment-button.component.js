/*
* Segment button component for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiSegmentButton extends FtuiElement {

  constructor(properties) {

    super(Object.assign(FtuiSegmentButton.properties, properties));

  }

  template() {
    return `
    <style> 
      :host {
          display: flex;
          justify-content: center;
          min-height: 1.75em;
          align-items: center;
          -webkit-transition: all .2s ease;
          transition: all .2s ease;
          will-change: color;
          background: transparent;
          --color-base: var(--segments-text-color, #20639b);
          color: var(--color-base);
          cursor: pointer;
        }
        :host(.active) {
          --color-base: var(--segments-selection-contrast-color);
        }
        :host(:not(.active):hover) {
          --color-base: var(--segments-hover-color);
        }
        ::slotted(*) {
          z-index: 2;
        }
    </style>

			<slot></slot>`;
  }

  static get properties() {
    return {
      value: '',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiSegmentButton.properties), ...super.observedAttributes];
  }

}

window.customElements.define('ftui-segment-button', FtuiSegmentButton);
