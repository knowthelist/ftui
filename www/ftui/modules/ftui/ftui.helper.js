export function getPart(value, part) {
  if (this.isDefined(part)) {
    if (this.isNumeric(part)) {
      const tokens = (this.isDefined(value)) ? value.toString().split(' ') : [];
      if (tokens.length >= part && part > 0) {
        return tokens[part - 1];
      }
    } else {
      if (this.isDefined(value)) {
        const matches = value.match(new RegExp('^' + part + '$'));
        if (matches) {
          return matches.slice(1).join('');
        }
      }
    }
  }
  return value;
}

export function filter(list, value) {
  return list.filter(item => isMatching(item, value)).length > 0
    ? value : null;
}

export function isEqual(pattern, value) {
  return value === pattern ||
    parseFloat(value) === parseFloat(pattern) ||
    String(value).match('^' + pattern + '$');
}

export function isEqualOrGreater(pattern, value) {
  return parseFloat(value) >= parseFloat(pattern);
}

export function isMatching(pattern, value) {
  return value === pattern ||
    String(value).match('^' + pattern + '$');
}

export function getMatchingValue(map, searchKey) {
  const key = this.getMatchingKey(map, searchKey);
  return this.isDefined(map[key]) ? map[key] : searchKey;
}

export function getMatchingKey(map, searchKey) {
  if (this.isDefined(map)) {
    const filteredKeys = this.getMatchingKeys(map, searchKey).sort((a, b) => {
      if (a === '.*') return -1;
      else if (b === '.*') return 1;
      else if (isNaN(a) || isNaN(b)) return isNaN(a) ? 1 : -1;
      else return a - b;
    });

    return filteredKeys[filteredKeys.length - 1];
  }

  return null;
}

export function getMatchingKeys(map, searchKey) {
  if (this.isDefined(map)) {
    return Object.keys(map)
      .filter(key => this.isMatching(key, searchKey))
      .map(key => key);
  } else {
    return null;
  }
}

export function getStepValue(steps, input) {
  const key = this.getStepKey(steps, input);
  return this.isDefined(steps[key]) ? steps[key] : input;
}

export function getStepKey(map, searchKey) {
  if (this.isDefined(map)) {
    const filteredKeys =
      this.getFilteredStepKeys(map, searchKey)
        .sort((a, b) => {
          return a - b;
        });
    // take last item of matching keys
    return filteredKeys.slice(-1)[0];
  } else {
    return null;
  }
}


