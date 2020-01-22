/* 
* Slider widget for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiWidget } from './ftui.widget.js';
import { Rangeable } from '../lib/rangeable/rangeable.min.js';

export class FtuiSlider extends FtuiWidget {

  constructor(attributes) {
    const defaults = {
      cmd: 'set',
      min: 0,
      max: 100,
      delay: 200,
      step: 1,
      value: null,
      vertical: false,
      tooltips: true,
      type: 'single',

    };
    super(Object.assign(defaults, attributes));

    this.rangeable = new Rangeable(this.querySelector('input'), {
      vertical: this.vertical,
      tooltips: this.tooltips,
      min: this.min,
      max: this.max,
      step: this.step,
      value: this.value,
      onChange: (value) => this.onSliderChanged(value)
    });

    ftui.getReadingEvents(this.valueReading).subscribe(param => this.onUpdateValue(param));
  }

  template() {
    return `<input type="range" orient="vertical">
              <div class="sliderticks">
                <span>${this.min}</span>
                <span>${this.max}</span>
              </div>`;
  }

  onUpdateValue(param) {
    this.value = param.value;
    this.rangeable.setValue(this.value);
    this.rangeable.update();
  }

  onSliderChanged(value) {
    if (this.value !== value) {
      this.value = value;
      // send to fhem
      this.sendReadingChange(this.valueReading, this.value);
    }
  }
}

ftui.appendStyleLink(ftui.config.basedir + 'widget/css/ftui.slider.css');
ftui.appendStyleLink(ftui.config.basedir + 'lib/rangeable/rangeable.min.css');
window.customElements.define('ftui-slider', FtuiSlider);
