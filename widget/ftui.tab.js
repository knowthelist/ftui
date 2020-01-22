/* 
* TabView and Tab widget for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiWidget } from './ftui.widget.js';
import { FtuiButton } from './ftui.button.js';

class FtuiTabView extends FtuiWidget {

  constructor() {
    const defaults = {
      group: 'default'
    };
    super(defaults);
  }
}

window.customElements.define('ftui-tab-view', FtuiTabView);

class FtuiTab extends FtuiButton {

  constructor() {
    const defaults = {
      group: 'default'
    };
    super(defaults);

    if (this.classList.contains('default')) {
      this.onClicked();
    }
  }

  onClicked() {

    // hide all views and show selected view
    ftui.selectAll('ftui-tab-view').forEach(elem => {
      if (elem.group === this.group) {
        if (elem.id !== this.view) {
          elem.style.visibility = 'hidden';
        } else {
          elem.style.visibility = 'visible';
        }
      }
    });

    // de-activated all tabs
    ftui.selectAll('ftui-tab').forEach(elem => {
      if (elem.group === this.group) {
        elem.value = 'off'
        elem.setMatchingClasses(elem.elementIcon, elem.stateClasses, elem.value);
      }
    });

    // activate clicked tab
    this.value = 'on'
    this.setMatchingClasses(this.elementIcon, this.stateClasses, this.value);
  }

  onUpdateState(param) {
    super.onUpdateState(param);
    if (this.value === 'on') {
      this.onClicked();
    }
  }
}

ftui.appendStyleLink(ftui.config.basedir + 'widget/css/ftui.tab.css');
window.customElements.define('ftui-tab', FtuiTab);