export function getFilteredStepKeys(map, searchKey) {
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
  if (isHTMLElement(context)) {
    return context.querySelectorAll(selector);
  } else {
    return null;
  }
  
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

export function isHTMLElement(obj) {
  return obj && (obj.nodeType === 1 || obj.nodeType === 9);
}

export function createElement(type, classes) {
  const el = document.createElement(type);
  if (classes) {
    el.classList.add(classes);
  }
  return el;
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

export function isAppVisible() {
  return document.visibilityState === 'visible';
}

export function isVisible(element) {
  const pop_parent = element.closest('ftui-popup');
  if (pop_parent){
    return (pop_parent.offsetParent !== null);
  } else {
    return (element.offsetParent !== null);
  }
  
}

export function isDefined(value) {
  return !isUndefined(value);
}

export function isUndefined(value) {
  return typeof value === 'undefined'
    || value === null;
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
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}


/**
 * Capitalize the first letter of a string
 *
 * @param {string} s - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(s) {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// date functions

export function dateFromString(str) {
  const regex1 = /(\d+)-(\d+)-(\d+)[_\s](\d+):(\d+):(\d+).*/;
  const regex2 = /^(\d+)$/;
  const regex3 = /(\d\d).(\d\d).(\d\d\d\d)/;
  const regex4 = /(\d\d\d\d)-(\d\d)-(\d\d)/;
  const offset = new Date().getTimezoneOffset();

  let date = new Date();

  if (regex1.test(str)) {
    const [, year, month, day, hours, minutes, seconds] = regex1.exec(str);
    date = new Date(+year, +month - 1, +day, +hours, +minutes, +seconds);
  } else if (regex2.test(str)) {
    const [, milliseconds] = regex2.exec(str);
    date = new Date(70, 0, 1, 0, 0, milliseconds, 0);
  } else if (regex3.test(str)) {
    const [, day, month, year] = regex3.exec(str);
    date = new Date(+year, +month - 1, +day, 0, -offset, 0, 0);
  } else if (regex4.test(str)) {
    const [, year, month, day] = regex4.exec(str);
    date = new Date(+year, +month - 1, +day, 0, -offset, 0, 0);
  }

  return date;
}

export function dateFormat(date, format) {
  const userLang = navigator.language || navigator.userLanguage;
  const lang = window.ftuiApp ? ftuiApp.config.lang : isDefined(userLang) ? userLang.split('-')[0] : 'de';
  let ret = String(format);
  if (!date) { return ret; }
  const weekday_de = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months_de = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const months = ['January', 'February', 'March;', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const YYYY = date.getFullYear().toString();
  const YY = date.getFullYear().toString().substring(2, 4);
  const month = date.getMonth();
  const MM = (month + 1).toString(); // getMonth() is zero-based
  const MMMM = (lang === 'de') ? months_de[month] : months[month];
  const dd = date.getDate().toString();
  const hh = date.getHours().toString();
  const mm = date.getMinutes().toString();
  const ss = date.getSeconds().toString();
  const zzz = date.getMilliseconds().toString();
  const zz = zzz.substring(0, 2);
  const z = zzz.substring(0, 1);
  const d = date.getDay();
  const eeee = (lang === 'de') ? weekday_de[d] : weekday[d];
  const eee = eeee.substring(0, 3);
  const ee = eeee.substring(0, 2);
  ret = ret.replace('DD', (dd > 9) ? dd : '0' + dd);
  ret = ret.replace('D', dd);
  ret = ret.replace('MMMM', MMMM);
  ret = ret.replace(/MM/g, (MM > 9) ? MM : '0' + MM);
  ret = ret.replace(/M[^aäs]/g, MM);
  ret = ret.replace('YYYY', YYYY);
  ret = ret.replace('YY', YY);
  ret = ret.replace('hh', (hh > 9) ? hh : '0' + hh);
  ret = ret.replace('mm', (mm > 9) ? mm : '0' + mm);
  ret = ret.replace('ss', (ss > 9) ? ss : '0' + ss);
  ret = ret.replace(/[\shmsz]h/g, hh);
  ret = ret.replace(/m[^b]/g, mm);
  ret = ret.replace(/[^u]s/g, ss);
  ret = ret.replace('zzz', zzz);
  ret = ret.replace('zz', zz);
  ret = ret.replace('/z[^e]/g', z);
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

export function timeFormat(ms, format, inputMode = 'ms', formatMode = 'lower') {
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

export function dateAgo(date) {
  const now = new Date();
  const ms = (now - date);

  return ms;
}

export function dateTill(date) {
  const now = new Date();
  const ms = (date - now);

  return ms;
}

export function durationHumanized(ms) {
  let x = ms / 1000
  const userLang = navigator.language || navigator.userLanguage;
  const lang = window.ftuiApp ? ftuiApp.config.lang : isDefined(userLang) ? userLang.split('-')[0] : 'de';
  const plural = (lang === 'de') ? 'n' : 's';
  const pluralDay = (lang === 'de') ? 'e' : 's';
  const seconds = ~~(x);
  if (seconds < 60) {
    return seconds + ' ' + (lang === 'de' ? 'Sekunde' : 'second') + (seconds > 1 ? plural : '');
  }
  x /= 60;
  const minutes = ~~(x);
  if (minutes < 60) {
    return minutes + ' ' + (lang === 'de' ? 'Minute' : 'minute') + (minutes > 1 ? plural : '');
  }
  x /= 60;
  const hours = ~~(x);
  if (hours < 24) {
    return hours + ' ' + (lang === 'de' ? 'Stunde' : 'hour') + (hours > 1 ? plural : '');
  }
  x /= 24;
  const days = ~~(x);
  return days + ' ' + (lang === 'de' ? 'Tag' : 'day') + (days > 1 ? pluralDay : '');
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

export function formatMoney(amount) {
  if (amount > 99.99) {
    return Math.round(amount);
  } else if (amount > 9.99) {
    return amount.toFixed(1);
  } else {
    return amount.toFixed(2);
  }
}

export function scale(value, minIn, maxIn, minOut, maxOut) {
  const slope = (minOut - maxOut) / (minIn - maxIn);
  const intercept = slope * -(minIn) + minOut;
  return value * slope + intercept;
}

export function limit(value, minIn, maxIn) {
  return value < minIn ? minIn
    : value > maxIn ? maxIn : value;
}

export function countDecimals(value) {
  const val = value.toString().split('.')[1] || '';
  return val.length || 0;
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
    timeout,
  ])
}

export function supportsPassive() {
  let supportsPassive = false;
  const opts = {
    get passive() {
      supportsPassive = true;
    }
  };

  try {
    window.addEventListener("testPassive", null, opts);
    window.removeEventListener("testPassive", null, opts);
  } catch (e) {}

  return supportsPassive;
}

// Classes

export class Stack {
  constructor() {
    this.items = [];
  }
  push(element) {
    this.items.push(element);
  }
  pop() {
    return this.items.pop();
  }
  peek() {
    return this.items[this.items.length - 1];
  }
  isEmpty() {
    return this.items.length === 0;
  }
  clear() {
    this.items.length = 0;
  }
  size() {
    return this.items.length;
  }
}

export class Subject {
  constructor() {
    this.observers = [];
  }

  isSubscribed(observer) {
    return this.observers.filter(subscriber => subscriber.observer === observer).length;
  }

  subscribe(observer) {
    if (this.isSubscribed(observer)) return;
    this.observers.push({ observer: observer });
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter(subscriber => subscriber.observer !== observer);
  }

  publish(args) {
    this.observers.forEach(subscriber => subscriber.observer(args));
  }
}
