/*
* Speak component for FTUI version 3
*
* Copyright (c) 2020-2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { backendService } from '../../modules/ftui/backend.service.js';
import { isDefined } from '../../modules/ftui/ftui.helper.js';


export class FtuiSpeak extends FtuiElement {
  constructor(properties) {
    super(Object.assign(FtuiSpeak.properties, properties));

    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = this.findVoice.bind(this);
    }

    this.readingName = this.binding.getReadingsOfAttribute('text')[0] || null;
  }

  static get properties() {
    return {
      lang: '',
      pitch: 0.9,
      rate: 1.0,
      volume: 1.0,
      text: '',
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiSpeak.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name, newValue, oldValue) {
    switch (name) {
      case 'lang':
        this.findVoice();
        break;
      case 'text': {
        const readingData = this.readingName
          ? backendService.getReadingItem(this.readingName).data
          : null;
        const readingTime = readingData && readingData.time;
        const hasChanged = readingTime
          ? readingTime !== this.lastTextToken
          : newValue !== oldValue;
        if (!this.disabled && newValue !== '' && hasChanged) {
          this.lastTextToken = readingTime || null;
          this.speakText(newValue);
        }
        break;
      }
    }
  }

  speakText(text) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = this.rate;
    utter.pitch = this.pitch;
    utter.volume = this.volume;
    if (isDefined(this.synthVoice)) {
      utter.voice = this.synthVoice;
    }
    window.speechSynthesis.speak(utter);
    // reset attribute to allow speak the same text again
    this.text = '';
  }

  findVoice() {
    const voices = window.speechSynthesis.getVoices();
    this.synthVoice = voices.find(voice => {
      return voice.lang === this.lang;
    })
  }
}

window.customElements.define('ftui-speak', FtuiSpeak);
