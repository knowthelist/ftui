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
    this.clockTimer = null;
    this.dailyRefreshTimeout = null;
    this.dailyRefreshInterval = null;
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
    super.connectedCallback();
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
          if (!Number.isNaN(fhemTime.getTime())) {
            this.serverDiff = Date.now() - fhemTime.getTime();
          }
        })
        .catch(() => {
          // Keep the local clock when FHEM is restarting or unavailable.
        });
    }
  }

  scheduleDailyRefresh() {
    clearTimeout(this.dailyRefreshTimeout);
    clearInterval(this.dailyRefreshInterval);

    // Calculate time until midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilNextDay = tomorrow - now;

    // Schedule first refresh at midnight, then daily thereafter
    this.dailyRefreshTimeout = setTimeout(() => {
      this.getFhemTime();
      this.dailyRefreshInterval = setInterval(() => {
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
    clearTimeout(this.clockTimer);
    const now = this.getDateTime();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();
    const waitMs = this.format.includes('s') ? 1000 - ms * 1 : 60000 - s * 1000 - ms * 1;
    this.clockTimer = setTimeout(() => {
      this.update();
      this.startInterval();
    }, waitMs);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.clockTimer);
    clearTimeout(this.dailyRefreshTimeout);
    clearInterval(this.dailyRefreshInterval);
  }

}

window.customElements.define('ftui-clock', FtuiClock);
