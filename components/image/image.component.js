/* 
* Image component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import * as ftui from '../../modules/ftui/ftui.helper.js';

export class FtuiImage extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiImage.properties, properties));

    this.imageElement = this.shadowRoot.querySelector('img');
    this.updateImage();
    document.addEventListener('ftuiVisiblityChanged', () => this.updateImage());
  }

  template() {
    return `<img></img>`;
  }

  static get properties() {
    return {
      base: '',
      src: '',
      width: 'auto',
      height: 'auto',
      interval: 0,
      refresh: ''
    };
  }

  static get observedAttributes() {
    return [...Object.keys(FtuiImage.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'src':
      case 'refresh':
        this.updateImage();
        break;
      case 'width':
        this.imageElement.width = this.width;
        break;
      case 'height':
        this.imageElement.height = this.height;
        break;
      case 'interval':
        this.checkInterval();
        break;
    }
  }

  updateImage() {
    if (ftui.isVisible(this.imageElement)) {
      this.imageElement.src = this.getUrl();
    }
  }

  getUrl() {
    const src = this.base + this.src;
    if (src && (this.hasAttribute('nocache') || this.refresh)) {
      const url = new URL(src);
      url.searchParams.set('_', Date.now());
      return url;
    }
    return src
  }

  checkInterval() {
    clearInterval(this.intervalTimer);
    if (this.interval) {
      this.intervalTimer = setInterval(() => this.updateImage(), this.interval * 1000);
    }
  }
}

window.customElements.define('ftui-image', FtuiImage);
