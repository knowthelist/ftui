/*
* Grid component for FTUI version 3
*
* Copyright (c) 2019-2022 Mario Stephan <mstephan@shared-files.de>
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
      margin: 8,
      resize: false,
      responsive: false,
      columns: 0,
      rows: 0,
    };
    super(properties);

    this.debouncedResize = debounce(this.configureGrid, this);

    this.windowWidth = 0;
    this.tiles = this.querySelectorAll(`#${this.id} ftui-grid-tile, #${this.id} [data-grid-tile]`);


    if (this.responsive) {
      if ( this.columns === 0 && this.rows === 0) {
        this.configResponsiveGrid();
      }
    } else {
      if (this.resize) {
        if ('ResizeObserver' in window) {
          const resize_ob = new ResizeObserver(() => {
            this.debouncedResize(500);
          });

          resize_ob.observe(document.body);
        } else {
          window.addEventListener('resize', () => {
            this.debouncedResize(500);
          });
        }

      }
      this.configureGrid();
      document.addEventListener('ftuiVisibilityChanged', () => this.configureGrid());
      document.addEventListener('ftuiComponentsAdded', () => this.configureGrid());
    }
  }

  template() {
    return `<style> 
      :host(:not([responsive])) {
        position: relative;
        display: block;
        width: 100%;
        height: 100%;
        margin: 0;
      }
      :host([responsive][columns][rows]) {
        display: grid;
        grid-template-columns: repeat(${this.columns}, 1fr);
        grid-template-rows: repeat(${this.rows}, 1fr);
        grid-auto-flow: dense;
        gap: ${this.margin}px;
        margin: ${this.margin}px;
      }
      :host([responsive][columns="0"][rows="0"]) {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        grid-template-rows: repeat(auto-fill, minmax(140px, 1fr));
        grid-auto-flow: dense;
        grid-auto-columns: 25%;
        grid-auto-rows: 25%;
        gap: ${this.margin}px;
        margin: ${this.margin}px;
      }
      :host([shape="round"]) {
        --grid-tile-border-radius: 0.75em;
      }
    </style>
    <slot></slot>
    `;
  }

  onConnected() {
    //this.style.margin = 0;
    if (this.responsive && this.columns > 0 && this.rows > 0) {
      this.configResponsiveGrid2();
    }
  }

  configResponsiveGrid() {
    const baseWidth = (this.baseWidth > 0) ? this.baseWidth : 140;
    const baseHeight = (this.baseHeight > 0) ? this.baseHeight : 140;
    this.tiles.forEach(tile => {
      tile.style['grid-row'] = 'span ' + tile.getAttribute('height');
      tile.style['grid-column'] = 'span ' + tile.getAttribute('width');
    });
    this.style['grid-auto-rows'] = baseHeight + 'px';
    this.style['grid-auto-columns'] = baseWidth + 'px';
  }
  
  configResponsiveGrid2() {
    const baseWidth = (this.baseWidth > 0) ? this.baseWidth : 140;
    const baseHeight = (this.baseHeight > 0) ? this.baseHeight : 140;
    this.tiles.forEach(tile => {
      tile.style['grid-row-end'] = 'span ' + Number(tile.getAttribute('height'));
      tile.style['grid-column-end'] = 'span ' + tile.getAttribute('width');
    });
  }

  configureGrid() {
    let highestCol = -1;
    let highestRow = -1;
    let baseWidth = 0;
    let baseHeight = 0;
    let cols = 0;
    let rows = 0;

    // find highest
    this.tiles.forEach(tile => {
      const colVal = Number(tile.col) + Number(tile.width) - 1;
      if (colVal > highestCol) { highestCol = colVal; }
      const rowVal = Number(tile.row) + Number(tile.height) - 1;
      if (rowVal > highestRow) { highestRow = rowVal; }
    });

    cols = (this.cols > 0) ? this.cols : highestCol;
    rows = (this.rows > 0) ? this.rows : highestRow;
    baseWidth = (this.baseWidth > 0) ? this.baseWidth : (this.clientWidth - this.margin) / cols;
    baseHeight = (this.baseHeight > 0) ? this.baseHeight : (this.clientHeight - this.margin) / rows;
    if (baseWidth < this.minX) {
      baseWidth = this.minX;
    }
    if (baseHeight < this.minY) {
      baseHeight = this.minY;
    }

    this.tiles.forEach(tile => {
      const style = tile.style;
      style.width = (tile.width * baseWidth - this.margin) + 'px';
      style.height = (tile.height * baseHeight - this.margin) + 'px';
      style['position'] = 'absolute';
      if (tile.querySelector('ftui-grid')) {
        style.backgroundColor = 'transparent';
        style.left = ((tile.col - 1) * baseWidth) + 'px';
        style.top = ((tile.row - 1) * baseHeight) + 'px';
      } else {
        style.left = ((tile.col - 1) * baseWidth + this.margin) + 'px';
        style.top = ((tile.row - 1) * baseHeight + this.margin) + 'px';
      }
    });
  }
}

window.customElements.define('ftui-grid', FtuiGrid);
