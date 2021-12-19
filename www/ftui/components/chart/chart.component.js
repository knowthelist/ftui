/*
* Chart component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { FtuiChartData } from './chart-data.component.js';
import { Chart } from '../../modules/chart.js/chart.js';
import { dateFormat, getStylePropertyValue } from '../../modules/ftui/ftui.helper.js';
import '../../modules/chart.js/chartjs-adapter-date-fns.bundle.min.js';

const HOUR = 3600 * 1000;
const DAY = 24 * 3600 * 1000;

export class FtuiChart extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiChart.properties, properties));

    this.configuration = {
      type: this.type,
      data: {
        datasets: []
      },
      options: {
        locale: window.ftuiApp ? ftuiApp.config.lang === 'de' ? 'de-DE' : 'en-US' : 'en-US',
        responsive: true,
        maintainAspectRatio: false,
        title: {
          padding: 0,
          display: false,
          text: '',
          font: {
            size: getStylePropertyValue('--chart-title-font-size', this) || 16,
            style: getStylePropertyValue('--chart-title-font-style', this) || '500',
            color: getStylePropertyValue('--chart-title-color', this) || getStylePropertyValue('--light-color', this)
          }
        },
        legend: {
          labels: {
            usePointStyle: true,
            boxWidth: 6,
            padding: 8,
            font: {
              size: getStylePropertyValue('--chart-legend-font-size', this) || 13,
              color: getStylePropertyValue('--chart-legend-color', this) || getStylePropertyValue('--chart-text-color', this)
            },
            filter: item => item.text
          }
        },
        scales: {
          x: {
            display: !this.noscale && !this.noX,
            type: 'time',
            time: {
              parser: 'yyyy-MM-dd_HH:mm:ss',
              displayFormats: { millisecond: 'HH:mm:ss.SSS', second: 'HH:mm:ss', minute: 'HH:mm', hour: 'HH:mm', day: 'd. MMM', month: 'MMMM' },
              tooltipFormat: 'd.MM.yyyy HH:mm:ss',
            },
            gridLines: {
              color: getStylePropertyValue('--chart-grid-line-color', this) || getStylePropertyValue('--dark-color', this)
            },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              autoSkipPadding: 30,
              font: {
                size: getStylePropertyValue('--chart-tick-font-size', this) || 11
              }
            }
          },
          y: {
            display: !this.noscale && !this.noY,
            position: 'left',
            scaleLabel: {
              display: this.yLabel.length > 0,
              labelString: this.yLabel,
            },
            gridLines: {
              color: getStylePropertyValue('--chart-grid-line-color', this) || getStylePropertyValue('--dark-color', this)
            },
            ticks: {
              autoSkip: true,
              autoSkipPadding: 30,
              font: {
                size: getStylePropertyValue('--chart-tick-font-size', this) || 11
              },
              callback: val => val + this.yUnit,
            }
          },
          y1: {
            display: (!this.noscale && !this.noY1),
            position: 'right',
            scaleLabel: {
              display: this.y1Label.length > 0,
              labelString: this.y1Label,
            },
            gridLines: {
              color: getStylePropertyValue('--chart-grid-line-color', this) || getStylePropertyValue('--dark-color', this)
            },
            ticks: {
              autoSkip: true,
              autoSkipPadding: 30,
              font: {
                size: getStylePropertyValue('--chart-tick-font-size', this) || 11
              },
              callback: val => val + this.y1Unit,
            }
          }
        }
      }
    };

    if (getStylePropertyValue('--chart-font-family', this)) {
      Chart.defaults.font.family = getStylePropertyValue('--chart-font-family', this)
    }
    if (getStylePropertyValue('--chart-font-style', this)) {
      Chart.defaults.font.style = getStylePropertyValue('--chart-font-style', this)
    }

    Chart.defaults.font.color = getStylePropertyValue('--chart-text-color', this);

    this.controlsElement = this.querySelector('ftui-chart-controls');
    this.chartContainer = this.shadowRoot.querySelector('#container');
    this.chartElement = this.shadowRoot.querySelector('#chart');

    this.chart = new Chart(this.chartElement, this.configuration);

    let hasY1Data = false;
    this.dataElements = this.querySelectorAll('ftui-chart-data');
    this.dataElements.forEach((dataElement, index) => {
      dataElement.index = index;
      this.configuration.data.datasets[index] = {};
      if (dataElement.yAxisID === 'y1') {
        hasY1Data = true;
      }
      dataElement.addEventListener('ftuiDataChanged', (data) => this.onDataChanged(data))
    });

    this.configuration.options.scales.y1.display = hasY1Data && !this.noY1;

    if (this.controlsElement) {
      this.controlsElement.addEventListener('ftuiForward', () => this.offset += 1);
      this.controlsElement.addEventListener('ftuiBackward', () => this.offset -= 1);
      ['hour', 'day', 'week', 'month', 'year', '24h', '30d'].forEach(unit => {
        this.controlsElement.addEventListener('ftuiUnit' + unit, () => this.unit = unit);
      });
    }
    this.chart.update();
    document.addEventListener('ftuiVisibilityChanged', () => this.refresh());
  }

  connectedCallback() {
    window.requestAnimationFrame(() => {
      this.refresh();
    })
  }

  template() {
    return `
      <style> @import "components/chart/chart.component.css"; </style>
      <div id="container">
        <canvas id="chart"></canvas>
      </div>
      <slot></slot>`;
  }

  static get properties() {
    return {
      title: '',
      type: 'line',
      width: null,
      height: null,
      unit: 'day',
      yLabel: '',
      y1Label: '',
      yMin: 0,
      y1Min: 0,
      yMax: 0,
      y1Max: 0,
      xMin: 0,
      xMax: 0,
      offset: 0,
      prefetch: 0,
      extend: false,
      noscale: false,
      noY: false,
      noY1: false,
      noX: false,
      yUnit: '',
      y1Unit: ''
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiChart.properties), ...super.observedAttributes];
  }

  get startDate() {
    if (this.unit === 'day' && this.xMin > 0) {
      return this.getDate(this.offset, this.xMin);
    }
    return this.getDate(this.offset);
  }

  get endDate() {
    if (this.unit === 'day' && this.xMax > 0) {
      return this.getDate(this.offset, this.xMax);
    }
    return this.getDate(this.offset + 1);
  }

  getDate(offset = 0, hour = 0) {
    let date = new Date();
    const ts = date.getTime();

    switch (this.unit) {
      case 'hour':
        date = new Date(ts + offset * HOUR);
        date.setMinutes(0, 0, 0);
        break;
      case 'day':
        date = new Date(ts + offset * DAY);
        date.setHours(hour, 0, 0, 0);
        break;
      case 'week':
        date.setHours(-24 * ((date.getDay() || 7) - 1));
        date = new Date(date.getTime() + offset * 7 * DAY);
        date.setHours(0, 0, 0, 0);
        break;
      case 'month':
        date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setMonth(date.getMonth() + offset, 1);
        break;
      case 'year':
        date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setFullYear(date.getFullYear() + offset, 0, 1);
        break;
      case '24h':
        date = new Date(ts + offset * DAY - DAY);
        break;
      case '30d':
        date = new Date(ts + (offset * 30 * DAY - 30 * DAY));
        break;
    }
    return dateFormat(date, 'YYYY-MM-DD_hh:mm:ss');
  }

  onAttributeChanged(name, value) {

    switch (name) {
      case 'title':
        this.configuration.options.title.text = value;
        this.configuration.options.title.display = (value && value.length > 0);
        this.chart.update();
        break;
      case 'type':
        this.configuration.type = value;
        this.chart.update();
        break;
      case 'y-min':
        this.configuration.options.scales.y.min = this.yMin;
        this.chart.update();
        break;
      case 'y1-min':
        this.configuration.options.scales.y1.min = this.y1Min;
        this.chart.update();
        break;
      case 'y-max':
        this.configuration.options.scales.y.max = this.yMax;
        this.chart.update();
        break;
      case 'y1-max':
        this.configuration.options.scales.y1.max = this.y1Max;
        this.chart.update();
        break;
      case 'no-y':
        this.configuration.options.scales.y.display = !this.noY;
        this.chart.update();
        break;
      case 'no-y1':
        this.configuration.options.scales.y1.display = !this.noY1;
        this.chart.update();
        break;
      case 'no-x':
        this.configuration.options.scales.x.display = !this.noX;
        this.chart.update();
        break;
      case 'unit':
        this.offset = 0;
        break;
      case 'offset':
      case 'extend':
      case 'prefetch':
        this.refresh();
        break;
      case 'height':
        this.style.height = value;
        break;
      case 'width':
        this.style.width = value;
        break;
    }
  }

  refresh() {
    this.updateControls();

    this.dataElements.forEach(dataElement => {
      dataElement.startDate = this.startDate;
      dataElement.endDate = this.endDate;
      dataElement.prefetch = (!dataElement.prefetch) ? this.prefetch : dataElement.prefetch;
      dataElement.extend = (!dataElement.extend) ? this.extend : dataElement.extend;

      dataElement.fetch();
    });
  }

  updateControls() {
    if (this.controlsElement) {
      this.controlsElement.unit = this.unit;
      this.controlsElement.startDate = this.startDate;
      this.controlsElement.endDate = this.endDate;
    }
  }

  onDataChanged(event) {

    this.configuration.options.scales.x.min = this.startDate;
    this.configuration.options.scales.x.max = this.endDate;
    const dataElement = event.target
    const dataset = {};
    Object.keys(FtuiChartData.properties).forEach(property => {
      dataset[property] = dataElement[property];
    });
    dataset.data = dataElement.data;
    this.configuration.data.datasets[dataElement.index] = dataset;
    this.configuration.data.labels = dataElement.labels;
    dataElement.startDate = this.startDate;
    dataElement.endDate = this.endDate;

    this.updateControls();
    this.chart.update();
    // disable animation after first update
    this.configuration.options.animation.duration = 0;
  }

}

window.customElements.define('ftui-chart', FtuiChart);
