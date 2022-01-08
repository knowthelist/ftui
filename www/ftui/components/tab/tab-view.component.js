/*
* TabView component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { selectAll } from '../../modules/ftui/ftui.helper.js';

export class FtuiTabView extends FtuiElement {

  constructor() {
    super(FtuiTabView.properties);

    this.addEventListener('click', this.onClicked);
  }

  template() {
    return `
      <style>
        :host {
         width: calc(100vw - 1px);
         height: calc(100vh - 100px);
         display: block;
        }
        </style>
        <slot></slot>`
  }

  static get properties() {
    return {
      group: 'default',
      hidden: true,
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiTabView.properties), ...super.observedAttributes];
  }

  onClicked() {
    // restart all goHome timeouts
    selectAll(`ftui-tab[group="${this.group}"][view="${this.id}"]`)
      .forEach(elem => {
        elem.startTimeout();
      });
  }

}

window.customElements.define('ftui-tab-view', FtuiTabView);
