/*
* Chart data component for FTUI version 3
*
* Copyright (c) 2020-2022 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { backendService } from '../../modules/ftui/backend.service.js';
import { Chart } from '../../modules/chart.js/chart.js';
import * as ftuiHelper from '../../modules/ftui/ftui.helper.js';

function toTransparentColor(color, alpha = 0.2) {
  const context = document.createElement('canvas').getContext('2d');
  context.fillStyle = color;

  const normalized = context.fillStyle;
  const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const [red, green, blue] = rgbMatch[1].split(',').slice(0, 3).map(part => Number.parseFloat(part.trim()));
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  const hexMatch = normalized.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    const [red, green, blue] = hex.length === 3
      ? hex.split('').map(part => Number.parseInt(part + part, 16))
      : [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(part => Number.parseInt(part, 16));

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  return normalized;
}


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
    //const cmd ="{getChartData()}";
    backendService.sendCommand(cmd)
      .then(backendService.checkText)
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
      this.backgroundColor = toTransparentColor(this.borderColor);
    }
    this.pointBackgroundColor = this.borderColor;
  }

}

window.customElements.define('ftui-chart-data', FtuiChartData);
