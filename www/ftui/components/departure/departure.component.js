/*
* Departure component for FTUI version 3
*
* Developed and Designed by mr_petz & OdfFhem
*
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
// eslint-disable-next-line no-unused-vars
import { FtuiIcon } from '../icon/icon.component.js';
import { fhemService } from '../../modules/ftui/fhem.service.js';
import { dateFormat, dateFromString, parseReadingId } from '../../modules/ftui/ftui.helper.js';

export class FtuiDeparture extends FtuiElement {

  constructor(properties) {
    super(Object.assign(FtuiDeparture.properties, properties));

    this.timerClock = null;
    this.timerUpdate = null;
    this.depMode = null;
    this.timeNow = new Date();
    this.size = this.shadowRoot.querySelector('.size');
    this.bg = this.shadowRoot.querySelector('table');
    this.dep = this.shadowRoot.querySelector('tbody');
    this.elementId = this.shadowRoot.querySelector('td[name="id"]');
    this.elementDest = this.shadowRoot.querySelector('td[name="dest"]');
    this.elementTime = this.shadowRoot.querySelector('td[name="time"]');
    this.elementClock = this.shadowRoot.querySelector('th[name="clock"]');
    this.elementMinutes = this.shadowRoot.querySelector('th[name="min"]');
    this.elementRefresh = this.shadowRoot.querySelector('.refresh');
    this.elementRefresh.addEventListener('click', event => this.manGetRefresh(event));
    this.elementSwitch = this.shadowRoot.querySelector('.switch');
    this.elementSwitch.addEventListener('click', event => this.switchDepMode(event));

    this.listReadingId = this.binding.getReadingsOfAttribute('list')[0] || '';

    if (!(this.hasAttribute('switch'))) { this.elementSwitch.style.display = 'none'; }

    if (this.hasAttribute('depmin')) {
      this.depMode = 'depmin';
    }
    if (this.hasAttribute('deptime')) {
      this.depMode = 'deptime';
    }
    this.arrangeWindow();
    this.startTimerClock();
  }

  template() {
    return `
      <style> @import "components/departure/departure.component.css";</style>
      <main>
        <div class="pos">
          <div class="size">
            <table class="table ${this.color}" border="0" cellspacing="0" celpadding="0">
              <thead>
                <tr class="header">
                  <th class="icon"><ftui-icon name="${this.icon}"></ftui-icon></th>
                  <th class="station">${this.station}</th>
                  <th class="line">Linie</th>
                  <th class="destination">Richtung</th>
                  <th class="minutes" name="min"></th>
                </tr>
                <tr>
                  <th class="refresh" name="refresh"></th>
                  <th class="switch" name="switch"></th>
                  <th class="istime" name="clock"></th>
                </tr>
              </thead>
              <tbody class="table-body list${this.color}">
                <tr>
                  <td name="id" class="id"></td>
                  <td name="dest" class="dest"></td>
                  <td name="time" class="time"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    `;
  }

  static get properties() {
    return {
      list: '',
      get: '',
      set: '',
      icon: 'bus',
      station: 'Haltestelle',
      refbutton: 'refresh',
      color: 'Default',
      bgcolor: '',
      depcolor: '',
      txtcolor: '',
      txtsize: '',
      deptxtcolor: '',
      deptxtlength: 27,
      depminsize: 60,
      width: '98%',
      height: '85%',
      top: '40px',
      getinterval: 60,
      refreshlist: 0,
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiDeparture.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'list':
        this.fillList();
        this.updateClock();
        break;
      case 'bgcolor':
      case 'depcolor':
      case 'txtcolor':
      case 'deptxtcolor':
      case 'deptxtlength':
      case 'depminsize':
      case 'txtsize':
      case 'width':
      case 'height':
      case 'top':
        this.arrangeWindow();
        break;
      case 'getinterval':
      case 'refreshlist':
        this.startTimerUpdate();
        this.startTimerRefreshList();
        this.updateClock();
        break;
    }
  }

  arrangeWindow() {
    this.bg.style.background = this.bgcolor;
    this.dep.style.background = this.depcolor;
    this.size.style.width = this.width;
    this.size.style.height = this.height;
    this.size.style.top = this.top;
    this.bg.style.color = this.txtcolor;
    this.dep.style.color = this.deptxtcolor;
    this.elementId.style.color = this.txtsize;
    this.elementDest.style.color = this.txtsize;
    this.elementTime.style.color = this.txtsize;
    if (this.hasAttribute('manuell')) {
      this.elementRefresh.innerHTML = '<ftui-icon name="' + this.refbutton + '"></ftui-icon>';
    }
    if (this.bgcolor) {
      this.bg.style.background = this.bgcolor;
    }
    if (this.depcolor) {
      this.dep.style.background = this.depcolor;
    }
    if (this.width) {
      this.size.style.width = this.width;
    }
    if (this.height) {
      this.size.style.height = this.height;
    }
    if (this.top) {
      this.size.style.top = this.top;
    }
    if (this.txtcolor) {
      this.bg.style.color = this.txtcolor;
    }
    if (this.deptxtcolor) {
      this.dep.style.color = this.deptxtcolor;
    }
    if (this.txtsize) {
      this.elementId.style.fontSize = this.txtsize;
      this.elementDest.style.fontSize = this.txtsize;
      this.elementTime.style.fontSize = this.txtsize;
    }
  }

  updateClock() {
    this.elementClock.innerHTML = /*dateFormat(new Date(),'ee')+', '+*/dateFormat(new Date(), 'hh:mm');
  }

  startTimerClock() {
    clearInterval(this.timerClock);
    clearTimeout(this.timerClock);
    ((dateFormat(new Date(), 'ss') === '00') ? this.timerClock = setTimeout(() => this.updateClock() & this.startTimerClock(), 60000) : this.timerClock = setInterval(() => this.updateClock() & this.startTimerClock(), 1000));
  }

  startTimerUpdate() {
    clearInterval(this.timerUpdate);
    clearTimeout(this.timerUpdate);
    if (this.listReadingId) {
      ((dateFormat(new Date(), 'ss') === '00') ? this.timerUpdate = setTimeout(() => this.startTimerUpdate(), this.getinterval * 1000) ? this.requestUpdate() : clearTimeout(this.timerUpdate) : this.timerUpdate = setInterval(() => this.startTimerUpdate(), 1000));
    }
  }

  startTimerRefreshList() {
    clearInterval(this.timerRefreshList);
    clearTimeout(this.timerRefreshList);
    if (!this.listReadingId) {
      ((dateFormat(new Date(), 'ss') === '00') ? this.timerRefreshList = setTimeout(() => this.startTimerRefreshList(), this.refreshlist * 1000) ? this.fillList() : clearTimeout(this.timerRefreshList) : this.timerRefreshList = setInterval(() => this.startTimerRefreshList(), 1000));
    }
  }

  getListReadingInfo() {
    return this.listReadingId ? parseReadingId(this.listReadingId) : ['', '', ''];
  }

  requestUpdate() {
    if (this.get || this.set) {
      return fhemService.sendCommand(this.get ? 'get ' + this.get : 'set ' + this.set);
    }

    const [, deviceName, readingName] = this.getListReadingInfo();
    if (!deviceName) {
      return Promise.resolve();
    }

    const command = readingName ? 'get ' + deviceName + ' ' + readingName : 'get ' + deviceName;
    return fhemService.sendCommand(command);
  }

  manGetRefresh(event) {
    event.stopPropagation();
    this.requestUpdate();
    this.elementRefresh.innerHTML = '<ftui-icon class="fade" name="' + this.refbutton + '"></ftui-icon>';
    this.timeNow = new Date();
  }

  switchDepMode(event) {
    event.stopPropagation();
    this.depMode = ((this.depMode === 'depmin') ? 'deptime' : 'depmin');
    this.fillList();
  }

  ensureListElements() {
    if (!this.dep.querySelector('tr')) {
      this.dep.innerHTML = `
        <tr>
          <td name="id" class="id"></td>
          <td name="dest" class="dest"></td>
          <td name="time" class="time"></td>
        </tr>
      `;
    }

    this.elementId = this.shadowRoot.querySelector('td[name="id"]');
    this.elementDest = this.shadowRoot.querySelector('td[name="dest"]');
    this.elementTime = this.shadowRoot.querySelector('td[name="time"]');
  }

  showEmptyState() {
    this.ensureListElements();
    this.elementId.innerHTML = '';
    this.elementDest.innerHTML = '<div style="text-align:center">keine Abfahrten vorhanden...</div>';
    this.elementTime.innerHTML = '';
  }

  fillList() {
    console.log('fillList', this.list);
    this.ensureListElements();
    if (this.list) {
      const [readingId] = this.getListReadingInfo();
      const refTime = readingId
        ? fhemService.getReadingItem(readingId).data.time
        : null;
      const parsedRefDate = refTime ? dateFromString(refTime) : null;
      const hasValidRefDate = parsedRefDate && !Number.isNaN(parsedRefDate.getTime());
      const refDate = hasValidRefDate ? parsedRefDate : new Date();
      refDate.setSeconds(59);
      const currentTime = new Date();
      const nextDay = dateFormat(new Date(currentTime.getTime() + 24 * 60 * 60 * 1000), 'ee');
      const listIsTimeBased = this.list.includes(':');
      const ageMinutes = hasValidRefDate
        ? Math.floor((currentTime.getTime() - refDate.getTime()) / (60 * 1000))
        : 0;
      let n = '';
      let text0 = '';
      let text1 = '';
      let text2 = '';
      let json;
      try {
        json = JSON.parse(this.list);
      } catch (error) {
        return;
      }
      if (!Array.isArray(json)) {
        return;
      }
      //times from this.list in min and min<=0 add 1440 for next Day from this.list end
      if (listIsTimeBased) {
        for (let i = 0, l = json.length; i < l; i++) {
          const times = json[i];
          if (!Array.isArray(times) || typeof times[2] !== 'string' || !times[2].includes(':')) {
            continue;
          }
          const [deph, depm] = times[2].split(':');
          const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
          const isDepMins = deph * 60 + parseInt(depm) - currentMinutes;
          times.splice(2, 1, isDepMins);
        }
        for (let i = json.length - 1; i >= 0; i--) {
          const mins = json[i];
          if (mins[2] <= 0) {
            const isDepMins = mins[2] + parseInt(1440);
            mins.splice(2, 1, isDepMins);
          } else {
            break;
          }
        }
      }

      for (let idx = 0, len = json.length; idx < len; idx++) {
        n++;
        const line = json[idx];
        if (!Array.isArray(line) || line.length < 3) {
          continue;
        }
        const originalWhen = parseInt(line[2]);
        let when = originalWhen;
        if (Number.isNaN(when)) {
          continue;
        }
        const remainingMinutes = listIsTimeBased ? when : when - Math.max(ageMinutes, 0);
        const departureDate = listIsTimeBased
          ? new Date(currentTime.getTime() + when * 60 * 1000)
          : new Date(refDate.getTime() + originalWhen * 60 * 1000);
        const depTime = dateFormat(departureDate, 'hh:mm');
        const depMinTime = depTime;
        const isNextDayDeparture = departureDate.toDateString() !== currentTime.toDateString();
        if (!this.depMode) {
          this.depMode = (listIsTimeBased ? 'deptime' : 'depmin');
        }
        if (this.depMode === 'deptime') {
          if (listIsTimeBased) {
            when = (when >= 0 ? depTime : '--:--');
            if (isNextDayDeparture && this.hasAttribute('nextday')) {
              when = nextDay;//+', '+depTime;
            }
          } else {
            when = (remainingMinutes >= 0 ? depMinTime : '--:--');
            if (isNextDayDeparture && this.hasAttribute('nextday')) {
              when = nextDay;//+', '+depMinTime;
            }
          }
        } else {
          if (listIsTimeBased) {
            when = (when >= 0 ? when : '-');
            if (when > this.depminsize && !this.hasAttribute('deptime') && !this.hasAttribute('depmin')) {
              when = depTime;
            }
            if (isNextDayDeparture && this.hasAttribute('nextday')) {
              when = nextDay;//+', '+depTime;
            }
          } else {
            when = (remainingMinutes >= 0 ? remainingMinutes : '-');
            if (remainingMinutes > this.depminsize && !this.hasAttribute('deptime') && !this.hasAttribute('depmin')) {
              when = depMinTime;
            }
            if (isNextDayDeparture && this.hasAttribute('nextday')) {
              when = nextDay;//+', '+depMinTime;
            }
          }
        }

        if (when !== '--:--' && when !== '-') {
          const text = (n % 2 === 0 && (this.hasAttribute('alternate')) ? '<div class="alt fade">' : '<div class="fade">');
          text0 += text + '<div class="id0">' + line[0] + '</div></div>';
          text1 += text + ((line[1].length > this.deptxtlength) ? '<div class="scrolltxt dest0">' : '<div class="dest0">') + line[1] + '</div></div>';
          text2 += text + ((when === '--:--' || when === '-') ? '<div class="time0">' : '<div class="top time0">') + when + '</div></div>';
        }
      }

      this.elementId.innerHTML = text0;
      if (!text1) {
        this.showEmptyState();
      } else {
        this.elementDest.innerHTML = text1;
      }
      if (this.hasAttribute('depscroll') && this.shadowRoot.querySelector('.scrolltxt') !== null) {
        const scroll = this.shadowRoot.querySelectorAll('.scrolltxt');
        for (let i = 0; i < scroll.length; i++) {
          scroll[i].addEventListener('click', function (event) { scroll[i].innerHTML = '<div class="depscroll">' + scroll[i].textContent/*firstChild.nodeValue*/ + '</div>'; event.stopPropagation(); });
        }
      }
      this.elementTime.innerHTML = text2;
      this.elementSwitch.innerHTML = '<ftui-icon name="' + ((this.depMode === 'deptime') ? 'sort-numeric-asc' : 'clock-o') + '"></ftui-icon>';
      this.elementMinutes.innerHTML = ((this.depMode === 'deptime') ? 'Zeit' : 'in Min');
      if (this.shadowRoot.querySelector('.top') !== null) {
        this.shadowRoot.querySelector('.top').scrollIntoView({ block: 'start', behavior: 'smooth' })
      }
    } else {
      this.showEmptyState();
    }
  }
}

window.customElements.define('ftui-departure', FtuiDeparture);
