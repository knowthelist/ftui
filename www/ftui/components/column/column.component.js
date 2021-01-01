/*
* Column component

* for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiCell } from '../cell/cell.component.js';

export class FtuiColumn extends FtuiCell {

  constructor() {
    super();
  }

  template() {
    return super.template() +
      `<style>
        :host {
          height: 100%;
          width: 100%;
        }
      </style>`;
  }
}

window.customElements.define('ftui-column', FtuiColumn);
