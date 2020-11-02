import { parseHocon } from '../hocon/hocon.min.js';
import * as ftuiHelper from './ftui.helper.js';
import { fhemService } from './fhem.service.js';


export class FtuiBinding {

  constructor(element) {

    this.private = {
      config: '',
      outputAttributes: new Set(),
      observer: null,
      isChanging: {}
    }

    this.element = element;
    this.config = {
      input: { readings: {} },
      output: { attributes: {} }
    };
    this.readAttributes(element.attributes);

    // subscribe input events (from FHEM reading to component)
    Object.keys(this.config.input.readings).forEach((reading) => {
      fhemService.getReadingEvents(reading).subscribe((param) => this.onReadingEvent(param));
    });

    // subscribe output events (from component to FHEM reading)
    if (this.private.outputAttributes.size > 0) {
      this.private.observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type == 'attributes') {
            const attributeName = mutation.attributeName;
            const attributeValue = mutation.target[attributeName] || mutation.target.getAttribute(attributeName);
            if (!this.private.isChanging[attributeName]) {
              this.handleAttributeChanged(attributeName, attributeValue);
            }
            this.private.isChanging[attributeName] = false;
          }
        });
      });
      this.private.observer.observe(this.element, {
        attributeFilter: this.outputAttributes,
      });
    }
  }

  get outputAttributes() {
    return [...this.private.outputAttributes];
  }

  // received events from FHEM
  onReadingEvent(readingData) {
    const readingAttributeMap = this.config.input.readings[readingData.id].attributes;
    Object.entries(readingAttributeMap)
      .forEach(([attribute, options]) => {
        const value = readingData[options.property];
        if (ftuiHelper.isDefined(value)) {
          const filteredValue = this.filter(value, options.filter);
          if (ftuiHelper.isDefined(filteredValue)) {
            if (String(this.element[attribute]) !== String(filteredValue)) {
              ftuiHelper.log(1, `${this.element.id}  -  onReadingEvent: set this.${attribute}=${filteredValue}`);
              // avoid endless loops
              this.private.isChanging[attribute] = true;
              // change element's property
              this.element[attribute] = filteredValue;
            }
          }
        }
      });
  }

  /**
 * Stores the attribute value for each defined target reading
 * and sends it to FHEM
 */
  handleAttributeChanged(attributeName, attributeValue) {
    const targetReadings = this.config?.output?.attributes[attributeName]?.readings || [];
    Object.entries(targetReadings).forEach(([readingId, options]) => {

      //const attributeValue = this.element[attributeName];
      const filteredValue = this.filter(attributeValue, options.filter);
      const value = String(options.value).replaceAll('$value', filteredValue);
      const [parameterId, deviceName, readingName] = ftuiHelper.parseReadingId(readingId);
      const cmdLine = [options.cmd, deviceName, readingName, value].join(' ');

      // update storage
      fhemService.updateReadingValue(parameterId, value);
      // notify FHEM
      if (this.element.debounce) {
        fhemService.debouncedUpdateFhem(this.element.debounce, cmdLine);
      } else {
        fhemService.updateFhem(cmdLine);
      }
    });
  }

  initInputBinding(attribute) {
    const semicolonNotInQuotes = /;(?=(?:[^']*'[^']*')*[^']*$)/;

    attribute.value.split(semicolonNotInQuotes).forEach((attrValue, idx) => {
      const { readingID, property, filter } = this.parseInputBinding(attrValue);

      if (!this.config.input.readings[readingID]) {
        this.config.input.readings[readingID] = { attributes: {} };
      }
      const readingConfig = this.config.input.readings[readingID];
      readingConfig.attributes[attribute.name] = { property, filter };
    });
  }


  initOutputBinding(attribute) {
    const { cmd, readingID, value, filter } = this.parseOutputBinding(attribute.value);

    if (!this.config.output.attributes[attribute.name]) {
      this.config.output.attributes[attribute.name] = { readings: {} };
    }
    const attributeConfig = this.config.output.attributes[attribute.name];
    attributeConfig.readings[readingID] = { cmd, value, filter }

    this.private.outputAttributes.add(attribute.name);
  }

  initEventListener(attribute) {
    this.element.addEventListener(attribute.name,
      this.evalInContext.bind(this.element, attribute.value)
    );
  }

  readAttributes(attributes) {

    [...attributes].forEach(attr => {
      const name = ftuiHelper.toCamelCase(attr.name);
      if (name.startsWith('[(') && name.endsWith(')]')) {
        this.initInputBinding({ name: name.slice(2, -2), value: attr.value });
        this.initOutputBinding({ name: name.slice(2, -2), value: attr.value });
      } else if (name.startsWith('@')) {
        this.initEventListener({ name: name.slice(1), value: attr.value });
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
      }
    });
  }

  parseInputBinding(attrText) {
    let index = 0;
    let propertyIndex = 0;
    let isFilter = false;
    let device = '';
    let reading = '';
    let property = '';
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
        propertyIndex++;
        switch (propertyIndex) {
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
              property = currentValue.trim();
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
      readingID: ftuiHelper.getReadingID(device, reading),
      property: property || 'value',
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
      readingID: ftuiHelper.getReadingID(device, reading),
      value,
      filter: attrTextItems.join('|')
    }
  }

  filter(text, filter = '') {
    if (filter !== '') {
      const part = value => input => ftuiHelper.getPart(input, value);
      const toDate = value => input => ftuiHelper.dateFromString(input, value);
      const toBool = () => input => ftuiHelper.toBool(input);
      const toInt = () => input => parseInt(input, 10);
      const format = value => input => ftuiHelper.dateFormat(input, value);
      const round = value => input => ftuiHelper.round(input, value);
      const add = value => input => input + value;
      const multiply = value => input => input * value;
      const replace = (find, replace) => input => String(input).replace(find, replace);
      const map = value => input => ftuiHelper.getMatchingValue(parseHocon(value, true), input);

      const pipe = (f1, ...fns) => (...args) => {
        return fns.reduce((res, fn) => fn(res), f1.apply(null, args));
      };
      try {
        const pipeNotInQuotes = /\|(?=([^']*'[^']*')*[^']*$)/g;
        filter = filter.replace(pipeNotInQuotes, ',').replace(/`/g, '"').replace(/´/, '"');
        const fn = eval('pipe(' + filter + ')');
        return fn(text);
      } catch (e) {
        this.element.classList.add('has-error');
        ftuiHelper.error(e.toString());
      }

    } else {
      return text;
    }
  }

  evalInContext(command, $event) {
    eval(command);
  }
}
