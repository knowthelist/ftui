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
import { Chart } from '../../modules/chart.js/chart.min.js';
import { dateFormat, getStylePropertyValue } from '../../modules/ftui/ftui.helper.js';
import '../../modules/chart.js/chartjs-adapter-date-fns.bundle.min.js';

export class FtuiChart extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiChart.properties, properties));

    this.configuration = {
      type: this.type,
      data: {
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        title: {
          padding: 0,
          display: false,
          text: '',
          font: {
            size: getStylePropertyValue('--chart-title-font-size') || 16,
            style: getStylePropertyValue('--chart-title-font-style') || '500',
            color: getStylePropertyValue('--chart-title-color') || getStylePropertyValue('--light-color')
          }
        },
        legend: {
          labels: {
            usePointStyle: true,
            boxWidth: 6,
            padding: 8,
            font: {
              size: getStylePropertyValue('--chart-legend-font-size') || 13,
              color: getStylePropertyValue('--chart-legend-color') || getStylePropertyValue('--chart-text-color')
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
              displayFormats: { millisecond: 'HH:mm:ss.SSS', second: 'HH:mm:ss', minute: 'HH:mm', hour: 'HH:mm', day: 'd. MMM' }
            },
            gridLines: {
              color: getStylePropertyValue('--dark-color')
            },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              autoSkipPadding: 30,
              font: {
                size: getStylePropertyValue('--chart-tick-font-size') || 11
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
              color: getStylePropertyValue('--dark-color')
            },
            ticks: {
              autoSkip: true,
              autoSkipPadding: 30,
              font: {
                size: getStylePropertyValue('--chart-tick-font-size') || 11
              }
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
              color: getStylePropertyValue('--dark-color')
            },
            ticks: {
              autoSkip: true,
              autoSkipPadding: 30,
              font: {
                size: getStylePropertyValue('--chart-tick-font-size') || 11
              }
            }
          }
        }
      }
    };

    console.log('this.y1Label',this.y1Label,'this.yLabel',this.yLabel)
    if (getStylePropertyValue('--chart-font-family')) {
      Chart.defaults.font.family = getStylePropertyValue('--chart-font-family')
    }
    if (getStylePropertyValue('--chart-font-style')) {
      Chart.defaults.font.style = getStylePropertyValue('--chart-font-style')
    }
    Chart.defaults.font.color = getStylePropertyValue('--chart-text-color');

    this.controlsElement = this.querySelector('ftui-chart-controls');
    this.chartContainer = this.shadowRoot.querySelector('#container');
    this.chartElement = this.shadowRoot.querySelector('#chart');

    this.chart = new Chart(this.chartElement, this.configuration);

    let hasY1Data= false;
    this.dataElements = this.querySelectorAll('ftui-chart-data');
    this.dataElements.forEach(dataElement => {
      if (dataElement.yAxisID === 'y1') {
        hasY1Data = true;
      }
      dataElement.addEventListener('ftuiDataChanged', () => this.onDataChanged())
    });

    this.configuration.options.scales.y1.display = hasY1Data && !this.noY1;

    if (this.controlsElement) {
      this.controlsElement.addEventListener('ftuiForward', () => this.offset += 1);
      this.controlsElement.addEventListener('ftuiBackward', () => this.offset -= 1);
      ['hour', 'day', 'week', 'month', 'year'].forEach(unit => {
        this.controlsElement.addEventListener('ftuiUnit' + unit, () => this.unit = unit);
      });
    }
    this.chart.update();
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
      offset: 0,
      prefetch: 0,
      extend: false,
      noscale: false,
      noY: false,
      noY1: false,
      noX: false
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiChart.properties), ...super.observedAttributes];
  }

  get startDate() {
    return this.getDate();
  }

  get endDate() {
    return this.getDate(1);
  }

  getDate(offset = 0) {
    const date = new Date();

    switch (this.unit) {
      case 'hour':
        date.setHours(date.getHours() + offset + this.offset, 0, 0, 0);
        break;
      case 'day':
        date.setDate(date.getDate() + offset + this.offset);
        date.setHours(0, 0, 0, 0);
        break;
      case 'week':
        date.setHours(0, 0, 0, 0);
        date.setDate((date.getDate() + (offset * 7) + this.offset * 7) - (date.getDay() - 1));
        break;
      case 'month':
        date.setHours(0, 0, 0, 0);
        date.setMonth(date.getMonth() + offset + this.offset, 1);
        break;
      case 'year':
        date.setHours(0, 0, 0, 0);
        date.setFullYear(date.getFullYear() + offset + this.offset, 0, 1);
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
        console.log(this.y1Min, value)
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
    if (this.controlsElement) {
      this.controlsElement.unit = this.unit;
      this.controlsElement.startDate = this.startDate;
      this.controlsElement.endDate = this.endDate;
    }

    this.dataElements.forEach(dataElement => {
      dataElement.startDate = this.startDate;
      dataElement.endDate = this.endDate;
      dataElement.prefetch = (!dataElement.prefetch) ? this.prefetch : dataElement.prefetch;
      dataElement.extend = (!dataElement.extend) ? this.extend : dataElement.extend;

      dataElement.fetch();
    });
  }

  onDataChanged() {
    this.configuration.options.scales.x.min = this.startDate;
    this.configuration.options.scales.x.max = this.endDate;
    this.configuration.data.datasets = [];
    this.dataElements.forEach(dataElement => {
      const dataset = {};
      Object.keys(FtuiChartData.properties).forEach(property => {
        dataset[property] = dataElement[property];
      });
      dataset.data = dataElement.data;
      this.configuration.data.datasets.push(dataset);
    });
    this.chart.update();
    // disable animation after first update
    this.configuration.options.animation.duration = 0;
  }

}

window.customElements.define('ftui-chart', FtuiChart);
