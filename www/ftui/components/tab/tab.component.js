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
/* eslint-disable no-unused-vars */
import { FtuiTabView } from './tab-view.component.js';
import { FtuiTabTitle } from './tab-title.component.js';


class FtuiTab extends FtuiButton {

  constructor(properties) {

    super(Object.assign(FtuiTab.properties, properties));


    // react on URL parameter(s)
    this.initialView = (new URLSearchParams(window.location.search)).get('initialView');
    this.homeView = (new URLSearchParams(window.location.search)).get('homeView');

    selectAll(`ftui-tab[group="${this.group}"]`).forEach(elem => {
      if (this.initialView) {
        if (elem.view === this.initialView) {
          elem.setAttribute('active', 'active');
        }
        else {
          elem.removeAttribute('active');
        }
      }
      if (this.homeView) {
        if (elem.view === this.homeView) { elem.setAttribute('home', 'home') } else {
          elem.removeAttribute('home');
        }
      }
    });

    window.customElements.whenDefined('ftui-tab-view').then(() => {
      if (this.hasAttribute('active')) {
        this.onClickEvent();
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

  onClickEvent() {
    this.isLocked = true;
    // hide all views and show selected view
    selectAll(`ftui-tab-view[group="${this.group}"]`).forEach(elem => {
      if (elem.id !== this.view) {
        elem.setAttribute('hidden', '');
      } else {
        elem.removeAttribute('hidden');
      }
    });

    // de-activated all tabs
    selectAll(`ftui-tab[group="${this.group}"][active]`).forEach(elem => {
      elem.submitChange('value', 'off');
      elem.active = false;
      elem.clearTimeout();
    });

    // activate clicked tab
    this.submitChange('value', 'on');
    this.active = true;
    this.startTimeout();

    // change all titles
    selectAll(`ftui-tab-title[group="${this.group}"]`).forEach(elem => {
      elem.text = this.title;
    });

    // emit event
    triggerEvent('ftuiVisibilityChanged');
    this.isLocked = false;
  }

  onAttributeChanged(name, newValue, oldValue) {
    switch (name) {
      case 'value':
        if (newValue === 'on' && oldValue !== 'on'
        &&  !this.isLocked ) {
          this.onClickEvent();
        }
        break;
    }
  }

  goHome() {
    let homeElem = selectOne(`ftui-tab[group="${this.group}"][home]`);
    if (!homeElem) {
      homeElem = selectOne(`ftui-tab[group="${this.group}"]:first-of-type`);
    }
    if ((homeElem) && (homeElem.id !== this.id)) {
      homeElem.onClickEvent();
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
