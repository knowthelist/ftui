/*
* Rotor component for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';

class FtuiRotor extends FtuiElement {

  constructor(properties) {

    super(Object.assign(FtuiRotor.properties, properties));
    this.blades = null;
    this.current = 0;
    this.slots = this.shadowRoot.querySelector('slot');
  }

  template() {
    return `
      <style> 
      :host {
        perspective: 300px;
      }
      
      ::slotted(*) {
        opacity: 0;
        transform-origin: 50% 100%;
        transform: rotateX(180deg);
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        display: flex;
        justify-content: center;
      }
      
      ::slotted(*.is-visible) {
        position: relative;
        opacity: 1;
        transform: rotateX(0deg);
        animation: rotate-in 1.2s;
      }
      
      ::slotted(*.is-hidden) {
        transform: rotateX(180deg);
        animation: rotate-out 1.2s;
      }
      </style>
      <slot></slot>
      `;
  }

  static get properties() {
    return {
      interval: 2,
      width: '',
      height: '',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiRotor.properties), ...super.observedAttributes];
  }

  onConnected() {
    this.blades = this.slots.assignedElements();
    if (this.blades.length) {
      this.blades[this.current].classList.add('is-visible');
      this.checkInterval();
    }
  }

  onAttributeChanged(name, value) {
    switch (name) {
      case 'interval':
        this.checkInterval();
        break;
      case 'width':
        this.style.width = value;
        break;
      case 'height':
        this.style.height = value;
        break;
    }
  }

  next(iteration = 0) {
    let currentBlade = this.blades[this.current];
    if (currentBlade) {
      currentBlade.classList.remove('is-visible');
      currentBlade.classList.add('is-hidden');
    }
    this.current++;
    if (this.current >= this.blades.length) {
      this.current = 0;
    }
    if (this.blades[this.current].hidden && iteration < this.blades.length) {
      iteration++;
      this.next(iteration);
    } else {
      if (iteration === this.blades.length) {
        this.current = 0;
      }
    }
    currentBlade = this.blades[this.current];
    if (currentBlade) {
      currentBlade.classList.remove('is-hidden');
      currentBlade.classList.add('is-visible');
    }
  }

  checkInterval() {
    clearInterval(this.intervalTimer);
    if (this.interval) {
      this.intervalTimer = setInterval(() => this.next(), this.interval * 1000);
    }
  }
}

window.customElements.define('ftui-rotor', FtuiRotor);
