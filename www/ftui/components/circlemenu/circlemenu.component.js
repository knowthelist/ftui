/*
* Circlemenu component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { CircleMenu } from '../../modules/circle-menu/circle-menu.min.js';

export class FtuiCircleMenu extends FtuiElement {

  constructor(properties) {

    super(Object.assign(FtuiCircleMenu.properties, properties));
    this.elementOverlay = this.shadowRoot.querySelector('.overlay');
    this.elementOverlay.addEventListener('click', this.onClickOverlay.bind(this));

    this.circleMenu = new CircleMenu(this, {
      trigger: 'click',
      circle_radius: this.circleRadius,
      direction: this.direction,
      close_event: this.keepOpen ? '' : 'click',
      open: () => {
        this.onOpen();
      },
      close: () => {
        this.onClose();
      },
      select: () => {
        this.onClose();
      }
    });
  }

  template() {
    return `<style>
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      min-width: 3em;
      min-height: 3em;
    }
    :host ::slotted(*:first-child) {
      cursor: pointer; 
      transform: translateZ(0); 
      position: absolute;
    }
    :host ::slotted(*) {
      position: absolute;
      z-index: 1;
      opacity: 1;
    }
    :host(.open) ::slotted(*) {
      z-index: 2;
    }
    .fixed {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color:var(--circlemenu-overlay-color, #000);
      opacity: ${this.opacity};
      z-index: 2;
    }    
    </style>
    <div class="overlay"></div>
    <slot></slot>`;
  }

  static get properties() {
    return {
      circleRadius: 6,
      keepOpen: false,
      direction: 'full',
      opacity: 0.75,
      timeout: 4
    }
  }

  onClickOverlay() {
    this.circleMenu.close(true);
  }

  onOpen() {
    const parent = this.closest('ftui-grid-tile, ftui-popup');
    if (parent) {
      parent.style.overflow = 'visible';
    }
    this.elementOverlay.classList.add('fixed');
    if (!this.keepOpen) {
      setTimeout(() => this.circleMenu.close(true), this.timeout * 1000);
    }
  }

  onClose() {
    const parent = this.closest('ftui-grid-tile, ftui-popup');
    if (parent) {
      parent.style.overflow = 'hidden';
    }
    this.elementOverlay.classList.remove('fixed');
  }

}

window.customElements.define('ftui-circlemenu', FtuiCircleMenu);
