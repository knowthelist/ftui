/*
* Tab component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiButton } from '../button/button.component.js';
import * as ftui from '../../modules/ftui/ftui.helper.js';


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
      view: ''
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiTab.properties), ...super.observedAttributes];
  }

  onClicked() {
    // hide all views and show selected view
    ftui.selectAll('ftui-tab-view').forEach(elem => {
      if (elem.group === this.group) {
        if (elem.id !== this.view) {
          elem.setAttribute('hidden', '');
        } else {
          elem.removeAttribute('hidden');
        }
      }
    });

    // de-activated all tabs
    ftui.selectAll('ftui-tab').forEach(elem => {
      if (elem.group === this.group && elem.id !== this.id) {
        elem.value = 'off';
        elem.active = false;
      }
    });

    // activate clicked tab
    this.value = 'on'
    this.active = true;

    // emit event
    ftui.triggerEvent('ftuiVisibilityChanged');
  }

  onAttributeChanged(name, newValue, oldValue) {
    switch (name) {
      case 'value':
        if (newValue === 'on' && oldValue !== 'on' && this.value !== newValue) {
          this.onClicked();
        }
        break;
    }
  }
}

window.customElements.define('ftui-tab', FtuiTab);
