/*
* View component

* for FTUI version 3
*
* Copyright (c) 2020-2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiView extends FtuiElement {

  constructor() {
    super(FtuiView.properties);
  }

  template() {
    return `
          <style>
            :host {

              will-change: transform;
              width: 100%;
              position: absolute;
              left: 0;
              top: 0;
/*               transition: -webkit-transform 0.3s cubic-bezier(0.465, 0.183, 0.153, 0.946); */
              transition: transform 0.3s cubic-bezier(0.465, 0.183, 0.153, 0.946);
              display: inline-block;
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
    return [...this.convertToAttributes(FtuiView.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, newValue) {
    switch (name) {
      case 'level':
        this.style.setProperty('--view-level', newValue);
        break;
    }
  }
}

window.customElements.define('ftui-view', FtuiView);
