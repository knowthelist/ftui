import { parseHocon } from '../hocon/hocon.min.js';
import { ftui } from './ftui.module.js';


export class ftuiBinding {

  constructor(element) {

    this.private = {
      unbindAttributes: {},
      config: '',
      outputAttributes: new Set(),
      observer: null,
      isChanging: {}
    }

    this.element = element;
    this.readAttributes(element.attributes);

    try {
      this.config = parseHocon(this.private.config);
    } catch (e) {
      this.element.classList.add('has-error');
      ftui.error(e.toString());
    }

    if (this.config?.input?.readings) {
      // subscribe input events (from FHEM reading to component)
      Object.keys(this.config.input.readings).forEach((reading) => {
        ftui.getReadingEvents(reading).subscribe((param) => this.onReadingEvent(param));
      });
    }

    // subscribe output events (from component to FHEM reading)
    if (this.private.outputAttributes.size > 0) {
      this.private.observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type == "attributes") {
            const attributeName = mutation.attributeName;
            const attributeValue = mutation.target[attributeName] || mutation.target.getAttribute(attributeName);
            this.handleAttributeChanged(attributeName, attributeValue);
            this.private.isChanging[attributeName] = false;
          }
        });
      });
      this.private.observer.observe(this.element, {
        attributeFilter: this.outputAttributes,
        /* subtree: true, */
      });

    }

    // define debounced function
    this.debouncedSubmitCommand = ftui.debounce(this.submitCommand, this.element.debounce);
  }


  get unbindAttributes() {
    return Object.assign(this.element.defaults || {}, this.private.unbindAttributes);
  }

  get outputAttributes() {
    return [...this.private.outputAttributes];
  }

  // received events from FHEM
  onReadingEvent(readingData) {
    const readingAttributeMap = this.config.input.readings[readingData.id].attributes;
    Object.entries(readingAttributeMap)
      .forEach(([attribute, options]) => {
        const value = readingData[options.source];
        const filteredValue = this.filterText(value, options.filter);
        if (ftui.isDefined(filteredValue)) {
          if (String(this.element[attribute]) !== String(filteredValue)) {
            ftui.log(3, `${this.element.id}  -  onReadingEvent: set this.${attribute}=${filteredValue}`);
            // avoid endless loop
            this.private.isChanging[attribute] = true;
            // change element's property
            this.element[attribute] = filteredValue;
          }
        }
      });
  }

  /**
 * Stores the attribute value for each defined target reading
 * and sends it to FHEM
 */
  handleAttributeChanged(attributeName, attributeValue) {
    if (!this.private.isChanging[attributeName]) {
      const targetReadings = this.config?.output?.attributes[attributeName]?.readings || [];
      Object.entries(targetReadings).forEach(([readingId, options]) => {

        //const attributeValue = this.element[attributeName];
        const filteredValue = this.filterText(attributeValue, options.filter);
        const value = String(options.value).replaceAll('$value', filteredValue);
        const [parameterId, deviceName, readingName] = ftui.parseReadingId(readingId);
        const cmdline = [options.cmd, deviceName, readingName, value].join(' ');

        // update storage
        ftui.updateReadingValue(parameterId, value);
        // notify FHEM
        this.sendCommand(cmdline);
      });
    }
  }

  // TODO: find a better name
  sendCommand(cmdl) {
    if (this.element.debounce) {
      this.debouncedSubmitCommand(cmdl);
    } else {
      this.submitCommand(cmdl);
    }
  }

  submitCommand(cmdl) {
    if (ftui.sendFhemCommand(cmdl)) {
      ftui.toast(cmdl);
    }
  }

  initInputBinding(attribute) {

    /* 
    in    "dummy1:state:value | map('on:1,off:0')" 
    
    out   input.readings.GartenTemp.attributes.text.source="value"
          input.readings.GartenTemp.attributes.text.filter="map('10:low,30:high')""
    */

    const semicolonNotInQuotes = /;(?=(?:[^']*'[^']*')*[^']*$)/;

    attribute.value.split(semicolonNotInQuotes).forEach((attrValue, idx) => {
      const { readingID, source, filter } = this.parseInputBinding(attrValue);

      this.private.config += `input.readings.${readingID}.attributes.${attribute.name}.source = "${source}"\n`;
      this.private.config += `input.readings.${readingID}.attributes.${attribute.name}.filter = "${filter}"\n`;
    });
  }


  initOutputBinding(attribute) {

    /* 
    in    "map('true:on,false:off') | dummy1"
 
    out   output.attributes.value.readings.dummy1.cmd="set"
          output.attributes.value.readings.dummy1.value="$value"
          output.attributes.value.readings.dummy1.filter="map('true:on,false:off')"
    */
    const { cmd, readingID, value, filter } = this.parseOutputBinding(attribute.value);

    this.private.config += `output.attributes.${attribute.name}.readings.${readingID}.cmd = "${cmd}"\n`;
    this.private.config += `output.attributes.${attribute.name}.readings.${readingID}.value = "${value}"\n`;
    this.private.config += `output.attributes.${attribute.name}.readings.${readingID}.filter = "${filter}"\n`;

    this.private.outputAttributes.add(attribute.name);
  }

  initEventListener(attribute) {
    this.element.addEventListener(attribute.name,
      this.evalInContext.bind(this.element, attribute.value)
    );
  }

  readAttributes(attributes) {

    [...attributes].forEach(attr => {
      const name = attr.name.replace(/-([a-z])/g, (char) => { return char[1].toUpperCase() });
      if (name.startsWith('[(') && name.endsWith(')]')) {
        this.initInputBinding({ name: name.slice(2, -2), value: attr.value });
        this.initOutputBinding({ name: name.slice(2, -2), value: attr.value });
      } else if (name.startsWith('((') && name.endsWith('))')) {
        this.initEventListener({ name: name.slice(2, -2), value: attr.value });
      } else if (name.startsWith('[') && name.endsWith(']')) {
        this.initInputBinding({ name: name.slice(1, -1), value: attr.value });
      } else if (name.startsWith('(') && name.endsWith(')')) {
        this.initOutputBinding({ name: name.slice(1, -1), value: attr.value });
      } else if (name.startsWith('bind:')) {
        this.initInputBinding({ name: name.slice(5), value: attr.value });
      } else if (name.startsWith('on:')) {
        this.initOutputBinding({ name: name.slice(3), value: attr.value });
      } else if (name.startsWith('bindon:')) {
        this.initInputBinding({ name: name.slice(7), value: attr.value });
        this.initOutputBinding({ name: name.slice(7), value: attr.value });
      } else {
        this.private.unbindAttributes[attr.name] = ftui.isNumeric(attr.value) ? Number(attr.value) : attr.value;
      }
    });
  }

  parseInputBinding(attrText) {
    let index = 0;
    let sourceIndex = 0;
    let isFilter = false;
    let device = '';
    let reading = '';
    let source = '';
    let filter = '';
    let currentValue = '';

    while (index < attrText.length) {
      const c = attrText[index];
      index++;

      if (isFilter) {
        filter += c;
        continue;
      }

      if (c === '|') {
        isFilter = true;
      }

      if (c === ':' || c === '|' || index === attrText.length) {
        index === attrText.length ? currentValue += c : null;
        sourceIndex++;
        switch (sourceIndex) {
          case 1:
            {
              device = currentValue.trim();
              break;
            }
          case 2:
            {
              reading = currentValue.trim();
              break;
            }
          case 3:
            {
              source = currentValue.trim();
              break;
            }
        }
        currentValue = '';
        continue;
      }
      currentValue += c;

    }
    filter = filter.trim();
    reading = reading.length > 0 ? reading : 'STATE';

    return {
      readingID: ftui.getReadingID(device, reading),
      source: source || 'value',
      filter
    }
  }

  parseOutputBinding(attrText) {
    const attrTextItems = attrText.split('|');
    const lastItem = attrTextItems.pop().trim();
    const [, cmd = 'set', device, reading = 'STATE', value = '$value'] =
      /^(?:(set|setreading)\s)?((?:[^-:\s])*)(?:[-:\s]((?:(?!\$value)[^\s])*))?(?:\s(.*)?)?$/
        .exec(lastItem);

    return {
      cmd,
      readingID: ftui.getReadingID(device, reading),
      value,
      filter: attrTextItems.join('|')
    }
  }

  filterText(text, filter = '') {
    if (filter !== '') {
      const part = value => input => ftui.getPart(input, value);
      const round = value => input => ftui.round(input, value);
      const toDate = value => input => ftui.dateFromString(input, value);
      const toBool = () => input => (['on', 'On', 'ON', '1', 'true', 'TRUE'].includes(input));
      const format = value => input => ftui.dateFormat(input, value);
      const toInt = value => input => parseInt(input, value);
      const add = value => input => input + value;
      const multiply = value => input => input * value;
      const map = value => input => ftui.getMatchingValue(parseHocon(value, true), input);

      const pipe = (f1, ...fns) => (...args) => {
        return fns.reduce((res, fn) => fn(res), f1.apply(null, args));
      };
      try {
        const pipeNotInQuotes = /\|(?=([^']*'[^']*')*[^']*$)/g;
        filter = filter.replace(pipeNotInQuotes, ',').replace('^', '"').replace('$', '"');
        const fn = eval('pipe(' + filter + ')');
        return fn(text);
      } catch (e) {
        this.element.classList.add('has-error');
        ftui.error(e.toString());
      }

    } else {
      return text;
    }
  }

  evalInContext(command) {
    eval(command);
  }
}
