/*
* Departure component for FTUI version 3
*
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
// eslint-disable-next-line no-unused-vars
import { FtuiIcon } from '../icon/icon.component.js';
import { fhemService } from '../../modules/ftui/fhem.service.js';
import { dateFormat } from '../../modules/ftui/ftui.helper.js';

export class FtuiDeparture extends FtuiElement {

  constructor(properties) {
    super(Object.assign(FtuiDeparture.properties, properties));

    this.timerClock = null;
    this.timerUpdate = null;
    this.idSlotElement = this.shadowRoot.querySelector('td[name="id"]');
    this.destSlotElement = this.shadowRoot.querySelector('td[name="dest"]');
    this.timeSlotElement = this.shadowRoot.querySelector('td[name="time"]');
    this.elementClock = this.shadowRoot.querySelector('th[name="clock"]');
    this.elementRefresh = this.shadowRoot.querySelector('.refresh');
    this.elementMinutes = this.shadowRoot.querySelector('th[name="min"]');
    this.size = this.shadowRoot.querySelector('.size');
    this.bg = this.shadowRoot.querySelector('table');
    this.dep = this.shadowRoot.querySelector('tbody');

    this.elementRefresh.addEventListener('click', this.requestUpdate.bind(this) );
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
						<th class="refresh" name="refresh">
								
						</th>
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
      icon: 'bus',
      refbutton: 'refresh1',
      color: 'Default',
      bgcolor: '',
      depcolor: '',
      txtcolor: '',
      deptxtcolor: '',
      width: '100%',
      height: '100%',
      top: '40px',
      interval: 60,
      station: 'Haltestelle',
      get: '',
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
      case 'width':
      case 'height':
      case 'top':
        this.arrangeWindow();
        break;
      case 'interval':
        this.startTimerUpdate();
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
  }

  updateClock() {
    this.elementClock.innerHTML = dateFormat(new Date(), 'hh:mm');
  }

  manRefresh() {
    this.requestUpdate();
  }

  startTimerClock() {
    clearInterval(this.timerClock);
    this.timerClock = setInterval(() => this.updateClock(), 1000);
  }

  requestUpdate() {
    fhemService.sendCommand('get ' + this.get);
  }

  startTimerUpdate() {
    clearInterval(this.timerUpdate);
    if (this.interval) {
      this.timerUpdate = setInterval(() => this.requestUpdate(), this.interval * 1000);
    }
  }

  fillList() {
    let n = '';
    let text = '';
    let text0 = '';
    let text1 = '';
    let text2 = '';
    let min = 0;
    const list = this.list;
    const json = JSON.parse(list);
    console.log(json, this.list);
    for (let idx = 0, len = json.length; idx < len; idx++) {
      n++;
      const line = json[idx];
      let when = line[2];
      const currentDate = new Date();
      const departureTime = new Date(currentDate.getTime() + (when * 60 * 1000));
      if (this.hasAttribute('deptime') && !when.match(/:/g)) {
        when = dateFormat(departureTime, 'hh:mm');
      }
      if (this.hasAttribute('depmin') && when.match(/:/g)) {
        const h = (dateFormat(new Date(), 'hh') * 60);
        const m = dateFormat(new Date(), 'mm');
        const min = (h + Math.abs(m));
        const deph = (String(when).replace(/:.*/g, '') * 60);
        const depm = String(when).replace(/.*:/g, '');
        const depmin = (deph + Math.abs(depm));
        if (depmin >= min) {
          when = (depmin - Math.abs(min));
        }
        if (depmin < min) {
          when = (depmin - Math.abs(min) + Math.abs(1440));
        }

      }
      text = (n % 2 === 0 && (this.hasAttribute('alternate')) ? '<div class="alt fade">' : '<div class="fade">');
      text0 += text + '<div class="id0">' + line[0] + '</div></div>';
      text1 += text + '<div class="dest0">' + line[1] + '</div></div>';
      text2 += text + '<div class="time0">' + when + '</div></div>';
      min = String(when).match(/:/g) ? 'Clock' : 'in Min';
    }
    this.idSlotElement.innerHTML = text0;
    this.destSlotElement.innerHTML = text1;
    this.timeSlotElement.innerHTML = text2;
    this.elementMinutes.innerHTML = min;
  }
}

window.customElements.define('ftui-departure', FtuiDeparture);
