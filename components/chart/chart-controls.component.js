/*
* Chart component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import * as ftuiHelper from '../../modules/ftui/ftui.helper.js';

export class FtuiChartControls extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiChartControls.properties, properties));

    this.dateElement = this.shadowRoot.querySelector('#date');
    this.backwardElement = this.shadowRoot.querySelector('#backward');
    this.forwardElement = this.shadowRoot.querySelector('#forward');

    this.backwardElement.addEventListener('click', () => ftuiHelper.triggerEvent('ftuiBackward', this));
    this.forwardElement.addEventListener('click', () => ftuiHelper.triggerEvent('ftuiForward', this));

    if (this.units) {
      let units = String(this.units).split(/[;,:]/).map(item => item.toLowerCase().trim());
      units.forEach(unit => {
        let element = this.shadowRoot.querySelector('#' + unit);
        element.classList.add('enabled');
        element.addEventListener('click', () => ftuiHelper.triggerEvent('ftuiUnit' + unit, this));
      });
    }
  }

  template() {
    return `
      <style> @import "components/chart/chart-controls.component.css"; </style>

      <div id="container">
        <div id="controls">
          <span id='backward'>◀</span>
          <span id='date'></span>
          <span id='forward'>▶</span>
        </div>
        <div id="units">
          <span class="unit" id="year">Year</span>
          <span class="unit" id="month">Month</span>
          <span class="unit" id="week">Week</span>
          <span class="unit" id="day">Day</span>
          <span class="unit" id="hour">Hour</span>
        </div>
      </div>`;
  }

  static get properties() {
    return {
      unit: '',
      units: '',
      startDate: '',
      endDate: ''
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiChartControls.properties), ...super.observedAttributes];
  }

  get dateString() {
    let dateString;

    switch (this.unit) {
      case 'hour':
      case 'day':
        dateString = ftuiHelper.dateFormat(ftuiHelper.dateFromString(this.startDate), 'ee DD.MM');
        break;
      case 'week':
        const endDate = ftuiHelper.dateFromString(this.endDate);
        endDate.setDate(endDate.getDate()-1);
        dateString = ftuiHelper.dateFormat(ftuiHelper.dateFromString(this.startDate), 'DD.MM') + ' - ' + ftuiHelper.dateFormat(endDate, 'DD.MM');
        break;
      case 'month':
        dateString = ftuiHelper.dateFormat(dateFromString(this.startDate), 'MM.YYYY');
        break;
      case 'year':
        dateString = ftuiHelper.dateFormat(dateFromString(this.startDate), 'YYYY');
        break;
    }
    return dateString;
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'start-date':
      case 'end-date':
        this.dateElement.innerHTML = this.dateString;
        break;
      case 'unit':
        this.shadowRoot.querySelectorAll('.unit').forEach(element => {
          element.classList.remove('active');
        });
        this.shadowRoot.querySelector('#' + this.unit).classList.add('active');
        break;
    }
  }

}

window.customElements.define('ftui-chart-controls', FtuiChartControls);
