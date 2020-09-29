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

    if (this.hasAttribute('default')) {
      this.onClicked();
    }
  }

  static get properties() {
    return {
      group: 'default',
      color: 'dark',
      view: ''
    };
  }

  static get observedAttributes() {
    return [...Object.keys(FtuiTab.properties), ...super.observedAttributes];
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
        elem.color = 'dark';
      }
    });

    // activate clicked tab
    this.value = 'on'
    this.color = 'primary';

    // emit event
    ftui.triggerEvent('ftuiVisiblityChanged');
  }

  onAttributeChanged(name, oldValue, newValue) {
    switch (name) {
      case 'value':
        if (newValue === 'on' && oldValue !== 'on') {
         this.onClicked();
        }
        break;
    }
  }
}

window.customElements.define('ftui-tab', FtuiTab);
