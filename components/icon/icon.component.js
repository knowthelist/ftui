/* 
* Icon component for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

export class FtuiIcon extends FtuiElement {

  constructor(attributes) {
    super(Object.assign(FtuiIcon.defaults, attributes));
    this.elementIcon = this.shadowRoot.querySelector('#icon');
  }

  template() {
    return `
        <style> @import "components/icon/icon.component.css"; </style>
        <span id="icon"></span>
      `;
  }

  static get defaults() {
    return {
      type: 'svg',
      path: 'icons',
      name: '',
      color: '',
      rgb: ''
    };
  }

  static get observedAttributes() {
    return [...Object.keys(FtuiIcon.defaults), ...super.observedAttributes];
  }

  onAttributeChanged(name, oldValue, newValue) {
    console.log(this.id,name, oldValue, newValue)
    switch (name) {
      case 'name':
        this.fetchIcon(`${this.path}/${newValue}.${this.type}`);
        break;
      case 'rgb':
        this.elementIcon.style.color = `#${newValue.replace('#', '')}`;
        break;
    }
  }

  fetchIcon(name) {
    fetch(name)
      .then(response => response.text())
      .then(svg => {
        this.elementIcon.innerHTML = svg;
      });
  }
}

window.customElements.define('ftui-icon', FtuiIcon);
