/*
* Speak component for FTUI version 3
*
* Copyright (c) 2020-2021 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import { fhemService } from '../../modules/ftui/fhem.service.js';
import * as ftuiHelper from '../../modules/ftui/ftui.helper.js';


export class FtuiSpeak extends FtuiElement {
  constructor(properties) {
    super(Object.assign(FtuiSpeak.properties, properties));

    this.findVoice();
    this.readingName = this.binding.getReadingsOfAttribute('text')[0];
  }

  static get properties() {
    return {
      lang: '',
      pitch: 0.9,
      rate: 1.0,
      volume: 1.0,
      text: ''
    };
  }

  static get observedAttributes() {
    return [...this.convertToAttributes(FtuiSpeak.properties), ...super.observedAttributes];
  }

  onAttributeChanged(name) {
    switch (name) {
      case 'lang':
        this.findVoice();
        break;
      case 'text': {
        const readingData = fhemService.getReadingItem(this.readingName).data;
        const isNewDate = readingData.time !== this.lastTextDate;
        if (this.isInitialized && !this.disabled && this.text !== '' && isNewDate) {
          this.lastTextDate = readingData.time;
          this.speakText(this.text);
        }
        if (!this.isInitialized) {
          this.isInitialized = true;
          // reset attribute to allow speak the same text again
          this.text = '';
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
    if (ftuiHelper.isDefined(this.synthVoice)) {
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
