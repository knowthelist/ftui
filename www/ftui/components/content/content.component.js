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

    ftui.log(2, '[FtuiContent] constructor  file = ', this.file);
    ftuiApp.config.refreshDelay = 500;
    if (this.file) {
      this.loadFileContent();
    }
  }

  static get properties() {
    return {
      file: '',
      content: '',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiContent.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'content':
        this.initContent();
        break;
    }
  }

  async loadFileContent() {
    const result = await fetch(this.file);
    this.content = await result.text();
  }

  initContent() {
    const solvedContent = String(this.content).replace(/\{\{([^}]+)\}\}/g, variable => {
      return this.getAttribute(variable.slice(2, -2)) || '';
    });

    this.insertAdjacentHTML('beforeend', solvedContent);
    ftui.log(2, '[FtuiContent] file loaded and content inserted');
    ftuiApp.initComponents(this);
  }

}

ftui.appendStyleLink('components/content/content.component.css');
window.customElements.define('ftui-content', FtuiContent);
