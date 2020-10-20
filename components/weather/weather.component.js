/*
* Weather component for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiIcon } from '../icon/icon.component.js';
import map from './weather.map.js';

class FtuiWeather extends FtuiIcon {

  constructor(properties) {

    super(Object.assign(FtuiWeather.properties, properties));
  }

  static get properties() {
    return {
      provider: 'proplanta',
      iconSet: 'meteocons',
      name: 'cloud11',
      rgb: '',
      condition: ''
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiWeather.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, oldValue, newValue) {
    switch (name) {
      case 'condition':
        this.loadIcon(map[this.provider]?.[this.iconSet]?.[newValue] || 'icons/none.svg');
        break;
      default:
        super.onAttributeChanged(name, oldValue, newValue);
        break;
    }
  }

}

window.customElements.define('ftui-weather', FtuiWeather);
