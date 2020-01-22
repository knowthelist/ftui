/* 
* Checkbox widget for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiWidget } from './ftui.widget.js';

let idCount = 0;

class FtuiCheckbox extends FtuiWidget {

  constructor(attributes) {
    const defaults = {
      cmd: 'set',
      states: ['off','on'],
      texts: ['',''],
      uid: 'checkbox' + ++idCount
    };
    super(Object.assign(defaults, attributes));

    this.states = ftui.parseArray(this.states);
    this.texts = ftui.parseArray(this.texts);

    this.elementInput = this.querySelector('input');
    this.elementInput.addEventListener('click', () => this.onClicked());

    const inner = this.querySelector('.inner');
    inner.setAttribute('data-text-off', this.texts[0]);
    inner.setAttribute('data-text-on', this.texts[1]);

    ftui.getReadingEvents(this.stateReading).subscribe(param => this.onUpdateState(param));
  }

  template() {
    return `<input type="checkbox" class="checkbox" id="${this.uid}" checked>
            <label class="label" for="${this.uid}">
                <span class="inner"></span>
                <span class="switch"></span>
            </label>`;
  }


  // FHEM event handler
  onUpdateState(param) {
    this.value = ftui.matchingValue(this.stateMap, param.value) || param.value;
    const index = this.states.indexOf(this.value);
    if (index > -1) {
      this.elementInput.checked = index === 1;
    }
  }

  // DOM event handler
  onClicked() {
    this.stateIndex = this.elementInput.checked ? 1 : 0;
    this.value = this.states[this.stateIndex];
    this.sendReadingChange(this.setReading || this.stateReading, this.value);
  }
}

ftui.appendStyleLink(ftui.config.basedir + 'widget/css/ftui.checkbox.css');
window.customElements.define('ftui-checkbox', FtuiCheckbox);
