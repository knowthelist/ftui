/* 
* Chart data component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { fhemService } from '../../modules/ftui/fhem.service.js';
import * as ftuiHelper from '../../modules/ftui/ftui.helper.js';


export class FtuiChartData extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiChartData.properties, properties));

    this.fetchLogItems(this.log, this.file, this.spec);
  }

  static get properties() {
    return {
      label: '',
      fill: false,
      backgroundColor: 'rgba(75,192,192,0.2)',
      borderColor: 'rgba(75,192,192,1)',
      title: '-',
      log: '-',
      file: '-',
      spec: '4:.*',
      unit: '°C',
      timeunit: 'day'
    };
  }

  static get observedAttributes() {
    return [...Object.keys(FtuiChartData.properties), ...super.observedAttributes];
  }

  get startDate() {
    let date = new Date();

    switch (this.timeunit) {
      case 'day' :
      date.setHours(0, 0, 0, 0);
      break;
    }
    return ftuiHelper.dateFormat(date, 'YYYY-MM-DD_hh:mm:ss');
  }

  get endDate() {
    let date = new Date();

    switch (this.timeunit) {
      case 'day' :
      date.setDate(date.getDate() + 1);
      date.setHours(0, 0, 0, 0);
      break;
    }
    return ftuiHelper.dateFormat(date, 'YYYY-MM-DD_hh:mm:ss');
  }

  fetchLogItems(log, file, spec) {
    const cmd = 'get ' + log + ' ' + file + ' - ' + this.startDate + ' ' + this.endDate + ' ' + spec;
    fhemService.sendCommand(cmd)
      .then(response => response.text())
      .then((response) => {
          this.data = this.parseLogItems(response);
          ftuiHelper.triggerEvent('ftuiDataChanged', this);
      })
  }

  parseLogItems(response) {
    let data = [];
    const lines = response.split('\n');

    lines.forEach(line => {
      const [date, value] = line.split(' ');
      if (date && ftuiHelper.isNumeric(value)) {
        data.push({'x': date, 'y': parseFloat(value)});
      } 
    });

    return data;
  }

  onAttributeChanged(name) {
    ftuiHelper.triggerEvent('dataChanged', this);
  }

}

window.customElements.define('ftui-chart-data', FtuiChartData);
