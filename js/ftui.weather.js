import FtuiSymbol from './ftui.symbol.js';

export default class FtuiWeather extends FtuiSymbol {

  constructor(attributes) {
    const defaults = {
      stateClasses: { '.*': '' },
      icon: 'mdi-weather-cloudy',
      iconClass: '',
      iconClasses: {
        'Regen': 'wi wi-rain',
        'stark bewölkt': 'wi wi-cloud',
        'Regenschauer': 'wi wi-showers',
        'wolkig': 'wi wi-cloudy',
        'heiter': 'wi wi-day-sunny-overcast',
        'sonnig': 'wi wi-day-sunny'
      },
      text: '',
      textClass: ''
    };
    super(Object.assign(defaults, attributes));
  }
}

ftui.appendStyleLink(ftui.config.basedir + 'css/ftui.weather.css', false);
ftui.appendStyleLink(ftui.config.basedir + 'css/weather-icons.min.css', false);
window.customElements.define('ftui-weather', FtuiWeather);