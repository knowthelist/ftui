/*
* Chart data component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { fhemService } from '../../modules/ftui/fhem.service.js';
import { Chart } from '../../modules/chart.js/chart.js';
import * as ftuiHelper from '../../modules/ftui/ftui.helper.js';


export class FtuiChartData extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiChartData.properties, properties));

    if (this.backgroundColor.length === 0) {
      this.hasCalculatedBackgroundColor = true;
    }
  }

  static get properties() {
    const primaryColor = ftuiHelper.getStylePropertyValue('--primary-color');
    return {
      label: '',
      type: 'line',
      fill: false,
      hidden: false,
      pointBackgroundColor: primaryColor,
      backgroundColor: '',
      color: primaryColor,
      borderColor: '',
      borderWidth: 1.2,
      pointRadius: 2,
      title: '-',
      log: '-',
      file: '-',
      spec: '4:.*',
      unit: '°C',
      startDate: '',
      endDate: '',
      prefetch: 0,
      extend: false,
      update: '',
      tension: '0.0',
      stepped: false,
      offset: 0,
      yAxisID: 'y'
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiChartData.properties), ...super.observedAttributes];
  }

  fetch() {
    this.fetchLogItems(this.log, this.file, this.spec);
  }

  fetchLogItems(log, file, spec) {
    const startDate = ftuiHelper.dateFromString(this.startDate);
    startDate.setSeconds(startDate.getSeconds() - this.prefetch);
    const startDateFormatted = ftuiHelper.dateFormat(startDate, 'YYYY-MM-DD_hh:mm:ss');

    const endDate = ftuiHelper.dateFromString(this.endDate);
    endDate.setSeconds(endDate.getSeconds() + this.prefetch);
    const endDateFormatted = ftuiHelper.dateFormat(endDate, 'YYYY-MM-DD_hh:mm:ss');

    const cmd = 'get ' + log + ' ' + file + ' - ' + startDateFormatted + ' ' + endDateFormatted + ' ' + spec;
    fhemService.sendCommand(cmd)
      .then(response => response.text())
      .then((response) => {
        const { labels, data } = this.parseLogItems(response);
        this.data = data;
        this.labels = labels;
        this.updateColor();
        ftuiHelper.triggerEvent('ftuiDataChanged', this);
      })
  }

  parseLogItems(response) {
    const data = [];
    const labels = [];
    let date, value;
    const lines = response.split('\n');

    lines.forEach(line => {
      if (line.length > 0 && !line.startsWith('#')) {
        [date, value] = line.split(' ');
        if (date && ftuiHelper.isNumeric(value)) {
          data.push({ 'x': date, 'y': parseFloat(value) + parseFloat(this.offset) });
          labels.push(date);
        }
      }
    });

    const now = ftuiHelper.dateFormat(new Date(), 'YYYY-MM-DD_hh:mm:ss');
    if (value && this.extend && this.endDate > now) {
      data.push({ 'x': now, 'y': parseFloat(value) + parseFloat(this.offset) });
    }

    return { labels, data };
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'color':
        this.updateColor();
        break;
      case 'update':
        this.fetch();
        break;
    }
  }

  updateColor() {
    this.borderColor = ftuiHelper.getStylePropertyValue('--color-base', this) || this.color;
    if (this.hasCalculatedBackgroundColor) {
      this.backgroundColor = Chart.helpers.color(this.borderColor).alpha(0.2).rgbString();
    }
    this.pointBackgroundColor = this.borderColor;
  }

}

window.customElements.define('ftui-chart-data', FtuiChartData);
