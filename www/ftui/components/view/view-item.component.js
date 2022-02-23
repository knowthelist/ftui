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
import { getLocalCssPath } from '../../modules/ftui/ftui.helper.js';

export class FtuiViewItem extends FtuiElement {

  constructor() {
    super(FtuiViewItem.properties);

    this.shadowRoot.addEventListener('slotchange', () => {
      const node = this.querySelector('ftui-checkbox');
      if (node) {
        this.classList.add('clickable')
      }
    })
    this.addEventListener('click', this.onClicked);
  }

  template() {
    return `<style> @import "${getLocalCssPath(import.meta.url)}"; </style>
            <div class="content">
              <slot name="start"></slot>
              <div class="inner">
                <div class="inner-wrapper">
                  <slot></slot>
                </div>
                <slot name="end"></slot>
              </div>
            </div>`;
  }

  static get properties() {
    return {
      target: '',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiViewItem.properties), ...super.observedAttributes];
  }

  onClicked() {
    if (this.target) {
      const stage = this.closest('ftui-view-stage');
      if (stage) {
        stage.goForward(this.target);
      }
    }
    // ToDo: make this more generic
    if(this.classList.contains('clickable')){
      const checkbox = this.querySelector('ftui-checkbox');
      checkbox.toggle();
    }
  }

}

window.customElements.define('ftui-view-item', FtuiViewItem);
