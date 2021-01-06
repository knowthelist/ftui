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

export function selectElements(selector, context = document) {
  return context.querySelectorAll(selector);
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
  const debugLevel = window.ftuiApp ? window.ftuiApp.config.debugLevel : 0;
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
  return !isUndefined(value);
}
export function isUndefined(value) {
  return typeof value === 'undefined' || value === null;
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

export function capitalize(s) {
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
  const month_de = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const YYYY = date.getFullYear().toString();
  const YY = date.getYear().toString();
  const MM = (date.getMonth() + 1).toString(); // getMonth() is zero-based
  const MMMM = (lang === 'de') ? month_de[MM] : month[MM];
  const dd = date.getDate().toString();
  const hh = date.getHours().toString();
  const mm = date.getMinutes().toString();
  const ss = date.getSeconds().toString();
  const d = date.getDay();
  const eeee = (lang === 'de') ? weekday_de[d] : weekday[d];
  const eee = eeee.substr(0, 3);
  const ee = eeee.substr(0, 2);
  let ret = String(format);
  ret = ret.replace('DD', (dd > 9) ? dd : '0' + dd);
  ret = ret.replace('D', dd);
  ret = ret.replace('MMMM', MMMM);
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
  const hrs = ~~(time / 3600);
  const mins = ~~((time % 3600) / 60);
  const secs = time % 60;
  let ret = '';
  if (hrs > 0) {
    ret += '' + hrs + ':' + (mins < 10 ? '0' : '');
  }
  ret += '' + mins + ':' + (secs < 10 ? '0' : '');
  ret += '' + secs;
  return ret;
}

export function timeFormat(ms, format, inputMode='ms', formatMode='lower') {
  // inputMode: 'ms' or 's'
  let x = ms
  if (inputMode === 'ms') { x /= 1000; }

  const totalSeconds = ~~(x);
  const seconds = ~~(x % 60);
  x /= 60;
  const totalMinutes = ~~(x);
  const minutes = ~~(x % 60);
  x /= 60;
  const totalHours = ~~(x);
  const hours = ~~(x % 24);
  x /= 24;
  const totalDays = ~~(x);

  // formatMode: 'lower' or 'upper'
  let ret = String(format);
  if (formatMode === 'lower') {
    ret = ret.replace(/(^|[^a-z])(ssssssss)([^a-z]|$)/g, '$1%SSSSSSSS$3');
    ret = ret.replace(/(^|[^a-z])(mmmmmm)([^a-z]|$)/g, '$1%MMMMMM$3');
    ret = ret.replace(/(^|[^a-z])(hhhh)([^a-z]|$)/g, '$1%HHHH$3');
    ret = ret.replace(/(^|[^a-z])(dd)([^a-z]|$)/g, '$1%DD$3');
    ret = ret.replace(/(^|[^a-z])(hh)([^a-z]|$)/g, '$1%HH$3');
    ret = ret.replace(/(^|[^a-z])(mm)([^a-z]|$)/g, '$1%MM$3');
    ret = ret.replace(/(^|[^a-z])(ss)([^a-z]|$)/g, '$1%SS$3');
    ret = ret.replace(/(^|[^a-z])(h)([^a-z]|$)/g, '$1%H$3');
    ret = ret.replace(/(^|[^a-z])(m)([^a-z]|$)/g, '$1%M$3');
    ret = ret.replace(/(^|[^a-z])(s)([^a-z]|$)/g, '$1%S$3');
  }
  ret = ret.replace(/%SSSSSSSS/g, totalSeconds);
  ret = ret.replace(/%MMMMMM/g, totalMinutes);
  ret = ret.replace(/%HHHH/g, totalHours);
  ret = ret.replace(/%DD/g, totalDays);
  ret = ret.replace(/%HH/g, (hours > 9) ? hours : '0' + hours);
  ret = ret.replace(/%MM/g, (minutes > 9) ? minutes : '0' + minutes);
  ret = ret.replace(/%SS/g, (seconds > 9) ? seconds : '0' + seconds);
  ret = ret.replace(/%H/g, hours);
  ret = ret.replace(/%M/g, minutes);
  ret = ret.replace(/%S/g, seconds);

  return ret;
}

export function dateAgo (date) {
  const now = new Date();
  const ms = (now - date);

  return ms;
}

export function dateTill (date) {
  const now = new Date();
  const ms = (date - now);

  return ms;
}

// Math functions

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

export function scale(value, minIn, maxIn, minOut, maxOut) {
  const slope = (minOut - maxOut) / (minIn - maxIn);
  const intercept = slope * -(minIn) + minOut;
  return value * slope + intercept;
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

export function getStylePropertyValue(property, element = document.body) {
  return getComputedStyle(element).getPropertyValue(property).trim();
}

export function timeoutPromise(promises, ms = 5000) {

  // Create a promise that rejects in <ms> milliseconds
  const timeout = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject('Timed out in ' + ms + 'ms.')
    }, ms)
  })

  // Returns a race between our timeout and the passed in promise
  return Promise.race([
    Promise.all(promises),
    timeout
  ])
}
