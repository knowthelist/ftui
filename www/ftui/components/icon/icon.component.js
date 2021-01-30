/*
* Icon component for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

const sizes = [0.75, 0.875, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 6, 8];

export class FtuiIcon extends FtuiElement {

  constructor(properties) {
    super(Object.assign(FtuiIcon.properties, properties));
    this.elementIcon = this.shadowRoot.querySelector('#icon');
  }

  template() {
    return `
        <style> @import "components/icon/icon.component.css"; </style>
        <span id="icon"></span>
        <slot></slot>
      `;
  }

  static get properties() {
    return {
      type: 'svg',
      path: 'icons',
      size: -1,
      name: '',
      color: '',
      rgb: '',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiIcon.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, newValue) {
    switch (name) {
      case 'name':
        this.loadIcon(`${this.path}/${newValue}.${this.type}`);
        break;
      case 'rgb':
        this.elementIcon.style.color = `#${newValue.replace('#', '')}`;
        break;
      case 'size':
        if (this.size > -1) {
          this.style.fontSize = sizes[this.size] + 'rem';
        }
        break;
    }
  }

  loadIcon(url) {
    if (url.endsWith('svg')) {
      fetch(url)
        .then(response => {
          // workaround until this issue has been fixed
          // https://forum.fhem.de/index.php/topic,115823.0.html
          const contentType = response.headers.get('Content-Type');
          if (contentType && contentType.startsWith('text/html')) {
            throw new Error(`${this.id} - icon '${this.name}' not found`);
          }
          return response.text()
        })
        .then(svg => this.elementIcon.innerHTML = svg)
        .catch(error => console.error(error));
    } else {
      this.elementIcon.innerHTML = `<img src="${url}"></img>`;
    }
  }
}

window.customElements.define('ftui-icon', FtuiIcon);
