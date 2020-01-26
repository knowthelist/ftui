/* 
* Slider widget for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiWidget } from './ftui.widget.js';
import { CircleMenu } from '../lib/circle-menu/circle-menu.min.js';

export class FtuiCircleMenu extends FtuiWidget {

  constructor(attributes) {
    const defaults = {
      cmd: 'set',
      circleRadius: 6,
      direction: 'full',
      timeout: 4
    };
    super(Object.assign(defaults, attributes));

    this.circlemenu = new CircleMenu(this, {
      trigger: 'click',
      circle_radius: this.circleRadius,
      direction: this.direction,
      close_event: this.keepOpen ? '' : 'click',
      open: () => {
        if (!this.keepOpen ) {
          setTimeout(() => this.circlemenu.close(), this.timeout * 1000);
        }
      }
    });
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

ftui.appendStyleLink(ftui.config.basedir + 'widget/css/ftui.circlemenu.css');
//ftui.appendStyleLink(ftui.config.basedir + 'lib/rangeable/rangeable.min.css');
window.customElements.define('ftui-circlemenu', FtuiCircleMenu);
