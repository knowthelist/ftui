/*
* Swiper component for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

class FtuiSwiper extends FtuiElement {

  constructor(properties) {

    super(Object.assign(FtuiSwiper.properties, properties));

  }


  template() {
    return `
    <style> @import "components/swiper/swiper.component.css"; </style>
    <div class="slides">
      <slot></slot>
    </div>
      `;
  }

  static get properties() {
    return {
      value: 'off'
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiSwiper.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'value':
        break;
    }
  }

}

window.customElements.define('ftui-swiper', FtuiSwiper);
