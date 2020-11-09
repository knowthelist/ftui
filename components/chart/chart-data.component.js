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
      this.backgroundColor = Chart.helpers.color(this.borderColor).alpha(0.2).rgbString();
    }
  }

  static get properties() {
    const primaryColor = ftuiHelper.getStylePropertyValue('--primary-color');
    return {
      label: '',
      fill: false,
      hidden: false,
      pointBackgroundColor: primaryColor,
      backgroundColor: '',
      borderColor: primaryColor,
      borderWidth: 1.2,
      pointRadius: 2,
      title: '-',
      log: '-',
      file: '-',
      spec: '4:.*',
      unit: '°C',
      startDate: '',
      endDate: '',
      extend: false,
      update: '',
      tension: '0.0',
      stepped: false,
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiChartData.properties), ...super.observedAttributes];
  }

  fetch() {
    this.fetchLogItems(this.log, this.file, this.spec);
  }

  fetchLogItems(log, file, spec) {
    const cmd = 'get ' + log + ' ' + file + ' - ' + this.startDate + ' ' + this.endDate + ' ' + spec;
    fhemService.sendCommand(cmd)
      .then(response => response.text())
      .then((response) => {
        this.data = this.parseLogItems(response);
        ftuiHelper.triggerEvent('ftuiDataChanged', this);
      })
  }

  parseLogItems(response) {
    const data = [];
    var date, value;
    const lines = response.split('\n');

    lines.forEach(line => {
      if (line.length > 0 && !line.startsWith('#')) {
        [date, value] = line.split(' ');
        if (date && ftuiHelper.isNumeric(value)) {
          data.push({ 'x': date, 'y': parseFloat(value) });
        }
      }
    });

    const now = ftuiHelper.dateFormat(new Date(), 'YYYY-MM-DD_hh:mm:ss');
    if (value && this.extend && this.endDate > now) {
      console.log('Extend needed')
      data.push({ 'x': now, 'y': parseFloat(value) });
    }

    return data;
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'border-color':
        if (this.hasCalculatedBackgroundColor) {
          this.backgroundColor = Chart.helpers.color(this.borderColor).alpha(0.2).rgbString();
        }
        this.pointBackgroundColor = this.borderColor;
        break;
      case 'update':
        this.fetch();
        break;
    }
    if (ftuiHelper.isDefined(this.data)) {
      ftuiHelper.triggerEvent('ftuiDataChanged', this);
    }
  }

}

window.customElements.define('ftui-chart-data', FtuiChartData);
