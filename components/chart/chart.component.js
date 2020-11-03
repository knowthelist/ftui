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
    this.chartContainer = this.shadowRoot.querySelector('#container');
    this.chartElement = this.shadowRoot.querySelector('#chart');

    this.configuration = {
      type: 'line',
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

    this.dataElements.forEach(dataElement => dataElement.addEventListener('ftuiDataChanged', () => this.onDataChanged()));

    Chart.defaults.font.color = getStylePropertyValue('--chart-text-color');
    Chart.defaults.font.family = getStylePropertyValue('--chart-font-family');
    Chart.defaults.font.style = getStylePropertyValue('--chart-font-style') || undefined;
    this.chart = new Chart(this.chartElement, this.configuration);

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
      width: '100%',
      height: 'auto',
      unit: 'day',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiChart.properties), ...super.observedAttributes];
  }

  get startDate() {
    const date = new Date();

    switch (this.unit) {
      case 'day':
        date.setHours(0, 0, 0, 0);
        break;
    }
    return dateFormat(date, 'YYYY-MM-DD_hh:mm:ss');
  }

  get endDate() {
    const date = new Date();

    switch (this.unit) {
      case 'day':
        date.setDate(date.getDate() + 1);
        date.setHours(0, 0, 0, 0);
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
      case 'unit':
        this.refresh();
    }
  }

  refresh() {
    this.dataElements.forEach(dataElement => {
      dataElement.startDate = this.startDate;
      dataElement.endDate = this.endDate;
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
