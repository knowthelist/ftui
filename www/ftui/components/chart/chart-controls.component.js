
/*
* Chart component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { triggerEvent, getLocalCssPath, dateFormat, dateFromString } from '../../modules/ftui/ftui.helper.js';

export class FtuiChartControls extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiChartControls.properties, properties));

    this.dateElement = this.shadowRoot.querySelector('#date');
    this.backwardElement = this.shadowRoot.querySelector('#backward');
    this.forwardElement = this.shadowRoot.querySelector('#forward');

    this.backwardElement.addEventListener('click', () => triggerEvent('ftuiBackward', this));
    this.forwardElement.addEventListener('click', () => triggerEvent('ftuiForward', this));

    if (this.units) {
      const units = String(this.units).split(/[;,:]/).map(item => item.toLowerCase().trim());
      units.forEach(unit => {
        const element = this.shadowRoot.querySelector('#unit_' + unit);
        element.classList.add('enabled');
        element.addEventListener('click', () => triggerEvent('ftuiUnit' + unit, this));
      });
    }
  }

  template() {
    return `
      <style> @import "${getLocalCssPath(import.meta.url)}"; </style>
      <div id="container">
        <div id="controls">
          <span id="backward">◀</span>
          <span id="date"></span>
          <span id="forward">▶</span>
        </div>
        <div id="units">
          <span class="unit" id="unit_year">Year</span>
          <span class="unit" id="unit_month">Month</span>
          <span class="unit" id="unit_week">Week</span>
          <span class="unit" id="unit_day">Day</span>
          <span class="unit" id="unit_24h">24h</span>
          <span class="unit" id="unit_30d">30d</span>
          <span class="unit" id="unit_hour">Hour</span>
        </div>
      </div>`;
  }

  static get properties() {
    return {
      unit: '',
      units: '',
      startDate: '',
      endDate: '',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiChartControls.properties), ...super.observedAttributes];
  }

  get dateString() {
    let dateString = '';

    switch (this.unit) {
      case 'hour':
        dateString = dateFormat(dateFromString(this.startDate), 'ee DD.MM hh:00');
        break;
      case 'day':
      case '24h':
        dateString = dateFormat(dateFromString(this.startDate), 'ee DD.MM');
        break;
      case 'week': {
        const endDate = dateFromString(this.endDate);
        endDate.setDate(endDate.getDate() - 1);
        dateString = dateFormat(dateFromString(this.startDate), 'DD.MM') + ' - ' + dateFormat(endDate, 'DD.MM');
        break;
      }
      case 'month':
      case '30d':
        dateString = dateFormat(dateFromString(this.startDate), 'MM.YYYY');
        break;
      case 'year':
        dateString = dateFormat(dateFromString(this.startDate), 'YYYY');
        break;
    }
    return dateString;
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'start-date':
      case 'end-date':
        this.dateElement.textContent = this.dateString;
        break;
      case 'unit': {
        this.shadowRoot.querySelectorAll('.unit').forEach(element => {
          element.classList.remove('active');
        });
        const currentUnit = this.shadowRoot.querySelector('#unit_' + this.unit);
        if (currentUnit) {
          currentUnit.classList.add('active');
        }
        break;
      }

    }
  }

}

window.customElements.define('ftui-chart-controls', FtuiChartControls);
