/*
* GridHead component for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiGridHeader extends FtuiElement {

  constructor() {
    const properties = {
      height: '',
      width: '100%',
      color: ''
    };
    super(properties);
  }

  template() {
    return `
    <style>
    :host {
      --color-base: var(--grid-header-background-color, #272727);
      height: ${this.height};
      width: ${this.width};
    }
    </style>
    <slot></slot>`;
  }
}

window.customElements.define('ftui-grid-header', FtuiGridHeader);
