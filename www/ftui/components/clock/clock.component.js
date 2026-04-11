/*
* Clock component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiLabel } from '../label/label.component.js';
import { backendService } from '../../modules/ftui/backend.service.js';
import { dateFormat } from '../../modules/ftui/ftui.helper.js';

export class FtuiClock extends FtuiLabel {

  constructor() {

    super(FtuiClock.properties);
  }

  static get properties() {
    return {
      format: 'hh:mm:ss',
      serverDiff: 0,
      offset: 0,
      isFhemTime: false,
    }
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiClock.properties), ...super.observedAttributes];
  }

  connectedCallback() {
    this.update();
    this.startInterval();
    this.getFhemTime();
    this.scheduleDailyRefresh();
  }

  getFhemTime() {
    if (this.isFhemTime) {
      backendService.sendUpdate('{localtime}')
        .then(res => res.text())
        .then((result) => {
          const fhemTime = new Date(result);
          this.serverDiff = Date.now() - fhemTime.getTime();
        });
    }
  }

  scheduleDailyRefresh() {
    // Calculate time until midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilNextDay = tomorrow - now;

    // Schedule first refresh at midnight, then daily thereafter
    setTimeout(() => {
      this.getFhemTime();
      setInterval(() => {
        this.getFhemTime();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, timeUntilNextDay);
  }

  update() {
    this.text = dateFormat(this.getDateTime(), this.format);
  }

  getDateTime() {
    return new Date(Date.now() - Number(this.serverDiff) + 3600000 * Number(this.offset));
  }

  startInterval() {
    const now = this.getDateTime();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();
    const waitMs = this.format.includes('s') ? 1000 - ms * 1 : 60000 - s * 1000 - ms * 1;
    setTimeout(() => {
      this.update();
      this.startInterval();
    }, waitMs);
  }

}

window.customElements.define('ftui-clock', FtuiClock);
