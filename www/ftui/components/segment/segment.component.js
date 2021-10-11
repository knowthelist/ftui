/*
* Segment component for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
// eslint-disable-next-line no-unused-vars
import { FtuiSegmentButton } from './segment-button.component.js';

class FtuiSegment extends FtuiElement {

  constructor(properties) {

    super(Object.assign(FtuiSegment.properties, properties));

    this.selector = this.shadowRoot.querySelector('.selection');
    this.slotMain = this.shadowRoot.querySelector('slot');

    this.slotMain.addEventListener('click', this.onClick.bind(this));
    document.addEventListener('ftuiVisibilityChanged', () => this.update());
  }

  template() {
    return `
    <style> @import "components/segment/segment.component.css"; </style>
		<div class="segments">
			<span class="selection"></span>
			<slot></slot>
		</div>`;
  }

  static get properties() {
    return {
      value: '',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiSegment.properties), ...super.observedAttributes];
  }

  onConnected() {
    this.update();
  }

  onAttributeChanged(name, newValue, oldValue) {
    switch (name) {
      case 'value': {
        if (newValue !== oldValue) {
          this.update();
        }
      }
        break;
    }
  }

  get segments() {
    return this.slotMain.assignedElements();
  }

  onClick(event) {
    const target = event.target.closest('ftui-segment-button');
    if (target) {
      this.submitChange('value', target.value);
    }
  }

  back() {
    this.currentIndex--;
    if (this.currentIndex < 0) {
      this.currentIndex = this.segments.length - 1;
    }
    this.setValueByIndex(this.currentIndex);
  }

  next() {
    this.currentIndex++;
    if (this.currentIndex >= this.segments.length) {
      this.currentIndex = 0;
    }
    this.setValueByIndex(this.currentIndex);
  }

  setValueByIndex(index) {
    this.submitChange('value', this.segments[index].value);
  }

  update() {
    // index
    const target = this.segments.find(item => item.value === this.value);
    this.currentIndex = this.segments.indexOf(target);
    if (this.currentIndex < 0) {
      this.currentIndex = 0;
    }
    // pill position
    this.selector.style.transform = 'translateX(' + ((this.selector.scrollWidth + 0.5)  * this.currentIndex) + 'px)';
    // active button
    this.segments.forEach((segment, index) => {
      if (this.currentIndex === index) {
        segment.classList.add('active');
      } else {
        segment.classList.remove('active');
      }
    });
  }

}

window.customElements.define('ftui-segment', FtuiSegment);
