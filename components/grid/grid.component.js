/*
* Grid component for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { debounce } from '../../modules/ftui/ftui.helper.js';
// eslint-disable-next-line no-unused-vars
import { FtuiGridTile } from './grid-tile.component.js';

export class FtuiGrid extends FtuiElement {

  constructor() {
    const properties = {
      minX: 0,
      minY: 0,
      baseWidth: 0,
      baseHeight: 0,
      cols: 0,
      rows: 0,
      margin: 8,
      resize: false
    };
    super(properties);

    this.debouncedResize = debounce(this.configureGrid, this);

    this.windowWidth = 0;
    this.tiles = this.querySelectorAll('ftui-grid-tile');
    this.configureGrid();

    if (this.resize) {
      window.addEventListener('resize', () => {
        if (this.windowWidth !== window.innerWidth) {
          this.debouncedResize(500);
          this.windowWidth = window.innerWidth;
        }
      });
    }
    document.addEventListener('ftuiVisibilityChanged', () => this.configureGrid());
    document.addEventListener('ftuiComponentsAdded', () => this.configureGrid());
  }

  template() {
    return `<style> 
      :host {
        position: relative;
        display: block;
        width: 100vw;
        height: 100vh;
      } 
    </style>
    <slot></slot>
    `;
  }

  configureGrid() {
    let highestCol = -1;
    let highestRow = -1;
    let baseWidth = 0;
    let baseHeight = 0;
    let cols = 0;
    let rows = 0;

    this.tiles.forEach(item => {
      const colVal = Number(item.col) + Number(item.width) - 1;
      if (colVal > highestCol) { highestCol = colVal; }
      const rowVal = Number(item.row) + Number(item.height) - 1;
      if (rowVal > highestRow) { highestRow = rowVal; }
    });

    cols = (this.cols > 0) ? this.cols : highestCol;
    rows = (this.rows > 0) ? this.rows : highestRow;
    baseWidth = (this.baseWidth > 0) ? this.baseWidth : (window.innerWidth - this.margin) / cols;
    baseHeight = (this.baseHeight > 0) ? this.baseHeight : (window.innerHeight - this.margin) / rows;

    if (baseWidth < this.minX) {
      baseWidth = this.minX;
    }
    if (baseHeight < this.minY) {
      baseHeight = this.minY;
    }

    this.tiles.forEach(item => {
      const style = item.style;
      style.width = (item.width * baseWidth - this.margin) + 'px';
      style.height = (item.height * baseHeight - this.margin) + 'px';
      if (item.querySelector('ftui-grid')) {
        style.backgroundColor = 'transparent';
        style.left = ((item.col - 1) * baseWidth) + 'px';
        style.top = ((item.row - 1) * baseHeight) + 'px';
      } else {
        style.left = ((item.col - 1) * baseWidth + this.margin) + 'px';
        style.top = ((item.row - 1) * baseHeight + this.margin) + 'px';
      }
    });

  }
}

window.customElements.define('ftui-grid', FtuiGrid);
