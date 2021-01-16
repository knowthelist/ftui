/*
* Navigation menu component
*
* for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiNavLink extends FtuiElement {

  constructor() {
    super(FtuiNavLink.properties);

    this.addEventListener('click', this.onClicked);
  }

  template() {
    return `
      <style>
        :host {
          cursor:pointer;
        }
      </style>
      <slot>&#10094; &nbsp; Back</slot>`;
  }

  static get properties() {
    return {
      target: 'back'
    };
  }

  onClicked() {
    const stage = this.closest('ftui-view-stage');
    if (stage) {
      switch (this.target) {
        case 'root':
          stage.showStartView();
          break;
        case 'back':
          stage.goBack();
          break;
        default:
          stage.goForward(this.navTarget);
          break;
      }
    }
  }
}

window.customElements.define('ftui-nav-link', FtuiNavLink);
