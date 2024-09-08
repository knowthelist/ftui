/*
* Base component for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/


import { isNumeric, toKebabCase, log } from '../modules/ftui/ftui.helper.js';

const uids = {};

export class FtuiElement extends HTMLElement {

  constructor(properties) {
    super();

    if (!this.id) {
      if (!uids[this.localName]) {
        uids[this.localName] = 1;
      }
      this.id = `${this.localName.replace(/-/g, '_')}_${uids[this.localName]++}`;
    }

    this.properties = Object.assign(FtuiElement.properties, properties);

    this.initProperties(this.properties);

    if (typeof this.template === 'function') {
      this.createShadowRoot(this.template());
    }

    this.isActiveChange = {};
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
      readonly: false,
      margin: '0',
      padding: '0',
    };
  }

  static get observedAttributes() {
    return [...Object.keys(FtuiElement.properties)];
  }

  static convertToAttributes(properties) {
    return Object.keys(properties).map(property => toKebabCase(property));
  }

  connectedCallback() {
    if (typeof this.onConnected === 'function') {
      // call the hook function of the instance
      this.onConnected();
    }
  }

  /**
   * Called when an observed attribute has changed.
   * @param {String} name The attribute's name.
   * @param {*} oldValue The old value of the attribute.
   * @param {*} newValue The new value of the attribute.
   */
  attributeChangedCallback(name, oldValue, newValue) {
    log(3, `${this.id} -  attributeChangedCallback name=${name}, oldValue=${oldValue}, newValue=${newValue}`)
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
      case 'margin': {
        if (this.tagName !== 'FTUI-GRID') {
          this.style.margin = isNumeric(newValue) ? newValue + 'em' : newValue;
        }
        break;
      }
      case 'padding': {
        this.style.padding = isNumeric(newValue) ? newValue + 'em' : newValue;
        break;
      }
    }
  }

  /**
   * sets the property of the element to this value
   * and forwards this new value to FHEM when a output binding is defined
   * and emits a change event for this property
   * @param {*} property
   * @param {*} value
   */
  submitChange(property, value) {
    this.isActiveChange[property] = true;
    this[property] = value;
    this.emitChangeEvent(property, value );
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
      const attr = toKebabCase(name);
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
      },
    });
  }

  defineNumberProperty(name, attr) {
    Object.defineProperty(this, name, {
      get() { return Number(this.getAttribute(attr)); },
      set(value) { this.setAttribute(attr, value); },
    });
  }

  defineStringProperty(name, attr) {
    Object.defineProperty(this, name, {
      get() { return this.getAttribute(attr); },
      set(value) { this.setAttribute(attr, value); },
    });
  }
}
