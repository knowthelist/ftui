/* 
* Weather widget for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiIcon } from '../icon/icon.component.js';
import map from './weather.map.js';

class FtuiWeather extends FtuiIcon {

  constructor(attributes) {

    super(Object.assign(FtuiWeather.defaults, attributes));
  }

  static get defaults() {
    return {
      provider: 'proplanta',
      iconSet: 'meteocons',
      name: 'cloud11',
      rgb: '',
      condition: ''
    };
  }

  static get observedAttributes() {
    return [...Object.keys(FtuiWeather.defaults), ...super.observedAttributes];
  }

  onAttributeChanged(name, oldValue, newValue) {
    switch (name) {
      case 'condition':
        this.fetchIcon(map[this.provider]?.[this.iconSet]?.[newValue] || 'icons/none.svg');
        break;
      default:
       super.onAttributeChanged(name, oldValue, newValue);
        break;
    }
  }

}

window.customElements.define('ftui-weather', FtuiWeather);