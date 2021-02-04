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
    this.currentIndex = 0;
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
      dots: false,
      autoPlay: false,
      interval: 5,
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiSwiper.properties), ...super.observedAttributes];
  }

  get slides() {
    return this.slotMain.assignedElements();
  }

  onConnected() {
    this.initObservers();
    this.createDots();
    this.checkInterval();
  }

  initObservers() {
    this.slides.forEach(item => this.initInViewportObserver(item));
  }

  initInViewportObserver(elem) {
    const observer = new IntersectionObserver(
      this.onIntersectionChange.bind(this),
      {
        root: this.container,
        delay: 500,
        trackVisibility: true,
      });
    observer.observe(elem);
  }

  onIntersectionChange(entries) {
    entries.forEach(entry => {
      entry.target.isVisible = ('isVisible' in entry) ? entry.isVisible : entry.isIntersecting;
      if (entry.target.isVisible && this.value !== entry.target.id) {
        this.value = entry.target.id;
      }
    });
  }

  onAttributeChanged(name, newValue, oldValue) {
    switch (name) {
      case 'value': {
        if (newValue !== oldValue) {
          const target = this.slides.find(item => item.id === newValue);
          this.currentIndex = this.slides.indexOf(target);
          this.updateDots();
          if (target && !target.isVisible) {
            target.scrollIntoView();
          }
        }
      }
        break;
      case 'interval':
      case 'auto-play':
        this.checkInterval();
        break;
    }
  }

  onDotClicked(event) {
    this.setValueByIndex(event.target.id.replace(`${this.id}-dot-`, ''));
  }

  back(iteration=1) {
    this.currentIndex--;
    if (this.currentIndex < 0) {
      this.currentIndex = this.slides.length - 1;
    }
    if (this.slides[this.currentIndex].hidden && iteration < this.slides.length) {
      this.back(iteration++);
    } else {
      this.setValueByIndex(this.currentIndex);
    }
  }

  next(iteration = 0) {
    this.currentIndex++;
    if (this.currentIndex >= this.slides.length) {
      this.currentIndex = 0;
    }
    if (this.slides[this.currentIndex].hidden && iteration < this.slides.length) {
      this.next(iteration++);
    } else {
      this.setValueByIndex(this.currentIndex);
    }
  }

  setValueByIndex(index) {
    const slide = this.slides[index];
    if (slide) {
      this.value = slide.id;
    }
  }

  createDots() {
    if (this.slotDots.assignedElements().length > 0 || !this.dots) {
      return;
    }
    this.slides.forEach((item, index) => {
      const elem = createElement('div', 'dot');
      elem.addEventListener('click', this.onDotClicked.bind(this));
      if (item.id === this.value) {
        elem.classList.add('active');
      }
      elem.id = `${this.id}-dot-${index}`;
      this.slotDots.appendChild(elem);
    })
  }

  updateDots() {
    const dotElements = this.slotDots.assignedElements().length
      ? this.slotDots.assignedElements() : this.slotDots.childNodes;
    dotElements.forEach((dotElement, index) => {
      if (this.currentIndex === index) {
        dotElement.classList.add('active');
      } else {
        dotElement.classList.remove('active');
      }
    });
  }

  checkInterval() {
    clearInterval(this.intervalTimer);
    if (this.interval && this.autoPlay) {
      this.intervalTimer = setInterval(() => this.next(), this.interval * 1000);
    }
  }

}

window.customElements.define('ftui-swiper', FtuiSwiper);
