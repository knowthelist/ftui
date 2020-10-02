/* 
* Chart data component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import * as ftui from '../../modules/ftui/ftui.helper.js';

export class FtuiChartData extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiChartData.properties, properties));
    // TODO: remove - only test data
    this.data = Array.from({length: 6}, () => Math.floor(Math.random() * 40));
  }

  static get properties() {
    return {
      label: '',
      fill: false,
      backgroundColor: 'rgba(75,192,192,0.2)',
      borderColor: 'rgba(75,192,192,1)'
    };
  }

  static get observedAttributes() {
    return [...Object.keys(FtuiChartData.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name) {
    ftui.triggerEvent('dataChanged', this);
  }

}

window.customElements.define('ftui-chart-data', FtuiChartData);
