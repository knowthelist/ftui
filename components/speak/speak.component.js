/* 
* Speak component for FTUI version 3
*
* Copyright (c) 2020 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
* 
* https://github.com/knowthelist/ftui
*/

import { FtuiElement } from '../element.component.js';
import * as ftuiHelper from '../../modules/ftui/ftui.helper.js';


export class FtuiSpeak extends FtuiElement {
  constructor(properties) {
    super(Object.assign(FtuiSpeak.properties, properties));
    
    this.findVoice();
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
      case 'text':
        if (this.isInitialized && !this.disabled) {
          this.speakText(this.text);
        }
        this.isInitialized = true;
        break;
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
  }

  findVoice() {
    const voices = window.speechSynthesis.getVoices();
    this.synthVoice = voices.find(voice => {
      return voice.lang === this.lang;
    })
  }
}

window.customElements.define('ftui-speak', FtuiSpeak);
