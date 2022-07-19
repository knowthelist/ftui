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
import { fhemService } from '../../modules/ftui/fhem.service.js';
import { Chart } from '../../modules/chart.js/chart.min.js';
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
        datasets: [],
      },
      options: {
        locale: window.ftuiApp ? ftuiApp.config.lang === 'de' ? 'de-DE' : 'en-US' : 'en-US',
        responsive: true,
        maintainAspectRatio: false,
        title: {
          padding: 0,
          display: false,
          text: '',
        },
        legend: {
          labels: {
            usePointStyle: true,
            boxWidth: 6,
            padding: 8,
            font: {},
            filter: item => item.text,
            generateLabels: function (chart) {
              const data = chart.data;
              return Chart.helpers.isArray(data.datasets) ? data.datasets.map((dataset, i) => {
                const values = dataset.data.map(i => i.y);
                let resLabel = dataset.label;
                if (resLabel && values && values.length) {
                  resLabel = resLabel.replace(/\$min/g, Math.min(...values));
                  resLabel = resLabel.replace(/\$max/g, Math.max(...values));
                  resLabel = resLabel.replace(/\$sum/g, values.reduce((a, b) => a + b));
                  resLabel = resLabel.replace(/\$avg/g, values.reduce((a, b) => a + b) / values.length);
                  resLabel = resLabel.replace(/\$last/g, values[values.length - 1]);
                }
                return {
                  text: resLabel,
                  fillStyle: (!Chart.helpers.isArray(dataset.backgroundColor) ? dataset.backgroundColor : dataset.backgroundColor[0]),
                  hidden: !chart.isDatasetVisible(i),
                  lineCap: dataset.borderCapStyle,
                  lineDash: dataset.borderDash,
                  lineDashOffset: dataset.borderDashOffset,
                  lineJoin: dataset.borderJoinStyle,
                  lineWidth: dataset.borderWidth,
                  strokeStyle: dataset.borderColor,
                  pointStyle: dataset.pointStyle,
                  datasetIndex: i,
                };
              }, this) : [];
            },
          },
        },
        scales: {
          x: {
            display: !this.noscale && !this.noX,
            type: 'time',
            stacked: this.stackedX,
            time: {
              parser: 'yyyy-MM-dd_HH:mm:ss',
              displayFormats: { millisecond: 'HH:mm:ss.SSS', second: 'HH:mm:ss', minute: 'HH:mm', hour: 'HH:mm', day: 'd. MMM', month: 'MMMM' },
              tooltipFormat: 'd.MM.yyyy HH:mm:ss',
            },
            gridLines: {},
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              autoSkipPadding: 30,
              font: {},
            },
          },
          y: {
            stacked: this.stackedY,
            display: !this.noscale && !this.noY,
            position: 'left',
            scaleLabel: {
              display: this.yLabel.length > 0,
              labelString: this.yLabel,
            },
            gridLines: {},
            ticks: {
              autoSkip: true,
              autoSkipPadding: 30,
              font: {},
              callback: val => val + this.yUnit,
            },
          },
          y1: {
            stacked: this.stackedY1,
            display: (!this.noscale && !this.noY1),
            position: 'right',
            scaleLabel: {
              display: this.y1Label.length > 0,
              labelString: this.y1Label,
            },
            gridLines: {},
            ticks: {
              autoSkip: true,
              autoSkipPadding: 30,
              font: {},
              callback: val => val + this.y1Unit,
            },
          },
        },
      },
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

    this.dataElements = this.querySelectorAll('ftui-chart-data');
    this.dataElements.forEach((dataElement, index) => {
      dataElement.index = index;
      this.configuration.data.datasets[index] = {};
      dataElement.addEventListener('ftuiDataChanged', (data) => this.onDataChanged(data))
    });

    if (this.controlsElement) {
      this.controlsElement.addEventListener('ftuiForward', () => this.offset += 1);
      this.controlsElement.addEventListener('ftuiBackward', () => this.offset -= 1);
      ['hour', 'day', 'week', 'month', 'year', '24h', '30d'].forEach(unit => {
        this.controlsElement.addEventListener('ftuiUnit' + unit, () => this.unit = unit);
      });
    }
    this.chart.update();
    this.onStyleChanged();

    document.addEventListener('ftuiVisibilityChanged', () => this.refresh());

    fhemService.getReadingEvents('ftui-isDark').subscribe(() => this.onStyleChanged());
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
      y1Unit: '',
      stackedX: false,
      stackedY: false,
      stackedY1: false,
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
    const options = this.configuration.options;
    switch (name) {
      case 'title':
        options.title.text = value;
        options.title.display = (value && value.length > 0);
        this.chart.update();
        break;
      case 'type':
        this.configuration.type = value;
        this.chart.update();
        break;
      case 'y-min':
        options.scales.y.min = this.yMin;
        this.chart.update();
        break;
      case 'y1-min':
        options.scales.y1.min = this.y1Min;
        this.chart.update();
        break;
      case 'y-max':
        options.scales.y.max = this.yMax;
        this.chart.update();
        break;
      case 'y1-max':
        options.scales.y1.max = this.y1Max;
        this.chart.update();
        break;
      case 'no-y':
        options.scales.y.display = !this.noY;
        this.chart.update();
        break;
      case 'no-y1':
        options.scales.y1.display = !this.noY1;
        this.chart.update();
        break;
      case 'no-x':
        options.scales.x.display = !this.noX;
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
      if (typeof dataElement.fetch === 'function') {
        dataElement.startDate = this.startDate;
        dataElement.endDate = this.endDate;
        dataElement.prefetch = (!dataElement.prefetch) ? this.prefetch : dataElement.prefetch;
        dataElement.extend = (!dataElement.extend) ? this.extend : dataElement.extend;
        dataElement.fetch();
      }
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
    const dataElement = event.target
    const dataset = {};
    Object.keys(FtuiChartData.properties).forEach(property => {
      dataset[property] = dataElement[property];
    });

    dataset.data = dataElement.data;
    if (dataElement.yAxisID === 'y1') {
      this.hasY1Data = true;
    }
    this.configuration.data.datasets[dataElement.index] = dataset;
    this.configuration.data.labels = dataElement.labels;
    this.configuration.options.scales.x.min = this.startDate;
    this.configuration.options.scales.x.max = this.endDate;
    this.configuration.options.scales.y1.display = this.hasY1Data && !this.noY1;
    dataElement.startDate = this.startDate;
    dataElement.endDate = this.endDate;

    this.updateControls();
    this.chart.update();
    // disable animation after first update
    this.configuration.options.animation.duration = 0;
  }

  onStyleChanged() {
    const options = this.configuration.options;
    options.font.color = getStylePropertyValue('--chart-text-color', this);

    options.title.font.size = getStylePropertyValue('--chart-title-font-size', this) || 16;
    options.title.font.style = getStylePropertyValue('--chart-title-font-style', this) || '500';
    options.title.font.color = getStylePropertyValue('--chart-title-color', this);// || getStylePropertyValue('--chart-text-color', this);

    options.legend.labels.font.size = getStylePropertyValue('--chart-legend-font-size', this) || 13;
    options.legend.labels.font.color = getStylePropertyValue('--chart-legend-color', this) || getStylePropertyValue('--chart-text-color', this);

    options.scales.x.gridLines.color = getStylePropertyValue('--chart-grid-line-color', this) || getStylePropertyValue('--dark-color', this);
    options.scales.x.ticks.font.size = getStylePropertyValue('--chart-tick-font-size', this) || 11;

    options.scales.y.gridLines.color = getStylePropertyValue('--chart-grid-line-color', this) || getStylePropertyValue('--dark-color', this);
    options.scales.y.ticks.font.size = getStylePropertyValue('--chart-tick-font-size', this) || 11;

    options.scales.y1.gridLines.color = getStylePropertyValue('--chart-grid-line-color', this) || getStylePropertyValue('--dark-color', this);
    options.scales.y1.ticks.font.size = getStylePropertyValue('--chart-tick-font-size', this) || 11;

    this.chart.update();
  }

}

window.customElements.define('ftui-chart', FtuiChart);
