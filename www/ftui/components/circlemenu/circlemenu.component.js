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
      }
    });
  }

  template() {
    return `<style> @import "components/circlemenu/circlemenu.component.css"; </style>
      <div class="overlay"></div>
      <slot></slot>`;
  }

  static get properties() {
    return {
      circleRadius: 6,
      keepOpen: false,
      direction: 'full',
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
