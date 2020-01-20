/* 
* Symbol widget for FTUI version 3
*
* Copyright (c) 2019-2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import FtuiWidget from './ftui.widget.js';

export default class FtuiSymbol extends FtuiWidget {

  constructor(attributes) {
    const defaults = {
      stateClasses: { 'off': '', 'on': 'active' },
      stateMap: { 'off': 'off', 'on': 'on' },
      icon: 'fa ftui-window',
      iconClass: '',
      text: '',
      textClass: '',
      badgeValue: '',
      badgeClass: ''

    };
    super(Object.assign(defaults, attributes));

    this.elementIcon = this.querySelector('#icon');
    this.elementText = this.querySelector('#text');
    this.elementBadge = this.querySelector('#badge');

    ftui.getReadingEvents(this.stateReading).subscribe(param => this.onUpdateState(param));
    ftui.getReadingEvents(this.iconReading).subscribe(param => this.onUpdateIcon(param));
    ftui.getReadingEvents(this.textReading).subscribe(param => this.onUpdateText(param));
    ftui.getReadingEvents(this.badgeReading).subscribe(param => this.onUpdateBadge(param));
  }

  template() {
    return `<div id="icon" class="${this.icon} ${this.iconClass}">
            <span id="text" class="${this.textClass}">${this.text}</span>
            <span id="badge" class="${this.badgeClass}">${this.badgeValue}</span>
          </div>`;
  }

  onUpdateState(param) {
    this.value = ftui.matchingValue(this.stateMap, param.value) || param.value;
    this.setMatchingClasses(this.elementIcon, this.stateClasses, this.value);
  }

  onUpdateIcon(param) {
    if (this.iconClasses) {
      if (this.icon) {
        this.elementIcon.classList.remove(...this.icon.split(' '));
      }
      this.setMatchingClasses(this.elementIcon, this.iconClasses, param.value);
    } else {
      if (this.icon) {
        this.elementIcon.classList.remove(...this.icon.split(' '));
        this.icon = param.value;
        this.elementIcon.classList.add(...this.icon.split(' '));
      }
    }
  }

  onUpdateText(param) {
    if (ftui.isDefined(param.value)) {
      this.elementText.innerHTML = param.value;
    }
    this.setMatchingClasses(this.elementText, this.textClasses, param.value);
  }

  onUpdateBadge(param) {
    this.elementBadge.innerHTML = (ftui.isDefined(param.value) && param.value > 0) ? param.value : '';
  }
}

ftui.appendStyleLink(ftui.config.basedir + 'widget/css/ftui.symbol.css');
window.customElements.define('ftui-symbol', FtuiSymbol);
