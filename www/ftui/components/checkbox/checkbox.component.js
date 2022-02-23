/*
* Checkbox component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { getLocalCssPath } from '../../modules/ftui/ftui.helper.js';

export class FtuiCheckbox extends FtuiElement {

  constructor(properties) {

    super(Object.assign(FtuiCheckbox.properties, properties));

    this.elementCheckbox = this.shadowRoot.querySelector('.checkbox');
    this.elementCheckbox.addEventListener('click', this.onClicked.bind(this));
  }

  template() {
    return `
    <style> @import "${getLocalCssPath(import.meta.url)}"; </style>

    <span class="checkbox">
      <svg viewBox="0 0 512 512">
      <path d="M362.6 192.9L345 174.8c-.7-.8-1.8-1.2-2.8-1.2-1.1 0-2.1.4-2.8 1.2l-122 
      122.9-44.4-44.4c-.8-.8-1.8-1.2-2.8-1.2-1 0-2 .4-2.8 1.2l-17.8 17.8c-1.6 1.6-1.6 
      4.1 0 5.7l56 56c3.6 3.6 8 5.7 11.7 5.7 5.3 0 9.9-3.9 11.6-5.5h.1l133.7-134.4c1.4-1.7 
      1.4-4.2-.1-5.7z"/></svg>
    </span>`;
  }

  static get properties() {
    return {
      states: 'off,on',
      texts: ',',
      color: 'primary',
      value: 'off',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiCheckbox.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'value':
        this.changeState();
        break;
    }
  }

  toggle() {
    this.elementCheckbox.classList.toggle('checked');
    const stateIndex = this.elementCheckbox.classList.contains('checked') ? 1 : 0;
    const value = this.getStates()[stateIndex];
    if (this.value !== value) {
      this.submitChange('value', value);
    }
  }

  changeState() {
    const index = this.getStates().indexOf(this.value);
    if (index > -1) {
      if (index === 1) {
        this.elementCheckbox.classList.add('checked');
      } else {
        this.elementCheckbox.classList.remove('checked');
      }
    }
  }

  onClicked(event) {
    event.preventDefault();
    this.toggle();
    event.stopPropagation();
  }

  getStates() {
    return this.states.split(/[;,:]/).map(item => item.trim());
  }
}

window.customElements.define('ftui-checkbox', FtuiCheckbox);
