/*
* Swiper component for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { createElement } from '../../modules/ftui/ftui.helper.js';

class FtuiSwiper extends FtuiElement {

  constructor(properties) {

    super(Object.assign(FtuiSwiper.properties, properties));
    this.container = this.shadowRoot.querySelector('.slides');
    this.slotMain = this.shadowRoot.querySelector('slot');
    this.slotDots = this.shadowRoot.querySelector('slot[name=dots]');
  }


  template() {
    return `
    <style> @import "components/swiper/swiper.component.css"; </style>
    <div class="slides">
      <slot></slot>
    </div>
    <slot name="dots"></slot>
      `;
  }

  static get properties() {
    return {
      value: '',
      debounce: 200,
      dots: false
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiSwiper.properties), ...super.observedAttributes];
  }

  onConnected() {
    this.initObservers();
    this.createDots();
  }

  initObservers() {
    this.slotMain.assignedElements().forEach(item => this.initInViewportObserver(item));
  }

  initInViewportObserver(elem) {
    const observer = new IntersectionObserver(
      this.onIntersectionChange.bind(this),
      {
        root: this.container,
        delay: 100,
        trackVisibility: true,
      });
    observer.observe(elem);
  }

  onIntersectionChange(entries) {
    entries.forEach(entry => {
      entry.target.isVisible = entry.isVisible;
      if (entry.isIntersecting && entry.isVisible && this.value !== entry.target.id) {
        this.value = entry.target.id;
      }
    });
  }

  onAttributeChanged(name, newValue, oldValue) {
    switch (name) {
      case 'value': {
        if (newValue !== oldValue) {
          const target = this.slotMain.assignedElements().find(item => item.id === newValue);
          if (target && !target.isVisible) {
            target.scrollIntoView();
          }
        }
      }
        break;
    }
  }

  createDots() {
    if (this.slotDots.assignedElements().length > 0 || !this.dots) {
      return;
    }
    console.log('createDots')
    this.slotMain.assignedElements().forEach(item => {
      console.dir(item)
      const elem = createElement('div', 'dot');
      elem.id = item.id;
      this.slotDots.appendChild(elem);
    })
  }

}

window.customElements.define('ftui-swiper', FtuiSwiper);
