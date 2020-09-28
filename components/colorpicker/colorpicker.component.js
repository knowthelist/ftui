/* 
* colorpicker component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import iro from '../../modules/iro.js/iro.min.js';


export class FtuiColorpicker extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiColorpicker.properties, properties));

    this.colorPicker = new iro.ColorPicker(this, {
      width: this.width,
    });

    this.colorPicker.on('input:change', (color) => this.onColorChange(color));

  }

  static get properties() {
    return {
      width: 150,
      hex: '',
      debounce: 200
    };
  }

  static get observedAttributes() {
    return [...Object.keys(FtuiColorpicker.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'list':
        this.fillList();
        break;
      case 'hex':
        this.colorPicker.color.hexString = `#${this.hex.replace('#', '')}`;
        break;
    }
  }

  onColorChange(color) {
    this.hex = color.hexString;
    this.emitChangeEvent('color', color );
  }

}

window.customElements.define('ftui-colorpicker', FtuiColorpicker);
