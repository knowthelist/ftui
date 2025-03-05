import { FtuiElement } from '../element.component.js';
import { limit, scale } from '../../modules/ftui/ftui.helper.js';

class FtuiWeatherBar extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiWeatherBar.properties, properties));

    this.progress = this.shadowRoot.querySelector('.progress');
    this.progress.style.width = this.width || (this.isVertical ? '1em' : '7em');
    this.progress.style.height = this.height || (this.isVertical ? '7em' : '1em');
    this.progressBar = this.shadowRoot.querySelector('.progress-bar');
  }

  static get properties() {
    return {
      minTemp: 10,
      maxTemp: 20,
      min: 0,
      max: 30,
      isVertical: false,
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

  onAttributeChanged(name, oldValue, newValue) {
    this.updateProgress();
  }

  updateProgress() {
    console.log('updateProgress');
    const minTemp = scale(this.minTemp, this.min, this.max, 0, 100);
    const width = scale(this.maxTemp, this.min, this.max, 0, 100) - minTemp;
    this.progressBar.style.left = `${minTemp}%`;
    this.progressBar.style.width = `${width}%`;
        // Calculate gradient stops
        const blueStop = ((5 -  this.minTemp) / (this.maxTemp - this.minTemp)) * 100;
        const yellowStop = ((20 - this.minTemp) / (this.maxTemp -this. minTemp)) * 100;
    
        this.progressBar.style.background = `linear-gradient(to right, 
        lightblue 0%, 
        lightblue ${blueStop}%, 
        #bdbd79 ${blueStop*2}%, 
        #bdbd79 ${yellowStop}%, 
        #f28383 100%)`;
   
  }
}

customElements.define('ftui-weather-bar', FtuiWeatherBar);