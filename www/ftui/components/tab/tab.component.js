/*
* Tab component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiButton } from '../button/button.component.js';
import { selectAll, selectOne, triggerEvent } from '../../modules/ftui/ftui.helper.js';
// eslint-disable-next-line no-unused-vars
import { FtuiTabView } from './tab-view.component.js';


class FtuiTab extends FtuiButton {

  constructor(properties) {

    super(Object.assign(FtuiTab.properties, properties));

    this.addEventListener('click', this.onClicked);
    window.customElements.whenDefined('ftui-tab-view').then(() => {
      if (this.hasAttribute('active')) {
        this.onClicked();
      }
    })

  }

  template() {
    return `<style> @import "components/tab/tab.component.css"; </style>`
      + super.template();
  }

  static get properties() {
    return {
      active: false,
      group: 'default',
      color: '',
      fill: 'clear',
      view: '',
      timeout: 0,
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiTab.properties), ...super.observedAttributes];
  }

  onClicked() {
    // hide all views and show selected view
    selectAll('ftui-tab-view').forEach(elem => {
      if (elem.group === this.group) {
        if (elem.id !== this.view) {
          elem.setAttribute('hidden', '');
        } else {
          elem.removeAttribute('hidden');
        }
      }
    });

    // de-activated all tabs
    selectAll('ftui-tab').forEach(elem => {
      if (elem.group === this.group && elem.id !== this.id) {
        elem.value = 'off';
        elem.active = false;
        elem.clearTimeout();
      }
    });

    // change tab title
    selectAll(`ftui-tab[group="${this.group}"]`)
      .forEach(elem => {
        elem.setAttribute('text', this.title || this.view);
      });

    // activate clicked tab
    this.submitChange('value', 'on');
    this.active = true;
    this.startTimeout();

    // emit event
    triggerEvent('ftuiVisibilityChanged');
  }

  onAttributeChanged(name, newValue, oldValue) {
    switch (name) {
      case 'value':
        if (newValue === 'on' && oldValue !== 'on') {
          this.onClicked();
        }
        break;
    }
  }

  goHome() {
    const homeElem = selectOne(`ftui-tab[group="${this.group}"]:first-of-type`);
    if (homeElem) {
      homeElem.onClicked();
    }
  }

  clearTimeout() {
    window.clearTimeout(this.timer);
  }

  startTimeout() {
    this.clearTimeout();
    if (this.timeout) {
      this.timer = setTimeout(() => this.goHome(), this.timeout * 1000);
    }
  }
}

window.customElements.define('ftui-tab', FtuiTab);
