/*
* Swiper component for FTUI version 3
*
* Copyright (c) 2021-2022 Mario Stephan <mstephan@shared-files.de>
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
    this.createDots();
    this.checkInterval();
    this.initObservers();
  }

  initObservers() {
    this.slides.forEach(item => this.initInViewportObserver(item));
    this.slides.forEach(item => this.initMutationObserver(item));
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

  initMutationObserver(elem) {
    const observer = new MutationObserver(
      this.onMutations.bind(this));
    observer.observe(elem,
      {
        attributes: true,
        attributeFilter: ['hidden'],
      });
  }

  onIntersectionChange(entries) {
    if (!this.autoPlay) {
      entries.forEach(entry => {
        entry.target.isVisible = ('isVisible' in entry) ? entry.isVisible : entry.isIntersecting;
        if (entry.target.isVisible && this.value !== entry.target.id) {
          this.submitChange('value', entry.target.id);
        }
      });
    }
  }

  // refresh if a slide changes visibility
  onMutations(entries) {
    entries.forEach(() => {
      this.updateDots();
      this.next();
    });
  }

  onAttributeChanged(name, newValue, oldValue) {
    switch (name) {
      case 'value': {
        if (newValue !== oldValue) {
          const target = this.slides.find(item => item.id === newValue);
          this.currentIndex = this.slides.indexOf(target);
          this.updateDots();
          if (target) {
            this.container.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
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

  back(iteration = 1) {
    this.currentIndex--;
    if (this.currentIndex < 0) {
      this.currentIndex = this.slides.length - 1;
    }
    // if previous slide is hidden, get the next one
    if (this.slides[this.currentIndex].hidden && iteration < this.slides.length) {
      this.back(iteration++);
    } else {
      if (iteration === this.slides.length) {
        this.currentIndex = -1;
        this.updateDots();
      }
      this.setValueByIndex(this.currentIndex);
    }
  }

  next(iteration = 0) {
    this.currentIndex++;
    if (this.currentIndex >= this.slides.length) {
      this.currentIndex = 0;
    }
    // if next slide is hidden, get the next one

    if (this.slides[this.currentIndex].hidden && iteration < this.slides.length) {
      iteration++;
      this.next(iteration);
    } else {
      if (iteration === this.slides.length) {
        this.currentIndex = -1;
        this.updateDots();
      }
      this.setValueByIndex(this.currentIndex);
    }
  }

  setValueByIndex(index) {
    const slide = this.slides[index];
    if (slide) {
      this.submitChange('value', slide.id);
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
      dotElement.classList.toggle('hidden', this.slides[index].hidden);
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
