export function getPart(value, part) {
  if (this.isDefined(part)) {
    if (this.isNumeric(part)) {
      const tokens = (this.isDefined(value)) ? value.toString().split(' ') : '';
      return (tokens.length >= part && part > 0) ? tokens[part - 1] : value;
    } else {
      let ret = '';
      if (this.isDefined(value)) {
        const matches = value.match(new RegExp('^' + part + '$'));
        if (matches) {
          for (let i = 1, len = matches.length; i < len; i++) {
            ret += matches[i];
          }
        }
      }
      return ret;
    }
  }
  return value;
}

export function isEqual(pattern, value) {
  return value === pattern ||
    parseFloat(value) === parseFloat(pattern) ||
    String(value).match('^' + pattern + '$');
}

export function isEqualOrGreater(pattern, value) {
  return value === pattern ||
    parseFloat(value) >= parseFloat(pattern) ||
    String(value).match('^' + pattern + '$');
}

export function getMatchingValue(map, searchKey) {
  const key = this.getMatchingKey(map, searchKey);
  return this.isDefined(map[key]) ? map[key] : searchKey;
}

export function getMatchingKey(map, searchKey) {
  if (this.isDefined(map)) {
    //console.log(map,searchKey)
    const filteredKeys =
      this.getMatchingKeys(map, searchKey)
        .sort((a, b) => {
          if (a === '.*') return -1;
          else if (b === '.*') return 1;
          else if (isNaN(a) && isNaN(b)) return a < b ? -1 : a == b ? 0 : 1;
          else if (isNaN(a)) return 1;
          else if (isNaN(b)) return -1;
          else return a - b;
        });
    // take last item of matching keys
    return filteredKeys.slice(-1)[0];
  } else {
    return null;
  }
}

export function getMatchingKeys(map, searchKey) {
  if (this.isDefined(map)) {
    return Object.keys(map)
      .filter(key => this.isEqualOrGreater(key, searchKey))
      .map(key => key);
  } else {
    return null;
  }
}

// DOM functions

export function appendStyleLink(file) {
  const newLink = document.createElement('link');
  newLink.href = file;
  newLink.setAttribute('rel', 'stylesheet');
  newLink.setAttribute('type', 'text/css');
  document.head.appendChild(newLink);
}

export function selectElements(selector, context) {
  return (document).querySelector(context).querySelectorAll(selector);
}

export function selectAll(selector) {
  return document.querySelectorAll(selector);
}

export function selectOne(selector) {
  return document.querySelector(selector);
}

export function getAllTagMatches(regEx) {
  return Array.prototype.slice.call(document.querySelectorAll('*')).filter((el) => {
    return el.tagName.match(regEx);
  });
}

export function log(level, ...args) {
  const debugLevel = window.ftui?.debuglevel || 1;
  if (debugLevel >= level) {
    // eslint-disable-next-line no-console
    console.log.apply(this, args);
  }
}

export function error(...args) {
  // eslint-disable-next-line no-console
  console.error.apply(this, args);
}

export function precision(a) {
  const s = a + '';
  const d = s.indexOf('.') + 1;

  return !d ? 0 : s.length - d;
}

// checker

export function isVisible(element) {
  return (element.offsetParent !== null);
}

export function isDefined(value) {
  return (typeof value !== 'undefined');
}
export function isUndefined(value) {
  return !isDefined(value);
}

export function isString(value) {
  return (typeof value === 'string' && !this.isNumeric(value));
}

export function isNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

export function toBool(value) {
  return ['on', 'On', 'ON', '1', true, 1, 'true', 'TRUE'].includes(value);
}

// converter

export function toCamelCase(string) {
  return string.replace(/-([a-z])/g, (char) => { return char[1].toUpperCase() });
}

