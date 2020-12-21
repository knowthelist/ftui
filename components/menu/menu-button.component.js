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

export class FtuiMenuButton extends FtuiElement {

  constructor() {
    super(FtuiMenuButton.properties);

    this.addEventListener('click', this.onClicked);
  }

  template() {
    return `<span style="font-size:30px;cursor:pointer">&#9776; open</span>`;
  }

  static get properties() {
    return {
      menu: 'ftui-menu-1',
    };
  }

  onClicked() {
    const elementMenu = document.getElementById(this.menu);
    if (elementMenu.hasAttribute('open')) {
      elementMenu.removeAttribute('open');

    } else {
      elementMenu.setAttribute('open', '');
    }
  }
}

window.customElements.define('ftui-menu-button', FtuiMenuButton);
