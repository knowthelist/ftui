/*
* Base component for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/


import * as ftuiHelper from '../modules/ftui/ftui.helper.js';

const uids = {};

export class FtuiElement extends HTMLElement {

  constructor(properties) {
    super();

    if (!this.id) {
      if (!uids[this.localName]) {
        uids[this.localName] = 1;
      }
      this.id = `${this.localName}-${uids[this.localName]++}`;
    }

    this.properties = Object.assign(FtuiElement.properties, properties);

    this.initProperties(this.properties);

    if (typeof this.template === 'function') {
      this.createShadowRoot(this.template());
    }

    if (window.ftuiApp) {
      ftuiApp.attachBinding(this);
    }

  }

  createShadowRoot(content) {
    const elemTemplate = document.createElement('template');
    elemTemplate.innerHTML = content;
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(elemTemplate.content.cloneNode(true));
  }

  static get properties() {
    return {
      hidden: false,
      disabled: false,
      readonly: false
    };
  }

  static get observedAttributes() {
    return [...Object.keys(FtuiElement.properties)];
  }

  static convertToAttributes(properties) {
    return Object.keys(properties).map(property => ftuiHelper.toKebabCase(property));
  }

  attributeChangedCallback(name, oldValue, newValue) {
    ftuiHelper.log(3, `${this.id} -  attributeChangedCallback name=${name}, oldValue=${oldValue}, newValue=${newValue}`)
    if (typeof this.onAttributeChanged === 'function') {
      // call the hook function of the instance
      this.onAttributeChanged(name, newValue, oldValue);
    }
    switch (name) {
      case 'hidden':
        this.style.display = newValue !== null ? 'none' : '';
        break;
      case 'disabled':
        this.style.filter = newValue !== null ? 'sepia(1) saturate(0) blur(1px)' : '';
        this.style.pointerEvents = newValue !== null ? 'none' : '';
        break;
      case 'readonly':
        this.style.pointerEvents = newValue !== null ? 'none' : '';
        break;
    }
  }

  emitChangeEvent(attribute, value) {
    this.emitEvent(attribute + 'Change', value);
  }

  emitEvent(name, value) {
    const event = new CustomEvent(name, { detail: value });
    this.dispatchEvent(event);
  }

  initProperties(properties) {
    Object.entries(properties).forEach(([name, defaultValue]) => {
      const attr = ftuiHelper.toKebabCase(name);
      if (typeof properties[name] === 'boolean') {
        this.defineBooleanProperty(name, attr);
        this.initBooleanAttribute(attr, defaultValue);
      } else if (typeof properties[name] === 'number') {
        this.defineNumberProperty(name, attr);
        this.initAttribute(attr, defaultValue);
      } else {
        this.defineStringProperty(name, attr);
        this.initAttribute(attr, defaultValue);
      }
    })
  }

  initAttribute(attr, value) {
    if (!this.hasAttribute(attr)) {
      this.setAttribute(attr, value);
    }
  }

  initBooleanAttribute(attr, value) {
    if (!this.hasAttribute(attr) && value) {
      this.setAttribute(attr, '');
    }
  }

  defineBooleanProperty(name, attr) {
    Object.defineProperty(this, name, {
      get() {
        return this.hasAttribute(attr)
          && this.getAttribute(attr) !== 'false';
      },
      set(value) {
        if (value) {
          this.setAttribute(attr, '');
        } else {
          this.removeAttribute(attr);
        }
      }
    });
  }

  defineNumberProperty(name, attr) {
    Object.defineProperty(this, name, {
      get() { return Number(this.getAttribute(attr)); },
      set(value) { this.setAttribute(attr, value); }
    });
  }

  defineStringProperty(name, attr) {
    Object.defineProperty(this, name, {
      get() { return this.getAttribute(attr); },
      set(value) { this.setAttribute(attr, value); }
    });
  }
}
