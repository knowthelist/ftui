/*
* Row component

* for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiCell } from '../cell/cell.component.js';

export class FtuiRow extends FtuiCell {

  constructor() {
    super();
  }

  template() {
    return super.template() +
      `<style>
        :host {
          flex-direction: row;
          height: 100%;
          width: 100%;
        }
        :host([align-items~=top]) {
          align-items: start;
        }
        :host([align-items~=bottom]) {
          align-items: end;
        }
        :host([align-items~=left]) {
          justify-content: flex-start;
        }
        :host([align-items~=right]) {
          justify-content: flex-end;
        }
      </style>`;
  }
}

window.customElements.define('ftui-row', FtuiRow);
