/*
* Template component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { ftuiApp } from '../../modules/ftui/ftui.app.js';
import * as ftui from '../../modules/ftui/ftui.helper.js';
import { FtuiElement } from '../element.component.js';

export class FtuiContent extends FtuiElement {

  constructor(properties) {
    super(Object.assign(FtuiContent.properties, properties));

    this.loadFileContent();
  }

  static get properties() {
    return {
      file: '',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiContent.properties), ...super.observedAttributes];
  }

  async loadFileContent() {
    const result = await fetch(this.file);
    const content = await result.text();
    const solvedContent = String(content).replace(/\{\{([^}]+)\}\}/g, variable => {
      return this.getAttribute(variable.slice(2, -2)) || '';
    });

    this.insertAdjacentHTML('beforeend', solvedContent);
    ftuiApp.initComponents(this);
  }

}

ftui.appendStyleLink('components/content/content.component.css');
window.customElements.define('ftui-content', FtuiContent);
