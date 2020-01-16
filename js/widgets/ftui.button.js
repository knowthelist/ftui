import FtuiSymbol from './ftui.symbol.js';

export default class FtuiButton extends FtuiSymbol {

  constructor(attributes) {
    const defaults = {
      cmd: 'set',
      states: ['on', 'off'],
      icon: 'mdi mdi-lightbulb-outline',
      stateIndex: 1
    };
    super(Object.assign(defaults, attributes));

    this.stateMap = ftui.parseObject(this.stateMap);
    this.states = ftui.parseArray(this.states);

    this.addEventListener('click', this.onClicked);
  }

  onUpdateState(param) {
    super.onUpdateState(param);
    const index = this.states.indexOf(this.value);
    if (index > -1) {
      this.stateIndex = index;
    }
  }

  onClicked() {
    this.stateIndex = ++this.stateIndex % this.states.length;
    this.value = this.states[this.stateIndex];
    
    super.onUpdateState({ value: this.value });

    if (this.showStateAsText) {
      this.onUpdateText({ value: this.value });
    }
    this.updateReading(this.setReading || this.stateReading, this.value);
  }
}

ftui.appendStyleLink(ftui.config.basedir + 'css/ftui.button.css', false);
window.customElements.define('ftui-button', FtuiButton);
