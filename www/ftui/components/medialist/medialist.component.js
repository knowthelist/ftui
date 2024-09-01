/*
* Medialist component for FTUI version 3
*
* Copyright (c) 2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { isDefined, durationFromSeconds, log, error, isNumeric } from '../../modules/ftui/ftui.helper.js';
import { parseHocon } from '../../modules/hocon/hocon.min.js';

export class FtuiMedialist extends FtuiElement {
  constructor(properties) {

    super(Object.assign(FtuiMedialist.properties, properties));

    this.elemList = this.shadowRoot.querySelector('.media-list');
  }

  template() {
    return `
      <style> @import "components/medialist/medialist.component.css"; </style>
      <div class="media-list">
        <div class="media placeholder">
          <div class="media-image"></div>
          <div class="media-text"><div class="title"></div>
          <div class="artist"></div><div class="duration"></div></div>
        </div>
        <div class="media placeholder">
          <div class="media-image"></div>
          <div class="media-text"><div class="title"></div>
          <div class="artist"></div><div class="duration"></div></div>
        </div>
        <div class="media placeholder">
          <div class="media-image"></div>
          <div class="media-text"><div class="title"></div>
          <div class="artist"></div><div class="duration"></div></div>
        </div>
      </div>
      <slot></slot>
      `;
  }

  static get properties() {
    return {
      list: '',
      file: '',
      track: '',
      width: '',
      height: '',
      padding: '0.5',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiMedialist.properties), ...super.observedAttributes];
  }

  onConnected() {
    this.style.padding = isNumeric(this.padding) ? this.padding + 'px' : this.padding;
    if (this.list.length > 0) {
      this.fillList();
    }
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'list':
        this.fillList();
        break;
      case 'track':
        this.setPosition();
        break;
      case 'file':
        this.setFile();
        break;
    }
  }

  onClicked(media) {
    this.submitChange('file', media.file);
    this.submitChange('track', media.track);
  }

  clearCurrent() {
    this.elemList.querySelectorAll('.current').forEach(elem => {
      elem.classList.remove('current');
    });
  }

  setPosition() {
    this.clearCurrent();
    if (this.track) {
      this.setCurrent(`[data-track="${this.track}"]`);
    }
  }

  setFile() {
    this.clearCurrent();
    if (this.file) {
      this.setCurrent(`[data-file="${this.file}"]`);
    }
  }

  setCurrent(selector) {
    this.elemList.querySelectorAll(selector).forEach(elem => {
      elem.classList.add('current');
      elem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    });
  }

  fillList() {
    if (isDefined(this.list)) {
      try {
        this.elemList.textContent = '';
        const collection = parseHocon(this.list
          .replace(/`/g, '\'')
          .replace(/´/g, '\''));
        collection.forEach((item, index) => {

          const elemItem = document.createElement('div');
          elemItem.classList.add('media');
          elemItem.file = item.File;
          elemItem.track = index + 1;
          elemItem.setAttribute('data-file', elemItem.file);
          elemItem.setAttribute('data-track', elemItem.track);
          elemItem.addEventListener('click', () => this.onClicked(elemItem));

          let content = '<div class="media-image">';
          content += '<img class="cover" src="' + item.Cover + '" onerror="this.src=\'components/medialist/album_icon.svg\';this.onerror=\'\';"/>';
          content += '</div>';
          content += '<div class="media-text">';
          content += '<div class="title">' + item.Title + '</div>';
          content += '<div class="artist">' + item.Artist + '</div>';
          content += '<div class="duration">' + ((item.Time > 0) ? durationFromSeconds(item.Time) : '&nbsp;') + '</div>';
          content += '</div>';
          elemItem.innerHTML = content;
          this.elemList.appendChild(elemItem);
        });

      } catch (e) {
        error('[FtuiMedialist] error: ' + e);
        log(1, this.list);
      }
    }
    this.setPosition();
  }
}

window.customElements.define('ftui-medialist', FtuiMedialist);
