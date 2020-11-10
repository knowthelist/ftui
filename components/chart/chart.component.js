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

export class FtuiChart extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiChart.properties, properties));

    this.dataElements = this.querySelectorAll('ftui-chart-data');
    this.controlsElement = this.querySelector('ftui-chart-controls');
    this.chartContainer = this.shadowRoot.querySelector('#container');
    this.chartElement = this.shadowRoot.querySelector('#chart');

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
            display: !this.noscale,
            scaleLabel: {
              labelString: 'value'
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

    if (getStylePropertyValue('--chart-font-family')) {
      Chart.defaults.font.family = getStylePropertyValue('--chart-font-family')
    }
    if (getStylePropertyValue('--chart-font-style')) {
      Chart.defaults.font.style = getStylePropertyValue('--chart-font-style')
    }
    Chart.defaults.font.color = getStylePropertyValue('--chart-text-color');
    this.chart = new Chart(this.chartElement, this.configuration);

    this.dataElements.forEach(dataElement => dataElement.addEventListener('ftuiDataChanged', () => this.onDataChanged()));
    this.controlsElement?.addEventListener('ftuiForward', () => this.offset +=1);
    this.controlsElement?.addEventListener('ftuiBackward', () => this.offset -= 1);
    
    ['hour', 'day', 'week', 'month', 'year'].forEach(unit => {
      this.controlsElement?.addEventListener('ftuiUnit' + unit, () => this.unit = unit);
    });

    this.chartContainer.style.width = this.width;
    this.chartContainer.style.height = this.height;
  }

  connectedCallback() {
    this.refresh();
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
      width: '100%',
      height: 'auto',
      unit: 'day',
      offset: 0,
      prefetch: 0,
      extend: false,
      noscale: false
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiChart.properties), ...super.observedAttributes];
  }

  get startDate() {
    const date = new Date();

    switch (this.unit) {
      case 'hour':
        date.setHours(date.getHours() + this.offset, 0, 0, 0);
        break;
      case 'day':
        date.setDate(date.getDate() + this.offset);
        date.setHours(0, 0, 0, 0);
        break;
      case 'week':
        date.setHours(0, 0, 0, 0);
        date.setDate((date.getDate() + this.offset*7) - (date.getDay()-1));
        break;
      case 'month':
        date.setHours(0, 0, 0, 0);
        date.setMonth(date.getMonth() + this.offset, 1);
        break;
      case 'year':
        date.setHours(0, 0, 0, 0);
        date.setFullYear(date.getFullYear() + this.offset, 0, 1);
        break;
    }
    return dateFormat(date, 'YYYY-MM-DD_hh:mm:ss');
  }

  get endDate() {
    const date = new Date();

    switch (this.unit) {
      case 'hour':
        date.setHours(date.getHours()+1 + this.offset, 0, 0, 0);
        break;
      case 'day':
        date.setDate(date.getDate()+1 + this.offset);
        date.setHours(0, 0, 0, 0);
        break;
      case 'week':
        date.setHours(0, 0, 0, 0);
        date.setDate((date.getDate()+7 + this.offset*7) - (date.getDay()-1));
        break;
      case 'month':
        date.setHours(0, 0, 0, 0);
        date.setMonth(date.getMonth()+1 + this.offset, 1);
        break;
      case 'year':
        date.setHours(0, 0, 0, 0);
        date.setFullYear(date.getFullYear()+1 + this.offset, 0, 1);
        break;
    }
    return dateFormat(date, 'YYYY-MM-DD_hh:mm:ss');
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'title':
        this.configuration.options.title.text = this.title;
        this.configuration.options.title.display = (this.title?.length > 0);
        this.chart.update();
        break;
      case 'type':
        this.configuration.type = this.type;
        this.chart.update();
        break;
      case 'unit':
        this.offset = 0;
        break;
      case 'offset':
        this.refresh();
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
