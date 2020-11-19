/*
* Column component

* for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiColumn extends FtuiElement {

  constructor() {
    const properties = {
      color: 'transparent'
    };
    super(properties);
  }

  template() {
    return `
    <style>
      :host {
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        align-items: center;
        height: 100%;
        width: 100%;
        background: var(--color-base);
        color: var(--color-contrast);
      }
    </style>
    <slot></slot>`;
  }

}

window.customElements.define('ftui-column', FtuiColumn);
