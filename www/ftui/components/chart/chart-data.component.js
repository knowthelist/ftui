/*
* Chart data component for FTUI version 3
*
* Copyright (c) 2020-2022 Mario Stephan <mstephan@shared-files.de>
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
      if (this.type === 'bubble') {
        this.backgroundColor = ftuiHelper.getStylePropertyValue('--color-base', this) || this.color;
      } else {
        this.hasCalculatedBackgroundColor = true;
      }
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
      unit: '',
      startDate: '',
      endDate: '',
      prefetch: 0,
      extend: false,
      update: '',
      tension: '0.0',
      stepped: false,
      offset: 0,
      stack: '',
      yAxisID: 'y',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiChartData.properties), ...super.observedAttributes];
  }

  fetch() {
    if (!this.isLoading) {
      this.fetchLogItems(this.log, this.file, this.spec);
    }
  }

  fetchLogItems(log, file, spec) {
    this.isLoading = true;
    const startDate = ftuiHelper.dateFromString(this.startDate);
    startDate.setSeconds(startDate.getSeconds() - this.prefetch);
    const startDateFormatted = ftuiHelper.dateFormat(startDate, 'YYYY-MM-DD_hh:mm:ss');
    const endDate = ftuiHelper.dateFromString(this.endDate);
    endDate.setSeconds(endDate.getSeconds() + this.prefetch);
    const endDateFormatted = ftuiHelper.dateFormat(endDate, 'YYYY-MM-DD_hh:mm:ss');
    this.rangeDate = endDate.getTime() - startDate.getTime();
    const cmd = 'get ' + log + ' ' + file + ' - ' + startDateFormatted + ' ' + endDateFormatted + ' ' + spec;
    fhemService.sendCommand(cmd)
      .then(fhemService.checkText)
      .then((response) => {
        const { labels, data } = this.parseLogItems(response);
        this.data = data;
        this.labels = labels;
        this.updateColor();
        ftuiHelper.triggerEvent('ftuiDataChanged', this);
        this.isLoading = false;
      }).catch(() => {
        this.isLoading = false;
      });
  }

  parseLogItems(response) {
    const data = [];
    const labels = [];
    const lines = response.split('\n').filter(l => l.length > 0 && !l.startsWith('#'));
    const timeStep = this.rangeDate / 150;
    let risingDate = this.startDate;
    const risingValue = this.offset + 1;
    if (this.type === 'bubble' && this.stepped) {
      // fill missing start and end points
      if (lines[0].split(' ')[1] === '0') {
        lines.unshift(this.startDate + ' 1');
      }
      if (lines[lines.length-1].split(' ')[1] !== '0') {
        lines.push(this.endDate + ' 0');
      }
    }
    lines.forEach(line => {
      const [date, value] = line.split(' ');
      if (date && ftuiHelper.isNumeric(value)) {
        const parsedValue = parseFloat(value) + parseFloat(this.offset);
        if (parseFloat(value) > 0 || this.type !== 'bubble') {
          risingDate = date;
          data.push({ 'x': date, 'y': parsedValue });
          labels.push(date);
        } else if (this.type === 'bubble'
          && (parseFloat(value) === 0)
          && this.stepped) {
          // interpolate times between rising and falling flank
          // to create a kind of gantt chart
          const startDate = ftuiHelper.dateFromString(risingDate).getTime();
          const endDate = ftuiHelper.dateFromString(date).getTime();
          for (let i = startDate; i < endDate; i += timeStep) {
            const interpolatedDate = ftuiHelper.dateFormat(new Date(i), 'YYYY-MM-DD_hh:mm:ss');
            data.push({ 'x': interpolatedDate, 'y': risingValue });
            labels.push(interpolatedDate);
          }
        }
      }
    });

    /*     if (value && this.extend && this.endDate > now) {
      data.push({ 'x': now, 'y': parseFloat(value) + parseFloat(this.offset) });
    } */
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
