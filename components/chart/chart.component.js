/* 
* Chart component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { Chart } from '../../modules/chart.js/chart.min.js';


export class FtuiChart extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiChart.properties, properties));

    this.chartElement = this.shadowRoot.querySelector('#chart');


    this.configuration = {
      type: 'line',
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "First dataset",
            data: [33, 53, 85, 41, 44, 65],
            fill: true,
            backgroundColor: "rgba(75,192,192,0.2)",
            borderColor: "rgba(75,192,192,1)"
          },
          {
            label: "Second dataset",
            data: [33, 25, 35, 51, 54, 76],
            fill: false,
            borderColor: "#742774"
          }
        ]
      },
      options: {
        title: {
          display: true,
          text: 'Custom Chart Title'
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


    this.chart = new Chart(this.chartElement, this.configuration);
    this.chartElement.style.height = this.width;
    this.chartElement.style.width = this.height;
  }

  template() {
    return `
      <style> @import "components/chart/chart.component.css"; </style>

      <canvas id="chart"></canvas>`;
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
        this.chart.update();
        break;
    }
  }

}

window.customElements.define('ftui-chart', FtuiChart);
