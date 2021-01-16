/*
* ViewItem component
*
* for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiViewItem extends FtuiElement {

  constructor() {
    super(FtuiViewItem.properties);

    this.addEventListener('click', this.onClicked);
  }

  template() {
    return `<style> @import "components/view/view-item.component.css"; </style>
            <div class="container">
              <div class="content">
                <div class="inner">
                  <slot name="start"></slot>
                  <slot></slot>
                </div>
                <slot name="end"></slot>
              </div>
            </div>`;
  }

  static get properties() {
    return {
      navTarget: '',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiViewItem.properties), ...super.observedAttributes];
  }

  onClicked() {
    if (this.navTarget) {
      const stage = this.closest('ftui-view-stage');
      if (stage) {
        stage.goForward(this.navTarget);
      }
    }
  }

}

window.customElements.define('ftui-view-item', FtuiViewItem);
