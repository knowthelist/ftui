import FtuiSymbol from './ftui.symbol.js';

export default class FtuiButton extends FtuiSymbol {

  constructor(attributes) {
    const defaults = {
      cmd: 'set',
      states: { '.*': 'on', 'off': 'off' },
      icon: 'mdi mdi-lightbulb-outline',
      stateIndex: 0
    };
    super(Object.assign(defaults, attributes));

    this.states = ftui.parseObject(this.states);
    this.stateArray = Object.values(this.states);

    this.addEventListener('click', this.onClicked);
  }

  onClicked() {
    this.stateIndex = ++this.stateIndex % this.stateArray.length;
    this.value = this.stateArray[this.stateIndex];
    super.onUpdateState({ value: this.value });
    if (this.showStateAsText) {
      this.onUpdateText({ value: this.value });
    }
    this.updateReading(this.setReading || this.stateReading, this.value);
  }

  onUpdateState(param) {
    const value = ftui.matchingValue(this.states, param.value);
    if (value !== null) {
      this.value = value;
      this.stateIndex = this.stateArray.indexOf(value);
      super.onUpdateState({ value: this.value });
    }
  }
}

ftui.appendStyleLink(ftui.config.basedir + 'css/ftui.button.css', false);
window.customElements.define('ftui-button', FtuiButton);
