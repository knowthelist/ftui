export default class FtuiWidget extends HTMLElement {
  constructor(defaults) {
    super();

    const attributes = {};
    [...this.attributes].forEach(attr => {
      const name = attr.name.replace(/-([a-z])/g, (char) => { return char[1].toUpperCase() });
      attributes[name] = attr.value
    });
    Object.assign(this, defaults, attributes);

    // init HTML template
    if (typeof this.template === 'function') {
      this.insertAdjacentHTML('beforeend', this.template());
    }

    this.delayedSubmitCommand = ftui.delay(this.submitCommand, this.delay);
  }

  updateReading(reading, value) {
    const match = /^([^-]*)-(.*)$/.exec(reading);
    const deviceName = match ? match[1] : reading;
    const readingName = match ? match[2] : null;
    const cmdl = [this.cmd, deviceName, readingName, value].join(' ');
    if (this.delay) {
      this.delayedSubmitCommand(cmdl);
    } else {
      this.submitCommand(cmdl);
    }
  }

  submitCommand(cmdl) {
    ftui.sendFhemCommand(cmdl);
    ftui.toast(cmdl);
  }

  allClasses(attribute) {
    const map = ftui.parseObject(attribute);
    return Object.values(map).map(value => value).join(' ').split(' ').filter(String);
  }

  matchingClasses(attribute, value) {
    const matchValue = ftui.matchingValue(attribute, value);
    return matchValue ? matchValue.split(' ').filter(String) : [];
  }
}