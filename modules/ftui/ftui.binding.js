import { parseHocon } from '../hocon/hocon.min.js';
import { ftui } from './ftui.module.js';


export class FtuiBinding {

  constructor(element) {

    this.private = {
      unbindAttributes: {},
      config: '',
      outputAttributes: new Set()
    }

    this.element = element;
    this.readAttributes(element.attributes);

    try {
      this.config = parseHocon(this.private.config);
    } catch (e) {
      this.element.classList.add('has-error');
      ftui.error(1, e.toString());
    }

    if (this.config?.input?.readings) {
      // subscribe events from all readings from this.config.input
      Object.keys(this.config.input.readings).forEach((reading) => {
        ftui.getReadingEvents(reading).subscribe((param) => this.onReadingEvent(param));
      });
    }
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
      .forEach(([attribute, attributeAssingment]) => {
        const value = readingData[attributeAssingment.source];
        const filteredValue = this.filterText(value, attributeAssingment.filter);
        if (ftui.isDefined(filteredValue)) {
          if (this.element[attribute] !== filteredValue) {
            ftui.log(3, `${this.element.id}  -  onReadingEvent: set this.${attribute}=${filteredValue}`);
            this.element[attribute] = filteredValue;
          }
        }
      });
  }

  /**
 * Stores the attribute value for each defined target reading
 * and sends it to FHEM
 */
  handleAttributeChanged(attributeName) {
    const targetReadings = this.config?.output?.attributes[attributeName]?.readings || [];
    Object.entries(targetReadings).forEach(([readingId, options]) => {
      const value = options.value === '$value' ? this.element[attributeName] : options.value;
      const [parameterId, deviceName, readingName] = ftui.parseReadingId(readingId);
      const cmdline = [options.cmd, deviceName, readingName, value].join(' ');
      // update storage
      ftui.updateReadingValue(parameterId, value);
      // notify FHEM
      this.element.sendCommand(cmdline);
    });
  }

  initInputBinding(attribute) {

    /* 
    in 
    
    "dummy1" 
    "dummy1:state:value" 
     "dummy1:state:value | map(on:1,off:0)" 
     */

    const semicolonNotInQuotes = /;(?=(?:[^']*'[^']*')*[^']*$)/;

    attribute.value.split(semicolonNotInQuotes).forEach((attrValue, idx) => {
      const { readingID, source, filter } = this.parseInputBinding(attrValue);

      this.private.config += `input.readings.${readingID}.attributes.${attribute.name}.source = "${source}"\n`;
      this.private.config += `input.readings.${readingID}.attributes.${attribute.name}.filter = "${filter}"\n`;
    });

    /* out
    
    input.readings.GartenTemp.attributes.text.source=value
    input.readings.GartenTemp.attributes.text.filter={10:low,30:high}

    */
  }


  initOutputBinding(attribute) {

    /* 
    in    (value)="dummy1 [on,off]"

    out   output.attributes.value.values=[on,off]
          output.attributes.value.readings.dummy1.cmd="set"
    */
    const { cmd, readingID, value } = this.parseOutputBinding(attribute.value);

    this.private.config += `output.attributes.${attribute.name}.readings.${readingID}.cmd = "${cmd}"\n`;
    this.private.config += `output.attributes.${attribute.name}.readings.${readingID}.value = "${value}"\n`;

    this.private.outputAttributes.add(attribute.name);
  }

  readAttributes(attributes) {

    [...attributes].forEach(attr => {
      if (attr.name.startsWith('[(') && attr.name.endsWith(')]')) {
        this.initInputBinding({ name: attr.name.slice(2, -2), value: attr.value });
        this.initOutputBinding({ name: attr.name.slice(2, -2), value: attr.value });
      } else if (attr.name.startsWith('[') && attr.name.endsWith(']')) {
        this.initInputBinding({ name: attr.name.slice(1, -1), value: attr.value });
      } else if (attr.name.startsWith('(') && attr.name.endsWith(')')) {
        this.initOutputBinding({ name: attr.name.slice(1, -1), value: attr.value });
      } else if (attr.name.startsWith('bind:')) {
        this.initInputBinding({ name: attr.name.slice(5), value: attr.value });
      } else if (attr.name.startsWith('on:')) {
        this.initOutputBinding({ name: attr.name.slice(3), value: attr.value });
      } else if (attr.name.startsWith('bindon:')) {
        this.initInputBinding({ name: attr.name.slice(7), value: attr.value });
        this.initOutputBinding({ name: attr.name.slice(7), value: attr.value });
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

    const [, cmd = 'set', device, reading = 'STATE', value = '$value'] =
      /^(?:(set|setreading)\s)?((?:[^-:\s])*)(?:[-:\s]((?:(?!\$value)[^\s])*))?(?:\s(.*)?)?$/
        .exec(attrText);

    return {
      cmd,
      readingID: ftui.getReadingID(device, reading),
      value
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
        filter = filter.replace(pipeNotInQuotes, ',').replace('^','"').replace('$','"');
        const fn = eval('pipe(' + filter + ')');
        return fn(text);
      } catch (e) {
        this.element.classList.add('has-error');
        ftui.error(1, e.toString());
      }

    } else {
      return text;
    }
  }
}
