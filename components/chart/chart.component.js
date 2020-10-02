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


export class FtuiChart extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiChart.properties, properties));

    this.dataElements = this.querySelectorAll('ftui-chart-data');
    this.chartElement = this.shadowRoot.querySelector('#chart');

    this.configuration = {
      type: 'line',
      data: {
         labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [] 
      },
      options: {
        title: {
          display: false,
        },
        scales: {
          yAxes: [{
            ticks: {
              reverse: false
            }
          }]
        }
      }
    }

    this.dataElements.forEach(dataElement => dataElement.addEventListener('dataChanged', () => this.updateDatasets()));

    this.chart = new Chart(this.chartElement, this.configuration);
    this.chartElement.style.height = this.width;
    this.chartElement.style.width = this.height;

    this.updateDatasets();
  }

  template() {
    return `
      <style> @import "components/chart/chart.component.css"; </style>

      <canvas id="chart"></canvas>
      <slot></slot>`;
  }

  static get properties() {
    return {
      title: '',
      height: '100%',
      width: '100%'
    };
  }

  static get observedAttributes() {
    return [...Object.keys(FtuiChart.properties), ...super.observedAttributes];
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
      console.log(dataElement)
      this.configuration.data.datasets.push(
        {
          label: dataElement.label,
          data: dataElement.data,
          fill: dataElement.fill,
          backgroundColor: dataElement.backgroundColor,
          borderColor: dataElement.borderColor
        }
      )
    });
    this.chart.update();
  }

}

window.customElements.define('ftui-chart', FtuiChart);
