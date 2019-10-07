import FtuiWidget from './ftui.widget.js';

class FtuiLabel extends FtuiWidget {

  constructor() {
    const defaults = {
      textPre: '',
      text: '',
      textPost: ''
    };
    super(defaults);

    //const label = 

    //this.insertAdjacentHTML('beforeend', label);
    this.elementText = this.querySelector('#text');

    ftui.addReading(this.stateReading).subscribe(param => this.onUpdateState(param));
    ftui.addReading(this.textReading).subscribe(param => this.onUpdateText(param));

  }

  template() {
    return `<div id="wrapper">
    <span id="pre">${this.textPre}</span>
    <span id="text">${this.text}</span>
    <span id="post">${this.textPost}</span></div>`;
  }

  onUpdateState(param) {
    if (ftui.isValid(param.value)) {
      if (this.stateClasses) {
        this.elementText.classList.remove(...this.allClasses(this.stateClasses));
        this.elementText.classList.add(...this.matchingClasses(this.stateClasses, param.value));
      }
    }
  }

  onUpdateText(param) {
    if (ftui.isValid(param.value)) {
      if (this.textFilter) {
        const part = value => input => ftui.getPart(input, value);
        const round = value => input => ftui.round(input, value);
        const add = value => input => input + value;
        const multiply = value => input => input * value;
        const pipe = (f1, ...fns) => (...args) => {
          return fns.reduce((res, fn) => fn(res), f1.apply(null, args));
        };
        const fn = eval('pipe(' + this.textFilter + ')');

        this.elementText.innerHTML = fn(param.value);
      } else {
        this.elementText.innerHTML = param.value;
      }
      if (this.textClasses) {
        this.elementText.classList.remove(...this.allClasses(this.textClasses));
        this.elementText.classList.add(...this.matchingClasses(this.textClasses, param.value));
      }
    }
  }
}

ftui.appendStyleLink(ftui.config.basedir + 'css/ftui.label.css', false);
window.customElements.define('ftui-label', FtuiLabel);
