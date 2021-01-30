/*
* Swiper component for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

class FtuiSwiper extends FtuiElement {

  constructor(properties) {

    super(Object.assign(FtuiSwiper.properties, properties));
    this.container = this.shadowRoot.querySelector('.slides');
    this.slots = this.shadowRoot.querySelector('slot');
  }


  template() {
    return `
    <style> @import "components/swiper/swiper.component.css"; </style>
    <div class="slides">
      <slot></slot>
    </div>
      `;
  }

  static get properties() {
    return {
      value: '',
      debounce: 200,
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiSwiper.properties), ...super.observedAttributes];
  }

  onConnected() {
    this.initObservers();
  }

  initObservers() {
    this.slots.assignedElements().forEach(item => this.initInViewportObserver(item));
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
          const target = this.slots.assignedElements().find(item => item.id === newValue);
          if (target && !target.isVisible) {
            target.scrollIntoView();
          }
        }
      }
        break;
    }
  }

}

window.customElements.define('ftui-swiper', FtuiSwiper);