export function toKebabCase(string) {
  return string
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

export function capitalize (s) {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// date functions

export function dateFromString(str) {
  const m = str.match(/(\d+)-(\d+)-(\d+)[_\s](\d+):(\d+):(\d+).*/);
  const m2 = str.match(/^(\d+)$/);
  const m3 = str.match(/(\d\d).(\d\d).(\d\d\d\d)/);
  const offset = new Date().getTimezoneOffset();

  return (m) ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])
    : (m2) ? new Date(70, 0, 1, 0, 0, m2[1], 0)
      : (m3) ? new Date(+m3[3], +m3[2] - 1, +m3[1], 0, -offset, 0, 0) : new Date();
}

export function dateFormat(date, format, lang = 'de') {
  const weekday_de = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const YYYY = date.getFullYear().toString();
  const YY = date.getYear().toString();
  const MM = (date.getMonth() + 1).toString(); // getMonth() is zero-based
  const dd = date.getDate().toString();
  const hh = date.getHours().toString();
  const mm = date.getMinutes().toString();
  const ss = date.getSeconds().toString();
  const d = date.getDay();
  const eeee = (lang === 'de') ? weekday_de[d] : weekday[d];
  const eee = eeee.substr(0, 3);
  const ee = eeee.substr(0, 2);
  let ret = format;
  ret = ret.replace('DD', (dd > 9) ? dd : '0' + dd);
  ret = ret.replace('D', dd);
  ret = ret.replace('MM', (MM > 9) ? MM : '0' + MM);
  ret = ret.replace('M', MM);
  ret = ret.replace('YYYY', YYYY);
  ret = ret.replace('YY', YY);
  ret = ret.replace('hh', (hh > 9) ? hh : '0' + hh);
  ret = ret.replace('mm', (mm > 9) ? mm : '0' + mm);
  ret = ret.replace('ss', (ss > 9) ? ss : '0' + ss);
  ret = ret.replace('h', hh);
  ret = ret.replace('m', mm);
  ret = ret.replace('s', ss);
  ret = ret.replace('eeee', eeee);
  ret = ret.replace('eee', eee);
  ret = ret.replace('ee', ee);

  return ret;
}

export function diffMinutes(date1, date2) {
  const diff = new Date(date2 - date1);
  return (diff / 1000 / 60).toFixed(0);
}

export function diffSeconds(date1, date2) {
  const diff = new Date(date2 - date1);
  return (diff / 1000).toFixed(1);
}

export function durationFromSeconds(time) {
  const hrs = Math.floor(time / 3600);
  const mins = Math.floor((time % 3600) / 60);
  const secs = time % 60;
  let ret = '';
  if (hrs > 0) {
    ret += '' + hrs + ':' + (mins < 10 ? '0' : '');
  }
  ret += '' + mins + ':' + (secs < 10 ? '0' : '');
  ret += '' + secs;
  return ret;
}

export function round(number, precision) {
  const shift = (number, precision, reverseShift) => {
    if (reverseShift) {
      precision = -precision;
    }
    const numArray = ('' + number).split('e');
    return +(numArray[0] + 'e' + (numArray[1] ? (+numArray[1] + precision) : precision));
  };
  return shift(Math.round(shift(number, precision, false)), precision, true);
}

export function debounce(callback, context = this) {
  let handle;
  return (delay, ...args) => {
    clearTimeout(handle);
    handle = setTimeout(callback.bind(context), delay, ...args);
  }
}

export function getReadingID(device, reading) {
  return (reading === 'STATE') ? device : [device, reading].join('-');
}

/**
 * Parses a given readingId and returns parameter id, device name and reading name
 * @param  {} readingId
 */
export function parseReadingId(readingId) {
  const [, device, reading] = /([^-:\s]*)[-:\s](.*)/.exec(readingId) || ['', readingId, ''];
  const paramid = (reading) ? [device, reading].join('-') : device;
  return [paramid, device, reading];
}

export function triggerEvent(eventName, source = document) {
  const event = new CustomEvent(eventName);
  source.dispatchEvent(event);
}

export function deferred() {
  const defer = {};
  const promise = new Promise((resolve, reject) => {
    defer.resolve = resolve;
    defer.reject = reject;
  });
  defer.promise = () => {
    return promise;
  };
  return defer;
}

export function getStylePropertyValue(property, element = document.body) {
  return getComputedStyle(element).getPropertyValue(property).trim();
}
