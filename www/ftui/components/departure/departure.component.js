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
import { dateFormat, dateFromString, getReadingID } from '../../modules/ftui/ftui.helper.js';

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

    this.listAttr = this.binding.getReadingsOfAttribute('list');
    if (this.listAttr[0]) { this.listAttr = this.listAttr[0].replace('-',' '); }

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
    if (this.listAttr[0]) {
      ((dateFormat(new Date(), 'ss') === '00') ? this.timerUpdate = setTimeout(() => this.startTimerUpdate(), this.getinterval * 1000) ? this.requestUpdate() : clearTimeout(this.timerUpdate) : this.timerUpdate = setInterval(() => this.startTimerUpdate(), 1000));
    }
  }

  startTimerRefreshList() {
    clearInterval(this.timerRefreshList);
    clearTimeout(this.timerRefreshList);
    if (!this.listAttr[0]) {
      ((dateFormat(new Date(), 'ss') === '00') ? this.timerRefreshList = setTimeout(() => this.startTimerRefreshList(), this.refreshlist * 1000) ? this.fillList() : clearTimeout(this.timerRefreshList) : this.timerRefreshList = setInterval(() => this.startTimerRefreshList(), 1000));
    }
  }

  requestUpdate() {
    fhemService.sendCommand((this.get || this.set ? (this.get ? 'get '+this.get : 'set '+this.set) : 'get '+this.listAttr));
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

  fillList() {
    if (this.list) {
      const refDate = ((this.listAttr[0]) ? dateFromString(fhemService.getReadingItem(getReadingID(this.listAttr.split(' ')[0], this.listAttr.split(' ')[1])).data.time) : new Date(this.timeNow));
      refDate.setSeconds(59);
      const currentTime = new Date();
      const nextDay = dateFormat(new Date(currentTime.setDate(currentTime.getDate() + 1)), 'ee');
      const isTimeMin = currentTime.getHours() * 60 + currentTime.getMinutes();
      const tsMin = refDate.getHours() * 60 + refDate.getMinutes();
      let n = '';
      let text0 = '';
      let text1 = '';
      let text2 = '';
      const json = JSON.parse(this.list);
      //times from this.list in min and min<=0 add 1440 for next Day from this.list end
      if (this.list.match(/:/g)) {
        for (let i = 0, l = json.length; i < l; i++) {
          const times = json[i];
          const [deph, depm] = times[2].split(':');
          const isDepMins = deph * 60 + parseInt(depm) - isTimeMin;
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
        let when = parseInt(line[2]);
        const depTime = dateFormat(new Date(currentTime.getTime() + when * 60 * 1000), 'hh:mm');
        const depMinTime = dateFormat(new Date(refDate.getTime() + when * 60 * 1000), 'hh:mm');
        const tsDep = when + tsMin - isTimeMin;
        if (!this.depMode) {
          this.depMode = (this.list.match(/:/g) ? 'deptime' : 'depmin');
        }
        if (this.depMode === 'deptime') {
          if (this.list.match(/:/g)) {
            when = (when >= 0 ? depTime : '--:--');
            if (line[2] > (1439 - isTimeMin) && this.hasAttribute('nextday')) {
              when = nextDay;//+', '+depTime;
            }
          } else {
            when = (tsDep >= 0 ? depMinTime : '--:--');
            if (tsDep > (1439 - isTimeMin) && this.hasAttribute('nextday')) {
              when = nextDay;//+', '+depMinTime;
            }
          }
        } else {
          if (this.list.match(/:/g)) {
            when = (when >= 0 ? when : '-');
            if (when > this.depminsize && !this.hasAttribute('deptime') && !this.hasAttribute('depmin')) {
              when = depTime;
            }
            if (line[2] > (1439 - isTimeMin) && this.hasAttribute('nextday')) {
              when = nextDay;//+', '+depTime;
            }
          } else {
            when = (tsDep >= 0 ? tsDep : '-');
            if (tsDep > this.depminsize && !this.hasAttribute('deptime') && !this.hasAttribute('depmin')) {
              when = depMinTime;
            }
            if (tsDep > (1439 - isTimeMin) && this.hasAttribute('nextday')) {
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
      ((!text1) ? this.dep.innerHTML = '<div style="text-align:center">' + 'keine Abfahrten vorhanden...' + '</div>' : this.elementDest.innerHTML = text1);
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
      this.dep.innerHTML = '<div style="text-align:center">' + 'keine Abfahrten vorhanden...' + '</div>';
    }
  }
}

window.customElements.define('ftui-departure', FtuiDeparture);
