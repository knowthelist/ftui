import FtuiWidget from './ftui.widget.js';

class FtuiLabel extends FtuiWidget {

  constructor() {
    const defaults = {
      textPre: '',
      text: '',
      textPost: ''
    };
    super(defaults);

    this.elementText = this.querySelector('#text');

    ftui.getReadingEvents(this.stateReading).subscribe(param => this.onUpdateState(param));
    ftui.getReadingEvents(this.textReading).subscribe(param => this.onUpdateText(param));
  }

  template() {
    return `<span id="pre">${this.textPre}</span>
    <span id="text">${this.text}</span>
    <span id="post">${this.textPost}</span>`;
  }

  onUpdateState(param) {
    if (ftui.isDefined(param.value)) {
      if (this.stateClasses) {
        this.setMatchingClasses(this.elementText, this.stateClasses, param.value);
      }
    }
  }

  onUpdateText(param) {
    if (ftui.isDefined(param.value)) {
      this.text = this.textFilter ? this.filteredText(param.value) : param.value;
      this.elementText.innerHTML = this.text;

      if (this.textClasses) {
        this.setMatchingClasses(this.elementText, this.textClasses, this.text);
      }

      // auto hide
      if (ftui.isDefined(this.hideEmpty) || this.hideEmpty ) {
        if (this.text === '') {
          this.classList.add('is-empty');
        } else {
          this.classList.remove('is-empty');
        }
      }
    }
  }

  filteredText(text) {
    const part = value => input => ftui.getPart(input, value);
    const round = value => input => ftui.round(input, value);
    const toDate = value => input => ftui.dateFromString(input, value);
    const format = value => input => ftui.dateFormat(input, value);
    const add = value => input => input + value;
    const multiply = value => input => input * value;

    const pipe = (f1, ...fns) => (...args) => {
      return fns.reduce((res, fn) => fn(res), f1.apply(null, args));
    };
    const fn = eval('pipe(' + this.textFilter.replace(/\|/g, ',') + ')');

    return fn(text);
  }
}

ftui.appendStyleLink(ftui.config.basedir + 'css/ftui.label.css', false);
window.customElements.define('ftui-label', FtuiLabel);
