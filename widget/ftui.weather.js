/* 
* Weather widget for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiSymbol } from './ftui.symbol.js';

class FtuiWeather extends FtuiSymbol {

  constructor(attributes) {
    const defaults = {
      stateClasses: { '.*': '' },
      icon: 'mdi-weather-cloudy',
      iconClass: '',
      iconClasses: {
        'Regen': 'wi wi-rain',
        'stark bewölkt': 'wi wi-cloud',
        'Regenschauer': 'wi wi-showers',
        'wolkig': 'wi wi-day-cloudy',
        'bedeckt': 'wi wi-cloudy',
        'heiter': 'wi wi-day-sunny-overcast',
        'sonnig': 'wi wi-day-sunny',
        'Sprühregen': 'wi wi-day-rain-mix',
        'Schneeregen': 'wi wi-sleet'
      },
      text: '',
      textClass: ''
    };
    super(Object.assign(defaults, attributes));
  }
}

ftui.appendStyleLink(ftui.config.basedir + 'widget/css/ftui.weather.css');
ftui.appendStyleLink(ftui.config.basedir + 'font/weathericons/weather-icons.min.css');
window.customElements.define('ftui-weather', FtuiWeather);