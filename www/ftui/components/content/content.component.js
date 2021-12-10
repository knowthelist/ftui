/*
* Template component for FTUI version 3
*
* Copyright (c) 2020-2021 Mario Stephan <mstephan@shared-files.de>
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

    this.onPageInitialized = this.onPageInitialized.bind(this);

    if (this.file) {
      if (this.lazy) {
        document.addEventListener('ftuiPageInitialized', this.onPageInitialized);
      } else {
        ftuiApp.config.refreshDelay = 500;
        this.loadFileContent();
      }
    }
  }

  static get properties() {
    return {
      file: '',
      content: '',
      lazy: false,
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiContent.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, newValue) {
    switch (name) {
      case 'content':
        if (newValue !== '/* ... */') {
          this.rawText = newValue;
          // remove long texts to avoid huge attr values in DOM
          setTimeout(() => {
            this.setAttribute(name, '/* ... */');
          }, 1000)
          this.initContent();
          break;
        }
    }
  }

  onPageInitialized() {
    if (!this.observer) {
      this.container = this.closest('ftui-view, ftui-tab-view') || this.parentElement;
      document.removeEventListener('ftuiPageInitialized', this.onPageInitialized);
      this.initInViewportObserver();
    }
  }

  initInViewportObserver() {
    this.observer = new IntersectionObserver(
      this.onIntersectionChange.bind(this),
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.5,
      });
    this.observer.observe(this.container);
  }

  onIntersectionChange(entries){
    if(entries[0].isIntersecting) {
      this.loadFileContent();
    }
  }

  async loadFileContent() {
    if (this.lazy) {
      this.observer.unobserve(this.container);
    }
    const result = await fetch(this.file);
    this.rawText = await result.text();
    this.initContent();
  }

  initContent() {
    const solvedContent = String(this.rawText).replace(/\{\{([^}]+)\}\}/g, variable => {
      return this.getAttribute(variable.slice(2, -2)) || '';
    });
    this.innerHTML = solvedContent;
    ftui.log(2, '[FtuiContent] file loaded and content inserted');
    ftuiApp.initComponents(this);
  }
}

ftui.appendStyleLink('components/content/content.component.css');
window.customElements.define('ftui-content', FtuiContent);
