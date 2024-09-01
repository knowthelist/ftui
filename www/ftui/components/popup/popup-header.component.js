/*
* popupHead component for FTUI version 3
*
* Copyright (c) 2021-2024 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuipopupHeader extends FtuiElement {

  constructor() {
    const properties = {
      height: '',
      width: '100%',
      color: '',
    };
    super(properties);
  }

  template() {
    return `
    <style>
    :host {
      --color-base: var(--popup-header-background-color, #272727);
      height: ${this.height};
      width: ${this.width};
    }
    </style>
    <slot></slot>`;
  }
}

window.customElements.define('ftui-popup-header', FtuipopupHeader);
