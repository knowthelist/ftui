/*
* Icon component for FTUI version 3
*
* Copyright (c) 2019-2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { isNumeric } from '../../modules/ftui/ftui.helper.js';

const sizes = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 6, 8];

export class FtuiIcon extends FtuiElement {

  constructor(properties) {
    super(Object.assign(FtuiIcon.properties, properties));
    this.elementIcon = this.shadowRoot.querySelector('.icon');
  }

  template() {
    return `
        <style> @import "components/icon/icon.component.css"; </style>
        <span class="icon"></span>
        <slot></slot>
      `;
  }

  static get properties() {
    return {
      type: 'svg',
      path: 'icons',
      size: 0,
      name: '',
      color: '',
      rgb: '',
      height: '',
      width: '',
      top: '',
      left: '',
      bottom: '',
      right: '',
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
      case 'width':
      case 'height':
        this.style.setProperty(`--icon-${name}`, newValue);
        break;
      case 'top':
      case 'left':
      case 'bottom':
      case 'right':
        this.style[name] = isNumeric(newValue) ? newValue + 'em' : newValue;
        break;
      case 'size':
        if (this.size > -7 && this.size < 13) {
          this.style.fontSize = sizes[this.size + 4] + 'rem';
        }
        break;
    }
  }

  loadIcon(url) {
    if (url.endsWith('svg')) {
      fetch(url)
        .then(response => {
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
