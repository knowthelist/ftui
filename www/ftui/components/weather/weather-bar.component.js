import { FtuiElement } from '../element.component.js';
import { limit, scale } from '../../modules/ftui/ftui.helper.js';

class FtuiWeatherBar extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiWeatherBar.properties, properties));

    this.minLabel = this.shadowRoot.querySelector('.min');
    this.maxLabel = this.shadowRoot.querySelector('.max');
    this.progress = this.shadowRoot.querySelector('.progress');
    this.progress.style.width = this.width || '7em';
    this.progress.style.height = this.height || '1em';
    this.progressBar = this.shadowRoot.querySelector('.progress-bar');
  }

  static get properties() {
    return {
      height: '',
      width: '',
      minTemp: 10,
      maxTemp: 20,
      min: 0,
      max: 30,
      unit: '°C',
    };
  }

  template() {
    return `<style> @import "components/weather/weather-bar.component.css";</style>
        <div class="container">
          <div class="min">${this.minTemp}</div>
          <slot></slot>
          <div class="progress">
          <div class="progress-bar"></div>
          </div>
          <div class="max">${this.maxTemp}</div>
        </div>`;
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiWeatherBar.properties), ...super.observedAttributes];
  }
  onAttributeChanged(name, oldValue, newValue) {
    this.updateProgress();
  }

  updateProgress() {
    const minTemp = scale(this.minTemp, this.min, this.max, 0, 100);
    const width = scale(this.maxTemp, this.min, this.max, 0, 100) - minTemp;
    this.progressBar.style.left = `${minTemp}%`;
    this.progressBar.style.width = `${width}%`;
    // Calculate gradient stops
    const blueStop = ((5 - this.minTemp) / (this.maxTemp - this.minTemp)) * 100;
    const yellowStop = ((20 - this.minTemp) / (this.maxTemp - this.minTemp)) * 100;
    this.progressBar.style.background = `linear-gradient(to right, 
        lightblue 0%, 
        lightblue ${blueStop}%, 
        #bdbd79 ${blueStop * 2}%, 
        #bdbd79 ${yellowStop}%, 
        #f28383 100%)`;
    // update labels
    this.minLabel.textContent = `${this.minTemp} ${this.unit}`;
    this.maxLabel.textContent = `${this.maxTemp} ${this.unit}`;
  }
}

customElements.define('ftui-weather-bar', FtuiWeatherBar);