/* 
* Label widget for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiWidget } from './ftui.widget.js';

export class FtuiLabel extends FtuiWidget {

  constructor() {
    const defaults = {
      textPre: '',
      text: '',
      textPost: '',
      preClass: '',
      textClass: '',
      postClass: ''
    };
    super(defaults);

    this.elementText = this.querySelector('#text');

    ftui.getReadingEvents(this.stateReading).subscribe(param => this.onUpdateState(param));
    ftui.getReadingEvents(this.textReading).subscribe(param => this.onUpdateText(param));
  }

  template() {
    return `<span id="pre" class="${this.preClass}">${this.textPre}</span>
            <span id="text" class="${this.textClass}">${this.text}</span>
            <span id="post" class="${this.postClass}">${this.textPost}</span>`;
  }

  onUpdateState(param) {
    if (ftui.isDefined(param.value)) {
      const value = ftui.getMatchingValue(this.stateMap, param.value) || param.value;
      this.setMatchingClasses(this.elementText, this.stateClasses, value);
    }
  }

  onUpdateText(param) {
    if (ftui.isDefined(param.value)) {
      const text = ftui.getMatchingValue(this.textMap, param.value) || param.value;
      this.text = this.textFilter ? this.filteredText(text) : text;
      this.elementText.innerHTML = this.text;

      this.setMatchingClasses(this.elementText, this.textClasses, this.text);

      // auto hide
      if (ftui.isDefined(this.hideEmpty) || this.hideEmpty) {
        if (this.text === '') {
          this.classList.add('is-empty');
        } else {
          this.classList.remove('is-empty');
        }
      }
    }
  }

  filteredText(text) {
    const part = value => input => ftui.getPart(input, value);
    const round = value => input => ftui.round(input, value);
    const toDate = value => input => ftui.dateFromString(input, value);
    const format = value => input => ftui.dateFormat(input, value);
    const add = value => input => input + value;
    const multiply = value => input => input * value;

    const pipe = (f1, ...fns) => (...args) => {
      return fns.reduce((res, fn) => fn(res), f1.apply(null, args));
    };
    const fn = eval('pipe(' + this.textFilter.replace(/\|/g, ',') + ')');

    return fn(text);
  }
}

ftui.appendStyleLink(ftui.config.basedir + 'widget/css/ftui.label.css');
window.customElements.define('ftui-label', FtuiLabel);
