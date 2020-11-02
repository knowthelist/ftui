/*
* GridTile component for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiGridTile extends FtuiElement {

  constructor() {
    const properties = {
      row: 0,
      col: 0,
      height: 0,
      width: 0,
      color: ''
    };
    super(properties);
  }

  template() {
    return `<style> @import "components/grid/grid-tile.component.css"; </style>
    <slot></slot>`;
  }
}

window.customElements.define('ftui-grid-tile', FtuiGridTile);
