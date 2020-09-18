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
    Object.entries(attributes).forEach(([name, defaultValue]) => {
      if (typeof attributes[name] === 'boolean') {
        this.defineBooleanProperty(name);
        this.initBooleanAttribute(name, defaultValue);
      } else if (typeof attributes[name] === 'number') {
        this.defineNumberProperty(name);
        this.initAttribute(name, defaultValue);
      } else {
        this.defineStringProperty(name);
        this.initAttribute(name, defaultValue);
      }
    })
  }

  initAttribute(name, value) {
    if (!this.hasAttribute(name)) {
      this.setAttribute(name, value);
    }
  }

  initBooleanAttribute(name, value) {
    if (!this.hasAttribute(name) && value) {
      this.setAttribute(name, '');
    }
  }

  defineBooleanProperty(name) {
    Object.defineProperty(this, name, {
      get() { return this.hasAttribute(name); },
      set(value) {
        if (value) {
          this.setAttribute(name, '');
        } else {
          this.removeAttribute(name);
        }
      }
    });
  }

  defineNumberProperty(name) {
    Object.defineProperty(this, name, {
      get() { return Number(this.getAttribute(name)); },
      set(value) { this.setAttribute(name, value); }
    });
  }

  defineStringProperty(name) {
    Object.defineProperty(this, name, {
      get() { return this.getAttribute(name); },
      set(value) { this.setAttribute(name, value); }
    });
  }
}
