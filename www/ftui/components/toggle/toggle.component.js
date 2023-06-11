/*
* Toggle component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
* Converted to Toggle Component by Andreas Fohl <andreas@fohl.net>
* https://github.com/Sturi2011/ftui/tree/master/www/ftui/components/checkbox
*/

import { FtuiElement } from '../element.component.js';

export class FtuiToggle extends FtuiElement {

  constructor(properties) {

    super(Object.assign(FtuiToggle.properties, properties));

    this.elementCheckbox = this.shadowRoot.querySelector('.checkbox');
    this.elementCheckbox.addEventListener('click', this.onClicked.bind(this));
  }

  template() {
    return `
    <style> @import "components/toggle/toggle.component.css"; </style>

    <span class="checkbox">
<svg
   width="512"
   height="512"
   viewBox="0 0 512 512"
   xmlns="http://www.w3.org/2000/svg">
    <g class="bg">
	<path d="M 140 116 A 140 140 0 0 0 18.755859 186 A 140 140 0 0 0 18.755859 326 A 140 140 0 0 0 140 396 L 372 396 A 140 140 0 0 0 512 256 A 140 140 0 0 0 372 116 L 140 116 z " />
    </g>
	<g class="round">
	<circle cx="140" cy="256" r="130" />
	</g>
</svg>
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
    return [...this.convertToAttributes(FtuiToggle.properties), ...super.observedAttributes];
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

window.customElements.define('ftui-toggle', FtuiToggle);
