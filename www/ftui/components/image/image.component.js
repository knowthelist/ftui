/*
* Image component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { notAvailable } from './image_not_available.js';
import { isNumeric, isVisible } from '../../modules/ftui/ftui.helper.js';


export class FtuiImage extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiImage.properties, properties));

    this.imageElement = this.shadowRoot.querySelector('img');
    this.updateImage();
    document.addEventListener('ftuiVisibilityChanged', () => this.updateImage());
  }

  template() {
    return `
    <style>
      :host {position: relative;}
      :host([shape="round"]) img {
        border-radius: 1.5em;
      }
      :host([shape="circle"]) img {
        border-radius: 50%;
      }
      ::slotted(ftui-badge),
      ::slotted(ftui-icon),
      ::slotted(ftui-image),
      ::slotted(ftui-label)  {
        top: 0;
        position: absolute;
        right: 0;
      }
    </style>
    <img></img>
    <slot></slot>`;
  }

  static get properties() {
    return {
      base: '',
      src: '',
      suffix: '',
      width: '100%',
      height: 'auto',
      interval: 0,
      refresh: '',
      user: '',
      pass: '',
      top: '',
      left: '',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiImage.properties), ...super.observedAttributes];
  }

  onConnected() {
    this.imageElement.style.width = this.width;
    this.imageElement.style.height = this.height;
    this.checkInterval();
  }

  onAttributeChanged(name, newValue) {
    switch (name) {
      case 'src':
      case 'refresh':
        this.updateImage();
        break;
      case 'width':
      case 'height':
        this.imageElement.style[name] = this[name];
        break;
      case 'interval':
        this.checkInterval();
        break;
      case 'top':
      case 'left':
      case 'bottom':
      case 'right':
        this.style[name] = isNumeric(newValue) ? newValue + 'px' : newValue;
        break;
    }
  }

  onError() {
    this.imageElement.src = notAvailable;
    this.imageElement.onerror = null;
  }

  async updateImage() {
    if (isVisible(this.imageElement)) {
      this.imageElement.onerror = this.onError.bind(this);
      this.imageElement.src = await this.createUrl();
    }
  }

  async createUrl() {
    const src = this.base + this.src + this.suffix;

    if (this.user.length) {
      const options = {
        username: this.user,
        password: this.pass,
      };
      const result = await fetch(src, options);
      const content = await result.blob();
      return URL.createObjectURL(content);
    } else {
      if (src && (this.hasAttribute('nocache') || this.refresh)) {
        const url = new URL(src);
        url.searchParams.set('_', Date.now());
        return url;
      }
      return src;
    }

  }

  checkInterval() {
    clearInterval(this.intervalTimer);
    if (this.interval) {
      this.intervalTimer = setInterval(() => this.updateImage(), this.interval * 1000);
    }
  }
}

window.customElements.define('ftui-image', FtuiImage);
