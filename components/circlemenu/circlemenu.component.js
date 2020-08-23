/* 
* Circlemenu component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { CircleMenu } from '../../modules/circle-menu/circle-menu.min.js';

export class FtuiCircleMenu extends FtuiElement {

  constructor(attributes) {

    super(Object.assign(FtuiCircleMenu.defaults, attributes));

    this.circlemenu = new CircleMenu(this, {
      trigger: 'click',
      circle_radius: this.circleRadius,
      direction: this.direction,
      close_event: this.keepOpen ? '' : 'click',
      open: () => {
        if (!this.keepOpen) {
          setTimeout(() => this.circlemenu.close(), this.timeout * 1000);
        }
      }
    });
  }

  static get defaults() {
    return {
      circleRadius: 6,
      keepOpen: false,
      direction: 'full',
      timeout: 4
    }
  }
}

ftui.appendStyleLink(ftui.config.basedir + 'components/circlemenu/circlemenu.component.css');
window.customElements.define('ftui-circlemenu', FtuiCircleMenu);
