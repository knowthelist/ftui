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
        title: {
          display: true,
          text: 'Custom Chart Title'
        },
        scales: {
          x: {
            type: 'time',
            time: {
              parser: 'yyyy-MM-dd_HH:mm:ss'
            }
          },
          y: {
            scaleLabel: {
              labelString: 'value'
            }
          }
        }
      }
    };

    this.dataElements.forEach(dataElement => dataElement.addEventListener('ftuiDataChanged', () => this.updateDatasets()));

    this.chart = new Chart(this.chartElement, this.configuration);

    // TODO: Why does the size not fit sometimes?
    this.chartContainer.style.width = this.width;
    this.chartContainer.style.height = this.height;
    this.updateDatasets();

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
      width: '400px',
      height: '200px'
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiChart.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'title':
        this.configuration.options.title.text = this.title;
        this.configuration.options.title.display = (this.title?.length > 0);
        this.chart.update();
        break;
    }
  }

  updateDatasets() {
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
  }

}

window.customElements.define('ftui-chart', FtuiChart);
