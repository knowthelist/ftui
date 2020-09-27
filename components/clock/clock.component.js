/* 
* Clock component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { fhemService } from '../../modules/ftui/fhem.service.js';
import { dateFormat } from '../../modules/ftui/ftui.helper.js';

export class FtuiClock extends FtuiElement {

  constructor(properties) {

    super(Object.assign(FtuiClock.properties, properties));

    this.outlet = this.shadowRoot.querySelector('#outlet');
    this.update();
    this.startInterval();
    this.getFhemTime();
  }

  template() {
    return `<div id="outlet"></div>`;
  }

  static get properties() {
    return {
      format: 'hh:mm:ss',
      serverDiff: 0,
      offset: 0,
      isFhemTime: false
    }
  }

  getFhemTime() {
    if (this.isFhemTime) {
      fhemService.sendCommand('{localtime}', '1')
        .then(res => res.text())
        .then((result) => {
          const fhemTime = new Date(result);
          this.serverDiff = Date.now() - fhemTime.getTime();
        });
    }
  }

  update() {
    this.outlet.innerHTML = dateFormat(this.getDateTime(), this.format);
  }

  getDateTime() {
    return new Date(Date.now() - Number(this.serverDiff) + 3600000 * Number(this.offset));
  }

  startInterval() {
    const now = this.getDateTime();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();
    const waitMs = this.format.includes('s') ? 1000 - ms * 1 : 60000 - s * 1000 - ms * 1;
    const tid = setTimeout(() => {
      this.update();
      this.startInterval();
    }, waitMs);
  }

}

window.customElements.define('ftui-clock', FtuiClock);
