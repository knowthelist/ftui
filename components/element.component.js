/* 
* Base component for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/


import { log, toBool } from '../modules/ftui/ftui.helper.js';

let uids = {};

export class FtuiElement extends HTMLElement {

  constructor(attributes) {
    super();

    if (!this.id) {
      if (!uids[this.localName]) {
        uids[this.localName] = 1;
      }
      this.id = `${this.localName}-${uids[this.localName]++}`;
    }

    this.defaults = Object.assign(FtuiElement.defaults, attributes);

    this.initProperties(this.defaults);

    if (typeof this.template === 'function') {
      this.createShadowRoot();
    }

    if (window.ftuiApp) {
      ftuiApp.attachBinding(this);
    }
   
  }

  createShadowRoot() {
    const elemTemplate = document.createElement('template');
    elemTemplate.innerHTML = this.template();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(elemTemplate.content.cloneNode(true));
  }

  static get defaults() {
    return {
      hidden: false,
      disabled: false
    };
  }

  static get observedAttributes() {
    return [...Object.keys(FtuiElement.defaults)];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    log(3, `${this.id} -  attributeChangedCallback name=${name}, oldValue=${oldValue}, newValue=${newValue}`)
    if (typeof this.onAttributeChanged === 'function') {
      // call the hook function of the instance
      this.onAttributeChanged(name, oldValue, newValue);
    }
    switch (name) {
      case 'hidden':
        this.style.display = newValue !== null ? 'none' : '';
        break;
      case 'disabled':
        this.style.filter = newValue !== null ? 'invert(0.5) sepia(1) saturate(0) blur(1px)' : '';
        this.style.pointerEvents = newValue !== null ? 'none' : '';
        break;
    }
  }

  initProperties(attributes) {
    Object.entries(attributes).forEach(([key, defaultValue]) => {
      if (typeof attributes[key] === 'boolean') {
        this.defineBooleanProperty(key);
        this.initBooleanAttribute(key, defaultValue);
      } else if (typeof attributes[key] === 'number') {
        this.defineNumberProperty(key);
        this.initAttribute(key, defaultValue);
      } else {
        this.defineStringProperty(key);
        this.initAttribute(key, defaultValue);
      }
    })
  }

  initAttribute(key, value) {
    if (!this.hasAttribute(key)) {
      this.setAttribute(key, value);
    }
  }

  initBooleanAttribute(key, value) {
    if (!this.hasAttribute(key) && value) {
      this.setAttribute(key, '');
    }
  }

  defineBooleanProperty(key) {
    Object.defineProperty(this, key, {
      get() { return this.hasAttribute(key); },
      set(value) {
        if (value) {
          this.setAttribute(key, '');
        } else {
          this.removeAttribute(key);
        }
      }
    });
  }

  defineNumberProperty(key) {
    Object.defineProperty(this, key, {
      get() { return Number(this.getAttribute(key)); },
      set(value) { this.setAttribute(key, value); }
    });
  }

  defineStringProperty(key) {
    Object.defineProperty(this, key, {
      get() { return this.getAttribute(key); },
      set(value) { this.setAttribute(key, value); }
    });
  }
}
