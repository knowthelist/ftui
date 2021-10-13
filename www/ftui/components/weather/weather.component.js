/*
* Weather component for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiIcon } from '../icon/icon.component.js';
import { providerSet, iconSet } from './weather.map.js';

class FtuiWeather extends FtuiIcon {

  constructor(properties) {

    super(Object.assign(FtuiWeather.properties, properties));
  }

  static get properties() {
    return {
      provider: 'proplanta',
      iconSet: 'meteocons',
      condition: '',
      name: '', // base class property (icon)
      rgb: '', // base class property (icon)
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiWeather.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, newValue) {
    switch (name) {
      case 'condition': {
        const conditions = providerSet[this.provider] || {};
        const icons = iconSet[this.iconSet] || {};
        this.loadIcon(icons[conditions[newValue]] || 'icons/none.svg');
        break;
      }
      default:
        super.onAttributeChanged(name, newValue);
        break;
    }
  }

}

window.customElements.define('ftui-weather', FtuiWeather);
