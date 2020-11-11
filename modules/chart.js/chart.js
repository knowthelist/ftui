/*!
 * Chart.js v3.0.0-beta
 * https://www.chartjs.org
 * (c) 2020 Chart.js Contributors
 * Released under the MIT License
 */
const Chart = (function () {
  function _defineProperties(target, props) {
    for (let i = 0; i < props.length; i++) {
      const descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ('value' in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _extends() {
    _extends = Object.assign || function (target) {
      for (let i = 1; i < arguments.length; i++) {
        const source = arguments[i];

        for (const key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }

  function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {};
    const target = {};
    const sourceKeys = Object.keys(source);
    let key, i;

    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }

    return target;
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError('this hasn\'t been initialised - super() hasn\'t been called');
    }

    return self;
  }

  function fontString(pixelSize, fontStyle, fontFamily) {
    return fontStyle + ' ' + pixelSize + 'px ' + fontFamily;
  }
  const requestAnimFrame = function () {
    if (typeof window === 'undefined') {
      return function (callback) {
        return callback();
      };
    }
    return window.requestAnimationFrame;
  }();
  function throttled(fn, thisArg, updateFn) {
    const updateArgs = updateFn || function (args) {
      return Array.prototype.slice.call(args);
    };
    let ticking = false;
    let args = [];
    return function () {
      for (var _len = arguments.length, rest = new Array(_len), _key = 0; _key < _len; _key++) {
        rest[_key] = arguments[_key];
      }
      args = updateArgs(rest);
      if (!ticking) {
        ticking = true;
        requestAnimFrame.call(window, function () {
          ticking = false;
          fn.apply(thisArg, args);
        });
      }
    };
  }

  function drawFPS(chart, count, date, lastDate) {
    const fps = 1000 / (date - lastDate) | 0;
    const ctx = chart.ctx;
    ctx.save();
    ctx.clearRect(0, 0, 50, 24);
    ctx.fillStyle = 'black';
    ctx.textAlign = 'right';
    if (count) {
      ctx.fillText(count, 50, 8);
      ctx.fillText(fps + ' fps', 50, 18);
    }
    ctx.restore();
  }
  const Animator = function () {
    function Animator() {
      this._request = null;
      this._charts = new Map();
      this._running = false;
      this._lastDate = undefined;
    }
    const _proto = Animator.prototype;
    _proto._notify = function _notify(chart, anims, date, type) {
      const callbacks = anims.listeners[type] || [];
      const numSteps = anims.duration;
      callbacks.forEach(function (fn) {
        return fn({
          chart: chart,
          numSteps: numSteps,
          currentStep: Math.min(date - anims.start, numSteps)
        });
      });
    }
    ;
    _proto._refresh = function _refresh() {
      const me = this;
      if (me._request) {
        return;
      }
      me._running = true;
      me._request = requestAnimFrame.call(window, function () {
        me._update();
        me._request = null;
        if (me._running) {
          me._refresh();
        }
      });
    }
    ;
    _proto._update = function _update() {
      const me = this;
      const date = Date.now();
      let remaining = 0;
      me._charts.forEach(function (anims, chart) {
        if (!anims.running || !anims.items.length) {
          return;
        }
        const items = anims.items;
        let i = items.length - 1;
        let draw = false;
        let item;
        for (; i >= 0; --i) {
          item = items[i];
          if (item._active) {
            item.tick(date);
            draw = true;
          } else {
            items[i] = items[items.length - 1];
            items.pop();
          }
        }
        if (draw) {
          chart.draw();
          me._notify(chart, anims, date, 'progress');
        }
        if (chart.options.animation.debug) {
          drawFPS(chart, items.length, date, me._lastDate);
        }
        if (!items.length) {
          anims.running = false;
          me._notify(chart, anims, date, 'complete');
        }
        remaining += items.length;
      });
      me._lastDate = date;
      if (remaining === 0) {
        me._running = false;
      }
    }
    ;
    _proto._getAnims = function _getAnims(chart) {
      const charts = this._charts;
      let anims = charts.get(chart);
      if (!anims) {
        anims = {
          running: false,
          items: [],
          listeners: {
            complete: [],
            progress: []
          }
        };
        charts.set(chart, anims);
      }
      return anims;
    }
    ;
    _proto.listen = function listen(chart, event, cb) {
      this._getAnims(chart).listeners[event].push(cb);
    }
    ;
    _proto.add = function add(chart, items) {
      let _this$_getAnims$items;
      if (!items || !items.length) {
        return;
      }
      (_this$_getAnims$items = this._getAnims(chart).items).push.apply(_this$_getAnims$items, items);
    }
    ;
    _proto.has = function has(chart) {
      return this._getAnims(chart).items.length > 0;
    }
    ;
    _proto.start = function start(chart) {
      const anims = this._charts.get(chart);
      if (!anims) {
        return;
      }
      anims.running = true;
      anims.start = Date.now();
      anims.duration = anims.items.reduce(function (acc, cur) {
        return Math.max(acc, cur._duration);
      }, 0);
      this._refresh();
    };
    _proto.running = function running(chart) {
      if (!this._running) {
        return false;
      }
      const anims = this._charts.get(chart);
      if (!anims || !anims.running || !anims.items.length) {
        return false;
      }
      return true;
    }
    ;
    _proto.stop = function stop(chart) {
      const anims = this._charts.get(chart);
      if (!anims || !anims.items.length) {
        return;
      }
      const items = anims.items;
      let i = items.length - 1;
      for (; i >= 0; --i) {
        items[i].cancel();
      }
      anims.items = [];
      this._notify(chart, anims, Date.now(), 'complete');
    }
    ;
    _proto.remove = function remove(chart) {
      return this._charts.delete(chart);
    };
    return Animator;
  }();
  const animator = new Animator();

  function noop() {}
  const uid = function () {
    let id = 0;
    return function () {
      return id++;
    };
  }();
  function isNullOrUndef(value) {
    return value === null || typeof value === 'undefined';
  }
  function isArray(value) {
    if (Array.isArray && Array.isArray(value)) {
      return true;
    }
    const type = Object.prototype.toString.call(value);
    if (type.substr(0, 7) === '[object' && type.substr(-6) === 'Array]') {
      return true;
    }
    return false;
  }
  function isObject(value) {
    return value !== null && Object.prototype.toString.call(value) === '[object Object]';
  }
  const isNumberFinite = function isNumberFinite(value) {
    return (typeof value === 'number' || value instanceof Number) && isFinite(+value);
  };
  function valueOrDefault(value, defaultValue) {
    return typeof value === 'undefined' ? defaultValue : value;
  }
  function callback(fn, args, thisArg) {
    if (fn && typeof fn.call === 'function') {
      return fn.apply(thisArg, args);
    }
  }
  function each(loopable, fn, thisArg, reverse) {
    let i, len, keys;
    if (isArray(loopable)) {
      len = loopable.length;
      if (reverse) {
        for (i = len - 1; i >= 0; i--) {
          fn.call(thisArg, loopable[i], i);
        }
      } else {
        for (i = 0; i < len; i++) {
          fn.call(thisArg, loopable[i], i);
        }
      }
    } else if (isObject(loopable)) {
      keys = Object.keys(loopable);
      len = keys.length;
      for (i = 0; i < len; i++) {
        fn.call(thisArg, loopable[keys[i]], keys[i]);
      }
    }
  }
  function _elementsEqual(a0, a1) {
    let i, ilen, v0, v1;
    if (!a0 || !a1 || a0.length !== a1.length) {
      return false;
    }
    for (i = 0, ilen = a0.length; i < ilen; ++i) {
      v0 = a0[i];
      v1 = a1[i];
      if (v0.datasetIndex !== v1.datasetIndex || v0.index !== v1.index) {
        return false;
      }
    }
    return true;
  }
  function clone(source) {
    if (isArray(source)) {
      return source.map(clone);
    }
    if (isObject(source)) {
      const target = Object.create(null);
      const keys = Object.keys(source);
      const klen = keys.length;
      let k = 0;
      for (; k < klen; ++k) {
        target[keys[k]] = clone(source[keys[k]]);
      }
      return target;
    }
    return source;
  }
  function isValidKey(key) {
    return ['__proto__', 'prototype', 'constructor'].indexOf(key) === -1;
  }
  function _merger(key, target, source, options) {
    if (!isValidKey(key)) {
      return;
    }
    const tval = target[key];
    const sval = source[key];
    if (isObject(tval) && isObject(sval)) {
      merge(tval, sval, options);
    } else {
      target[key] = clone(sval);
    }
  }
  function merge(target, source, options) {
    const sources = isArray(source) ? source : [source];
    const ilen = sources.length;
    if (!isObject(target)) {
      return target;
    }
    options = options || {};
    const merger = options.merger || _merger;
    for (let i = 0; i < ilen; ++i) {
      source = sources[i];
      if (!isObject(source)) {
        continue;
      }
      const keys = Object.keys(source);
      for (let k = 0, klen = keys.length; k < klen; ++k) {
        merger(keys[k], target, source, options);
      }
    }
    return target;
  }
  function mergeIf(target, source) {
    return merge(target, source, {
      merger: _mergerIf
    });
  }
  function _mergerIf(key, target, source) {
    if (!isValidKey(key)) {
      return;
    }
    const tval = target[key];
    const sval = source[key];
    if (isObject(tval) && isObject(sval)) {
      mergeIf(tval, sval);
    } else if (!Object.prototype.hasOwnProperty.call(target, key)) {
      target[key] = clone(sval);
    }
  }
  function _deprecated(scope, value, previous, current) {
    if (value !== undefined) {
      console.warn(scope + ': "' + previous + '" is deprecated. Please use "' + current + '" instead');
    }
  }
  function resolveObjectKey(obj, key) {
    if (key.length < 3) {
      return obj[key];
    }
    const keys = key.split('.');
    for (let i = 0, n = keys.length; i < n; ++i) {
      const k = keys[i];
      if (k in obj) {
        obj = obj[k];
      } else {
        return;
      }
    }
    return obj;
  }
  function _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function getScope(node, key) {
    if (!key) {
      return node;
    }
    const keys = key.split('.');
    for (let i = 0, n = keys.length; i < n; ++i) {
      const k = keys[i];
      node = node[k] || (node[k] = Object.create(null));
    }
    return node;
  }
  const Defaults = function () {
    function Defaults() {
      this.color = 'rgba(0,0,0,0.1)';
      this.elements = {};
      this.events = ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'];
      this.font = {
        color: '#666',
        family: '\'Helvetica Neue\', \'Helvetica\', \'Arial\', sans-serif',
        size: 12,
        style: 'normal',
        lineHeight: 1.2,
        weight: null,
        lineWidth: 0,
        strokeStyle: undefined
      };
      this.interaction = {
        mode: 'nearest',
        intersect: true
      };
      this.hover = {
        onHover: null
      };
      this.maintainAspectRatio = true;
      this.onHover = null;
      this.onClick = null;
      this.responsive = true;
      this.showLine = true;
      this.plugins = {};
      this.scale = undefined;
      this.scales = {};
      this.controllers = {};
    }
    const _proto = Defaults.prototype;
    _proto.set = function set(scope, values) {
      return merge(getScope(this, scope), values);
    };
    _proto.get = function get(scope) {
      return getScope(this, scope);
    }
    ;
    _proto.route = function route(scope, name, targetScope, targetName) {
      let _Object$definePropert;
      const scopeObject = getScope(this, scope);
      const targetScopeObject = getScope(this, targetScope);
      const privateName = '_' + name;
      Object.defineProperties(scopeObject, (_Object$definePropert = {}, _Object$definePropert[privateName] = {
        writable: true
      }, _Object$definePropert[name] = {
        enumerable: true,
        get: function get() {
          return valueOrDefault(this[privateName], targetScopeObject[targetName]);
        },
        set: function set(value) {
          this[privateName] = value;
        }
      }, _Object$definePropert));
    };
    return Defaults;
  }();
  const defaults = new Defaults();

  const PI = Math.PI;
  const TAU = 2 * PI;
  const PITAU = TAU + PI;
  const INFINITY = Number.POSITIVE_INFINITY;
  const RAD_PER_DEG = PI / 180;
  const HALF_PI = PI / 2;
  const QUARTER_PI = PI / 4;
  const TWO_THIRDS_PI = PI * 2 / 3;
  function _factorize(value) {
    const result = [];
    const sqrt = Math.sqrt(value);
    let i;
    for (i = 1; i < sqrt; i++) {
      if (value % i === 0) {
        result.push(i);
        result.push(value / i);
      }
    }
    if (sqrt === (sqrt | 0)) {
      result.push(sqrt);
    }
    result.sort(function (a, b) {
      return a - b;
    }).pop();
    return result;
  }
  const log10 = Math.log10 || function (x) {
    const exponent = Math.log(x) * Math.LOG10E;
    const powerOf10 = Math.round(exponent);
    const isPowerOf10 = x === Math.pow(10, powerOf10);
    return isPowerOf10 ? powerOf10 : exponent;
  };
  function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
  function almostEquals(x, y, epsilon) {
    return Math.abs(x - y) < epsilon;
  }
  function almostWhole(x, epsilon) {
    const rounded = Math.round(x);
    return rounded - epsilon <= x && rounded + epsilon >= x;
  }
  function _setMinAndMaxByKey(array, target, property) {
    let i, ilen, value;
    for (i = 0, ilen = array.length; i < ilen; i++) {
      value = array[i][property];
      if (!isNaN(value)) {
        target.min = Math.min(target.min, value);
        target.max = Math.max(target.max, value);
      }
    }
  }
  const sign = Math.sign ? function (x) {
    return Math.sign(x);
  } : function (x) {
    x = +x;
    if (x === 0 || isNaN(x)) {
      return x;
    }
    return x > 0 ? 1 : -1;
  };
  function toRadians(degrees) {
    return degrees * (PI / 180);
  }
  function toDegrees(radians) {
    return radians * (180 / PI);
  }
  function _decimalPlaces(x) {
    if (!isNumberFinite(x)) {
      return;
    }
    let e = 1;
    let p = 0;
    while (Math.round(x * e) / e !== x) {
      e *= 10;
      p++;
    }
    return p;
  }
  function getAngleFromPoint(centrePoint, anglePoint) {
    const distanceFromXCenter = anglePoint.x - centrePoint.x;
    const distanceFromYCenter = anglePoint.y - centrePoint.y;
    const radialDistanceFromCenter = Math.sqrt(distanceFromXCenter * distanceFromXCenter + distanceFromYCenter * distanceFromYCenter);
    let angle = Math.atan2(distanceFromYCenter, distanceFromXCenter);
    if (angle < -0.5 * PI) {
      angle += TAU;
    }
    return {
      angle: angle,
      distance: radialDistanceFromCenter
    };
  }
  function distanceBetweenPoints(pt1, pt2) {
    return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
  }
  function _angleDiff(a, b) {
    return (a - b + PITAU) % TAU - PI;
  }
  function _normalizeAngle(a) {
    return (a % TAU + TAU) % TAU;
  }
  function _angleBetween(angle, start, end) {
    const a = _normalizeAngle(angle);
    const s = _normalizeAngle(start);
    const e = _normalizeAngle(end);
    const angleToStart = _normalizeAngle(s - a);
    const angleToEnd = _normalizeAngle(e - a);
    const startToAngle = _normalizeAngle(a - s);
    const endToAngle = _normalizeAngle(a - e);
    return a === s || a === e || angleToStart > angleToEnd && startToAngle < endToAngle;
  }
  function _limitValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function _int16Range(value) {
    return _limitValue(value, -32768, 32767);
  }

  function toFontString(font) {
    if (!font || isNullOrUndef(font.size) || isNullOrUndef(font.family)) {
      return null;
    }
    return (font.style ? font.style + ' ' : '') + (font.weight ? font.weight + ' ' : '') + font.size + 'px ' + font.family;
  }
  function _measureText(ctx, data, gc, longest, string) {
    let textWidth = data[string];
    if (!textWidth) {
      textWidth = data[string] = ctx.measureText(string).width;
      gc.push(string);
    }
    if (textWidth > longest) {
      longest = textWidth;
    }
    return longest;
  }
  function _longestText(ctx, font, arrayOfThings, cache) {
    cache = cache || {};
    let data = cache.data = cache.data || {};
    let gc = cache.garbageCollect = cache.garbageCollect || [];
    if (cache.font !== font) {
      data = cache.data = {};
      gc = cache.garbageCollect = [];
      cache.font = font;
    }
    ctx.save();
    ctx.font = font;
    let longest = 0;
    const ilen = arrayOfThings.length;
    let i, j, jlen, thing, nestedThing;
    for (i = 0; i < ilen; i++) {
      thing = arrayOfThings[i];
      if (thing !== undefined && thing !== null && isArray(thing) !== true) {
        longest = _measureText(ctx, data, gc, longest, thing);
      } else if (isArray(thing)) {
        for (j = 0, jlen = thing.length; j < jlen; j++) {
          nestedThing = thing[j];
          if (nestedThing !== undefined && nestedThing !== null && !isArray(nestedThing)) {
            longest = _measureText(ctx, data, gc, longest, nestedThing);
          }
        }
      }
    }
    ctx.restore();
    const gcLen = gc.length / 2;
    if (gcLen > arrayOfThings.length) {
      for (i = 0; i < gcLen; i++) {
        delete data[gc[i]];
      }
      gc.splice(0, gcLen);
    }
    return longest;
  }
  function _alignPixel(chart, pixel, width) {
    const devicePixelRatio = chart.currentDevicePixelRatio;
    const halfWidth = width / 2;
    return Math.round((pixel - halfWidth) * devicePixelRatio) / devicePixelRatio + halfWidth;
  }
  function clear(chart) {
    chart.ctx.clearRect(0, 0, chart.width, chart.height);
  }
  function drawPoint(ctx, options, x, y) {
    let type, xOffset, yOffset, size, cornerRadius;
    const style = options.pointStyle;
    const rotation = options.rotation;
    const radius = options.radius;
    let rad = (rotation || 0) * RAD_PER_DEG;
    if (style && typeof style === 'object') {
      type = style.toString();
      if (type === '[object HTMLImageElement]' || type === '[object HTMLCanvasElement]') {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rad);
        ctx.drawImage(style, -style.width / 2, -style.height / 2, style.width, style.height);
        ctx.restore();
        return;
      }
    }
    if (isNaN(radius) || radius <= 0) {
      return;
    }
    ctx.beginPath();
    switch (style) {
      default:
        ctx.arc(x, y, radius, 0, TAU);
        ctx.closePath();
        break;
      case 'triangle':
        ctx.moveTo(x + Math.sin(rad) * radius, y - Math.cos(rad) * radius);
        rad += TWO_THIRDS_PI;
        ctx.lineTo(x + Math.sin(rad) * radius, y - Math.cos(rad) * radius);
        rad += TWO_THIRDS_PI;
        ctx.lineTo(x + Math.sin(rad) * radius, y - Math.cos(rad) * radius);
        ctx.closePath();
        break;
      case 'rectRounded':
        cornerRadius = radius * 0.516;
        size = radius - cornerRadius;
        xOffset = Math.cos(rad + QUARTER_PI) * size;
        yOffset = Math.sin(rad + QUARTER_PI) * size;
        ctx.arc(x - xOffset, y - yOffset, cornerRadius, rad - PI, rad - HALF_PI);
        ctx.arc(x + yOffset, y - xOffset, cornerRadius, rad - HALF_PI, rad);
        ctx.arc(x + xOffset, y + yOffset, cornerRadius, rad, rad + HALF_PI);
        ctx.arc(x - yOffset, y + xOffset, cornerRadius, rad + HALF_PI, rad + PI);
        ctx.closePath();
        break;
      case 'rect':
        if (!rotation) {
          size = Math.SQRT1_2 * radius;
          ctx.rect(x - size, y - size, 2 * size, 2 * size);
          break;
        }
        rad += QUARTER_PI;
      case 'rectRot':
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        ctx.moveTo(x - xOffset, y - yOffset);
        ctx.lineTo(x + yOffset, y - xOffset);
        ctx.lineTo(x + xOffset, y + yOffset);
        ctx.lineTo(x - yOffset, y + xOffset);
        ctx.closePath();
        break;
      case 'crossRot':
        rad += QUARTER_PI;
      case 'cross':
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        ctx.moveTo(x - xOffset, y - yOffset);
        ctx.lineTo(x + xOffset, y + yOffset);
        ctx.moveTo(x + yOffset, y - xOffset);
        ctx.lineTo(x - yOffset, y + xOffset);
        break;
      case 'star':
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        ctx.moveTo(x - xOffset, y - yOffset);
        ctx.lineTo(x + xOffset, y + yOffset);
        ctx.moveTo(x + yOffset, y - xOffset);
        ctx.lineTo(x - yOffset, y + xOffset);
        rad += QUARTER_PI;
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        ctx.moveTo(x - xOffset, y - yOffset);
        ctx.lineTo(x + xOffset, y + yOffset);
        ctx.moveTo(x + yOffset, y - xOffset);
        ctx.lineTo(x - yOffset, y + xOffset);
        break;
      case 'line':
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        ctx.moveTo(x - xOffset, y - yOffset);
        ctx.lineTo(x + xOffset, y + yOffset);
        break;
      case 'dash':
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(rad) * radius, y + Math.sin(rad) * radius);
        break;
    }
    ctx.fill();
    if (options.borderWidth > 0) {
      ctx.stroke();
    }
  }
  function _isPointInArea(point, area) {
    const epsilon = 0.5;
    return point.x > area.left - epsilon && point.x < area.right + epsilon && point.y > area.top - epsilon && point.y < area.bottom + epsilon;
  }
  function clipArea(ctx, area) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(area.left, area.top, area.right - area.left, area.bottom - area.top);
    ctx.clip();
  }
  function unclipArea(ctx) {
    ctx.restore();
  }
  function _steppedLineTo(ctx, previous, target, flip, mode) {
    if (!previous) {
      return ctx.lineTo(target.x, target.y);
    }
    if (mode === 'middle') {
      const midpoint = (previous.x + target.x) / 2.0;
      ctx.lineTo(midpoint, previous.y);
      ctx.lineTo(midpoint, target.y);
    } else if (mode === 'after' !== !!flip) {
      ctx.lineTo(previous.x, target.y);
    } else {
      ctx.lineTo(target.x, previous.y);
    }
    ctx.lineTo(target.x, target.y);
  }
  function _bezierCurveTo(ctx, previous, target, flip) {
    if (!previous) {
      return ctx.lineTo(target.x, target.y);
    }
    ctx.bezierCurveTo(flip ? previous.controlPointPreviousX : previous.controlPointNextX, flip ? previous.controlPointPreviousY : previous.controlPointNextY, flip ? target.controlPointNextX : target.controlPointPreviousX, flip ? target.controlPointNextY : target.controlPointPreviousY, target.x, target.y);
  }

  function _lookup(table, value, cmp) {
    cmp = cmp || function (index) {
      return table[index] < value;
    };
    let hi = table.length - 1;
    let lo = 0;
    let mid;
    while (hi - lo > 1) {
      mid = lo + hi >> 1;
      if (cmp(mid)) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return {
      lo: lo,
      hi: hi
    };
  }
  const _lookupByKey = function _lookupByKey(table, key, value) {
    return _lookup(table, value, function (index) {
      return table[index][key] < value;
    });
  };
  const _rlookupByKey = function _rlookupByKey(table, key, value) {
    return _lookup(table, value, function (index) {
      return table[index][key] >= value;
    });
  };
  function _filterBetween(values, min, max) {
    let start = 0;
    let end = values.length;
    while (start < end && values[start] < min) {
      start++;
    }
    while (end > start && values[end - 1] > max) {
      end--;
    }
    return start > 0 || end < values.length ? values.slice(start, end) : values;
  }
  const arrayEvents = ['push', 'pop', 'shift', 'splice', 'unshift'];
  function listenArrayEvents(array, listener) {
    if (array._chartjs) {
      array._chartjs.listeners.push(listener);
      return;
    }
    Object.defineProperty(array, '_chartjs', {
      configurable: true,
      enumerable: false,
      value: {
        listeners: [listener]
      }
    });
    arrayEvents.forEach(function (key) {
      const method = '_onData' + _capitalize(key);
      const base = array[key];
      Object.defineProperty(array, key, {
        configurable: true,
        enumerable: false,
        value: function value() {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          const res = base.apply(this, args);
          array._chartjs.listeners.forEach(function (object) {
            if (typeof object[method] === 'function') {
              object[method].apply(object, args);
            }
          });
          return res;
        }
      });
    });
  }
  function unlistenArrayEvents(array, listener) {
    const stub = array._chartjs;
    if (!stub) {
      return;
    }
    const listeners = stub.listeners;
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    if (listeners.length > 0) {
      return;
    }
    arrayEvents.forEach(function (key) {
      delete array[key];
    });
    delete array._chartjs;
  }
  function _arrayUnique(items) {
    const set = new Set();
    let i, ilen;
    for (i = 0, ilen = items.length; i < ilen; ++i) {
      set.add(items[i]);
    }
    if (set.size === ilen) {
      return items;
    }
    const result = [];
    set.forEach(function (item) {
      result.push(item);
    });
    return result;
  }

  function _getParentNode(domNode) {
    let parent = domNode.parentNode;
    if (parent && parent.toString() === '[object ShadowRoot]') {
      parent = parent.host;
    }
    return parent;
  }
  function parseMaxStyle(styleValue, node, parentProperty) {
    let valueInPixels;
    if (typeof styleValue === 'string') {
      valueInPixels = parseInt(styleValue, 10);
      if (styleValue.indexOf('%') !== -1) {
        valueInPixels = valueInPixels / 100 * node.parentNode[parentProperty];
      }
    } else {
      valueInPixels = styleValue;
    }
    return valueInPixels;
  }
  const getComputedStyle = function getComputedStyle(element) {
    return window.getComputedStyle(element, null);
  };
  function getStyle(el, property) {
    return el.currentStyle ? el.currentStyle[property] : getComputedStyle(el).getPropertyValue(property);
  }
  const positions = ['top', 'right', 'bottom', 'left'];
  function getPositionedStyle(styles, style, suffix) {
    const result = {};
    suffix = suffix ? '-' + suffix : '';
    for (let i = 0; i < 4; i++) {
      const pos = positions[i];
      result[pos] = parseFloat(styles[style + '-' + pos + suffix]) || 0;
    }
    result.width = result.left + result.right;
    result.height = result.top + result.bottom;
    return result;
  }
  function getCanvasPosition(evt, canvas) {
    const e = evt.originalEvent || evt;
    const touches = e.touches;
    const source = touches && touches.length ? touches[0] : e;
    const offsetX = source.offsetX,
      offsetY = source.offsetY;
    let box = false;
    let x, y;
    if (offsetX > 0 || offsetY > 0) {
      x = offsetX;
      y = offsetY;
    } else {
      const rect = canvas.getBoundingClientRect();
      x = source.clientX - rect.left;
      y = source.clientY - rect.top;
      box = true;
    }
    return {
      x: x,
      y: y,
      box: box
    };
  }
  function getRelativePosition(evt, chart) {
    const canvas = chart.canvas,
      currentDevicePixelRatio = chart.currentDevicePixelRatio;
    const style = getComputedStyle(canvas);
    const borderBox = style.boxSizing === 'border-box';
    const paddings = getPositionedStyle(style, 'padding');
    const borders = getPositionedStyle(style, 'border', 'width');
    const _getCanvasPosition = getCanvasPosition(evt, canvas),
      x = _getCanvasPosition.x,
      y = _getCanvasPosition.y,
      box = _getCanvasPosition.box;
    const xOffset = paddings.left + (box && borders.left);
    const yOffset = paddings.top + (box && borders.top);
    let width = chart.width,
      height = chart.height;
    if (borderBox) {
      width -= paddings.width + borders.width;
      height -= paddings.height + borders.height;
    }
    return {
      x: Math.round((x - xOffset) / width * canvas.width / currentDevicePixelRatio),
      y: Math.round((y - yOffset) / height * canvas.height / currentDevicePixelRatio)
    };
  }
  function getContainerSize(canvas, width, height) {
    let maxWidth, maxHeight;
    if (width === undefined || height === undefined) {
      const container = _getParentNode(canvas);
      if (!container) {
        width = canvas.clientWidth;
        height = canvas.clientHeight;
      } else {
        const rect = container.getBoundingClientRect();
        const containerStyle = getComputedStyle(container);
        const containerBorder = getPositionedStyle(containerStyle, 'border', 'width');
        const containerPadding = getPositionedStyle(containerStyle, 'padding');
        width = rect.width - containerPadding.width - containerBorder.width;
        height = rect.height - containerPadding.height - containerBorder.height;
        maxWidth = parseMaxStyle(containerStyle.maxWidth, container, 'clientWidth');
        maxHeight = parseMaxStyle(containerStyle.maxHeight, container, 'clientHeight');
      }
    }
    return {
      width: width,
      height: height,
      maxWidth: maxWidth || INFINITY,
      maxHeight: maxHeight || INFINITY
    };
  }
  function getMaximumSize(canvas, bbWidth, bbHeight, aspectRatio) {
    const style = getComputedStyle(canvas);
    const margins = getPositionedStyle(style, 'margin');
    const maxWidth = parseMaxStyle(style.maxWidth, canvas, 'clientWidth') || INFINITY;
    const maxHeight = parseMaxStyle(style.maxHeight, canvas, 'clientHeight') || INFINITY;
    const containerSize = getContainerSize(canvas, bbWidth, bbHeight);
    let width = containerSize.width,
      height = containerSize.height;
    if (style.boxSizing === 'content-box') {
      const borders = getPositionedStyle(style, 'border', 'width');
      const paddings = getPositionedStyle(style, 'padding');
      width -= paddings.width + borders.width;
      height -= paddings.height + borders.height;
    }
    width = Math.max(0, width - margins.width);
    height = Math.max(0, aspectRatio ? Math.floor(width / aspectRatio) : height - margins.height);
    return {
      width: Math.min(width, maxWidth, containerSize.maxWidth),
      height: Math.min(height, maxHeight, containerSize.maxHeight)
    };
  }
  function retinaScale(chart, forceRatio) {
    const pixelRatio = chart.currentDevicePixelRatio = forceRatio || typeof window !== 'undefined' && window.devicePixelRatio || 1;
    const canvas = chart.canvas,
      width = chart.width,
      height = chart.height;
    canvas.height = height * pixelRatio;
    canvas.width = width * pixelRatio;
    chart.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    if (canvas.style && !canvas.style.height && !canvas.style.width) {
      canvas.style.height = height + 'px';
      canvas.style.width = width + 'px';
    }
  }
  const supportsEventListenerOptions = function () {
    let passiveSupported = false;
    try {
      const options = {
        get passive() {
          passiveSupported = true;
          return false;
        }
      };
      window.addEventListener('test', null, options);
      window.removeEventListener('test', null, options);
    } catch (e) {
    }
    return passiveSupported;
  }();
  function readUsedSize(element, property) {
    const value = getStyle(element, property);
    const matches = value && value.match(/^(\d+)(\.\d+)?px$/);
    return matches ? +matches[1] : undefined;
  }

  function getRelativePosition$1(e, chart) {
    if ('native' in e) {
      return {
        x: e.x,
        y: e.y
      };
    }
    return getRelativePosition(e, chart);
  }
  function evaluateAllVisibleItems(chart, handler) {
    const metasets = chart.getSortedVisibleDatasetMetas();
    let index, data, element;
    for (let i = 0, ilen = metasets.length; i < ilen; ++i) {
      const _metasets$i = metasets[i];
      index = _metasets$i.index;
      data = _metasets$i.data;
      for (let j = 0, jlen = data.length; j < jlen; ++j) {
        element = data[j];
        if (!element.skip) {
          handler(element, index, j);
        }
      }
    }
  }
  function binarySearch(metaset, axis, value, intersect) {
    const controller = metaset.controller,
      data = metaset.data,
      _sorted = metaset._sorted;
    const iScale = controller._cachedMeta.iScale;
    if (iScale && axis === iScale.axis && _sorted && data.length) {
      const lookupMethod = iScale._reversePixels ? _rlookupByKey : _lookupByKey;
      if (!intersect) {
        return lookupMethod(data, axis, value);
      } else if (controller._sharedOptions) {
        const el = data[0];
        const range = typeof el.getRange === 'function' && el.getRange(axis);
        if (range) {
          const start = lookupMethod(data, axis, value - range);
          const end = lookupMethod(data, axis, value + range);
          return {
            lo: start.lo,
            hi: end.hi
          };
        }
      }
    }
    return {
      lo: 0,
      hi: data.length - 1
    };
  }
  function optimizedEvaluateItems(chart, axis, position, handler, intersect) {
    const metasets = chart.getSortedVisibleDatasetMetas();
    const value = position[axis];
    for (let i = 0, ilen = metasets.length; i < ilen; ++i) {
      const _metasets$i2 = metasets[i],
        index = _metasets$i2.index,
        data = _metasets$i2.data;
      const _binarySearch = binarySearch(metasets[i], axis, value, intersect),
        lo = _binarySearch.lo,
        hi = _binarySearch.hi;
      for (let j = lo; j <= hi; ++j) {
        const element = data[j];
        if (!element.skip) {
          handler(element, index, j);
        }
      }
    }
  }
  function getDistanceMetricForAxis(axis) {
    const useX = axis.indexOf('x') !== -1;
    const useY = axis.indexOf('y') !== -1;
    return function (pt1, pt2) {
      const deltaX = useX ? Math.abs(pt1.x - pt2.x) : 0;
      const deltaY = useY ? Math.abs(pt1.y - pt2.y) : 0;
      return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
    };
  }
  function getIntersectItems(chart, position, axis, useFinalPosition) {
    const items = [];
    if (!_isPointInArea(position, chart.chartArea)) {
      return items;
    }
    const evaluationFunc = function evaluationFunc(element, datasetIndex, index) {
      if (element.inRange(position.x, position.y, useFinalPosition)) {
        items.push({
          element: element,
          datasetIndex: datasetIndex,
          index: index
        });
      }
    };
    optimizedEvaluateItems(chart, axis, position, evaluationFunc, true);
    return items;
  }
  function getNearestItems(chart, position, axis, intersect, useFinalPosition) {
    const distanceMetric = getDistanceMetricForAxis(axis);
    let minDistance = Number.POSITIVE_INFINITY;
    let items = [];
    if (!_isPointInArea(position, chart.chartArea)) {
      return items;
    }
    const evaluationFunc = function evaluationFunc(element, datasetIndex, index) {
      if (intersect && !element.inRange(position.x, position.y, useFinalPosition)) {
        return;
      }
      const center = element.getCenterPoint(useFinalPosition);
      const distance = distanceMetric(position, center);
      if (distance < minDistance) {
        items = [{
          element: element,
          datasetIndex: datasetIndex,
          index: index
        }];
        minDistance = distance;
      } else if (distance === minDistance) {
        items.push({
          element: element,
          datasetIndex: datasetIndex,
          index: index
        });
      }
    };
    optimizedEvaluateItems(chart, axis, position, evaluationFunc);
    return items;
  }
  function getAxisItems(chart, e, options, useFinalPosition) {
    const position = getRelativePosition$1(e, chart);
    const items = [];
    const axis = options.axis;
    const rangeMethod = axis === 'x' ? 'inXRange' : 'inYRange';
    let intersectsItem = false;
    evaluateAllVisibleItems(chart, function (element, datasetIndex, index) {
      if (element[rangeMethod](position[axis], useFinalPosition)) {
        items.push({
          element: element,
          datasetIndex: datasetIndex,
          index: index
        });
      }
      if (element.inRange(position.x, position.y, useFinalPosition)) {
        intersectsItem = true;
      }
    });
    if (options.intersect && !intersectsItem) {
      return [];
    }
    return items;
  }
  const Interaction = {
    modes: {
      index: function index(chart, e, options, useFinalPosition) {
        const position = getRelativePosition$1(e, chart);
        const axis = options.axis || 'x';
        const items = options.intersect ? getIntersectItems(chart, position, axis, useFinalPosition) : getNearestItems(chart, position, axis, false, useFinalPosition);
        const elements = [];
        if (!items.length) {
          return [];
        }
        chart.getSortedVisibleDatasetMetas().forEach(function (meta) {
          const index = items[0].index;
          const element = meta.data[index];
          if (element && !element.skip) {
            elements.push({
              element: element,
              datasetIndex: meta.index,
              index: index
            });
          }
        });
        return elements;
      },
      dataset: function dataset(chart, e, options, useFinalPosition) {
        const position = getRelativePosition$1(e, chart);
        const axis = options.axis || 'xy';
        let items = options.intersect ? getIntersectItems(chart, position, axis, useFinalPosition) : getNearestItems(chart, position, axis, false, useFinalPosition);
        if (items.length > 0) {
          const datasetIndex = items[0].datasetIndex;
          const data = chart.getDatasetMeta(datasetIndex).data;
          items = [];
          for (let i = 0; i < data.length; ++i) {
            items.push({
              element: data[i],
              datasetIndex: datasetIndex,
              index: i
            });
          }
        }
        return items;
      },
      point: function point(chart, e, options, useFinalPosition) {
        const position = getRelativePosition$1(e, chart);
        const axis = options.axis || 'xy';
        return getIntersectItems(chart, position, axis, useFinalPosition);
      },
      nearest: function nearest(chart, e, options, useFinalPosition) {
        const position = getRelativePosition$1(e, chart);
        const axis = options.axis || 'xy';
        return getNearestItems(chart, position, axis, options.intersect, useFinalPosition);
      },
      x: function x(chart, e, options, useFinalPosition) {
        options.axis = 'x';
        return getAxisItems(chart, e, options, useFinalPosition);
      },
      y: function y(chart, e, options, useFinalPosition) {
        options.axis = 'y';
        return getAxisItems(chart, e, options, useFinalPosition);
      }
    }
  };

  function toLineHeight(value, size) {
    const matches = ('' + value).match(/^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/);
    if (!matches || matches[1] === 'normal') {
      return size * 1.2;
    }
    value = +matches[2];
    switch (matches[3]) {
      case 'px':
        return value;
      case '%':
        value /= 100;
        break;
    }
    return size * value;
  }
  const numberOrZero = function numberOrZero(v) {
    return +v || 0;
  };
  function toTRBL(value) {
    let t, r, b, l;
    if (isObject(value)) {
      t = numberOrZero(value.top);
      r = numberOrZero(value.right);
      b = numberOrZero(value.bottom);
      l = numberOrZero(value.left);
    } else {
      t = r = b = l = numberOrZero(value);
    }
    return {
      top: t,
      right: r,
      bottom: b,
      left: l
    };
  }
  function toTRBLCorners(value) {
    let tl, tr, bl, br;
    if (isObject(value)) {
      tl = numberOrZero(value.topLeft);
      tr = numberOrZero(value.topRight);
      bl = numberOrZero(value.bottomLeft);
      br = numberOrZero(value.bottomRight);
    } else {
      tl = tr = bl = br = numberOrZero(value);
    }
    return {
      topLeft: tl,
      topRight: tr,
      bottomLeft: bl,
      bottomRight: br
    };
  }
  function toPadding(value) {
    const obj = toTRBL(value);
    obj.width = obj.left + obj.right;
    obj.height = obj.top + obj.bottom;
    return obj;
  }
  function toFont(options, fallback) {
    options = options || {};
    fallback = fallback || defaults.font;
    let size = valueOrDefault(options.size, fallback.size);
    if (typeof size === 'string') {
      size = parseInt(size, 10);
    }
    const font = {
      color: valueOrDefault(options.color, fallback.color),
      family: valueOrDefault(options.family, fallback.family),
      lineHeight: toLineHeight(valueOrDefault(options.lineHeight, fallback.lineHeight), size),
      lineWidth: valueOrDefault(options.lineWidth, fallback.lineWidth),
      size: size,
      style: valueOrDefault(options.style, fallback.style),
      weight: valueOrDefault(options.weight, fallback.weight),
      strokeStyle: valueOrDefault(options.strokeStyle, fallback.strokeStyle),
      string: ''
    };
    font.string = toFontString(font);
    return font;
  }
  function resolve(inputs, context, index, info) {
    let cacheable = true;
    let i, ilen, value;
    for (i = 0, ilen = inputs.length; i < ilen; ++i) {
      value = inputs[i];
      if (value === undefined) {
        continue;
      }
      if (context !== undefined && typeof value === 'function') {
        value = value(context);
        cacheable = false;
      }
      if (index !== undefined && isArray(value)) {
        value = value[index % value.length];
        cacheable = false;
      }
      if (value !== undefined) {
        if (info && !cacheable) {
          info.cacheable = false;
        }
        return value;
      }
    }
  }

  const STATIC_POSITIONS = ['left', 'top', 'right', 'bottom'];
  function filterByPosition(array, position) {
    return array.filter(function (v) {
      return v.pos === position;
    });
  }
  function filterDynamicPositionByAxis(array, axis) {
    return array.filter(function (v) {
      return STATIC_POSITIONS.indexOf(v.pos) === -1 && v.box.axis === axis;
    });
  }
  function sortByWeight(array, reverse) {
    return array.sort(function (a, b) {
      const v0 = reverse ? b : a;
      const v1 = reverse ? a : b;
      return v0.weight === v1.weight ? v0.index - v1.index : v0.weight - v1.weight;
    });
  }
  function wrapBoxes(boxes) {
    const layoutBoxes = [];
    let i, ilen, box;
    for (i = 0, ilen = (boxes || []).length; i < ilen; ++i) {
      box = boxes[i];
      layoutBoxes.push({
        index: i,
        box: box,
        pos: box.position,
        horizontal: box.isHorizontal(),
        weight: box.weight
      });
    }
    return layoutBoxes;
  }
  function setLayoutDims(layouts, params) {
    let i, ilen, layout;
    for (i = 0, ilen = layouts.length; i < ilen; ++i) {
      layout = layouts[i];
      if (layout.horizontal) {
        layout.width = layout.box.fullWidth && params.availableWidth;
        layout.height = params.hBoxMaxHeight;
      } else {
        layout.width = params.vBoxMaxWidth;
        layout.height = layout.box.fullWidth && params.availableHeight;
      }
    }
  }
  function buildLayoutBoxes(boxes) {
    const layoutBoxes = wrapBoxes(boxes);
    const left = sortByWeight(filterByPosition(layoutBoxes, 'left'), true);
    const right = sortByWeight(filterByPosition(layoutBoxes, 'right'));
    const top = sortByWeight(filterByPosition(layoutBoxes, 'top'), true);
    const bottom = sortByWeight(filterByPosition(layoutBoxes, 'bottom'));
    const centerHorizontal = filterDynamicPositionByAxis(layoutBoxes, 'x');
    const centerVertical = filterDynamicPositionByAxis(layoutBoxes, 'y');
    return {
      leftAndTop: left.concat(top),
      rightAndBottom: right.concat(centerVertical).concat(bottom).concat(centerHorizontal),
      chartArea: filterByPosition(layoutBoxes, 'chartArea'),
      vertical: left.concat(right).concat(centerVertical),
      horizontal: top.concat(bottom).concat(centerHorizontal)
    };
  }
  function getCombinedMax(maxPadding, chartArea, a, b) {
    return Math.max(maxPadding[a], chartArea[a]) + Math.max(maxPadding[b], chartArea[b]);
  }
  function updateDims(chartArea, params, layout) {
    const box = layout.box;
    const maxPadding = chartArea.maxPadding;
    if (isObject(layout.pos)) {
      return;
    }
    if (layout.size) {
      chartArea[layout.pos] -= layout.size;
    }
    layout.size = layout.horizontal ? box.height : box.width;
    chartArea[layout.pos] += layout.size;
    if (box.getPadding) {
      const boxPadding = box.getPadding();
      maxPadding.top = Math.max(maxPadding.top, boxPadding.top);
      maxPadding.left = Math.max(maxPadding.left, boxPadding.left);
      maxPadding.bottom = Math.max(maxPadding.bottom, boxPadding.bottom);
      maxPadding.right = Math.max(maxPadding.right, boxPadding.right);
    }
    const newWidth = params.outerWidth - getCombinedMax(maxPadding, chartArea, 'left', 'right');
    const newHeight = params.outerHeight - getCombinedMax(maxPadding, chartArea, 'top', 'bottom');
    if (newWidth !== chartArea.w || newHeight !== chartArea.h) {
      chartArea.w = newWidth;
      chartArea.h = newHeight;
      return layout.horizontal ? newWidth !== chartArea.w : newHeight !== chartArea.h;
    }
  }
  function handleMaxPadding(chartArea) {
    const maxPadding = chartArea.maxPadding;
    function updatePos(pos) {
      const change = Math.max(maxPadding[pos] - chartArea[pos], 0);
      chartArea[pos] += change;
      return change;
    }
    chartArea.y += updatePos('top');
    chartArea.x += updatePos('left');
    updatePos('right');
    updatePos('bottom');
  }
  function getMargins(horizontal, chartArea) {
    const maxPadding = chartArea.maxPadding;
    function marginForPositions(positions) {
      const margin = {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      };
      positions.forEach(function (pos) {
        margin[pos] = Math.max(chartArea[pos], maxPadding[pos]);
      });
      return margin;
    }
    return horizontal ? marginForPositions(['left', 'right']) : marginForPositions(['top', 'bottom']);
  }
  function fitBoxes(boxes, chartArea, params) {
    const refitBoxes = [];
    let i, ilen, layout, box, refit, changed;
    for (i = 0, ilen = boxes.length; i < ilen; ++i) {
      layout = boxes[i];
      box = layout.box;
      box.update(layout.width || chartArea.w, layout.height || chartArea.h, getMargins(layout.horizontal, chartArea));
      if (updateDims(chartArea, params, layout)) {
        changed = true;
        if (refitBoxes.length) {
          refit = true;
        }
      }
      if (!box.fullWidth) {
        refitBoxes.push(layout);
      }
    }
    return refit ? fitBoxes(refitBoxes, chartArea, params) || changed : changed;
  }
  function placeBoxes(boxes, chartArea, params) {
    const userPadding = params.padding;
    let x = chartArea.x;
    let y = chartArea.y;
    let i, ilen, layout, box;
    for (i = 0, ilen = boxes.length; i < ilen; ++i) {
      layout = boxes[i];
      box = layout.box;
      if (layout.horizontal) {
        box.left = box.fullWidth ? userPadding.left : chartArea.left;
        box.right = box.fullWidth ? params.outerWidth - userPadding.right : chartArea.left + chartArea.w;
        box.top = y;
        box.bottom = y + box.height;
        box.width = box.right - box.left;
        y = box.bottom;
      } else {
        box.left = x;
        box.right = x + box.width;
        box.top = box.fullWidth ? userPadding.top : chartArea.top;
        box.bottom = box.fullWidth ? params.outerHeight - userPadding.right : chartArea.top + chartArea.h;
        box.height = box.bottom - box.top;
        x = box.right;
      }
    }
    chartArea.x = x;
    chartArea.y = y;
  }
  defaults.set('layout', {
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  });
  const layouts = {
    addBox: function addBox(chart, item) {
      if (!chart.boxes) {
        chart.boxes = [];
      }
      item.fullWidth = item.fullWidth || false;
      item.position = item.position || 'top';
      item.weight = item.weight || 0;
      item._layers = item._layers || function () {
        return [{
          z: 0,
          draw: function draw(chartArea) {
            item.draw(chartArea);
          }
        }];
      };
      chart.boxes.push(item);
    },
    removeBox: function removeBox(chart, layoutItem) {
      const index = chart.boxes ? chart.boxes.indexOf(layoutItem) : -1;
      if (index !== -1) {
        chart.boxes.splice(index, 1);
      }
    },
    configure: function configure(chart, item, options) {
      const props = ['fullWidth', 'position', 'weight'];
      const ilen = props.length;
      let i = 0;
      let prop;
      for (; i < ilen; ++i) {
        prop = props[i];
        if (Object.prototype.hasOwnProperty.call(options, prop)) {
          item[prop] = options[prop];
        }
      }
    },
    update: function update(chart, width, height) {
      if (!chart) {
        return;
      }
      const layoutOptions = chart.options.layout || {};
      const context = {
        chart: chart
      };
      const padding = toPadding(resolve([layoutOptions.padding], context));
      const availableWidth = width - padding.width;
      const availableHeight = height - padding.height;
      const boxes = buildLayoutBoxes(chart.boxes);
      const verticalBoxes = boxes.vertical;
      const horizontalBoxes = boxes.horizontal;
      const params = Object.freeze({
        outerWidth: width,
        outerHeight: height,
        padding: padding,
        availableWidth: availableWidth,
        availableHeight: availableHeight,
        vBoxMaxWidth: availableWidth / 2 / verticalBoxes.length,
        hBoxMaxHeight: availableHeight / 2
      });
      const chartArea = _extends({
        maxPadding: _extends({}, padding),
        w: availableWidth,
        h: availableHeight,
        x: padding.left,
        y: padding.top
      }, padding);
      setLayoutDims(verticalBoxes.concat(horizontalBoxes), params);
      fitBoxes(verticalBoxes, chartArea, params);
      if (fitBoxes(horizontalBoxes, chartArea, params)) {
        fitBoxes(verticalBoxes, chartArea, params);
      }
      handleMaxPadding(chartArea);
      placeBoxes(boxes.leftAndTop, chartArea, params);
      chartArea.x += chartArea.w;
      chartArea.y += chartArea.h;
      placeBoxes(boxes.rightAndBottom, chartArea, params);
      chart.chartArea = {
        left: chartArea.left,
        top: chartArea.top,
        right: chartArea.left + chartArea.w,
        bottom: chartArea.top + chartArea.h,
        height: chartArea.h,
        width: chartArea.w
      };
      each(boxes.chartArea, function (layout) {
        const box = layout.box;
        _extends(box, chart.chartArea);
        box.update(chartArea.w, chartArea.h);
      });
    }
  };

  const BasePlatform = function () {
    function BasePlatform() {}
    const _proto = BasePlatform.prototype;
    _proto.acquireContext = function acquireContext(canvas, options) {}
    ;
    _proto.releaseContext = function releaseContext(context) {
      return false;
    }
    ;
    _proto.addEventListener = function addEventListener(chart, type, listener) {}
    ;
    _proto.removeEventListener = function removeEventListener(chart, type, listener) {}
    ;
    _proto.getDevicePixelRatio = function getDevicePixelRatio() {
      return 1;
    }
    ;
    _proto.getMaximumSize = function getMaximumSize(element, width, height, aspectRatio) {
      width = Math.max(0, width || element.width);
      height = height || element.height;
      return {
        width: width,
        height: Math.max(0, aspectRatio ? Math.floor(width / aspectRatio) : height)
      };
    }
    ;
    _proto.isAttached = function isAttached(canvas) {
      return true;
    };
    return BasePlatform;
  }();

  const BasicPlatform = function (_BasePlatform) {
    _inheritsLoose(BasicPlatform, _BasePlatform);
    function BasicPlatform() {
      return _BasePlatform.apply(this, arguments) || this;
    }
    const _proto = BasicPlatform.prototype;
    _proto.acquireContext = function acquireContext(item) {
      return item && item.getContext && item.getContext('2d') || null;
    };
    return BasicPlatform;
  }(BasePlatform);

  const MapShim = function () {
    if (typeof Map !== 'undefined') {
      return Map;
    }
    function getIndex(arr, key) {
      let result = -1;
      arr.some(function (entry, index) {
        if (entry[0] === key) {
          result = index;
          return true;
        }
        return false;
      });
      return result;
    }
    return (
      function () {
        function class_1() {
          this.__entries__ = [];
        }
        Object.defineProperty(class_1.prototype, 'size', {
          get: function get() {
            return this.__entries__.length;
          },
          enumerable: true,
          configurable: true
        });
        class_1.prototype.get = function (key) {
          const index = getIndex(this.__entries__, key);
          const entry = this.__entries__[index];
          return entry && entry[1];
        };
        class_1.prototype.set = function (key, value) {
          const index = getIndex(this.__entries__, key);
          if (~index) {
            this.__entries__[index][1] = value;
          } else {
            this.__entries__.push([key, value]);
          }
        };
        class_1.prototype.delete = function (key) {
          const entries = this.__entries__;
          const index = getIndex(entries, key);
          if (~index) {
            entries.splice(index, 1);
          }
        };
        class_1.prototype.has = function (key) {
          return !!~getIndex(this.__entries__, key);
        };
        class_1.prototype.clear = function () {
          this.__entries__.splice(0);
        };
        class_1.prototype.forEach = function (callback, ctx) {
          if (ctx === void 0) {
            ctx = null;
          }
          for (let _i = 0, _a = this.__entries__; _i < _a.length; _i++) {
            const entry = _a[_i];
            callback.call(ctx, entry[1], entry[0]);
          }
        };
        return class_1;
      }()
    );
  }();
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined' && window.document === document;
  const global$1 = function () {
    if (typeof global !== 'undefined' && global.Math === Math) {
      return global;
    }
    if (typeof self !== 'undefined' && self.Math === Math) {
      return self;
    }
    if (typeof window !== 'undefined' && window.Math === Math) {
      return window;
    }
    return Function('return this')();
  }();
  const requestAnimationFrame$1 = function () {
    if (typeof requestAnimationFrame === 'function') {
      return requestAnimationFrame.bind(global$1);
    }
    return function (callback) {
      return setTimeout(function () {
        return callback(Date.now());
      }, 1000 / 60);
    };
  }();
  const trailingTimeout = 2;
  function throttle(callback, delay) {
    let leadingCall = false,
      trailingCall = false,
      lastCallTime = 0;
    function resolvePending() {
      if (leadingCall) {
        leadingCall = false;
        callback();
      }
      if (trailingCall) {
        proxy();
      }
    }
    function timeoutCallback() {
      requestAnimationFrame$1(resolvePending);
    }
    function proxy() {
      const timeStamp = Date.now();
      if (leadingCall) {
        if (timeStamp - lastCallTime < trailingTimeout) {
          return;
        }
        trailingCall = true;
      } else {
        leadingCall = true;
        trailingCall = false;
        setTimeout(timeoutCallback, delay);
      }
      lastCallTime = timeStamp;
    }
    return proxy;
  }
  const REFRESH_DELAY = 20;
  const transitionKeys = ['top', 'right', 'bottom', 'left', 'width', 'height', 'size', 'weight'];
  const mutationObserverSupported = typeof MutationObserver !== 'undefined';
  const ResizeObserverController =
  function () {
    function ResizeObserverController() {
      this.connected_ = false;
      this.mutationEventsAdded_ = false;
      this.mutationsObserver_ = null;
      this.observers_ = [];
      this.onTransitionEnd_ = this.onTransitionEnd_.bind(this);
      this.refresh = throttle(this.refresh.bind(this), REFRESH_DELAY);
    }
    ResizeObserverController.prototype.addObserver = function (observer) {
      if (!~this.observers_.indexOf(observer)) {
        this.observers_.push(observer);
      }
      if (!this.connected_) {
        this.connect_();
      }
    };
    ResizeObserverController.prototype.removeObserver = function (observer) {
      const observers = this.observers_;
      const index = observers.indexOf(observer);
      if (~index) {
        observers.splice(index, 1);
      }
      if (!observers.length && this.connected_) {
        this.disconnect_();
      }
    };
    ResizeObserverController.prototype.refresh = function () {
      const changesDetected = this.updateObservers_();
      if (changesDetected) {
        this.refresh();
      }
    };
    ResizeObserverController.prototype.updateObservers_ = function () {
      const activeObservers = this.observers_.filter(function (observer) {
        return observer.gatherActive(), observer.hasActive();
      });
      activeObservers.forEach(function (observer) {
        return observer.broadcastActive();
      });
      return activeObservers.length > 0;
    };
    ResizeObserverController.prototype.connect_ = function () {
      if (!isBrowser || this.connected_) {
        return;
      }
      document.addEventListener('transitionend', this.onTransitionEnd_);
      window.addEventListener('resize', this.refresh);
      if (mutationObserverSupported) {
        this.mutationsObserver_ = new MutationObserver(this.refresh);
        this.mutationsObserver_.observe(document, {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true
        });
      } else {
        document.addEventListener('DOMSubtreeModified', this.refresh);
        this.mutationEventsAdded_ = true;
      }
      this.connected_ = true;
    };
    ResizeObserverController.prototype.disconnect_ = function () {
      if (!isBrowser || !this.connected_) {
        return;
      }
      document.removeEventListener('transitionend', this.onTransitionEnd_);
      window.removeEventListener('resize', this.refresh);
      if (this.mutationsObserver_) {
        this.mutationsObserver_.disconnect();
      }
      if (this.mutationEventsAdded_) {
        document.removeEventListener('DOMSubtreeModified', this.refresh);
      }
      this.mutationsObserver_ = null;
      this.mutationEventsAdded_ = false;
      this.connected_ = false;
    };
    ResizeObserverController.prototype.onTransitionEnd_ = function (_a) {
      const _b = _a.propertyName,
        propertyName = _b === void 0 ? '' : _b;
      const isReflowProperty = transitionKeys.some(function (key) {
        return !!~propertyName.indexOf(key);
      });
      if (isReflowProperty) {
        this.refresh();
      }
    };
    ResizeObserverController.getInstance = function () {
      if (!this.instance_) {
        this.instance_ = new ResizeObserverController();
      }
      return this.instance_;
    };
    ResizeObserverController.instance_ = null;
    return ResizeObserverController;
  }();
  const defineConfigurable = function defineConfigurable(target, props) {
    for (let _i = 0, _a = Object.keys(props); _i < _a.length; _i++) {
      const key = _a[_i];
      Object.defineProperty(target, key, {
        value: props[key],
        enumerable: false,
        writable: false,
        configurable: true
      });
    }
    return target;
  };
  const getWindowOf = function getWindowOf(target) {
    const ownerGlobal = target && target.ownerDocument && target.ownerDocument.defaultView;
    return ownerGlobal || global$1;
  };
  const emptyRect = createRectInit(0, 0, 0, 0);
  function toFloat(value) {
    return parseFloat(value) || 0;
  }
  function getBordersSize(styles) {
    const positions = [];
    for (let _i = 1; _i < arguments.length; _i++) {
      positions[_i - 1] = arguments[_i];
    }
    return positions.reduce(function (size, position) {
      const value = styles['border-' + position + '-width'];
      return size + toFloat(value);
    }, 0);
  }
  function getPaddings(styles) {
    const positions = ['top', 'right', 'bottom', 'left'];
    const paddings = {};
    for (let _i = 0, positions_1 = positions; _i < positions_1.length; _i++) {
      const position = positions_1[_i];
      const value = styles['padding-' + position];
      paddings[position] = toFloat(value);
    }
    return paddings;
  }
  function getSVGContentRect(target) {
    const bbox = target.getBBox();
    return createRectInit(0, 0, bbox.width, bbox.height);
  }
  function getHTMLElementContentRect(target) {
    const clientWidth = target.clientWidth,
      clientHeight = target.clientHeight;
    if (!clientWidth && !clientHeight) {
      return emptyRect;
    }
    const styles = getWindowOf(target).getComputedStyle(target);
    const paddings = getPaddings(styles);
    const horizPad = paddings.left + paddings.right;
    const vertPad = paddings.top + paddings.bottom;
    let width = toFloat(styles.width),
      height = toFloat(styles.height);
    if (styles.boxSizing === 'border-box') {
      if (Math.round(width + horizPad) !== clientWidth) {
        width -= getBordersSize(styles, 'left', 'right') + horizPad;
      }
      if (Math.round(height + vertPad) !== clientHeight) {
        height -= getBordersSize(styles, 'top', 'bottom') + vertPad;
      }
    }
    if (!isDocumentElement(target)) {
      const vertScrollbar = Math.round(width + horizPad) - clientWidth;
      const horizScrollbar = Math.round(height + vertPad) - clientHeight;
      if (Math.abs(vertScrollbar) !== 1) {
        width -= vertScrollbar;
      }
      if (Math.abs(horizScrollbar) !== 1) {
        height -= horizScrollbar;
      }
    }
    return createRectInit(paddings.left, paddings.top, width, height);
  }
  const isSVGGraphicsElement = function () {
    if (typeof SVGGraphicsElement !== 'undefined') {
      return function (target) {
        return target instanceof getWindowOf(target).SVGGraphicsElement;
      };
    }
    return function (target) {
      return target instanceof getWindowOf(target).SVGElement && typeof target.getBBox === 'function';
    };
  }();
  function isDocumentElement(target) {
    return target === getWindowOf(target).document.documentElement;
  }
  function getContentRect(target) {
    if (!isBrowser) {
      return emptyRect;
    }
    if (isSVGGraphicsElement(target)) {
      return getSVGContentRect(target);
    }
    return getHTMLElementContentRect(target);
  }
  function createReadOnlyRect(_a) {
    const x = _a.x,
      y = _a.y,
      width = _a.width,
      height = _a.height;
    const Constr = typeof DOMRectReadOnly !== 'undefined' ? DOMRectReadOnly : Object;
    const rect = Object.create(Constr.prototype);
    defineConfigurable(rect, {
      x: x,
      y: y,
      width: width,
      height: height,
      top: y,
      right: x + width,
      bottom: height + y,
      left: x
    });
    return rect;
  }
  function createRectInit(x, y, width, height) {
    return {
      x: x,
      y: y,
      width: width,
      height: height
    };
  }
  const ResizeObservation =
  function () {
    function ResizeObservation(target) {
      this.broadcastWidth = 0;
      this.broadcastHeight = 0;
      this.contentRect_ = createRectInit(0, 0, 0, 0);
      this.target = target;
    }
    ResizeObservation.prototype.isActive = function () {
      const rect = getContentRect(this.target);
      this.contentRect_ = rect;
      return rect.width !== this.broadcastWidth || rect.height !== this.broadcastHeight;
    };
    ResizeObservation.prototype.broadcastRect = function () {
      const rect = this.contentRect_;
      this.broadcastWidth = rect.width;
      this.broadcastHeight = rect.height;
      return rect;
    };
    return ResizeObservation;
  }();
  const ResizeObserverEntry =
  function () {
    function ResizeObserverEntry(target, rectInit) {
      const contentRect = createReadOnlyRect(rectInit);
      defineConfigurable(this, {
        target: target,
        contentRect: contentRect
      });
    }
    return ResizeObserverEntry;
  }();
  const ResizeObserverSPI =
  function () {
    function ResizeObserverSPI(callback, controller, callbackCtx) {
      this.activeObservations_ = [];
      this.observations_ = new MapShim();
      if (typeof callback !== 'function') {
        throw new TypeError('The callback provided as parameter 1 is not a function.');
      }
      this.callback_ = callback;
      this.controller_ = controller;
      this.callbackCtx_ = callbackCtx;
    }
    ResizeObserverSPI.prototype.observe = function (target) {
      if (!arguments.length) {
        throw new TypeError('1 argument required, but only 0 present.');
      }
      if (typeof Element === 'undefined' || !(Element instanceof Object)) {
        return;
      }
      if (!(target instanceof getWindowOf(target).Element)) {
        throw new TypeError('parameter 1 is not of type "Element".');
      }
      const observations = this.observations_;
      if (observations.has(target)) {
        return;
      }
      observations.set(target, new ResizeObservation(target));
      this.controller_.addObserver(this);
      this.controller_.refresh();
    };
    ResizeObserverSPI.prototype.unobserve = function (target) {
      if (!arguments.length) {
        throw new TypeError('1 argument required, but only 0 present.');
      }
      if (typeof Element === 'undefined' || !(Element instanceof Object)) {
        return;
      }
      if (!(target instanceof getWindowOf(target).Element)) {
        throw new TypeError('parameter 1 is not of type "Element".');
      }
      const observations = this.observations_;
      if (!observations.has(target)) {
        return;
      }
      observations.delete(target);
      if (!observations.size) {
        this.controller_.removeObserver(this);
      }
    };
    ResizeObserverSPI.prototype.disconnect = function () {
      this.clearActive();
      this.observations_.clear();
      this.controller_.removeObserver(this);
    };
    ResizeObserverSPI.prototype.gatherActive = function () {
      const _this = this;
      this.clearActive();
      this.observations_.forEach(function (observation) {
        if (observation.isActive()) {
          _this.activeObservations_.push(observation);
        }
      });
    };
    ResizeObserverSPI.prototype.broadcastActive = function () {
      if (!this.hasActive()) {
        return;
      }
      const ctx = this.callbackCtx_;
      const entries = this.activeObservations_.map(function (observation) {
        return new ResizeObserverEntry(observation.target, observation.broadcastRect());
      });
      this.callback_.call(ctx, entries, ctx);
      this.clearActive();
    };
    ResizeObserverSPI.prototype.clearActive = function () {
      this.activeObservations_.splice(0);
    };
    ResizeObserverSPI.prototype.hasActive = function () {
      return this.activeObservations_.length > 0;
    };
    return ResizeObserverSPI;
  }();
  const observers = typeof WeakMap !== 'undefined' ? new WeakMap() : new MapShim();
  const ResizeObserver =
  function () {
    function ResizeObserver(callback) {
      if (!(this instanceof ResizeObserver)) {
        throw new TypeError('Cannot call a class as a function.');
      }
      if (!arguments.length) {
        throw new TypeError('1 argument required, but only 0 present.');
      }
      const controller = ResizeObserverController.getInstance();
      const observer = new ResizeObserverSPI(callback, controller, this);
      observers.set(this, observer);
    }
    return ResizeObserver;
  }();
  ['observe', 'unobserve', 'disconnect'].forEach(function (method) {
    ResizeObserver.prototype[method] = function () {
      let _a;
      return (_a = observers.get(this))[method].apply(_a, arguments);
    };
  });
  const index = function () {
    if (typeof global$1.ResizeObserver !== 'undefined') {
      return global$1.ResizeObserver;
    }
    return ResizeObserver;
  }();

  const EXPANDO_KEY = '$chartjs';
  const EVENT_TYPES = {
    touchstart: 'mousedown',
    touchmove: 'mousemove',
    touchend: 'mouseup',
    pointerenter: 'mouseenter',
    pointerdown: 'mousedown',
    pointermove: 'mousemove',
    pointerup: 'mouseup',
    pointerleave: 'mouseout',
    pointerout: 'mouseout'
  };
  const isNullOrEmpty = function isNullOrEmpty(value) {
    return value === null || value === '';
  };
  function initCanvas(canvas, config) {
    const style = canvas.style;
    const renderHeight = canvas.getAttribute('height');
    const renderWidth = canvas.getAttribute('width');
    canvas[EXPANDO_KEY] = {
      initial: {
        height: renderHeight,
        width: renderWidth,
        style: {
          display: style.display,
          height: style.height,
          width: style.width
        }
      }
    };
    style.display = style.display || 'block';
    style.boxSizing = style.boxSizing || 'border-box';
    if (isNullOrEmpty(renderWidth)) {
      const displayWidth = readUsedSize(canvas, 'width');
      if (displayWidth !== undefined) {
        canvas.width = displayWidth;
      }
    }
    if (isNullOrEmpty(renderHeight)) {
      if (canvas.style.height === '') {
        canvas.height = canvas.width / (config.options.aspectRatio || 2);
      } else {
        const displayHeight = readUsedSize(canvas, 'height');
        if (displayHeight !== undefined) {
          canvas.height = displayHeight;
        }
      }
    }
    return canvas;
  }
  const eventListenerOptions = supportsEventListenerOptions ? {
    passive: true
  } : false;
  function addListener(node, type, listener) {
    node.addEventListener(type, listener, eventListenerOptions);
  }
  function removeListener(chart, type, listener) {
    chart.canvas.removeEventListener(type, listener, eventListenerOptions);
  }
  function fromNativeEvent(event, chart) {
    const type = EVENT_TYPES[event.type] || event.type;
    const _getRelativePosition = getRelativePosition(event, chart),
      x = _getRelativePosition.x,
      y = _getRelativePosition.y;
    return {
      type: type,
      chart: chart,
      native: event,
      x: x !== undefined ? x : null,
      y: y !== undefined ? y : null
    };
  }
  function createAttachObserver(chart, type, listener) {
    const canvas = chart.canvas;
    const container = canvas && _getParentNode(canvas);
    const element = container || canvas;
    const observer = new MutationObserver(function (entries) {
      const parent = _getParentNode(element);
      entries.forEach(function (entry) {
        for (let i = 0; i < entry.addedNodes.length; i++) {
          const added = entry.addedNodes[i];
          if (added === element || added === parent) {
            listener(entry.target);
          }
        }
      });
    });
    observer.observe(document, {
      childList: true,
      subtree: true
    });
    return observer;
  }
  function createDetachObserver(chart, type, listener) {
    const canvas = chart.canvas;
    const container = canvas && _getParentNode(canvas);
    if (!container) {
      return;
    }
    const observer = new MutationObserver(function (entries) {
      entries.forEach(function (entry) {
        for (let i = 0; i < entry.removedNodes.length; i++) {
          if (entry.removedNodes[i] === canvas) {
            listener();
            break;
          }
        }
      });
    });
    observer.observe(container, {
      childList: true
    });
    return observer;
  }
  const drpListeningCharts = new Map();
  let oldDevicePixelRatio = 0;
  function onWindowResize() {
    const dpr = window.devicePixelRatio;
    if (dpr === oldDevicePixelRatio) {
      return;
    }
    oldDevicePixelRatio = dpr;
    drpListeningCharts.forEach(function (resize, chart) {
      if (chart.currentDevicePixelRatio !== dpr) {
        resize();
      }
    });
  }
  function listenDevicePixelRatioChanges(chart, resize) {
    if (!drpListeningCharts.size) {
      window.addEventListener('resize', onWindowResize);
    }
    drpListeningCharts.set(chart, resize);
  }
  function unlistenDevicePixelRatioChanges(chart) {
    drpListeningCharts.delete(chart);
    if (!drpListeningCharts.size) {
      window.removeEventListener('resize', onWindowResize);
    }
  }
  function createResizeObserver(chart, type, listener) {
    const canvas = chart.canvas;
    const container = canvas && _getParentNode(canvas);
    if (!container) {
      return;
    }
    const resize = throttled(function (width, height) {
      const w = container.clientWidth;
      listener(width, height);
      if (w < container.clientWidth) {
        listener();
      }
    }, window);
    const observer = new index(function (entries) {
      const entry = entries[0];
      const width = entry.contentRect.width;
      const height = entry.contentRect.height;
      if (width === 0 && height === 0) {
        return;
      }
      resize(width, height);
    });
    observer.observe(container);
    listenDevicePixelRatioChanges(chart, resize);
    return observer;
  }
  function releaseObserver(chart, type, observer) {
    if (observer) {
      observer.disconnect();
    }
    if (type === 'resize') {
      unlistenDevicePixelRatioChanges(chart);
    }
  }
  function createProxyAndListen(chart, type, listener) {
    const canvas = chart.canvas;
    const proxy = throttled(function (event) {
      if (chart.ctx !== null) {
        listener(fromNativeEvent(event, chart));
      }
    }, chart, function (args) {
      const event = args[0];
      return [event, event.offsetX, event.offsetY];
    });
    addListener(canvas, type, proxy);
    return proxy;
  }
  const DomPlatform = function (_BasePlatform) {
    _inheritsLoose(DomPlatform, _BasePlatform);
    function DomPlatform() {
      return _BasePlatform.apply(this, arguments) || this;
    }
    const _proto = DomPlatform.prototype;
    _proto.acquireContext = function acquireContext(canvas, config) {
      const context = canvas && canvas.getContext && canvas.getContext('2d');
      if (context && context.canvas === canvas) {
        initCanvas(canvas, config);
        return context;
      }
      return null;
    }
    ;
    _proto.releaseContext = function releaseContext(context) {
      const canvas = context.canvas;
      if (!canvas[EXPANDO_KEY]) {
        return false;
      }
      const initial = canvas[EXPANDO_KEY].initial;
      ['height', 'width'].forEach(function (prop) {
        const value = initial[prop];
        if (isNullOrUndef(value)) {
          canvas.removeAttribute(prop);
        } else {
          canvas.setAttribute(prop, value);
        }
      });
      const style = initial.style || {};
      Object.keys(style).forEach(function (key) {
        canvas.style[key] = style[key];
      });
      canvas.width = canvas.width;
      delete canvas[EXPANDO_KEY];
      return true;
    }
    ;
    _proto.addEventListener = function addEventListener(chart, type, listener) {
      this.removeEventListener(chart, type);
      const proxies = chart.$proxies || (chart.$proxies = {});
      const handlers = {
        attach: createAttachObserver,
        detach: createDetachObserver,
        resize: createResizeObserver
      };
      const handler = handlers[type] || createProxyAndListen;
      proxies[type] = handler(chart, type, listener);
    }
    ;
    _proto.removeEventListener = function removeEventListener(chart, type) {
      const proxies = chart.$proxies || (chart.$proxies = {});
      const proxy = proxies[type];
      if (!proxy) {
        return;
      }
      const handlers = {
        attach: releaseObserver,
        detach: releaseObserver,
        resize: releaseObserver
      };
      const handler = handlers[type] || removeListener;
      handler(chart, type, proxy);
      proxies[type] = undefined;
    };
    _proto.getDevicePixelRatio = function getDevicePixelRatio() {
      return window.devicePixelRatio;
    }
    ;
    _proto.getMaximumSize = function getMaximumSize$1(canvas, width, height, aspectRatio) {
      return getMaximumSize(canvas, width, height, aspectRatio);
    }
    ;
    _proto.isAttached = function isAttached(canvas) {
      const container = _getParentNode(canvas);
      return !!(container && _getParentNode(container));
    };
    return DomPlatform;
  }(BasePlatform);

  const platforms = /*#__PURE__*/Object.freeze({
    __proto__: null,
    BasePlatform: BasePlatform,
    BasicPlatform: BasicPlatform,
    DomPlatform: DomPlatform
  });

  function finallyConstructor(callback) {
    const constructor = this.constructor;
    return this.then(function (value) {
      return constructor.resolve(callback()).then(function () {
        return value;
      });
    }, function (reason) {
      return constructor.resolve(callback()).then(function () {
        return constructor.reject(reason);
      });
    });
  }

  function allSettled(arr) {
    const P = this;
    return new P(function (resolve, reject) {
      if (!(arr && typeof arr.length !== 'undefined')) {
        return reject(new TypeError(typeof arr + ' ' + arr + ' is not iterable(cannot read property Symbol(Symbol.iterator))'));
      }
      const args = Array.prototype.slice.call(arr);
      if (args.length === 0) return resolve([]);
      let remaining = args.length;
      function res(i, val) {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          const then = val.then;
          if (typeof then === 'function') {
            then.call(val, function (val) {
              res(i, val);
            }, function (e) {
              args[i] = {
                status: 'rejected',
                reason: e
              };
              if (--remaining === 0) {
                resolve(args);
              }
            });
            return;
          }
        }
        args[i] = {
          status: 'fulfilled',
          value: val
        };
        if (--remaining === 0) {
          resolve(args);
        }
      }
      for (let i = 0; i < args.length; i++) {
        res(i, args[i]);
      }
    });
  }

  const setTimeoutFunc = setTimeout;
  function isArray$1(x) {
    return Boolean(x && typeof x.length !== 'undefined');
  }
  function noop$1() {}
  function bind(fn, thisArg) {
    return function () {
      fn.apply(thisArg, arguments);
    };
  }
  function Promise(fn) {
    if (!(this instanceof Promise)) throw new TypeError('Promises must be constructed via new');
    if (typeof fn !== 'function') throw new TypeError('not a function');
    this._state = 0;
    this._handled = false;
    this._value = undefined;
    this._deferreds = [];
    doResolve(fn, this);
  }
  function handle(self, deferred) {
    while (self._state === 3) {
      self = self._value;
    }
    if (self._state === 0) {
      self._deferreds.push(deferred);
      return;
    }
    self._handled = true;
    Promise._immediateFn(function () {
      const cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
      if (cb === null) {
        (self._state === 1 ? resolve$1 : reject)(deferred.promise, self._value);
        return;
      }
      let ret;
      try {
        ret = cb(self._value);
      } catch (e) {
        reject(deferred.promise, e);
        return;
      }
      resolve$1(deferred.promise, ret);
    });
  }
  function resolve$1(self, newValue) {
    try {
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.');
      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        const then = newValue.then;
        if (newValue instanceof Promise) {
          self._state = 3;
          self._value = newValue;
          finale(self);
          return;
        } else if (typeof then === 'function') {
          doResolve(bind(then, newValue), self);
          return;
        }
      }
      self._state = 1;
      self._value = newValue;
      finale(self);
    } catch (e) {
      reject(self, e);
    }
  }
  function reject(self, newValue) {
    self._state = 2;
    self._value = newValue;
    finale(self);
  }
  function finale(self) {
    if (self._state === 2 && self._deferreds.length === 0) {
      Promise._immediateFn(function () {
        if (!self._handled) {
          Promise._unhandledRejectionFn(self._value);
        }
      });
    }
    for (let i = 0, len = self._deferreds.length; i < len; i++) {
      handle(self, self._deferreds[i]);
    }
    self._deferreds = null;
  }
  function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.promise = promise;
  }
  function doResolve(fn, self) {
    let done = false;
    try {
      fn(function (value) {
        if (done) return;
        done = true;
        resolve$1(self, value);
      }, function (reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      });
    } catch (ex) {
      if (done) return;
      done = true;
      reject(self, ex);
    }
  }
  Promise.prototype['catch'] = function (onRejected) {
    return this.then(null, onRejected);
  };
  Promise.prototype.then = function (onFulfilled, onRejected) {
    const prom = new this.constructor(noop$1);
    handle(this, new Handler(onFulfilled, onRejected, prom));
    return prom;
  };
  Promise.prototype['finally'] = finallyConstructor;
  Promise.all = function (arr) {
    return new Promise(function (resolve, reject) {
      if (!isArray$1(arr)) {
        return reject(new TypeError('Promise.all accepts an array'));
      }
      const args = Array.prototype.slice.call(arr);
      if (args.length === 0) return resolve([]);
      let remaining = args.length;
      function res(i, val) {
        try {
          if (val && (typeof val === 'object' || typeof val === 'function')) {
            const then = val.then;
            if (typeof then === 'function') {
              then.call(val, function (val) {
                res(i, val);
              }, reject);
              return;
            }
          }
          args[i] = val;
          if (--remaining === 0) {
            resolve(args);
          }
        } catch (ex) {
          reject(ex);
        }
      }
      for (let i = 0; i < args.length; i++) {
        res(i, args[i]);
      }
    });
  };
  Promise.allSettled = allSettled;
  Promise.resolve = function (value) {
    if (value && typeof value === 'object' && value.constructor === Promise) {
      return value;
    }
    return new Promise(function (resolve) {
      resolve(value);
    });
  };
  Promise.reject = function (value) {
    return new Promise(function (resolve, reject) {
      reject(value);
    });
  };
  Promise.race = function (arr) {
    return new Promise(function (resolve, reject) {
      if (!isArray$1(arr)) {
        return reject(new TypeError('Promise.race accepts an array'));
      }
      for (let i = 0, len = arr.length; i < len; i++) {
        Promise.resolve(arr[i]).then(resolve, reject);
      }
    });
  };
  Promise._immediateFn =
  typeof setImmediate === 'function' && function (fn) {
    setImmediate(fn);
  } || function (fn) {
    setTimeoutFunc(fn, 0);
  };
  Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
    if (typeof console !== 'undefined' && console) {
      console.warn('Possible Unhandled Promise Rejection:', err);
    }
  };

  var effects = {
    linear: function linear(t) {
      return t;
    },
    easeInQuad: function easeInQuad(t) {
      return t * t;
    },
    easeOutQuad: function easeOutQuad(t) {
      return -t * (t - 2);
    },
    easeInOutQuad: function easeInOutQuad(t) {
      if ((t /= 0.5) < 1) {
        return 0.5 * t * t;
      }
      return -0.5 * (--t * (t - 2) - 1);
    },
    easeInCubic: function easeInCubic(t) {
      return t * t * t;
    },
    easeOutCubic: function easeOutCubic(t) {
      return (t -= 1) * t * t + 1;
    },
    easeInOutCubic: function easeInOutCubic(t) {
      if ((t /= 0.5) < 1) {
        return 0.5 * t * t * t;
      }
      return 0.5 * ((t -= 2) * t * t + 2);
    },
    easeInQuart: function easeInQuart(t) {
      return t * t * t * t;
    },
    easeOutQuart: function easeOutQuart(t) {
      return -((t -= 1) * t * t * t - 1);
    },
    easeInOutQuart: function easeInOutQuart(t) {
      if ((t /= 0.5) < 1) {
        return 0.5 * t * t * t * t;
      }
      return -0.5 * ((t -= 2) * t * t * t - 2);
    },
    easeInQuint: function easeInQuint(t) {
      return t * t * t * t * t;
    },
    easeOutQuint: function easeOutQuint(t) {
      return (t -= 1) * t * t * t * t + 1;
    },
    easeInOutQuint: function easeInOutQuint(t) {
      if ((t /= 0.5) < 1) {
        return 0.5 * t * t * t * t * t;
      }
      return 0.5 * ((t -= 2) * t * t * t * t + 2);
    },
    easeInSine: function easeInSine(t) {
      return -Math.cos(t * HALF_PI) + 1;
    },
    easeOutSine: function easeOutSine(t) {
      return Math.sin(t * HALF_PI);
    },
    easeInOutSine: function easeInOutSine(t) {
      return -0.5 * (Math.cos(PI * t) - 1);
    },
    easeInExpo: function easeInExpo(t) {
      return t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
    },
    easeOutExpo: function easeOutExpo(t) {
      return t === 1 ? 1 : -Math.pow(2, -10 * t) + 1;
    },
    easeInOutExpo: function easeInOutExpo(t) {
      if (t === 0) {
        return 0;
      }
      if (t === 1) {
        return 1;
      }
      if ((t /= 0.5) < 1) {
        return 0.5 * Math.pow(2, 10 * (t - 1));
      }
      return 0.5 * (-Math.pow(2, -10 * --t) + 2);
    },
    easeInCirc: function easeInCirc(t) {
      if (t >= 1) {
        return t;
      }
      return -(Math.sqrt(1 - t * t) - 1);
    },
    easeOutCirc: function easeOutCirc(t) {
      return Math.sqrt(1 - (t -= 1) * t);
    },
    easeInOutCirc: function easeInOutCirc(t) {
      if ((t /= 0.5) < 1) {
        return -0.5 * (Math.sqrt(1 - t * t) - 1);
      }
      return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
    },
    easeInElastic: function easeInElastic(t) {
      let s = 1.70158;
      let p = 0;
      const a = 1;
      if (t === 0) {
        return 0;
      }
      if (t === 1) {
        return 1;
      }
      if (!p) {
        p = 0.3;
      }
      {
        s = p / TAU * Math.asin(1 / a);
      }
      return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * TAU / p));
    },
    easeOutElastic: function easeOutElastic(t) {
      let s = 1.70158;
      let p = 0;
      const a = 1;
      if (t === 0) {
        return 0;
      }
      if (t === 1) {
        return 1;
      }
      if (!p) {
        p = 0.3;
      }
      {
        s = p / TAU * Math.asin(1 / a);
      }
      return a * Math.pow(2, -10 * t) * Math.sin((t - s) * TAU / p) + 1;
    },
    easeInOutElastic: function easeInOutElastic(t) {
      let s = 1.70158;
      let p = 0;
      const a = 1;
      if (t === 0) {
        return 0;
      }
      if ((t /= 0.5) === 2) {
        return 1;
      }
      if (!p) {
        p = 0.45;
      }
      {
        s = p / TAU * Math.asin(1 / a);
      }
      if (t < 1) {
        return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * TAU / p));
      }
      return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - s) * TAU / p) * 0.5 + 1;
    },
    easeInBack: function easeInBack(t) {
      const s = 1.70158;
      return t * t * ((s + 1) * t - s);
    },
    easeOutBack: function easeOutBack(t) {
      const s = 1.70158;
      return (t -= 1) * t * ((s + 1) * t + s) + 1;
    },
    easeInOutBack: function easeInOutBack(t) {
      let s = 1.70158;
      if ((t /= 0.5) < 1) {
        return 0.5 * (t * t * (((s *= 1.525) + 1) * t - s));
      }
      return 0.5 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2);
    },
    easeInBounce: function easeInBounce(t) {
      return 1 - effects.easeOutBounce(1 - t);
    },
    easeOutBounce: function easeOutBounce(t) {
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      }
      if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      }
      if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      }
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    },
    easeInOutBounce: function easeInOutBounce(t) {
      if (t < 0.5) {
        return effects.easeInBounce(t * 2) * 0.5;
      }
      return effects.easeOutBounce(t * 2 - 1) * 0.5 + 0.5;
    }
  };

  /*!
   * @kurkle/color v0.1.9
   * https://github.com/kurkle/color#readme
   * (c) 2020 Jukka Kurkela
   * Released under the MIT License
   */
  const map = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
    a: 10,
    b: 11,
    c: 12,
    d: 13,
    e: 14,
    f: 15
  };
  const hex = '0123456789ABCDEF';
  const h1 = function h1(b) {
    return hex[b & 0xF];
  };
  const h2 = function h2(b) {
    return hex[(b & 0xF0) >> 4] + hex[b & 0xF];
  };
  const eq = function eq(b) {
    return (b & 0xF0) >> 4 === (b & 0xF);
  };
  function isShort(v) {
    return eq(v.r) && eq(v.g) && eq(v.b) && eq(v.a);
  }
  function hexParse(str) {
    const len = str.length;
    let ret;
    if (str[0] === '#') {
      if (len === 4 || len === 5) {
        ret = {
          r: 255 & map[str[1]] * 17,
          g: 255 & map[str[2]] * 17,
          b: 255 & map[str[3]] * 17,
          a: len === 5 ? map[str[4]] * 17 : 255
        };
      } else if (len === 7 || len === 9) {
        ret = {
          r: map[str[1]] << 4 | map[str[2]],
          g: map[str[3]] << 4 | map[str[4]],
          b: map[str[5]] << 4 | map[str[6]],
          a: len === 9 ? map[str[7]] << 4 | map[str[8]] : 255
        };
      }
    }
    return ret;
  }
  function _hexString(v) {
    const f = isShort(v) ? h1 : h2;
    return v ? '#' + f(v.r) + f(v.g) + f(v.b) + (v.a < 255 ? f(v.a) : '') : v;
  }
  function round(v) {
    return v + 0.5 | 0;
  }
  const lim = function lim(v, l, h) {
    return Math.max(Math.min(v, h), l);
  };
  function p2b(v) {
    return lim(round(v * 2.55), 0, 255);
  }
  function n2b(v) {
    return lim(round(v * 255), 0, 255);
  }
  function b2n(v) {
    return lim(round(v / 2.55) / 100, 0, 1);
  }
  function n2p(v) {
    return lim(round(v * 100), 0, 100);
  }
  const RGB_RE = /^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;
  function rgbParse(str) {
    const m = RGB_RE.exec(str);
    let a = 255;
    let r, g, b;
    if (!m) {
      return;
    }
    if (m[7] !== r) {
      const v = +m[7];
      a = 255 & (m[8] ? p2b(v) : v * 255);
    }
    r = +m[1];
    g = +m[3];
    b = +m[5];
    r = 255 & (m[2] ? p2b(r) : r);
    g = 255 & (m[4] ? p2b(g) : g);
    b = 255 & (m[6] ? p2b(b) : b);
    return {
      r: r,
      g: g,
      b: b,
      a: a
    };
  }
  function _rgbString(v) {
    return v && (v.a < 255 ? 'rgba(' + v.r + ', ' + v.g + ', ' + v.b + ', ' + b2n(v.a) + ')' : 'rgb(' + v.r + ', ' + v.g + ', ' + v.b + ')');
  }
  const HUE_RE = /^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;
  function hsl2rgbn(h, s, l) {
    const a = s * Math.min(l, 1 - l);
    const f = function f(n, k) {
      if (k === void 0) {
        k = (n + h / 30) % 12;
      }
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    return [f(0), f(8), f(4)];
  }
  function hsv2rgbn(h, s, v) {
    const f = function f(n, k) {
      if (k === void 0) {
        k = (n + h / 60) % 6;
      }
      return v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    };
    return [f(5), f(3), f(1)];
  }
  function hwb2rgbn(h, w, b) {
    const rgb = hsl2rgbn(h, 1, 0.5);
    let i;
    if (w + b > 1) {
      i = 1 / (w + b);
      w *= i;
      b *= i;
    }
    for (i = 0; i < 3; i++) {
      rgb[i] *= 1 - w - b;
      rgb[i] += w;
    }
    return rgb;
  }
  function rgb2hsl(v) {
    const range = 255;
    const r = v.r / range;
    const g = v.g / range;
    const b = v.b / range;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h, s, d;
    if (max !== min) {
      d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h = h * 60 + 0.5;
    }
    return [h | 0, s || 0, l];
  }
  function calln(f, a, b, c) {
    return (Array.isArray(a) ? f(a[0], a[1], a[2]) : f(a, b, c)).map(n2b);
  }
  function hsl2rgb(h, s, l) {
    return calln(hsl2rgbn, h, s, l);
  }
  function hwb2rgb(h, w, b) {
    return calln(hwb2rgbn, h, w, b);
  }
  function hsv2rgb(h, s, v) {
    return calln(hsv2rgbn, h, s, v);
  }
  function hue(h) {
    return (h % 360 + 360) % 360;
  }
  function hueParse(str) {
    const m = HUE_RE.exec(str);
    let a = 255;
    let v;
    if (!m) {
      return;
    }
    if (m[5] !== v) {
      a = m[6] ? p2b(+m[5]) : n2b(+m[5]);
    }
    const h = hue(+m[2]);
    const p1 = +m[3] / 100;
    const p2 = +m[4] / 100;
    if (m[1] === 'hwb') {
      v = hwb2rgb(h, p1, p2);
    } else if (m[1] === 'hsv') {
      v = hsv2rgb(h, p1, p2);
    } else {
      v = hsl2rgb(h, p1, p2);
    }
    return {
      r: v[0],
      g: v[1],
      b: v[2],
      a: a
    };
  }
  function _rotate(v, deg) {
    let h = rgb2hsl(v);
    h[0] = hue(h[0] + deg);
    h = hsl2rgb(h);
    v.r = h[0];
    v.g = h[1];
    v.b = h[2];
  }
  function _hslString(v) {
    if (!v) {
      return;
    }
    const a = rgb2hsl(v);
    const h = a[0];
    const s = n2p(a[1]);
    const l = n2p(a[2]);
    return v.a < 255 ? 'hsla(' + h + ', ' + s + '%, ' + l + '%, ' + b2n(v.a) + ')' : 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
  }
  const map$1 = {
    x: 'dark',
    Z: 'light',
    Y: 're',
    X: 'blu',
    W: 'gr',
    V: 'medium',
    U: 'slate',
    A: 'ee',
    T: 'ol',
    S: 'or',
    B: 'ra',
    C: 'lateg',
    D: 'ights',
    R: 'in',
    Q: 'turquois',
    E: 'hi',
    P: 'ro',
    O: 'al',
    N: 'le',
    M: 'de',
    L: 'yello',
    F: 'en',
    K: 'ch',
    G: 'arks',
    H: 'ea',
    I: 'ightg',
    J: 'wh'
  };
  const names = {
    OiceXe: 'f0f8ff',
    antiquewEte: 'faebd7',
    aqua: 'ffff',
    aquamarRe: '7fffd4',
    azuY: 'f0ffff',
    beige: 'f5f5dc',
    bisque: 'ffe4c4',
    black: '0',
    blanKedOmond: 'ffebcd',
    Xe: 'ff',
    XeviTet: '8a2be2',
    bPwn: 'a52a2a',
    burlywood: 'deb887',
    caMtXe: '5f9ea0',
    KartYuse: '7fff00',
    KocTate: 'd2691e',
    cSO: 'ff7f50',
    cSnflowerXe: '6495ed',
    cSnsilk: 'fff8dc',
    crimson: 'dc143c',
    cyan: 'ffff',
    xXe: '8b',
    xcyan: '8b8b',
    xgTMnPd: 'b8860b',
    xWay: 'a9a9a9',
    xgYF: '6400',
    xgYy: 'a9a9a9',
    xkhaki: 'bdb76b',
    xmagFta: '8b008b',
    xTivegYF: '556b2f',
    xSange: 'ff8c00',
    xScEd: '9932cc',
    xYd: '8b0000',
    xsOmon: 'e9967a',
    xsHgYF: '8fbc8f',
    xUXe: '483d8b',
    xUWay: '2f4f4f',
    xUgYy: '2f4f4f',
    xQe: 'ced1',
    xviTet: '9400d3',
    dAppRk: 'ff1493',
    dApskyXe: 'bfff',
    dimWay: '696969',
    dimgYy: '696969',
    dodgerXe: '1e90ff',
    fiYbrick: 'b22222',
    flSOwEte: 'fffaf0',
    foYstWAn: '228b22',
    fuKsia: 'ff00ff',
    gaRsbSo: 'dcdcdc',
    ghostwEte: 'f8f8ff',
    gTd: 'ffd700',
    gTMnPd: 'daa520',
    Way: '808080',
    gYF: '8000',
    gYFLw: 'adff2f',
    gYy: '808080',
    honeyMw: 'f0fff0',
    hotpRk: 'ff69b4',
    RdianYd: 'cd5c5c',
    Rdigo: '4b0082',
    ivSy: 'fffff0',
    khaki: 'f0e68c',
    lavFMr: 'e6e6fa',
    lavFMrXsh: 'fff0f5',
    lawngYF: '7cfc00',
    NmoncEffon: 'fffacd',
    ZXe: 'add8e6',
    ZcSO: 'f08080',
    Zcyan: 'e0ffff',
    ZgTMnPdLw: 'fafad2',
    ZWay: 'd3d3d3',
    ZgYF: '90ee90',
    ZgYy: 'd3d3d3',
    ZpRk: 'ffb6c1',
    ZsOmon: 'ffa07a',
    ZsHgYF: '20b2aa',
    ZskyXe: '87cefa',
    ZUWay: '778899',
    ZUgYy: '778899',
    ZstAlXe: 'b0c4de',
    ZLw: 'ffffe0',
    lime: 'ff00',
    limegYF: '32cd32',
    lRF: 'faf0e6',
    magFta: 'ff00ff',
    maPon: '800000',
    VaquamarRe: '66cdaa',
    VXe: 'cd',
    VScEd: 'ba55d3',
    VpurpN: '9370db',
    VsHgYF: '3cb371',
    VUXe: '7b68ee',
    VsprRggYF: 'fa9a',
    VQe: '48d1cc',
    VviTetYd: 'c71585',
    midnightXe: '191970',
    mRtcYam: 'f5fffa',
    mistyPse: 'ffe4e1',
    moccasR: 'ffe4b5',
    navajowEte: 'ffdead',
    navy: '80',
    Tdlace: 'fdf5e6',
    Tive: '808000',
    TivedBb: '6b8e23',
    Sange: 'ffa500',
    SangeYd: 'ff4500',
    ScEd: 'da70d6',
    pOegTMnPd: 'eee8aa',
    pOegYF: '98fb98',
    pOeQe: 'afeeee',
    pOeviTetYd: 'db7093',
    papayawEp: 'ffefd5',
    pHKpuff: 'ffdab9',
    peru: 'cd853f',
    pRk: 'ffc0cb',
    plum: 'dda0dd',
    powMrXe: 'b0e0e6',
    purpN: '800080',
    YbeccapurpN: '663399',
    Yd: 'ff0000',
    Psybrown: 'bc8f8f',
    PyOXe: '4169e1',
    saddNbPwn: '8b4513',
    sOmon: 'fa8072',
    sandybPwn: 'f4a460',
    sHgYF: '2e8b57',
    sHshell: 'fff5ee',
    siFna: 'a0522d',
    silver: 'c0c0c0',
    skyXe: '87ceeb',
    UXe: '6a5acd',
    UWay: '708090',
    UgYy: '708090',
    snow: 'fffafa',
    sprRggYF: 'ff7f',
    stAlXe: '4682b4',
    tan: 'd2b48c',
    teO: '8080',
    tEstN: 'd8bfd8',
    tomato: 'ff6347',
    Qe: '40e0d0',
    viTet: 'ee82ee',
    JHt: 'f5deb3',
    wEte: 'ffffff',
    wEtesmoke: 'f5f5f5',
    Lw: 'ffff00',
    LwgYF: '9acd32'
  };
  function unpack() {
    const unpacked = {};
    const keys = Object.keys(names);
    const tkeys = Object.keys(map$1);
    let i, j, k, ok, nk;
    for (i = 0; i < keys.length; i++) {
      ok = nk = keys[i];
      for (j = 0; j < tkeys.length; j++) {
        k = tkeys[j];
        nk = nk.replace(k, map$1[k]);
      }
      k = parseInt(names[ok], 16);
      unpacked[nk] = [k >> 16 & 0xFF, k >> 8 & 0xFF, k & 0xFF];
    }
    return unpacked;
  }
  let names$1;
  function nameParse(str) {
    if (!names$1) {
      names$1 = unpack();
      names$1.transparent = [0, 0, 0, 0];
    }
    const a = names$1[str.toLowerCase()];
    return a && {
      r: a[0],
      g: a[1],
      b: a[2],
      a: a.length === 4 ? a[3] : 255
    };
  }
  function modHSL(v, i, ratio) {
    if (v) {
      let tmp = rgb2hsl(v);
      tmp[i] = Math.max(0, Math.min(tmp[i] + tmp[i] * ratio, i === 0 ? 360 : 1));
      tmp = hsl2rgb(tmp);
      v.r = tmp[0];
      v.g = tmp[1];
      v.b = tmp[2];
    }
  }
  function clone$1(v, proto) {
    return v ? _extends(proto || {}, v) : v;
  }
  function fromObject(input) {
    let v = {
      r: 0,
      g: 0,
      b: 0,
      a: 255
    };
    if (Array.isArray(input)) {
      if (input.length >= 3) {
        v = {
          r: input[0],
          g: input[1],
          b: input[2],
          a: 255
        };
        if (input.length > 3) {
          v.a = n2b(input[3]);
        }
      }
    } else {
      v = clone$1(input, {
        r: 0,
        g: 0,
        b: 0,
        a: 1
      });
      v.a = n2b(v.a);
    }
    return v;
  }
  function functionParse(str) {
    if (str.charAt(0) === 'r') {
      return rgbParse(str);
    }
    return hueParse(str);
  }
  const Color = function () {
    function Color(input) {
      if (input instanceof Color) {
        return input;
      }
      const type = typeof input;
      let v;
      if (type === 'object') {
        v = fromObject(input);
      } else if (type === 'string') {
        v = hexParse(input) || nameParse(input) || functionParse(input);
      }
      this._rgb = v;
      this._valid = !!v;
    }
    const _proto = Color.prototype;
    _proto.rgbString = function rgbString() {
      return this._valid ? _rgbString(this._rgb) : this._rgb;
    };
    _proto.hexString = function hexString() {
      return this._valid ? _hexString(this._rgb) : this._rgb;
    };
    _proto.hslString = function hslString() {
      return this._valid ? _hslString(this._rgb) : this._rgb;
    };
    _proto.mix = function mix(color, weight) {
      const me = this;
      if (color) {
        const c1 = me.rgb;
        const c2 = color.rgb;
        let w2;
        const p = weight === w2 ? 0.5 : weight;
        const w = 2 * p - 1;
        const a = c1.a - c2.a;
        const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
        w2 = 1 - w1;
        c1.r = 0xFF & w1 * c1.r + w2 * c2.r + 0.5;
        c1.g = 0xFF & w1 * c1.g + w2 * c2.g + 0.5;
        c1.b = 0xFF & w1 * c1.b + w2 * c2.b + 0.5;
        c1.a = p * c1.a + (1 - p) * c2.a;
        me.rgb = c1;
      }
      return me;
    };
    _proto.clone = function clone() {
      return new Color(this.rgb);
    };
    _proto.alpha = function alpha(a) {
      this._rgb.a = n2b(a);
      return this;
    };
    _proto.clearer = function clearer(ratio) {
      const rgb = this._rgb;
      rgb.a *= 1 - ratio;
      return this;
    };
    _proto.greyscale = function greyscale() {
      const rgb = this._rgb;
      const val = round(rgb.r * 0.3 + rgb.g * 0.59 + rgb.b * 0.11);
      rgb.r = rgb.g = rgb.b = val;
      return this;
    };
    _proto.opaquer = function opaquer(ratio) {
      const rgb = this._rgb;
      rgb.a *= 1 + ratio;
      return this;
    };
    _proto.negate = function negate() {
      const v = this._rgb;
      v.r = 255 - v.r;
      v.g = 255 - v.g;
      v.b = 255 - v.b;
      return this;
    };
    _proto.lighten = function lighten(ratio) {
      modHSL(this._rgb, 2, ratio);
      return this;
    };
    _proto.darken = function darken(ratio) {
      modHSL(this._rgb, 2, -ratio);
      return this;
    };
    _proto.saturate = function saturate(ratio) {
      modHSL(this._rgb, 1, ratio);
      return this;
    };
    _proto.desaturate = function desaturate(ratio) {
      modHSL(this._rgb, 1, -ratio);
      return this;
    };
    _proto.rotate = function rotate(deg) {
      _rotate(this._rgb, deg);
      return this;
    };
    _createClass(Color, [{
      key: 'valid',
      get: function get() {
        return this._valid;
      }
    }, {
      key: 'rgb',
      get: function get() {
        const v = clone$1(this._rgb);
        if (v) {
          v.a = b2n(v.a);
        }
        return v;
      },
      set: function set(obj) {
        this._rgb = fromObject(obj);
      }
    }]);
    return Color;
  }();
  function index_esm(input) {
    return new Color(input);
  }

  const isPatternOrGradient = function isPatternOrGradient(value) {
    return value instanceof CanvasGradient || value instanceof CanvasPattern;
  };
  function color(value) {
    return isPatternOrGradient(value) ? value : index_esm(value);
  }
  function getHoverColor(value) {
    return isPatternOrGradient(value) ? value : index_esm(value).saturate(0.5).darken(0.1).hexString();
  }

  const transparent = 'transparent';
  const interpolators = {
    boolean: function boolean(from, to, factor) {
      return factor > 0.5 ? to : from;
    },
    color: function color$1(from, to, factor) {
      const c0 = color(from || transparent);
      const c1 = c0.valid && color(to || transparent);
      return c1 && c1.valid ? c1.mix(c0, factor).hexString() : to;
    },
    number: function number(from, to, factor) {
      return from + (to - from) * factor;
    }
  };
  const Animation = function () {
    function Animation(cfg, target, prop, to) {
      const currentValue = target[prop];
      to = resolve([cfg.to, to, currentValue, cfg.from]);
      const from = resolve([cfg.from, currentValue, to]);
      this._active = true;
      this._fn = cfg.fn || interpolators[cfg.type || typeof from];
      this._easing = effects[cfg.easing || 'linear'];
      this._start = Math.floor(Date.now() + (cfg.delay || 0));
      this._duration = Math.floor(cfg.duration);
      this._loop = !!cfg.loop;
      this._target = target;
      this._prop = prop;
      this._from = from;
      this._to = to;
      this._promises = undefined;
    }
    const _proto = Animation.prototype;
    _proto.active = function active() {
      return this._active;
    };
    _proto.update = function update(cfg, to, date) {
      const me = this;
      if (me._active) {
        const currentValue = me._target[me._prop];
        const elapsed = date - me._start;
        const remain = me._duration - elapsed;
        me._start = date;
        me._duration = Math.floor(Math.max(remain, cfg.duration));
        me._loop = !!cfg.loop;
        me._to = resolve([cfg.to, to, currentValue, cfg.from]);
        me._from = resolve([cfg.from, currentValue, to]);
      }
    };
    _proto.cancel = function cancel() {
      const me = this;
      if (me._active) {
        me.tick(Date.now());
        me._active = false;
        me._notify(false);
      }
    };
    _proto.tick = function tick(date) {
      const me = this;
      const elapsed = date - me._start;
      const duration = me._duration;
      const prop = me._prop;
      const from = me._from;
      const loop = me._loop;
      const to = me._to;
      let factor;
      me._active = from !== to && (loop || elapsed < duration);
      if (!me._active) {
        me._target[prop] = to;
        me._notify(true);
        return;
      }
      if (elapsed < 0) {
        me._target[prop] = from;
        return;
      }
      factor = elapsed / duration % 2;
      factor = loop && factor > 1 ? 2 - factor : factor;
      factor = me._easing(Math.min(1, Math.max(0, factor)));
      me._target[prop] = me._fn(from, to, factor);
    };
    _proto.wait = function wait() {
      const promises = this._promises || (this._promises = []);
      return new Promise(function (res, rej) {
        promises.push({
          res: res,
          rej: rej
        });
      });
    };
    _proto._notify = function _notify(resolved) {
      const method = resolved ? 'res' : 'rej';
      const promises = this._promises || [];
      for (let i = 0; i < promises.length; i++) {
        promises[i][method]();
      }
    };
    return Animation;
  }();

  const numbers = ['x', 'y', 'borderWidth', 'radius', 'tension'];
  const colors = ['borderColor', 'backgroundColor'];
  defaults.set('animation', {
    duration: 1000,
    easing: 'easeOutQuart',
    onProgress: noop,
    onComplete: noop,
    colors: {
      type: 'color',
      properties: colors
    },
    numbers: {
      type: 'number',
      properties: numbers
    },
    active: {
      duration: 400
    },
    resize: {
      duration: 0
    },
    show: {
      colors: {
        type: 'color',
        properties: colors,
        from: 'transparent'
      },
      visible: {
        type: 'boolean',
        duration: 0
      }
    },
    hide: {
      colors: {
        type: 'color',
        properties: colors,
        to: 'transparent'
      },
      visible: {
        type: 'boolean',
        easing: 'easeInExpo'
      }
    }
  });
  function copyOptions(target, values) {
    const oldOpts = target.options;
    const newOpts = values.options;
    if (!oldOpts || !newOpts) {
      return;
    }
    if (oldOpts.$shared && !newOpts.$shared) {
      target.options = _extends({}, oldOpts, newOpts, {
        $shared: false
      });
    } else {
      _extends(oldOpts, newOpts);
    }
    delete values.options;
  }
  function extensibleConfig(animations) {
    const result = {};
    Object.keys(animations).forEach(function (key) {
      const value = animations[key];
      if (!isObject(value)) {
        result[key] = value;
      }
    });
    return result;
  }
  const Animations = function () {
    function Animations(chart, animations) {
      this._chart = chart;
      this._properties = new Map();
      this.configure(animations);
    }
    const _proto = Animations.prototype;
    _proto.configure = function configure(animations) {
      if (!isObject(animations)) {
        return;
      }
      const animatedProps = this._properties;
      const animDefaults = extensibleConfig(animations);
      Object.keys(animations).forEach(function (key) {
        const cfg = animations[key];
        if (!isObject(cfg)) {
          return;
        }
        (cfg.properties || [key]).forEach(function (prop) {
          if (!animatedProps.has(prop)) {
            animatedProps.set(prop, _extends({}, animDefaults, cfg));
          } else if (prop === key) {
            const _animatedProps$get = animatedProps.get(prop),
              properties = _animatedProps$get.properties,
              inherited = _objectWithoutPropertiesLoose(_animatedProps$get, ['properties']);
            animatedProps.set(prop, _extends({}, inherited, cfg));
          }
        });
      });
    }
    ;
    _proto._animateOptions = function _animateOptions(target, values) {
      const newOptions = values.options;
      const options = resolveTargetOptions(target, newOptions);
      if (!options) {
        return [];
      }
      const animations = this._createAnimations(options, newOptions);
      if (newOptions.$shared && !options.$shared) {
        awaitAll(target.options.$animations, newOptions).then(function () {
          target.options = newOptions;
        });
      }
      return animations;
    }
    ;
    _proto._createAnimations = function _createAnimations(target, values) {
      const animatedProps = this._properties;
      const animations = [];
      const running = target.$animations || (target.$animations = {});
      const props = Object.keys(values);
      const date = Date.now();
      let i;
      for (i = props.length - 1; i >= 0; --i) {
        const prop = props[i];
        if (prop.charAt(0) === '$') {
          continue;
        }
        if (prop === 'options') {
          animations.push.apply(animations, this._animateOptions(target, values));
          continue;
        }
        const value = values[prop];
        let animation = running[prop];
        const cfg = animatedProps.get(prop);
        if (animation) {
          if (cfg && animation.active()) {
            animation.update(cfg, value, date);
            continue;
          } else {
            animation.cancel();
          }
        }
        if (!cfg || !cfg.duration) {
          target[prop] = value;
          continue;
        }
        running[prop] = animation = new Animation(cfg, target, prop, value);
        animations.push(animation);
      }
      return animations;
    }
    ;
    _proto.update = function update(target, values) {
      if (this._properties.size === 0) {
        copyOptions(target, values);
        _extends(target, values);
        return;
      }
      const animations = this._createAnimations(target, values);
      if (animations.length) {
        animator.add(this._chart, animations);
        return true;
      }
    };
    return Animations;
  }();
  function awaitAll(animations, properties) {
    const running = [];
    const keys = Object.keys(properties);
    for (let i = 0; i < keys.length; i++) {
      const anim = animations[keys[i]];
      if (anim && anim.active()) {
        running.push(anim.wait());
      }
    }
    return Promise.all(running);
  }
  function resolveTargetOptions(target, newOptions) {
    if (!newOptions) {
      return;
    }
    let options = target.options;
    if (!options) {
      target.options = newOptions;
      return;
    }
    if (options.$shared && !newOptions.$shared) {
      target.options = options = _extends({}, options, {
        $shared: false,
        $animations: {}
      });
    }
    return options;
  }

  function scaleClip(scale, allowedOverflow) {
    const opts = scale && scale.options || {};
    const reverse = opts.reverse;
    const min = opts.min === undefined ? allowedOverflow : 0;
    const max = opts.max === undefined ? allowedOverflow : 0;
    return {
      start: reverse ? max : min,
      end: reverse ? min : max
    };
  }
  function defaultClip(xScale, yScale, allowedOverflow) {
    if (allowedOverflow === false) {
      return false;
    }
    const x = scaleClip(xScale, allowedOverflow);
    const y = scaleClip(yScale, allowedOverflow);
    return {
      top: y.end,
      right: x.end,
      bottom: y.start,
      left: x.start
    };
  }
  function toClip(value) {
    let t, r, b, l;
    if (isObject(value)) {
      t = value.top;
      r = value.right;
      b = value.bottom;
      l = value.left;
    } else {
      t = r = b = l = value;
    }
    return {
      top: t,
      right: r,
      bottom: b,
      left: l
    };
  }
  function getSortedDatasetIndices(chart, filterVisible) {
    const keys = [];
    const metasets = chart._getSortedDatasetMetas(filterVisible);
    let i, ilen;
    for (i = 0, ilen = metasets.length; i < ilen; ++i) {
      keys.push(metasets[i].index);
    }
    return keys;
  }
  function _applyStack(stack, value, dsIndex, allOther) {
    const keys = stack.keys;
    let i, ilen, datasetIndex, otherValue;
    for (i = 0, ilen = keys.length; i < ilen; ++i) {
      datasetIndex = +keys[i];
      if (datasetIndex === dsIndex) {
        if (allOther) {
          continue;
        }
        break;
      }
      otherValue = stack.values[datasetIndex];
      if (!isNaN(otherValue) && (value === 0 || sign(value) === sign(otherValue))) {
        value += otherValue;
      }
    }
    return value;
  }
  function convertObjectDataToArray(data) {
    const keys = Object.keys(data);
    const adata = new Array(keys.length);
    let i, ilen, key;
    for (i = 0, ilen = keys.length; i < ilen; ++i) {
      key = keys[i];
      adata[i] = {
        x: key,
        y: data[key]
      };
    }
    return adata;
  }
  function isStacked(scale, meta) {
    const stacked = scale && scale.options.stacked;
    return stacked || stacked === undefined && meta.stack !== undefined;
  }
  function getStackKey(indexScale, valueScale, meta) {
    return indexScale.id + '.' + valueScale.id + '.' + meta.stack + '.' + meta.type;
  }
  function getUserBounds(scale) {
    const _scale$getUserBounds = scale.getUserBounds(),
      min = _scale$getUserBounds.min,
      max = _scale$getUserBounds.max,
      minDefined = _scale$getUserBounds.minDefined,
      maxDefined = _scale$getUserBounds.maxDefined;
    return {
      min: minDefined ? min : Number.NEGATIVE_INFINITY,
      max: maxDefined ? max : Number.POSITIVE_INFINITY
    };
  }
  function getOrCreateStack(stacks, stackKey, indexValue) {
    const subStack = stacks[stackKey] || (stacks[stackKey] = {});
    return subStack[indexValue] || (subStack[indexValue] = {});
  }
  function updateStacks(controller, parsed) {
    const chart = controller.chart,
      meta = controller._cachedMeta;
    const stacks = chart._stacks || (chart._stacks = {});
    const iScale = meta.iScale,
      vScale = meta.vScale,
      datasetIndex = meta.index;
    const iAxis = iScale.axis;
    const vAxis = vScale.axis;
    const key = getStackKey(iScale, vScale, meta);
    const ilen = parsed.length;
    let stack;
    for (let i = 0; i < ilen; ++i) {
      const item = parsed[i];
      const index = item[iAxis],
        value = item[vAxis];
      const itemStacks = item._stacks || (item._stacks = {});
      stack = itemStacks[vAxis] = getOrCreateStack(stacks, key, index);
      stack[datasetIndex] = value;
    }
  }
  function getFirstScaleId(chart, axis) {
    const scales = chart.scales;
    return Object.keys(scales).filter(function (key) {
      return scales[key].axis === axis;
    }).shift();
  }
  function createDatasetContext(parent, index, dataset) {
    return Object.create(parent, {
      active: {
        writable: true,
        value: false
      },
      dataset: {
        value: dataset
      },
      datasetIndex: {
        value: index
      },
      index: {
        get: function get() {
          return this.datasetIndex;
        }
      },
      type: {
        value: 'dataset'
      }
    });
  }
  function createDataContext(parent, index, point, element) {
    return Object.create(parent, {
      active: {
        writable: true,
        value: false
      },
      dataIndex: {
        value: index
      },
      dataPoint: {
        value: point
      },
      element: {
        value: element
      },
      index: {
        get: function get() {
          return this.dataIndex;
        }
      },
      type: {
        value: 'data'
      }
    });
  }
  function clearStacks(meta, items) {
    items = items || meta._parsed;
    items.forEach(function (parsed) {
      delete parsed._stacks[meta.vScale.id][meta.index];
    });
  }
  const optionKeys = function optionKeys(optionNames) {
    return isArray(optionNames) ? optionNames : Object.keys(optionNames);
  };
  const optionKey = function optionKey(key, active) {
    return active ? 'hover' + _capitalize(key) : key;
  };
  const isDirectUpdateMode = function isDirectUpdateMode(mode) {
    return mode === 'reset' || mode === 'none';
  };
  const cloneIfNotShared = function cloneIfNotShared(cached, shared) {
    return shared ? cached : _extends({}, cached);
  };
  const freezeIfShared = function freezeIfShared(values, shared) {
    return shared ? Object.freeze(values) : values;
  };
  const DatasetController = function () {
    function DatasetController(chart, datasetIndex) {
      this.chart = chart;
      this._ctx = chart.ctx;
      this.index = datasetIndex;
      this._cachedAnimations = {};
      this._cachedDataOpts = {};
      this._cachedMeta = this.getMeta();
      this._type = this._cachedMeta.type;
      this._config = undefined;
      this._parsing = false;
      this._data = undefined;
      this._objectData = undefined;
      this._sharedOptions = undefined;
      this._drawStart = undefined;
      this._drawCount = undefined;
      this.enableOptionSharing = false;
      this.$context = undefined;
      this.initialize();
    }
    const _proto = DatasetController.prototype;
    _proto.initialize = function initialize() {
      const me = this;
      const meta = me._cachedMeta;
      me.configure();
      me.linkScales();
      meta._stacked = isStacked(meta.vScale, meta);
      me.addElements();
    };
    _proto.updateIndex = function updateIndex(datasetIndex) {
      this.index = datasetIndex;
    };
    _proto.linkScales = function linkScales() {
      const me = this;
      const chart = me.chart;
      const meta = me._cachedMeta;
      const dataset = me.getDataset();
      const chooseId = function chooseId(axis, x, y, r) {
        return axis === 'x' ? x : axis === 'r' ? r : y;
      };
      const xid = meta.xAxisID = valueOrDefault(dataset.xAxisID, getFirstScaleId(chart, 'x'));
      const yid = meta.yAxisID = valueOrDefault(dataset.yAxisID, getFirstScaleId(chart, 'y'));
      const rid = meta.rAxisID = valueOrDefault(dataset.rAxisID, getFirstScaleId(chart, 'r'));
      const indexAxis = meta.indexAxis;
      const iid = meta.iAxisID = chooseId(indexAxis, xid, yid, rid);
      const vid = meta.vAxisID = chooseId(indexAxis, yid, xid, rid);
      meta.xScale = me.getScaleForId(xid);
      meta.yScale = me.getScaleForId(yid);
      meta.rScale = me.getScaleForId(rid);
      meta.iScale = me.getScaleForId(iid);
      meta.vScale = me.getScaleForId(vid);
    };
    _proto.getDataset = function getDataset() {
      return this.chart.data.datasets[this.index];
    };
    _proto.getMeta = function getMeta() {
      return this.chart.getDatasetMeta(this.index);
    }
    ;
    _proto.getScaleForId = function getScaleForId(scaleID) {
      return this.chart.scales[scaleID];
    }
    ;
    _proto._getOtherScale = function _getOtherScale(scale) {
      const meta = this._cachedMeta;
      return scale === meta.iScale ? meta.vScale : meta.iScale;
    };
    _proto.reset = function reset() {
      this._update('reset');
    }
    ;
    _proto._destroy = function _destroy() {
      const meta = this._cachedMeta;
      if (this._data) {
        unlistenArrayEvents(this._data, this);
      }
      if (meta._stacked) {
        clearStacks(meta);
      }
    }
    ;
    _proto._dataCheck = function _dataCheck() {
      const me = this;
      const dataset = me.getDataset();
      const data = dataset.data || (dataset.data = []);
      if (isObject(data)) {
        me._data = convertObjectDataToArray(data);
      } else if (me._data !== data) {
        if (me._data) {
          unlistenArrayEvents(me._data, me);
        }
        if (data && Object.isExtensible(data)) {
          listenArrayEvents(data, me);
        }
        me._data = data;
      }
    };
    _proto.addElements = function addElements() {
      const me = this;
      const meta = me._cachedMeta;
      me._dataCheck();
      const data = me._data;
      const metaData = meta.data = new Array(data.length);
      for (let i = 0, ilen = data.length; i < ilen; ++i) {
        metaData[i] = new me.dataElementType();
      }
      if (me.datasetElementType) {
        meta.dataset = new me.datasetElementType();
      }
    };
    _proto.buildOrUpdateElements = function buildOrUpdateElements() {
      const me = this;
      const meta = me._cachedMeta;
      const dataset = me.getDataset();
      let stackChanged = false;
      me._dataCheck();
      meta._stacked = isStacked(meta.vScale, meta);
      if (meta.stack !== dataset.stack) {
        stackChanged = true;
        clearStacks(meta);
        meta.stack = dataset.stack;
      }
      me._resyncElements();
      if (stackChanged) {
        updateStacks(me, meta._parsed);
      }
    }
    ;
    _proto.configure = function configure() {
      const me = this;
      me._config = merge(Object.create(null), [defaults.controllers[me._type].datasets, (me.chart.options[me._type] || {}).datasets, me.getDataset()], {
        merger: function merger(key, target, source) {
          if (key !== 'data') {
            _merger(key, target, source);
          }
        }
      });
      me._parsing = resolve([me._config.parsing, me.chart.options.parsing, true]);
    }
    ;
    _proto.parse = function parse(start, count) {
      const me = this;
      const meta = me._cachedMeta,
        data = me._data;
      const iScale = meta.iScale,
        vScale = meta.vScale,
        _stacked = meta._stacked;
      const iAxis = iScale.axis;
      let sorted = true;
      let i, parsed, cur, prev;
      if (start > 0) {
        sorted = meta._sorted;
        prev = meta._parsed[start - 1];
      }
      if (me._parsing === false) {
        meta._parsed = data;
        meta._sorted = true;
      } else {
        if (isArray(data[start])) {
          parsed = me.parseArrayData(meta, data, start, count);
        } else if (isObject(data[start])) {
          parsed = me.parseObjectData(meta, data, start, count);
        } else {
          parsed = me.parsePrimitiveData(meta, data, start, count);
        }
        const isNotInOrderComparedToPrev = function isNotInOrderComparedToPrev() {
          return isNaN(cur[iAxis]) || prev && cur[iAxis] < prev[iAxis];
        };
        for (i = 0; i < count; ++i) {
          meta._parsed[i + start] = cur = parsed[i];
          if (sorted) {
            if (isNotInOrderComparedToPrev()) {
              sorted = false;
            }
            prev = cur;
          }
        }
        meta._sorted = sorted;
      }
      if (_stacked) {
        updateStacks(me, parsed);
      }
      iScale.invalidateCaches();
      vScale.invalidateCaches();
    }
    ;
    _proto.parsePrimitiveData = function parsePrimitiveData(meta, data, start, count) {
      const iScale = meta.iScale,
        vScale = meta.vScale;
      const iAxis = iScale.axis;
      const vAxis = vScale.axis;
      const labels = iScale.getLabels();
      const singleScale = iScale === vScale;
      const parsed = new Array(count);
      let i, ilen, index;
      for (i = 0, ilen = count; i < ilen; ++i) {
        var _parsed$i;
        index = i + start;
        parsed[i] = (_parsed$i = {}, _parsed$i[iAxis] = singleScale || iScale.parse(labels[index], index), _parsed$i[vAxis] = vScale.parse(data[index], index), _parsed$i);
      }
      return parsed;
    }
    ;
    _proto.parseArrayData = function parseArrayData(meta, data, start, count) {
      const xScale = meta.xScale,
        yScale = meta.yScale;
      const parsed = new Array(count);
      let i, ilen, index, item;
      for (i = 0, ilen = count; i < ilen; ++i) {
        index = i + start;
        item = data[index];
        parsed[i] = {
          x: xScale.parse(item[0], index),
          y: yScale.parse(item[1], index)
        };
      }
      return parsed;
    }
    ;
    _proto.parseObjectData = function parseObjectData(meta, data, start, count) {
      const xScale = meta.xScale,
        yScale = meta.yScale;
      const _this$_parsing = this._parsing,
        _this$_parsing$xAxisK = _this$_parsing.xAxisKey,
        xAxisKey = _this$_parsing$xAxisK === void 0 ? 'x' : _this$_parsing$xAxisK,
        _this$_parsing$yAxisK = _this$_parsing.yAxisKey,
        yAxisKey = _this$_parsing$yAxisK === void 0 ? 'y' : _this$_parsing$yAxisK;
      const parsed = new Array(count);
      let i, ilen, index, item;
      for (i = 0, ilen = count; i < ilen; ++i) {
        index = i + start;
        item = data[index];
        parsed[i] = {
          x: xScale.parse(resolveObjectKey(item, xAxisKey), index),
          y: yScale.parse(resolveObjectKey(item, yAxisKey), index)
        };
      }
      return parsed;
    }
    ;
    _proto.getParsed = function getParsed(index) {
      return this._cachedMeta._parsed[index];
    }
    ;
    _proto.getDataElement = function getDataElement(index) {
      return this._cachedMeta.data[index];
    }
    ;
    _proto.applyStack = function applyStack(scale, parsed) {
      const chart = this.chart;
      const meta = this._cachedMeta;
      const value = parsed[scale.axis];
      const stack = {
        keys: getSortedDatasetIndices(chart, true),
        values: parsed._stacks[scale.axis]
      };
      return _applyStack(stack, value, meta.index);
    }
    ;
    _proto.updateRangeFromParsed = function updateRangeFromParsed(range, scale, parsed, stack) {
      let value = parsed[scale.axis];
      const values = stack && parsed._stacks[scale.axis];
      if (stack && values) {
        stack.values = values;
        range.min = Math.min(range.min, value);
        range.max = Math.max(range.max, value);
        value = _applyStack(stack, value, this._cachedMeta.index, true);
      }
      range.min = Math.min(range.min, value);
      range.max = Math.max(range.max, value);
    }
    ;
    _proto.getMinMax = function getMinMax(scale, canStack) {
      const me = this;
      const meta = me._cachedMeta;
      const _parsed = meta._parsed;
      const sorted = meta._sorted && scale === meta.iScale;
      const ilen = _parsed.length;
      const otherScale = me._getOtherScale(scale);
      const stack = canStack && meta._stacked && {
        keys: getSortedDatasetIndices(me.chart, true),
        values: null
      };
      const range = {
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY
      };
      const _getUserBounds = getUserBounds(otherScale),
        otherMin = _getUserBounds.min,
        otherMax = _getUserBounds.max;
      let i, value, parsed, otherValue;
      function _skip() {
        parsed = _parsed[i];
        value = parsed[scale.axis];
        otherValue = parsed[otherScale.axis];
        return isNaN(value) || isNaN(otherValue) || otherMin > otherValue || otherMax < otherValue;
      }
      for (i = 0; i < ilen; ++i) {
        if (_skip()) {
          continue;
        }
        me.updateRangeFromParsed(range, scale, parsed, stack);
        if (sorted) {
          break;
        }
      }
      if (sorted) {
        for (i = ilen - 1; i >= 0; --i) {
          if (_skip()) {
            continue;
          }
          me.updateRangeFromParsed(range, scale, parsed, stack);
          break;
        }
      }
      return range;
    };
    _proto.getAllParsedValues = function getAllParsedValues(scale) {
      const parsed = this._cachedMeta._parsed;
      const values = [];
      let i, ilen, value;
      for (i = 0, ilen = parsed.length; i < ilen; ++i) {
        value = parsed[i][scale.axis];
        if (!isNaN(value)) {
          values.push(value);
        }
      }
      return values;
    }
    ;
    _proto.getMaxOverflow = function getMaxOverflow() {
      return false;
    }
    ;
    _proto.getLabelAndValue = function getLabelAndValue(index) {
      const me = this;
      const meta = me._cachedMeta;
      const iScale = meta.iScale;
      const vScale = meta.vScale;
      const parsed = me.getParsed(index);
      return {
        label: iScale ? '' + iScale.getLabelForValue(parsed[iScale.axis]) : '',
        value: vScale ? '' + vScale.getLabelForValue(parsed[vScale.axis]) : ''
      };
    }
    ;
    _proto._update = function _update(mode) {
      const me = this;
      const meta = me._cachedMeta;
      me.configure();
      me._cachedAnimations = {};
      me._cachedDataOpts = {};
      me.update(mode || 'default');
      meta._clip = toClip(valueOrDefault(me._config.clip, defaultClip(meta.xScale, meta.yScale, me.getMaxOverflow())));
    }
    ;
    _proto.update = function update(mode) {}
    ;
    _proto.draw = function draw() {
      const me = this;
      const ctx = me._ctx;
      const chart = me.chart;
      const meta = me._cachedMeta;
      const elements = meta.data || [];
      const area = chart.chartArea;
      const active = [];
      const start = me._drawStart || 0;
      const count = me._drawCount || elements.length - start;
      let i;
      if (meta.dataset) {
        meta.dataset.draw(ctx, area, start, count);
      }
      for (i = start; i < start + count; ++i) {
        const element = elements[i];
        if (element.active) {
          active.push(element);
        } else {
          element.draw(ctx, area);
        }
      }
      for (i = 0; i < active.length; ++i) {
        active[i].draw(ctx, area);
      }
    }
    ;
    _proto._addAutomaticHoverColors = function _addAutomaticHoverColors(index, options) {
      const me = this;
      const normalOptions = me.getStyle(index);
      const missingColors = Object.keys(normalOptions).filter(function (key) {
        return key.indexOf('Color') !== -1 && !(key in options);
      });
      let i = missingColors.length - 1;
      let color;
      for (; i >= 0; i--) {
        color = missingColors[i];
        options[color] = getHoverColor(normalOptions[color]);
      }
    }
    ;
    _proto.getStyle = function getStyle(index, active) {
      const me = this;
      const meta = me._cachedMeta;
      const dataset = meta.dataset;
      if (!me._config) {
        me.configure();
      }
      const options = dataset && index === undefined ? me.resolveDatasetElementOptions(active) : me.resolveDataElementOptions(index || 0, active && 'active');
      if (active) {
        me._addAutomaticHoverColors(index, options);
      }
      return options;
    }
    ;
    _proto.getContext = function getContext(index, active) {
      const me = this;
      let context;
      if (index >= 0 && index < me._cachedMeta.data.length) {
        const element = me._cachedMeta.data[index];
        context = element.$context || (element.$context = createDataContext(me.getContext(), index, me.getParsed(index), element));
      } else {
        context = me.$context || (me.$context = createDatasetContext(me.chart.getContext(), me.index, me.getDataset()));
      }
      context.active = !!active;
      return context;
    }
    ;
    _proto.resolveDatasetElementOptions = function resolveDatasetElementOptions(active) {
      return this._resolveOptions(this.datasetElementOptions, {
        active: active,
        type: this.datasetElementType.id
      });
    }
    ;
    _proto.resolveDataElementOptions = function resolveDataElementOptions(index, mode) {
      mode = mode || 'default';
      const me = this;
      const active = mode === 'active';
      const cache = me._cachedDataOpts;
      const cached = cache[mode];
      const sharing = me.enableOptionSharing;
      if (cached) {
        return cloneIfNotShared(cached, sharing);
      }
      const info = {
        cacheable: !active
      };
      const values = me._resolveOptions(me.dataElementOptions, {
        index: index,
        active: active,
        info: info,
        type: me.dataElementType.id
      });
      if (info.cacheable) {
        values.$shared = sharing;
        cache[mode] = freezeIfShared(values, sharing);
      }
      return values;
    }
    ;
    _proto._resolveOptions = function _resolveOptions(optionNames, args) {
      const me = this;
      const index = args.index,
        active = args.active,
        type = args.type,
        info = args.info;
      const datasetOpts = me._config;
      const options = me.chart.options.elements[type] || {};
      const values = {};
      const context = me.getContext(index, active);
      const keys = optionKeys(optionNames);
      for (let i = 0, ilen = keys.length; i < ilen; ++i) {
        const key = keys[i];
        const readKey = optionKey(key, active);
        const value = resolve([datasetOpts[optionNames[readKey]], datasetOpts[readKey], options[readKey]], context, index, info);
        if (value !== undefined) {
          values[key] = value;
        }
      }
      return values;
    }
    ;
    _proto._resolveAnimations = function _resolveAnimations(index, mode, active) {
      const me = this;
      const chart = me.chart;
      const cached = me._cachedAnimations;
      mode = mode || 'default';
      if (cached[mode]) {
        return cached[mode];
      }
      const info = {
        cacheable: true
      };
      const context = me.getContext(index, active);
      const chartAnim = resolve([chart.options.animation], context, index, info);
      const datasetAnim = resolve([me._config.animation], context, index, info);
      let config = chartAnim && mergeIf({}, [datasetAnim, chartAnim]);
      if (config[mode]) {
        config = _extends({}, config, config[mode]);
      }
      const animations = new Animations(chart, config);
      if (info.cacheable) {
        cached[mode] = animations && Object.freeze(animations);
      }
      return animations;
    }
    ;
    _proto.getSharedOptions = function getSharedOptions(options) {
      if (!options.$shared) {
        return;
      }
      return this._sharedOptions || (this._sharedOptions = _extends({}, options));
    }
    ;
    _proto.includeOptions = function includeOptions(mode, sharedOptions) {
      return !sharedOptions || isDirectUpdateMode(mode);
    }
    ;
    _proto.updateElement = function updateElement(element, index, properties, mode) {
      if (isDirectUpdateMode(mode)) {
        _extends(element, properties);
      } else {
        this._resolveAnimations(index, mode).update(element, properties);
      }
    }
    ;
    _proto.updateSharedOptions = function updateSharedOptions(sharedOptions, mode, newOptions) {
      if (sharedOptions) {
        this._resolveAnimations(undefined, mode).update({
          options: sharedOptions
        }, {
          options: newOptions
        });
      }
    }
    ;
    _proto._setStyle = function _setStyle(element, index, mode, active) {
      element.active = active;
      const options = this.getStyle(index, active);
      this._resolveAnimations(index, mode, active).update(element, {
        options: this.getSharedOptions(options) || options
      });
    };
    _proto.removeHoverStyle = function removeHoverStyle(element, datasetIndex, index) {
      this._setStyle(element, index, 'active', false);
    };
    _proto.setHoverStyle = function setHoverStyle(element, datasetIndex, index) {
      this._setStyle(element, index, 'active', true);
    }
    ;
    _proto._removeDatasetHoverStyle = function _removeDatasetHoverStyle() {
      const element = this._cachedMeta.dataset;
      if (element) {
        this._setStyle(element, undefined, 'active', false);
      }
    }
    ;
    _proto._setDatasetHoverStyle = function _setDatasetHoverStyle() {
      const element = this._cachedMeta.dataset;
      if (element) {
        this._setStyle(element, undefined, 'active', true);
      }
    }
    ;
    _proto._resyncElements = function _resyncElements() {
      const me = this;
      const numMeta = me._cachedMeta.data.length;
      const numData = me._data.length;
      if (numData > numMeta) {
        me._insertElements(numMeta, numData - numMeta);
      } else if (numData < numMeta) {
        me._removeElements(numData, numMeta - numData);
      }
      me.parse(0, Math.min(numData, numMeta));
    }
    ;
    _proto._insertElements = function _insertElements(start, count) {
      const me = this;
      const elements = new Array(count);
      const meta = me._cachedMeta;
      const data = meta.data;
      let i;
      for (i = 0; i < count; ++i) {
        elements[i] = new me.dataElementType();
      }
      data.splice.apply(data, [start, 0].concat(elements));
      if (me._parsing) {
        let _meta$_parsed;
        (_meta$_parsed = meta._parsed).splice.apply(_meta$_parsed, [start, 0].concat(new Array(count)));
      }
      me.parse(start, count);
      me.updateElements(data, start, count, 'reset');
    };
    _proto.updateElements = function updateElements(element, start, count, mode) {}
    ;
    _proto._removeElements = function _removeElements(start, count) {
      const me = this;
      const meta = me._cachedMeta;
      if (me._parsing) {
        const removed = meta._parsed.splice(start, count);
        if (meta._stacked) {
          clearStacks(meta, removed);
        }
      }
      meta.data.splice(start, count);
    }
    ;
    _proto._onDataPush = function _onDataPush() {
      const count = arguments.length;
      this._insertElements(this.getDataset().data.length - count, count);
    }
    ;
    _proto._onDataPop = function _onDataPop() {
      this._removeElements(this._cachedMeta.data.length - 1, 1);
    }
    ;
    _proto._onDataShift = function _onDataShift() {
      this._removeElements(0, 1);
    }
    ;
    _proto._onDataSplice = function _onDataSplice(start, count) {
      this._removeElements(start, count);
      this._insertElements(start, arguments.length - 2);
    }
    ;
    _proto._onDataUnshift = function _onDataUnshift() {
      this._insertElements(0, arguments.length);
    };
    return DatasetController;
  }();
  DatasetController.defaults = {};
  DatasetController.prototype.datasetElementType = null;
  DatasetController.prototype.dataElementType = null;
  DatasetController.prototype.datasetElementOptions = ['backgroundColor', 'borderCapStyle', 'borderColor', 'borderDash', 'borderDashOffset', 'borderJoinStyle', 'borderWidth'];
  DatasetController.prototype.dataElementOptions = ['backgroundColor', 'borderColor', 'borderWidth', 'pointStyle'];

  const Element$1 = function () {
    function Element() {
      this.x = undefined;
      this.y = undefined;
      this.active = false;
      this.options = undefined;
      this.$animations = undefined;
    }
    const _proto = Element.prototype;
    _proto.tooltipPosition = function tooltipPosition(useFinalPosition) {
      const _this$getProps = this.getProps(['x', 'y'], useFinalPosition),
        x = _this$getProps.x,
        y = _this$getProps.y;
      return {
        x: x,
        y: y
      };
    };
    _proto.hasValue = function hasValue() {
      return isNumber(this.x) && isNumber(this.y);
    }
    ;
    _proto.getProps = function getProps(props, final) {
      const me = this;
      const anims = this.$animations;
      if (!final || !anims) {
        return me;
      }
      const ret = {};
      props.forEach(function (prop) {
        ret[prop] = anims[prop] && anims[prop].active ? anims[prop]._to : me[prop];
      });
      return ret;
    };
    return Element;
  }();
  Element$1.defaults = {};
  Element$1.defaultRoutes = undefined;

  const intlCache = new Map();
  const formatters = {
    values: function values(value) {
      return isArray(value) ? value : '' + value;
    },
    numeric: function numeric(tickValue, index, ticks) {
      if (tickValue === 0) {
        return '0';
      }
      const locale = this.chart.options.locale;
      const maxTick = Math.max(Math.abs(ticks[0].value), Math.abs(ticks[ticks.length - 1].value));
      let notation;
      if (maxTick < 1e-4 || maxTick > 1e+15) {
        notation = 'scientific';
      }
      let delta = ticks.length > 3 ? ticks[2].value - ticks[1].value : ticks[1].value - ticks[0].value;
      if (Math.abs(delta) > 1 && tickValue !== Math.floor(tickValue)) {
        delta = tickValue - Math.floor(tickValue);
      }
      const logDelta = log10(Math.abs(delta));
      const numDecimal = Math.max(Math.min(-1 * Math.floor(logDelta), 20), 0);
      const options = {
        notation: notation,
        minimumFractionDigits: numDecimal,
        maximumFractionDigits: numDecimal
      };
      _extends(options, this.options.ticks.format);
      const cacheKey = locale + JSON.stringify(options);
      let formatter = intlCache.get(cacheKey);
      if (!formatter) {
        formatter = new Intl.NumberFormat(locale, options);
        intlCache.set(cacheKey, formatter);
      }
      return formatter.format(tickValue);
    }
  };
  formatters.logarithmic = function (tickValue, index, ticks) {
    if (tickValue === 0) {
      return '0';
    }
    const remain = tickValue / Math.pow(10, Math.floor(log10(tickValue)));
    if (remain === 1 || remain === 2 || remain === 5) {
      return formatters.numeric.call(this, tickValue, index, ticks);
    }
    return '';
  };
  const Ticks = {
    formatters: formatters
  };

  defaults.set('scale', {
    display: true,
    offset: false,
    reverse: false,
    beginAtZero: false,
    gridLines: {
      display: true,
      color: 'rgba(0,0,0,0.1)',
      lineWidth: 1,
      drawBorder: true,
      drawOnChartArea: true,
      drawTicks: true,
      tickMarkLength: 10,
      offsetGridLines: false,
      borderDash: [],
      borderDashOffset: 0.0
    },
    scaleLabel: {
      display: false,
      labelString: '',
      padding: {
        top: 4,
        bottom: 4
      }
    },
    ticks: {
      minRotation: 0,
      maxRotation: 50,
      mirror: false,
      lineWidth: 0,
      strokeStyle: '',
      padding: 0,
      display: true,
      autoSkip: true,
      autoSkipPadding: 0,
      labelOffset: 0,
      callback: Ticks.formatters.values,
      minor: {},
      major: {},
      align: 'center',
      crossAlign: 'near'
    }
  });
  function sample(arr, numItems) {
    const result = [];
    const increment = arr.length / numItems;
    const len = arr.length;
    let i = 0;
    for (; i < len; i += increment) {
      result.push(arr[Math.floor(i)]);
    }
    return result;
  }
  function getPixelForGridLine(scale, index, offsetGridLines) {
    const length = scale.ticks.length;
    const validIndex = Math.min(index, length - 1);
    const start = scale._startPixel;
    const end = scale._endPixel;
    const epsilon = 1e-6;
    let lineValue = scale.getPixelForTick(validIndex);
    let offset;
    if (offsetGridLines) {
      if (length === 1) {
        offset = Math.max(lineValue - start, end - lineValue);
      } else if (index === 0) {
        offset = (scale.getPixelForTick(1) - lineValue) / 2;
      } else {
        offset = (lineValue - scale.getPixelForTick(validIndex - 1)) / 2;
      }
      lineValue += validIndex < index ? offset : -offset;
      if (lineValue < start - epsilon || lineValue > end + epsilon) {
        return;
      }
    }
    return lineValue;
  }
  function garbageCollect(caches, length) {
    each(caches, function (cache) {
      const gc = cache.gc;
      const gcLen = gc.length / 2;
      let i;
      if (gcLen > length) {
        for (i = 0; i < gcLen; ++i) {
          delete cache.data[gc[i]];
        }
        gc.splice(0, gcLen);
      }
    });
  }
  function getTickMarkLength(options) {
    return options.drawTicks ? options.tickMarkLength : 0;
  }
  function getScaleLabelHeight(options, fallback) {
    if (!options.display) {
      return 0;
    }
    const font = toFont(options.font, fallback);
    const padding = toPadding(options.padding);
    return font.lineHeight + padding.height;
  }
  function getEvenSpacing(arr) {
    const len = arr.length;
    let i, diff;
    if (len < 2) {
      return false;
    }
    for (diff = arr[0], i = 1; i < len; ++i) {
      if (arr[i] - arr[i - 1] !== diff) {
        return false;
      }
    }
    return diff;
  }
  function calculateSpacing(majorIndices, ticks, ticksLimit) {
    const evenMajorSpacing = getEvenSpacing(majorIndices);
    const spacing = ticks.length / ticksLimit;
    if (!evenMajorSpacing) {
      return Math.max(spacing, 1);
    }
    const factors = _factorize(evenMajorSpacing);
    for (let i = 0, ilen = factors.length - 1; i < ilen; i++) {
      const factor = factors[i];
      if (factor > spacing) {
        return factor;
      }
    }
    return Math.max(spacing, 1);
  }
  function getMajorIndices(ticks) {
    const result = [];
    let i, ilen;
    for (i = 0, ilen = ticks.length; i < ilen; i++) {
      if (ticks[i].major) {
        result.push(i);
      }
    }
    return result;
  }
  function skipMajors(ticks, newTicks, majorIndices, spacing) {
    let count = 0;
    let next = majorIndices[0];
    let i;
    spacing = Math.ceil(spacing);
    for (i = 0; i < ticks.length; i++) {
      if (i === next) {
        newTicks.push(ticks[i]);
        count++;
        next = majorIndices[count * spacing];
      }
    }
  }
  function skip(ticks, newTicks, spacing, majorStart, majorEnd) {
    const start = valueOrDefault(majorStart, 0);
    const end = Math.min(valueOrDefault(majorEnd, ticks.length), ticks.length);
    let count = 0;
    let length, i, next;
    spacing = Math.ceil(spacing);
    if (majorEnd) {
      length = majorEnd - majorStart;
      spacing = length / Math.floor(length / spacing);
    }
    next = start;
    while (next < 0) {
      count++;
      next = Math.round(start + count * spacing);
    }
    for (i = Math.max(start, 0); i < end; i++) {
      if (i === next) {
        newTicks.push(ticks[i]);
        count++;
        next = Math.round(start + count * spacing);
      }
    }
  }
  function createScaleContext(parent, scale) {
    return Object.create(parent, {
      scale: {
        value: scale
      },
      type: {
        value: 'scale'
      }
    });
  }
  function createTickContext(parent, index, tick) {
    return Object.create(parent, {
      tick: {
        value: tick
      },
      index: {
        value: index
      },
      type: {
        value: 'tick'
      }
    });
  }
  const Scale = function (_Element) {
    _inheritsLoose(Scale, _Element);
    function Scale(cfg) {
      let _this;
      _this = _Element.call(this) || this;
      _this.id = cfg.id;
      _this.type = cfg.type;
      _this.options = undefined;
      _this.ctx = cfg.ctx;
      _this.chart = cfg.chart;
      _this.top = undefined;
      _this.bottom = undefined;
      _this.left = undefined;
      _this.right = undefined;
      _this.width = undefined;
      _this.height = undefined;
      _this._margins = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      };
      _this.maxWidth = undefined;
      _this.maxHeight = undefined;
      _this.paddingTop = undefined;
      _this.paddingBottom = undefined;
      _this.paddingLeft = undefined;
      _this.paddingRight = undefined;
      _this.axis = undefined;
      _this.labelRotation = undefined;
      _this.min = undefined;
      _this.max = undefined;
      _this.ticks = [];
      _this._gridLineItems = null;
      _this._labelItems = null;
      _this._labelSizes = null;
      _this._length = 0;
      _this._longestTextCache = {};
      _this._startPixel = undefined;
      _this._endPixel = undefined;
      _this._reversePixels = false;
      _this._userMax = undefined;
      _this._userMin = undefined;
      _this._ticksLength = 0;
      _this._borderValue = 0;
      _this._cache = {};
      _this.$context = undefined;
      return _this;
    }
    const _proto = Scale.prototype;
    _proto.init = function init(options) {
      const me = this;
      me.options = options;
      me.axis = me.isHorizontal() ? 'x' : 'y';
      me._userMin = me.parse(options.min);
      me._userMax = me.parse(options.max);
    }
    ;
    _proto.parse = function parse(raw, index) {
      return raw;
    }
    ;
    _proto.getUserBounds = function getUserBounds() {
      let min = this._userMin;
      let max = this._userMax;
      if (isNullOrUndef(min) || isNaN(min)) {
        min = Number.POSITIVE_INFINITY;
      }
      if (isNullOrUndef(max) || isNaN(max)) {
        max = Number.NEGATIVE_INFINITY;
      }
      return {
        min: min,
        max: max,
        minDefined: isNumberFinite(min),
        maxDefined: isNumberFinite(max)
      };
    }
    ;
    _proto.getMinMax = function getMinMax(canStack) {
      const me = this;
      let _me$getUserBounds = me.getUserBounds(),
        min = _me$getUserBounds.min,
        max = _me$getUserBounds.max,
        minDefined = _me$getUserBounds.minDefined,
        maxDefined = _me$getUserBounds.maxDefined;
      let range;
      if (minDefined && maxDefined) {
        return {
          min: min,
          max: max
        };
      }
      const metas = me.getMatchingVisibleMetas();
      for (let i = 0, ilen = metas.length; i < ilen; ++i) {
        range = metas[i].controller.getMinMax(me, canStack);
        if (!minDefined) {
          min = Math.min(min, range.min);
        }
        if (!maxDefined) {
          max = Math.max(max, range.max);
        }
      }
      return {
        min: min,
        max: max
      };
    };
    _proto.invalidateCaches = function invalidateCaches() {
      this._cache = {};
    }
    ;
    _proto.getPadding = function getPadding() {
      const me = this;
      return {
        left: me.paddingLeft || 0,
        top: me.paddingTop || 0,
        right: me.paddingRight || 0,
        bottom: me.paddingBottom || 0
      };
    }
    ;
    _proto.getTicks = function getTicks() {
      return this.ticks;
    }
    ;
    _proto.getLabels = function getLabels() {
      const data = this.chart.data;
      return this.options.labels || (this.isHorizontal() ? data.xLabels : data.yLabels) || data.labels || [];
    }
    ;
    _proto.beforeUpdate = function beforeUpdate() {
      callback(this.options.beforeUpdate, [this]);
    }
    ;
    _proto.update = function update(maxWidth, maxHeight, margins) {
      const me = this;
      const tickOpts = me.options.ticks;
      const sampleSize = tickOpts.sampleSize;
      me.beforeUpdate();
      me.maxWidth = maxWidth;
      me.maxHeight = maxHeight;
      me._margins = _extends({
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      }, margins);
      me.ticks = null;
      me._labelSizes = null;
      me._gridLineItems = null;
      me._labelItems = null;
      me.beforeSetDimensions();
      me.setDimensions();
      me.afterSetDimensions();
      me.beforeDataLimits();
      me.determineDataLimits();
      me.afterDataLimits();
      me.beforeBuildTicks();
      me.ticks = me.buildTicks() || [];
      me.afterBuildTicks();
      const samplingEnabled = sampleSize < me.ticks.length;
      me._convertTicksToLabels(samplingEnabled ? sample(me.ticks, sampleSize) : me.ticks);
      me.configure();
      me.beforeCalculateLabelRotation();
      me.calculateLabelRotation();
      me.afterCalculateLabelRotation();
      me.beforeFit();
      me.fit();
      me.afterFit();
      me.ticks = tickOpts.display && (tickOpts.autoSkip || tickOpts.source === 'auto') ? me._autoSkip(me.ticks) : me.ticks;
      if (samplingEnabled) {
        me._convertTicksToLabels(me.ticks);
      }
      me.afterUpdate();
    }
    ;
    _proto.configure = function configure() {
      const me = this;
      let reversePixels = me.options.reverse;
      let startPixel, endPixel;
      if (me.isHorizontal()) {
        startPixel = me.left;
        endPixel = me.right;
      } else {
        startPixel = me.top;
        endPixel = me.bottom;
        reversePixels = !reversePixels;
      }
      me._startPixel = startPixel;
      me._endPixel = endPixel;
      me._reversePixels = reversePixels;
      me._length = endPixel - startPixel;
    };
    _proto.afterUpdate = function afterUpdate() {
      callback(this.options.afterUpdate, [this]);
    }
    ;
    _proto.beforeSetDimensions = function beforeSetDimensions() {
      callback(this.options.beforeSetDimensions, [this]);
    };
    _proto.setDimensions = function setDimensions() {
      const me = this;
      if (me.isHorizontal()) {
        me.width = me.maxWidth;
        me.left = 0;
        me.right = me.width;
      } else {
        me.height = me.maxHeight;
        me.top = 0;
        me.bottom = me.height;
      }
      me.paddingLeft = 0;
      me.paddingTop = 0;
      me.paddingRight = 0;
      me.paddingBottom = 0;
    };
    _proto.afterSetDimensions = function afterSetDimensions() {
      callback(this.options.afterSetDimensions, [this]);
    }
    ;
    _proto.beforeDataLimits = function beforeDataLimits() {
      callback(this.options.beforeDataLimits, [this]);
    };
    _proto.determineDataLimits = function determineDataLimits() {};
    _proto.afterDataLimits = function afterDataLimits() {
      callback(this.options.afterDataLimits, [this]);
    }
    ;
    _proto.beforeBuildTicks = function beforeBuildTicks() {
      callback(this.options.beforeBuildTicks, [this]);
    }
    ;
    _proto.buildTicks = function buildTicks() {
      return [];
    };
    _proto.afterBuildTicks = function afterBuildTicks() {
      callback(this.options.afterBuildTicks, [this]);
    };
    _proto.beforeTickToLabelConversion = function beforeTickToLabelConversion() {
      callback(this.options.beforeTickToLabelConversion, [this]);
    }
    ;
    _proto.generateTickLabels = function generateTickLabels(ticks) {
      const me = this;
      const tickOpts = me.options.ticks;
      let i, ilen, tick;
      for (i = 0, ilen = ticks.length; i < ilen; i++) {
        tick = ticks[i];
        tick.label = callback(tickOpts.callback, [tick.value, i, ticks], me);
      }
    };
    _proto.afterTickToLabelConversion = function afterTickToLabelConversion() {
      callback(this.options.afterTickToLabelConversion, [this]);
    }
    ;
    _proto.beforeCalculateLabelRotation = function beforeCalculateLabelRotation() {
      callback(this.options.beforeCalculateLabelRotation, [this]);
    };
    _proto.calculateLabelRotation = function calculateLabelRotation() {
      const me = this;
      const options = me.options;
      const tickOpts = options.ticks;
      const numTicks = me.ticks.length;
      const minRotation = tickOpts.minRotation || 0;
      const maxRotation = tickOpts.maxRotation;
      let labelRotation = minRotation;
      let tickWidth, maxHeight, maxLabelDiagonal;
      if (!me._isVisible() || !tickOpts.display || minRotation >= maxRotation || numTicks <= 1 || !me.isHorizontal()) {
        me.labelRotation = minRotation;
        return;
      }
      const labelSizes = me._getLabelSizes();
      const maxLabelWidth = labelSizes.widest.width;
      const maxLabelHeight = labelSizes.highest.height - labelSizes.highest.offset;
      const maxWidth = Math.min(me.maxWidth, me.chart.width - maxLabelWidth);
      tickWidth = options.offset ? me.maxWidth / numTicks : maxWidth / (numTicks - 1);
      if (maxLabelWidth + 6 > tickWidth) {
        tickWidth = maxWidth / (numTicks - (options.offset ? 0.5 : 1));
        maxHeight = me.maxHeight - getTickMarkLength(options.gridLines) - tickOpts.padding - getScaleLabelHeight(options.scaleLabel, me.chart.options.font);
        maxLabelDiagonal = Math.sqrt(maxLabelWidth * maxLabelWidth + maxLabelHeight * maxLabelHeight);
        labelRotation = toDegrees(Math.min(Math.asin(Math.min((labelSizes.highest.height + 6) / tickWidth, 1)), Math.asin(Math.min(maxHeight / maxLabelDiagonal, 1)) - Math.asin(maxLabelHeight / maxLabelDiagonal)));
        labelRotation = Math.max(minRotation, Math.min(maxRotation, labelRotation));
      }
      me.labelRotation = labelRotation;
    };
    _proto.afterCalculateLabelRotation = function afterCalculateLabelRotation() {
      callback(this.options.afterCalculateLabelRotation, [this]);
    }
    ;
    _proto.beforeFit = function beforeFit() {
      callback(this.options.beforeFit, [this]);
    };
    _proto.fit = function fit() {
      const me = this;
      const minSize = {
        width: 0,
        height: 0
      };
      const chart = me.chart;
      const opts = me.options;
      const tickOpts = opts.ticks;
      const scaleLabelOpts = opts.scaleLabel;
      const gridLineOpts = opts.gridLines;
      const display = me._isVisible();
      const labelsBelowTicks = opts.position !== 'top' && me.axis === 'x';
      const isHorizontal = me.isHorizontal();
      const scaleLabelHeight = display && getScaleLabelHeight(scaleLabelOpts, chart.options.font);
      if (isHorizontal) {
        minSize.width = me.maxWidth;
      } else if (display) {
        minSize.width = getTickMarkLength(gridLineOpts) + scaleLabelHeight;
      }
      if (!isHorizontal) {
        minSize.height = me.maxHeight;
      } else if (display) {
        minSize.height = getTickMarkLength(gridLineOpts) + scaleLabelHeight;
      }
      if (tickOpts.display && display && me.ticks.length) {
        const labelSizes = me._getLabelSizes();
        const firstLabelSize = labelSizes.first;
        const lastLabelSize = labelSizes.last;
        const widestLabelSize = labelSizes.widest;
        const highestLabelSize = labelSizes.highest;
        const lineSpace = highestLabelSize.offset * 0.8;
        const tickPadding = tickOpts.padding;
        if (isHorizontal) {
          const isRotated = me.labelRotation !== 0;
          const angleRadians = toRadians(me.labelRotation);
          const cosRotation = Math.cos(angleRadians);
          const sinRotation = Math.sin(angleRadians);
          const labelHeight = sinRotation * widestLabelSize.width + cosRotation * (highestLabelSize.height - (isRotated ? highestLabelSize.offset : 0)) + (isRotated ? 0 : lineSpace);
          minSize.height = Math.min(me.maxHeight, minSize.height + labelHeight + tickPadding);
          const offsetLeft = me.getPixelForTick(0) - me.left;
          const offsetRight = me.right - me.getPixelForTick(me.ticks.length - 1);
          let paddingLeft, paddingRight;
          if (isRotated) {
            paddingLeft = labelsBelowTicks ? cosRotation * firstLabelSize.width + sinRotation * firstLabelSize.offset : sinRotation * (firstLabelSize.height - firstLabelSize.offset);
            paddingRight = labelsBelowTicks ? sinRotation * (lastLabelSize.height - lastLabelSize.offset) : cosRotation * lastLabelSize.width + sinRotation * lastLabelSize.offset;
          } else if (tickOpts.align === 'start') {
            paddingLeft = 0;
            paddingRight = lastLabelSize.width;
          } else if (tickOpts.align === 'end') {
            paddingLeft = firstLabelSize.width;
            paddingRight = 0;
          } else {
            paddingLeft = firstLabelSize.width / 2;
            paddingRight = lastLabelSize.width / 2;
          }
          me.paddingLeft = Math.max((paddingLeft - offsetLeft) * me.width / (me.width - offsetLeft), 0) + 3;
          me.paddingRight = Math.max((paddingRight - offsetRight) * me.width / (me.width - offsetRight), 0) + 3;
        } else {
          const labelWidth = tickOpts.mirror ? 0 :
            widestLabelSize.width + tickPadding + lineSpace;
          minSize.width = Math.min(me.maxWidth, minSize.width + labelWidth);
          let paddingTop = lastLabelSize.height / 2;
          let paddingBottom = firstLabelSize.height / 2;
          if (tickOpts.align === 'start') {
            paddingTop = 0;
            paddingBottom = firstLabelSize.height;
          } else if (tickOpts.align === 'end') {
            paddingTop = lastLabelSize.height;
            paddingBottom = 0;
          }
          me.paddingTop = paddingTop;
          me.paddingBottom = paddingBottom;
        }
      }
      me._handleMargins();
      if (isHorizontal) {
        me.width = me._length = chart.width - me._margins.left - me._margins.right;
        me.height = minSize.height;
      } else {
        me.width = minSize.width;
        me.height = me._length = chart.height - me._margins.top - me._margins.bottom;
      }
    }
    ;
    _proto._handleMargins = function _handleMargins() {
      const me = this;
      if (me._margins) {
        me._margins.left = Math.max(me.paddingLeft, me._margins.left);
        me._margins.top = Math.max(me.paddingTop, me._margins.top);
        me._margins.right = Math.max(me.paddingRight, me._margins.right);
        me._margins.bottom = Math.max(me.paddingBottom, me._margins.bottom);
      }
    };
    _proto.afterFit = function afterFit() {
      callback(this.options.afterFit, [this]);
    }
    ;
    _proto.isHorizontal = function isHorizontal() {
      const _this$options = this.options,
        axis = _this$options.axis,
        position = _this$options.position;
      return position === 'top' || position === 'bottom' || axis === 'x';
    }
    ;
    _proto.isFullWidth = function isFullWidth() {
      return this.options.fullWidth;
    }
    ;
    _proto._convertTicksToLabels = function _convertTicksToLabels(ticks) {
      const me = this;
      me.beforeTickToLabelConversion();
      me.generateTickLabels(ticks);
      me.afterTickToLabelConversion();
    }
    ;
    _proto._getLabelSizes = function _getLabelSizes() {
      const me = this;
      let labelSizes = me._labelSizes;
      if (!labelSizes) {
        me._labelSizes = labelSizes = me._computeLabelSizes();
      }
      return labelSizes;
    }
    ;
    _proto._computeLabelSizes = function _computeLabelSizes() {
      const me = this;
      const ctx = me.ctx;
      const caches = me._longestTextCache;
      const sampleSize = me.options.ticks.sampleSize;
      const widths = [];
      const heights = [];
      const offsets = [];
      let widestLabelSize = 0;
      let highestLabelSize = 0;
      let ticks = me.ticks;
      if (sampleSize < ticks.length) {
        ticks = sample(ticks, sampleSize);
      }
      const length = ticks.length;
      let i, j, jlen, label, tickFont, fontString, cache, lineHeight, width, height, nestedLabel;
      for (i = 0; i < length; ++i) {
        label = ticks[i].label;
        tickFont = me._resolveTickFontOptions(i);
        ctx.font = fontString = tickFont.string;
        cache = caches[fontString] = caches[fontString] || {
          data: {},
          gc: []
        };
        lineHeight = tickFont.lineHeight;
        width = height = 0;
        if (!isNullOrUndef(label) && !isArray(label)) {
          width = _measureText(ctx, cache.data, cache.gc, width, label);
          height = lineHeight;
        } else if (isArray(label)) {
          for (j = 0, jlen = label.length; j < jlen; ++j) {
            nestedLabel = label[j];
            if (!isNullOrUndef(nestedLabel) && !isArray(nestedLabel)) {
              width = _measureText(ctx, cache.data, cache.gc, width, nestedLabel);
              height += lineHeight;
            }
          }
        }
        widths.push(width);
        heights.push(height);
        offsets.push(lineHeight / 2);
        widestLabelSize = Math.max(width, widestLabelSize);
        highestLabelSize = Math.max(height, highestLabelSize);
      }
      garbageCollect(caches, length);
      const widest = widths.indexOf(widestLabelSize);
      const highest = heights.indexOf(highestLabelSize);
      function valueAt(idx) {
        return {
          width: widths[idx] || 0,
          height: heights[idx] || 0,
          offset: offsets[idx] || 0
        };
      }
      return {
        first: valueAt(0),
        last: valueAt(length - 1),
        widest: valueAt(widest),
        highest: valueAt(highest)
      };
    }
    ;
    _proto.getLabelForValue = function getLabelForValue(value) {
      return value;
    }
    ;
    _proto.getPixelForValue = function getPixelForValue(value, index) {
      return NaN;
    }
    ;
    _proto.getValueForPixel = function getValueForPixel(pixel) {}
    ;
    _proto.getPixelForTick = function getPixelForTick(index) {
      const ticks = this.ticks;
      if (index < 0 || index > ticks.length - 1) {
        return null;
      }
      return this.getPixelForValue(ticks[index].value);
    }
    ;
    _proto.getPixelForDecimal = function getPixelForDecimal(decimal) {
      const me = this;
      if (me._reversePixels) {
        decimal = 1 - decimal;
      }
      return _int16Range(me._startPixel + decimal * me._length);
    }
    ;
    _proto.getDecimalForPixel = function getDecimalForPixel(pixel) {
      const decimal = (pixel - this._startPixel) / this._length;
      return this._reversePixels ? 1 - decimal : decimal;
    }
    ;
    _proto.getBasePixel = function getBasePixel() {
      return this.getPixelForValue(this.getBaseValue());
    }
    ;
    _proto.getBaseValue = function getBaseValue() {
      const min = this.min,
        max = this.max;
      return min < 0 && max < 0 ? max : min > 0 && max > 0 ? min : 0;
    }
    ;
    _proto.getContext = function getContext(index) {
      const me = this;
      const ticks = me.ticks || [];
      if (index >= 0 && index < ticks.length) {
        const tick = ticks[index];
        return tick.$context || (tick.$context = createTickContext(me.getContext(), index, tick));
      }
      return me.$context || (me.$context = createScaleContext(me.chart.getContext(), me));
    }
    ;
    _proto._autoSkip = function _autoSkip(ticks) {
      const me = this;
      const tickOpts = me.options.ticks;
      const ticksLimit = tickOpts.maxTicksLimit || me._length / me._tickSize();
      const majorIndices = tickOpts.major.enabled ? getMajorIndices(ticks) : [];
      const numMajorIndices = majorIndices.length;
      const first = majorIndices[0];
      const last = majorIndices[numMajorIndices - 1];
      const newTicks = [];
      if (numMajorIndices > ticksLimit) {
        skipMajors(ticks, newTicks, majorIndices, numMajorIndices / ticksLimit);
        return newTicks;
      }
      const spacing = calculateSpacing(majorIndices, ticks, ticksLimit);
      if (numMajorIndices > 0) {
        let i, ilen;
        const avgMajorSpacing = numMajorIndices > 1 ? Math.round((last - first) / (numMajorIndices - 1)) : null;
        skip(ticks, newTicks, spacing, isNullOrUndef(avgMajorSpacing) ? 0 : first - avgMajorSpacing, first);
        for (i = 0, ilen = numMajorIndices - 1; i < ilen; i++) {
          skip(ticks, newTicks, spacing, majorIndices[i], majorIndices[i + 1]);
        }
        skip(ticks, newTicks, spacing, last, isNullOrUndef(avgMajorSpacing) ? ticks.length : last + avgMajorSpacing);
        return newTicks;
      }
      skip(ticks, newTicks, spacing);
      return newTicks;
    }
    ;
    _proto._tickSize = function _tickSize() {
      const me = this;
      const optionTicks = me.options.ticks;
      const rot = toRadians(me.labelRotation);
      const cos = Math.abs(Math.cos(rot));
      const sin = Math.abs(Math.sin(rot));
      const labelSizes = me._getLabelSizes();
      const padding = optionTicks.autoSkipPadding || 0;
      const w = labelSizes ? labelSizes.widest.width + padding : 0;
      const h = labelSizes ? labelSizes.highest.height + padding : 0;
      return me.isHorizontal() ? h * cos > w * sin ? w / cos : h / sin : h * sin < w * cos ? h / cos : w / sin;
    }
    ;
    _proto._isVisible = function _isVisible() {
      const display = this.options.display;
      if (display !== 'auto') {
        return !!display;
      }
      return this.getMatchingVisibleMetas().length > 0;
    }
    ;
    _proto._computeGridLineItems = function _computeGridLineItems(chartArea) {
      const me = this;
      const axis = me.axis;
      const chart = me.chart;
      const options = me.options;
      const gridLines = options.gridLines,
        position = options.position;
      const offsetGridLines = gridLines.offsetGridLines;
      const isHorizontal = me.isHorizontal();
      const ticks = me.ticks;
      const ticksLength = ticks.length + (offsetGridLines ? 1 : 0);
      const tl = getTickMarkLength(gridLines);
      const items = [];
      let context = this.getContext(0);
      const axisWidth = gridLines.drawBorder ? resolve([gridLines.borderWidth, gridLines.lineWidth, 0], context, 0) : 0;
      const axisHalfWidth = axisWidth / 2;
      const alignBorderValue = function alignBorderValue(pixel) {
        return _alignPixel(chart, pixel, axisWidth);
      };
      let borderValue, i, lineValue, alignedLineValue;
      let tx1, ty1, tx2, ty2, x1, y1, x2, y2;
      if (position === 'top') {
        borderValue = alignBorderValue(me.bottom);
        ty1 = me.bottom - tl;
        ty2 = borderValue - axisHalfWidth;
        y1 = alignBorderValue(chartArea.top) + axisHalfWidth;
        y2 = chartArea.bottom;
      } else if (position === 'bottom') {
        borderValue = alignBorderValue(me.top);
        y1 = chartArea.top;
        y2 = alignBorderValue(chartArea.bottom) - axisHalfWidth;
        ty1 = borderValue + axisHalfWidth;
        ty2 = me.top + tl;
      } else if (position === 'left') {
        borderValue = alignBorderValue(me.right);
        tx1 = me.right - tl;
        tx2 = borderValue - axisHalfWidth;
        x1 = alignBorderValue(chartArea.left) + axisHalfWidth;
        x2 = chartArea.right;
      } else if (position === 'right') {
        borderValue = alignBorderValue(me.left);
        x1 = chartArea.left;
        x2 = alignBorderValue(chartArea.right) - axisHalfWidth;
        tx1 = borderValue + axisHalfWidth;
        tx2 = me.left + tl;
      } else if (axis === 'x') {
        if (position === 'center') {
          borderValue = alignBorderValue((chartArea.top + chartArea.bottom) / 2);
        } else if (isObject(position)) {
          const positionAxisID = Object.keys(position)[0];
          const value = position[positionAxisID];
          borderValue = alignBorderValue(me.chart.scales[positionAxisID].getPixelForValue(value));
        }
        y1 = chartArea.top;
        y2 = chartArea.bottom;
        ty1 = borderValue + axisHalfWidth;
        ty2 = ty1 + tl;
      } else if (axis === 'y') {
        if (position === 'center') {
          borderValue = alignBorderValue((chartArea.left + chartArea.right) / 2);
        } else if (isObject(position)) {
          const _positionAxisID = Object.keys(position)[0];
          const _value = position[_positionAxisID];
          borderValue = alignBorderValue(me.chart.scales[_positionAxisID].getPixelForValue(_value));
        }
        tx1 = borderValue - axisHalfWidth;
        tx2 = tx1 - tl;
        x1 = chartArea.left;
        x2 = chartArea.right;
      }
      for (i = 0; i < ticksLength; ++i) {
        context = this.getContext(i);
        const lineWidth = resolve([gridLines.lineWidth], context, i);
        const lineColor = resolve([gridLines.color], context, i);
        const borderDash = gridLines.borderDash || [];
        const borderDashOffset = resolve([gridLines.borderDashOffset], context, i);
        lineValue = getPixelForGridLine(me, i, offsetGridLines);
        if (lineValue === undefined) {
          continue;
        }
        alignedLineValue = _alignPixel(chart, lineValue, lineWidth);
        if (isHorizontal) {
          tx1 = tx2 = x1 = x2 = alignedLineValue;
        } else {
          ty1 = ty2 = y1 = y2 = alignedLineValue;
        }
        items.push({
          tx1: tx1,
          ty1: ty1,
          tx2: tx2,
          ty2: ty2,
          x1: x1,
          y1: y1,
          x2: x2,
          y2: y2,
          width: lineWidth,
          color: lineColor,
          borderDash: borderDash,
          borderDashOffset: borderDashOffset
        });
      }
      me._ticksLength = ticksLength;
      me._borderValue = borderValue;
      return items;
    }
    ;
    _proto._computeLabelItems = function _computeLabelItems(chartArea) {
      const me = this;
      const axis = me.axis;
      const options = me.options;
      const position = options.position,
        optionTicks = options.ticks;
      const isHorizontal = me.isHorizontal();
      const ticks = me.ticks;
      const align = optionTicks.align,
        crossAlign = optionTicks.crossAlign,
        padding = optionTicks.padding;
      const tl = getTickMarkLength(options.gridLines);
      const tickAndPadding = tl + padding;
      const rotation = -toRadians(me.labelRotation);
      const items = [];
      let i, ilen, tick, label, x, y, textAlign, pixel, font, lineHeight, lineCount, textOffset;
      let textBaseline = 'middle';
      if (position === 'top') {
        y = me.bottom - tickAndPadding;
        textAlign = me._getXAxisLabelAlignment();
      } else if (position === 'bottom') {
        y = me.top + tickAndPadding;
        textAlign = me._getXAxisLabelAlignment();
      } else if (position === 'left') {
        const ret = this._getYAxisLabelAlignment(tl);
        textAlign = ret.textAlign;
        x = ret.x;
      } else if (position === 'right') {
        const _ret = this._getYAxisLabelAlignment(tl);
        textAlign = _ret.textAlign;
        x = _ret.x;
      } else if (axis === 'x') {
        if (position === 'center') {
          y = (chartArea.top + chartArea.bottom) / 2 + tickAndPadding;
        } else if (isObject(position)) {
          const positionAxisID = Object.keys(position)[0];
          const value = position[positionAxisID];
          y = me.chart.scales[positionAxisID].getPixelForValue(value) + tickAndPadding;
        }
        textAlign = me._getXAxisLabelAlignment();
      } else if (axis === 'y') {
        if (position === 'center') {
          x = (chartArea.left + chartArea.right) / 2 - tickAndPadding;
        } else if (isObject(position)) {
          const _positionAxisID2 = Object.keys(position)[0];
          const _value2 = position[_positionAxisID2];
          x = me.chart.scales[_positionAxisID2].getPixelForValue(_value2);
        }
        textAlign = this._getYAxisLabelAlignment(tl).textAlign;
      }
      if (axis === 'y') {
        if (align === 'start') {
          textBaseline = 'top';
        } else if (align === 'end') {
          textBaseline = 'bottom';
        }
      }
      const labelSizes = me._getLabelSizes();
      for (i = 0, ilen = ticks.length; i < ilen; ++i) {
        tick = ticks[i];
        label = tick.label;
        pixel = me.getPixelForTick(i) + optionTicks.labelOffset;
        font = me._resolveTickFontOptions(i);
        lineHeight = font.lineHeight;
        lineCount = isArray(label) ? label.length : 1;
        const halfCount = lineCount / 2;
        if (isHorizontal) {
          x = pixel;
          if (position === 'top') {
            if (crossAlign === 'near' || rotation !== 0) {
              textOffset = (Math.sin(rotation) * halfCount + 0.5) * lineHeight;
              textOffset -= (rotation === 0 ? lineCount - 0.5 : Math.cos(rotation) * halfCount) * lineHeight;
            } else if (crossAlign === 'center') {
              textOffset = -1 * (labelSizes.highest.height / 2);
              textOffset -= halfCount * lineHeight;
            } else {
              textOffset = -1 * labelSizes.highest.height + 0.5 * lineHeight;
            }
          } else if (position === 'bottom') {
            if (crossAlign === 'near' || rotation !== 0) {
              textOffset = Math.sin(rotation) * halfCount * lineHeight;
              textOffset += (rotation === 0 ? 0.5 : Math.cos(rotation) * halfCount) * lineHeight;
            } else if (crossAlign === 'center') {
              textOffset = labelSizes.highest.height / 2;
              textOffset -= halfCount * lineHeight;
            } else {
              textOffset = labelSizes.highest.height - (lineCount - 0.5) * lineHeight;
            }
          }
        } else {
          y = pixel;
          textOffset = (1 - lineCount) * lineHeight / 2;
        }
        items.push({
          x: x,
          y: y,
          rotation: rotation,
          label: label,
          font: font,
          textOffset: textOffset,
          textAlign: textAlign,
          textBaseline: textBaseline
        });
      }
      return items;
    };
    _proto._getXAxisLabelAlignment = function _getXAxisLabelAlignment() {
      const me = this;
      const _me$options = me.options,
        position = _me$options.position,
        ticks = _me$options.ticks;
      const rotation = -toRadians(me.labelRotation);
      if (rotation) {
        return position === 'top' ? 'left' : 'right';
      }
      let align = 'center';
      if (ticks.align === 'start') {
        align = 'left';
      } else if (ticks.align === 'end') {
        align = 'right';
      }
      return align;
    };
    _proto._getYAxisLabelAlignment = function _getYAxisLabelAlignment(tl) {
      const me = this;
      const _me$options2 = me.options,
        position = _me$options2.position,
        ticks = _me$options2.ticks;
      const crossAlign = ticks.crossAlign,
        mirror = ticks.mirror,
        padding = ticks.padding;
      const labelSizes = me._getLabelSizes();
      const tickAndPadding = tl + padding;
      const widest = labelSizes.widest.width;
      let textAlign;
      let x;
      if (position === 'left') {
        if (mirror) {
          textAlign = 'left';
          x = me.right - padding;
        } else {
          x = me.right - tickAndPadding;
          if (crossAlign === 'near') {
            textAlign = 'right';
          } else if (crossAlign === 'center') {
            textAlign = 'center';
            x -= widest / 2;
          } else {
            textAlign = 'left';
            x -= widest;
          }
        }
      } else if (position === 'right') {
        if (mirror) {
          textAlign = 'right';
          x = me.left + padding;
        } else {
          x = me.left + tickAndPadding;
          if (crossAlign === 'near') {
            textAlign = 'left';
          } else if (crossAlign === 'center') {
            textAlign = 'center';
            x += widest / 2;
          } else {
            textAlign = 'right';
            x += widest;
          }
        }
      } else {
        textAlign = 'right';
      }
      return {
        textAlign: textAlign,
        x: x
      };
    }
    ;
    _proto.drawGrid = function drawGrid(chartArea) {
      const me = this;
      const gridLines = me.options.gridLines;
      const ctx = me.ctx;
      const chart = me.chart;
      let context = me.getContext(0);
      const axisWidth = gridLines.drawBorder ? resolve([gridLines.borderWidth, gridLines.lineWidth, 0], context, 0) : 0;
      const items = me._gridLineItems || (me._gridLineItems = me._computeGridLineItems(chartArea));
      let i, ilen;
      if (gridLines.display) {
        for (i = 0, ilen = items.length; i < ilen; ++i) {
          const item = items[i];
          const width = item.width;
          const color = item.color;
          if (width && color) {
            ctx.save();
            ctx.lineWidth = width;
            ctx.strokeStyle = color;
            if (ctx.setLineDash) {
              ctx.setLineDash(item.borderDash);
              ctx.lineDashOffset = item.borderDashOffset;
            }
            ctx.beginPath();
            if (gridLines.drawTicks) {
              ctx.moveTo(item.tx1, item.ty1);
              ctx.lineTo(item.tx2, item.ty2);
            }
            if (gridLines.drawOnChartArea) {
              ctx.moveTo(item.x1, item.y1);
              ctx.lineTo(item.x2, item.y2);
            }
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      if (axisWidth) {
        const firstLineWidth = axisWidth;
        context = me.getContext(me._ticksLength - 1);
        const lastLineWidth = resolve([gridLines.lineWidth, 1], context, me._ticksLength - 1);
        const borderValue = me._borderValue;
        let x1, x2, y1, y2;
        if (me.isHorizontal()) {
          x1 = _alignPixel(chart, me.left, firstLineWidth) - firstLineWidth / 2;
          x2 = _alignPixel(chart, me.right, lastLineWidth) + lastLineWidth / 2;
          y1 = y2 = borderValue;
        } else {
          y1 = _alignPixel(chart, me.top, firstLineWidth) - firstLineWidth / 2;
          y2 = _alignPixel(chart, me.bottom, lastLineWidth) + lastLineWidth / 2;
          x1 = x2 = borderValue;
        }
        ctx.lineWidth = axisWidth;
        ctx.strokeStyle = resolve([gridLines.borderColor, gridLines.color], context, 0);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    ;
    _proto.drawLabels = function drawLabels(chartArea) {
      const me = this;
      const optionTicks = me.options.ticks;
      if (!optionTicks.display) {
        return;
      }
      const ctx = me.ctx;
      const items = me._labelItems || (me._labelItems = me._computeLabelItems(chartArea));
      let i, j, ilen, jlen;
      for (i = 0, ilen = items.length; i < ilen; ++i) {
        const item = items[i];
        const tickFont = item.font;
        const useStroke = tickFont.lineWidth > 0 && tickFont.strokeStyle !== '';
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);
        ctx.font = tickFont.string;
        ctx.fillStyle = tickFont.color;
        ctx.textAlign = item.textAlign;
        ctx.textBaseline = item.textBaseline;
        if (useStroke) {
          ctx.strokeStyle = tickFont.strokeStyle;
          ctx.lineWidth = tickFont.lineWidth;
        }
        const label = item.label;
        let y = item.textOffset;
        if (isArray(label)) {
          for (j = 0, jlen = label.length; j < jlen; ++j) {
            if (useStroke) {
              ctx.strokeText('' + label[j], 0, y);
            }
            ctx.fillText('' + label[j], 0, y);
            y += tickFont.lineHeight;
          }
        } else {
          if (useStroke) {
            ctx.strokeText(label, 0, y);
          }
          ctx.fillText(label, 0, y);
        }
        ctx.restore();
      }
    }
    ;
    _proto.drawTitle = function drawTitle(chartArea) {
      const me = this;
      const ctx = me.ctx;
      const options = me.options;
      const scaleLabel = options.scaleLabel;
      if (!scaleLabel.display) {
        return;
      }
      const scaleLabelFont = toFont(scaleLabel.font, me.chart.options.font);
      const scaleLabelPadding = toPadding(scaleLabel.padding);
      const halfLineHeight = scaleLabelFont.lineHeight / 2;
      const scaleLabelAlign = scaleLabel.align;
      const position = options.position;
      const isReverse = me.options.reverse;
      let rotation = 0;
      let textAlign;
      let scaleLabelX, scaleLabelY;
      if (me.isHorizontal()) {
        switch (scaleLabelAlign) {
          case 'start':
            scaleLabelX = me.left + (isReverse ? me.width : 0);
            textAlign = isReverse ? 'right' : 'left';
            break;
          case 'end':
            scaleLabelX = me.left + (isReverse ? 0 : me.width);
            textAlign = isReverse ? 'left' : 'right';
            break;
          default:
            scaleLabelX = me.left + me.width / 2;
            textAlign = 'center';
        }
        scaleLabelY = position === 'top' ? me.top + halfLineHeight + scaleLabelPadding.top : me.bottom - halfLineHeight - scaleLabelPadding.bottom;
      } else {
        const isLeft = position === 'left';
        scaleLabelX = isLeft ? me.left + halfLineHeight + scaleLabelPadding.top : me.right - halfLineHeight - scaleLabelPadding.top;
        switch (scaleLabelAlign) {
          case 'start':
            scaleLabelY = me.top + (isReverse ? 0 : me.height);
            textAlign = isReverse === isLeft ? 'right' : 'left';
            break;
          case 'end':
            scaleLabelY = me.top + (isReverse ? me.height : 0);
            textAlign = isReverse === isLeft ? 'left' : 'right';
            break;
          default:
            scaleLabelY = me.top + me.height / 2;
            textAlign = 'center';
        }
        rotation = isLeft ? -HALF_PI : HALF_PI;
      }
      ctx.save();
      ctx.translate(scaleLabelX, scaleLabelY);
      ctx.rotate(rotation);
      ctx.textAlign = textAlign;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = scaleLabelFont.color;
      ctx.font = scaleLabelFont.string;
      ctx.fillText(scaleLabel.labelString, 0, 0);
      ctx.restore();
    };
    _proto.draw = function draw(chartArea) {
      const me = this;
      if (!me._isVisible()) {
        return;
      }
      me.drawGrid(chartArea);
      me.drawTitle();
      me.drawLabels(chartArea);
    }
    ;
    _proto._layers = function _layers() {
      const me = this;
      const opts = me.options;
      const tz = opts.ticks && opts.ticks.z || 0;
      const gz = opts.gridLines && opts.gridLines.z || 0;
      if (!me._isVisible() || tz === gz || me.draw !== me._draw) {
        return [{
          z: tz,
          draw: function draw(chartArea) {
            me.draw(chartArea);
          }
        }];
      }
      return [{
        z: gz,
        draw: function draw(chartArea) {
          me.drawGrid(chartArea);
          me.drawTitle();
        }
      }, {
        z: tz,
        draw: function draw(chartArea) {
          me.drawLabels(chartArea);
        }
      }];
    }
    ;
    _proto.getMatchingVisibleMetas = function getMatchingVisibleMetas(type) {
      const me = this;
      const metas = me.chart.getSortedVisibleDatasetMetas();
      const axisID = me.axis + 'AxisID';
      const result = [];
      let i, ilen;
      for (i = 0, ilen = metas.length; i < ilen; ++i) {
        const meta = metas[i];
        if (meta[axisID] === me.id && (!type || meta.type === type)) {
          result.push(meta);
        }
      }
      return result;
    }
    ;
    _proto._resolveTickFontOptions = function _resolveTickFontOptions(index) {
      const me = this;
      const chart = me.chart;
      const options = me.options.ticks;
      const context = me.getContext(index);
      return toFont(resolve([options.font], context), chart.options.font);
    };
    return Scale;
  }(Element$1);
  Scale.prototype._draw = Scale.prototype.draw;

  const TypedRegistry = function () {
    function TypedRegistry(type, scope) {
      this.type = type;
      this.scope = scope;
      this.items = Object.create(null);
    }
    const _proto = TypedRegistry.prototype;
    _proto.isForType = function isForType(type) {
      return Object.prototype.isPrototypeOf.call(this.type.prototype, type.prototype);
    }
    ;
    _proto.register = function register(item) {
      const proto = Object.getPrototypeOf(item);
      let parentScope;
      if (isIChartComponent(proto)) {
        parentScope = this.register(proto);
      }
      const items = this.items;
      const id = item.id;
      const baseScope = this.scope;
      const scope = baseScope ? baseScope + '.' + id : id;
      if (!id) {
        throw new Error('class does not have id: ' + item);
      }
      if (id in items) {
        return scope;
      }
      if (Object.keys(defaults.get(scope)).length) {
        throw new Error('Can not register "' + id + '", because "defaults.' + scope + '" would collide with existing defaults');
      }
      items[id] = item;
      registerDefaults(item, scope, parentScope);
      return scope;
    }
    ;
    _proto.get = function get(id) {
      return this.items[id];
    }
    ;
    _proto.unregister = function unregister(item) {
      const items = this.items;
      const id = item.id;
      const scope = this.scope;
      if (id in items) {
        delete items[id];
      }
      if (scope && id in defaults[scope]) {
        delete defaults[scope][id];
      } else if (id in defaults) {
        delete defaults[id];
      }
    };
    return TypedRegistry;
  }();
  function registerDefaults(item, scope, parentScope) {
    const itemDefaults = parentScope ? _extends({}, defaults.get(parentScope), item.defaults) : item.defaults;
    defaults.set(scope, itemDefaults);
    if (item.defaultRoutes) {
      routeDefaults(scope, item.defaultRoutes);
    }
  }
  function routeDefaults(scope, routes) {
    Object.keys(routes).forEach(function (property) {
      const parts = routes[property].split('.');
      const targetName = parts.pop();
      const targetScope = parts.join('.');
      defaults.route(scope, property, targetScope, targetName);
    });
  }
  function isIChartComponent(proto) {
    return 'id' in proto && 'defaults' in proto;
  }

  const Registry = function () {
    function Registry() {
      this.controllers = new TypedRegistry(DatasetController, 'controllers');
      this.elements = new TypedRegistry(Element$1, 'elements');
      this.plugins = new TypedRegistry(Object, 'plugins');
      this.scales = new TypedRegistry(Scale, 'scales');
      this._typedRegistries = [this.controllers, this.scales, this.elements];
    }
    const _proto = Registry.prototype;
    _proto.add = function add() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      this._each('register', args);
    };
    _proto.remove = function remove() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      this._each('unregister', args);
    }
    ;
    _proto.addControllers = function addControllers() {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }
      this._each('register', args, this.controllers);
    }
    ;
    _proto.addElements = function addElements() {
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }
      this._each('register', args, this.elements);
    }
    ;
    _proto.addPlugins = function addPlugins() {
      for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }
      this._each('register', args, this.plugins);
    }
    ;
    _proto.addScales = function addScales() {
      for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
        args[_key6] = arguments[_key6];
      }
      this._each('register', args, this.scales);
    }
    ;
    _proto.getController = function getController(id) {
      return this._get(id, this.controllers, 'controller');
    }
    ;
    _proto.getElement = function getElement(id) {
      return this._get(id, this.elements, 'element');
    }
    ;
    _proto.getPlugin = function getPlugin(id) {
      return this._get(id, this.plugins, 'plugin');
    }
    ;
    _proto.getScale = function getScale(id) {
      return this._get(id, this.scales, 'scale');
    }
    ;
    _proto.removeControllers = function removeControllers() {
      for (var _len7 = arguments.length, args = new Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
        args[_key7] = arguments[_key7];
      }
      this._each('unregister', args, this.controllers);
    }
    ;
    _proto.removeElements = function removeElements() {
      for (var _len8 = arguments.length, args = new Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
        args[_key8] = arguments[_key8];
      }
      this._each('unregister', args, this.elements);
    }
    ;
    _proto.removePlugins = function removePlugins() {
      for (var _len9 = arguments.length, args = new Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
        args[_key9] = arguments[_key9];
      }
      this._each('unregister', args, this.plugins);
    }
    ;
    _proto.removeScales = function removeScales() {
      for (var _len10 = arguments.length, args = new Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
        args[_key10] = arguments[_key10];
      }
      this._each('unregister', args, this.scales);
    }
    ;
    _proto._each = function _each(method, args, typedRegistry) {
      const me = this;
      [].concat(args).forEach(function (arg) {
        const reg = typedRegistry || me._getRegistryForType(arg);
        if (typedRegistry || reg.isForType(arg) || reg === me.plugins && arg.id) {
          me._exec(method, reg, arg);
        } else {
          each(arg, function (item) {
            const itemReg = typedRegistry || me._getRegistryForType(item);
            me._exec(method, itemReg, item);
          });
        }
      });
    }
    ;
    _proto._exec = function _exec(method, registry, component) {
      const camelMethod = _capitalize(method);
      callback(component['before' + camelMethod], [], component);
      registry[method](component);
      callback(component['after' + camelMethod], [], component);
    }
    ;
    _proto._getRegistryForType = function _getRegistryForType(type) {
      for (let i = 0; i < this._typedRegistries.length; i++) {
        const reg = this._typedRegistries[i];
        if (reg.isForType(type)) {
          return reg;
        }
      }
      return this.plugins;
    }
    ;
    _proto._get = function _get(id, typedRegistry, type) {
      const item = typedRegistry.get(id);
      if (item === undefined) {
        throw new Error('"' + id + '" is not a registered ' + type + '.');
      }
      return item;
    };
    return Registry;
  }();
  const registry = new Registry();

  const PluginService = function () {
    function PluginService() {}
    const _proto = PluginService.prototype;
    _proto.notify = function notify(chart, hook, args) {
      const descriptors = this._descriptors(chart);
      for (let i = 0; i < descriptors.length; ++i) {
        const descriptor = descriptors[i];
        const plugin = descriptor.plugin;
        const method = plugin[hook];
        if (typeof method === 'function') {
          const params = [chart].concat(args || []);
          params.push(descriptor.options);
          if (method.apply(plugin, params) === false) {
            return false;
          }
        }
      }
      return true;
    };
    _proto.invalidate = function invalidate() {
      this._cache = undefined;
    }
    ;
    _proto._descriptors = function _descriptors(chart) {
      if (this._cache) {
        return this._cache;
      }
      const config = chart && chart.config;
      const options = config.options && config.options.plugins || {};
      const plugins = allPlugins(config);
      const descriptors = createDescriptors(plugins, options);
      this._cache = descriptors;
      return descriptors;
    };
    return PluginService;
  }();
  function allPlugins(config) {
    const plugins = [];
    const keys = Object.keys(registry.plugins.items);
    for (let i = 0; i < keys.length; i++) {
      plugins.push(registry.getPlugin(keys[i]));
    }
    const local = config.plugins || [];
    for (let _i = 0; _i < local.length; _i++) {
      const plugin = local[_i];
      if (plugins.indexOf(plugin) === -1) {
        plugins.push(plugin);
      }
    }
    return plugins;
  }
  function createDescriptors(plugins, options) {
    const result = [];
    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i];
      const id = plugin.id;
      let opts = options[id];
      if (opts === false) {
        continue;
      }
      if (opts === true) {
        opts = {};
      }
      result.push({
        plugin: plugin,
        options: mergeIf({}, [opts, defaults.plugins[id]])
      });
    }
    return result;
  }

  function getIndexAxis(type, options) {
    const typeDefaults = defaults.controllers[type] || {};
    const datasetDefaults = typeDefaults.datasets || {};
    const typeOptions = options[type] || {};
    const datasetOptions = typeOptions.datasets || {};
    return datasetOptions.indexAxis || options.indexAxis || datasetDefaults.indexAxis || 'x';
  }
  function getAxisFromDefaultScaleID(id, indexAxis) {
    let axis = id;
    if (id === '_index_') {
      axis = indexAxis;
    } else if (id === '_value_') {
      axis = indexAxis === 'x' ? 'y' : 'x';
    }
    return axis;
  }
  function getDefaultScaleIDFromAxis(axis, indexAxis) {
    return axis === indexAxis ? '_index_' : '_value_';
  }
  function axisFromPosition(position) {
    if (position === 'top' || position === 'bottom') {
      return 'x';
    }
    if (position === 'left' || position === 'right') {
      return 'y';
    }
  }
  function determineAxis(id, scaleOptions) {
    if (id === 'x' || id === 'y' || id === 'r') {
      return id;
    }
    return scaleOptions.axis || axisFromPosition(scaleOptions.position) || id.charAt(0).toLowerCase();
  }
  function mergeScaleConfig(config, options) {
    options = options || {};
    const chartDefaults = defaults.controllers[config.type] || {
      scales: {}
    };
    const configScales = options.scales || {};
    const chartIndexAxis = getIndexAxis(config.type, options);
    const firstIDs = Object.create(null);
    const scales = Object.create(null);
    Object.keys(configScales).forEach(function (id) {
      const scaleConf = configScales[id];
      const axis = determineAxis(id, scaleConf);
      const defaultId = getDefaultScaleIDFromAxis(axis, chartIndexAxis);
      firstIDs[axis] = firstIDs[axis] || id;
      scales[id] = mergeIf(Object.create(null), [{
        axis: axis
      }, scaleConf, chartDefaults.scales[axis], chartDefaults.scales[defaultId]]);
    });
    if (options.scale) {
      scales[options.scale.id || 'r'] = mergeIf(Object.create(null), [{
        axis: 'r'
      }, options.scale, chartDefaults.scales.r]);
      firstIDs.r = firstIDs.r || options.scale.id || 'r';
    }
    config.data.datasets.forEach(function (dataset) {
      const type = dataset.type || config.type;
      const indexAxis = dataset.indexAxis || getIndexAxis(type, options);
      const datasetDefaults = defaults.controllers[type] || {};
      const defaultScaleOptions = datasetDefaults.scales || {};
      Object.keys(defaultScaleOptions).forEach(function (defaultID) {
        const axis = getAxisFromDefaultScaleID(defaultID, indexAxis);
        const id = dataset[axis + 'AxisID'] || firstIDs[axis] || axis;
        scales[id] = scales[id] || Object.create(null);
        mergeIf(scales[id], [{
          axis: axis
        }, configScales[id], defaultScaleOptions[defaultID]]);
      });
    });
    Object.keys(scales).forEach(function (key) {
      const scale = scales[key];
      mergeIf(scale, [defaults.scales[scale.type], defaults.scale]);
    });
    return scales;
  }
  function mergeConfig()
  {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    return merge(Object.create(null), args, {
      merger: function merger(key, target, source, options) {
        if (key !== 'scales' && key !== 'scale' && key !== 'controllers') {
          _merger(key, target, source, options);
        }
      }
    });
  }
  function includeDefaults(config, options) {
    const scaleConfig = mergeScaleConfig(config, options);
    options = mergeConfig(defaults, defaults.controllers[config.type], options || {});
    options.hover = merge(Object.create(null), [defaults.interaction, defaults.hover, options.interaction, options.hover]);
    options.scales = scaleConfig;
    options.title = options.title !== false && merge(Object.create(null), [defaults.plugins.title, options.title]);
    options.tooltips = options.tooltips !== false && merge(Object.create(null), [defaults.interaction, defaults.plugins.tooltip, options.interaction, options.tooltips]);
    return options;
  }
  function initConfig(config) {
    config = config || {};
    const data = config.data = config.data || {
      datasets: [],
      labels: []
    };
    data.datasets = data.datasets || [];
    data.labels = data.labels || [];
    config.options = includeDefaults(config, config.options);
    return config;
  }
  const Config = function () {
    function Config(config) {
      this._config = initConfig(config);
    }
    const _proto = Config.prototype;
    _proto.update = function update(options) {
      const config = this._config;
      config.options = includeDefaults(config, options);
    };
    _createClass(Config, [{
      key: 'type',
      get: function get() {
        return this._config.type;
      }
    }, {
      key: 'data',
      get: function get() {
        return this._config.data;
      },
      set: function set(data) {
        this._config.data = data;
      }
    }, {
      key: 'options',
      get: function get() {
        return this._config.options;
      }
    }, {
      key: 'plugins',
      get: function get() {
        return this._config.plugins;
      }
    }]);
    return Config;
  }();

  const version = '3.0.0-beta.6';

  const KNOWN_POSITIONS = ['top', 'bottom', 'left', 'right', 'chartArea'];
  function positionIsHorizontal(position, axis) {
    return position === 'top' || position === 'bottom' || KNOWN_POSITIONS.indexOf(position) === -1 && axis === 'x';
  }
  function compare2Level(l1, l2) {
    return function (a, b) {
      return a[l1] === b[l1] ? a[l2] - b[l2] : a[l1] - b[l1];
    };
  }
  function onAnimationsComplete(context) {
    const chart = context.chart;
    const animationOptions = chart.options.animation;
    chart._plugins.notify(chart, 'afterRender');
    callback(animationOptions && animationOptions.onComplete, [context], chart);
  }
  function onAnimationProgress(context) {
    const chart = context.chart;
    const animationOptions = chart.options.animation;
    callback(animationOptions && animationOptions.onProgress, [context], chart);
  }
  function isDomSupported() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }
  function getCanvas(item) {
    if (isDomSupported() && typeof item === 'string') {
      item = document.getElementById(item);
    } else if (item && item.length) {
      item = item[0];
    }
    if (item && item.canvas) {
      item = item.canvas;
    }
    return item;
  }
  const Chart = function () {
    function Chart(item, config) {
      const me = this;
      this.config = config = new Config(config);
      const initialCanvas = getCanvas(item);
      const existingChart = Chart.getChart(initialCanvas);
      if (existingChart) {
        throw new Error('Canvas is already in use. Chart with ID \'' + existingChart.id + '\'' + ' must be destroyed before the canvas can be reused.');
      }
      this.platform = me._initializePlatform(initialCanvas, config);
      const context = me.platform.acquireContext(initialCanvas, config);
      const canvas = context && context.canvas;
      const height = canvas && canvas.height;
      const width = canvas && canvas.width;
      this.id = uid();
      this.ctx = context;
      this.canvas = canvas;
      this.width = width;
      this.height = height;
      this.aspectRatio = height ? width / height : null;
      this.options = config.options;
      this._layers = [];
      this._metasets = [];
      this.boxes = [];
      this.currentDevicePixelRatio = undefined;
      this.chartArea = undefined;
      this._active = [];
      this._lastEvent = undefined;
      this._listeners = {};
      this._sortedMetasets = [];
      this.scales = {};
      this.scale = undefined;
      this._plugins = new PluginService();
      this.$proxies = {};
      this._hiddenIndices = {};
      this.attached = false;
      this._animationsDisabled = undefined;
      this.$context = undefined;
      Chart.instances[me.id] = me;
      if (!context || !canvas) {
        console.error('Failed to create chart: can\'t acquire context from the given item');
        return;
      }
      animator.listen(me, 'complete', onAnimationsComplete);
      animator.listen(me, 'progress', onAnimationProgress);
      me._initialize();
      if (me.attached) {
        me.update();
      }
    }
    const _proto = Chart.prototype;
    _proto._initialize = function _initialize() {
      const me = this;
      me._plugins.notify(me, 'beforeInit');
      if (me.options.responsive) {
        me.resize();
      } else {
        retinaScale(me, me.options.devicePixelRatio);
      }
      me.bindEvents();
      me._plugins.notify(me, 'afterInit');
      return me;
    }
    ;
    _proto._initializePlatform = function _initializePlatform(canvas, config) {
      if (config.platform) {
        return new config.platform();
      } else if (!isDomSupported() || typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
        return new BasicPlatform();
      }
      return new DomPlatform();
    };
    _proto.clear = function clear$1() {
      clear(this);
      return this;
    };
    _proto.stop = function stop() {
      animator.stop(this);
      return this;
    };
    _proto.resize = function resize(width, height) {
      if (!animator.running(this)) {
        this._resize(width, height);
      } else {
        this._resizeBeforeDraw = {
          width: width,
          height: height
        };
      }
    };
    _proto._resize = function _resize(width, height) {
      const me = this;
      const options = me.options;
      const canvas = me.canvas;
      const aspectRatio = options.maintainAspectRatio && me.aspectRatio;
      const newSize = me.platform.getMaximumSize(canvas, width, height, aspectRatio);
      const oldRatio = me.currentDevicePixelRatio;
      const newRatio = options.devicePixelRatio || me.platform.getDevicePixelRatio();
      if (me.width === newSize.width && me.height === newSize.height && oldRatio === newRatio) {
        return;
      }
      canvas.width = me.width = newSize.width;
      canvas.height = me.height = newSize.height;
      if (canvas.style) {
        canvas.style.width = newSize.width + 'px';
        canvas.style.height = newSize.height + 'px';
      }
      retinaScale(me, newRatio);
      me._plugins.notify(me, 'resize', [newSize]);
      callback(options.onResize, [newSize], me);
      if (me.attached) {
        me.update('resize');
      }
    };
    _proto.ensureScalesHaveIDs = function ensureScalesHaveIDs() {
      const options = this.options;
      const scalesOptions = options.scales || {};
      const scaleOptions = options.scale;
      each(scalesOptions, function (axisOptions, axisID) {
        axisOptions.id = axisID;
      });
      if (scaleOptions) {
        scaleOptions.id = scaleOptions.id || 'scale';
      }
    }
    ;
    _proto.buildOrUpdateScales = function buildOrUpdateScales() {
      const me = this;
      const options = me.options;
      const scaleOpts = options.scales;
      const scales = me.scales || {};
      const updated = Object.keys(scales).reduce(function (obj, id) {
        obj[id] = false;
        return obj;
      }, {});
      let items = [];
      if (scaleOpts) {
        items = items.concat(Object.keys(scaleOpts).map(function (id) {
          const scaleOptions = scaleOpts[id];
          const axis = determineAxis(id, scaleOptions);
          const isRadial = axis === 'r';
          const isHorizontal = axis === 'x';
          return {
            options: scaleOptions,
            dposition: isRadial ? 'chartArea' : isHorizontal ? 'bottom' : 'left',
            dtype: isRadial ? 'radialLinear' : isHorizontal ? 'category' : 'linear'
          };
        }));
      }
      each(items, function (item) {
        const scaleOptions = item.options;
        const id = scaleOptions.id;
        const axis = determineAxis(id, scaleOptions);
        const scaleType = valueOrDefault(scaleOptions.type, item.dtype);
        if (scaleOptions.position === undefined || positionIsHorizontal(scaleOptions.position, axis) !== positionIsHorizontal(item.dposition)) {
          scaleOptions.position = item.dposition;
        }
        updated[id] = true;
        let scale = null;
        if (id in scales && scales[id].type === scaleType) {
          scale = scales[id];
        } else {
          const scaleClass = registry.getScale(scaleType);
          scale = new scaleClass({
            id: id,
            type: scaleType,
            ctx: me.ctx,
            chart: me
          });
          scales[scale.id] = scale;
        }
        scale.init(scaleOptions, options);
        if (item.isDefault) {
          me.scale = scale;
        }
      });
      each(updated, function (hasUpdated, id) {
        if (!hasUpdated) {
          delete scales[id];
        }
      });
      me.scales = scales;
      each(scales, function (scale) {
        scale.fullWidth = scale.options.fullWidth;
        scale.position = scale.options.position;
        scale.weight = scale.options.weight;
        layouts.addBox(me, scale);
      });
    }
    ;
    _proto._updateMetasetIndex = function _updateMetasetIndex(meta, index) {
      const metasets = this._metasets;
      const oldIndex = meta.index;
      if (oldIndex !== index) {
        metasets[oldIndex] = metasets[index];
        metasets[index] = meta;
        meta.index = index;
      }
    }
    ;
    _proto._updateMetasets = function _updateMetasets() {
      const me = this;
      const metasets = me._metasets;
      const numData = me.data.datasets.length;
      const numMeta = metasets.length;
      if (numMeta > numData) {
        for (let i = numData; i < numMeta; ++i) {
          me._destroyDatasetMeta(i);
        }
        metasets.splice(numData, numMeta - numData);
      }
      me._sortedMetasets = metasets.slice(0).sort(compare2Level('order', 'index'));
    }
    ;
    _proto._removeUnreferencedMetasets = function _removeUnreferencedMetasets() {
      const me = this;
      const datasets = me.data.datasets;
      me._metasets.forEach(function (meta, index) {
        if (datasets.filter(function (x) {
          return x === meta._dataset;
        }).length === 0) {
          me._destroyDatasetMeta(index);
        }
      });
    };
    _proto.buildOrUpdateControllers = function buildOrUpdateControllers() {
      const me = this;
      const newControllers = [];
      const datasets = me.data.datasets;
      let i, ilen;
      me._removeUnreferencedMetasets();
      for (i = 0, ilen = datasets.length; i < ilen; i++) {
        const dataset = datasets[i];
        let meta = me.getDatasetMeta(i);
        const type = dataset.type || me.config.type;
        if (meta.type && meta.type !== type) {
          me._destroyDatasetMeta(i);
          meta = me.getDatasetMeta(i);
        }
        meta.type = type;
        meta.indexAxis = dataset.indexAxis || getIndexAxis(type, me.options);
        meta.order = dataset.order || 0;
        me._updateMetasetIndex(meta, i);
        meta.label = '' + dataset.label;
        meta.visible = me.isDatasetVisible(i);
        if (meta.controller) {
          meta.controller.updateIndex(i);
          meta.controller.linkScales();
        } else {
          const controllerDefaults = defaults.controllers[type];
          const ControllerClass = registry.getController(type);
          _extends(ControllerClass.prototype, {
            dataElementType: registry.getElement(controllerDefaults.dataElementType),
            datasetElementType: controllerDefaults.datasetElementType && registry.getElement(controllerDefaults.datasetElementType),
            dataElementOptions: controllerDefaults.dataElementOptions,
            datasetElementOptions: controllerDefaults.datasetElementOptions
          });
          meta.controller = new ControllerClass(me, i);
          newControllers.push(meta.controller);
        }
      }
      me._updateMetasets();
      return newControllers;
    }
    ;
    _proto._resetElements = function _resetElements() {
      const me = this;
      each(me.data.datasets, function (dataset, datasetIndex) {
        me.getDatasetMeta(datasetIndex).controller.reset();
      }, me);
    }
    ;
    _proto.reset = function reset() {
      this._resetElements();
      this._plugins.notify(this, 'reset');
    };
    _proto.update = function update(mode) {
      const me = this;
      const args = {
        mode: mode
      };
      let i, ilen;
      each(me.scales, function (scale) {
        layouts.removeBox(me, scale);
      });
      me.config.update(me.options);
      me.options = me.config.options;
      me._animationsDisabled = !me.options.animation;
      me.ensureScalesHaveIDs();
      me.buildOrUpdateScales();
      me._plugins.invalidate();
      if (me._plugins.notify(me, 'beforeUpdate', [args]) === false) {
        return;
      }
      const newControllers = me.buildOrUpdateControllers();
      for (i = 0, ilen = me.data.datasets.length; i < ilen; i++) {
        me.getDatasetMeta(i).controller.buildOrUpdateElements();
      }
      me._updateLayout();
      each(newControllers, function (controller) {
        controller.reset();
      });
      me._updateDatasets(mode);
      me._plugins.notify(me, 'afterUpdate', [args]);
      me._layers.sort(compare2Level('z', '_idx'));
      if (me._lastEvent) {
        me._eventHandler(me._lastEvent, true);
      }
      me.render();
    }
    ;
    _proto._updateLayout = function _updateLayout() {
      const me = this;
      if (me._plugins.notify(me, 'beforeLayout') === false) {
        return;
      }
      layouts.update(me, me.width, me.height);
      me._layers = [];
      each(me.boxes, function (box) {
        let _me$_layers;
        if (box.configure) {
          box.configure();
        }
        (_me$_layers = me._layers).push.apply(_me$_layers, box._layers());
      }, me);
      me._layers.forEach(function (item, index) {
        item._idx = index;
      });
      me._plugins.notify(me, 'afterLayout');
    }
    ;
    _proto._updateDatasets = function _updateDatasets(mode) {
      const me = this;
      const isFunction = typeof mode === 'function';
      const args = {
        mode: mode
      };
      if (me._plugins.notify(me, 'beforeDatasetsUpdate', [args]) === false) {
        return;
      }
      for (let i = 0, ilen = me.data.datasets.length; i < ilen; ++i) {
        me._updateDataset(i, isFunction ? mode({
          datasetIndex: i
        }) : mode);
      }
      me._plugins.notify(me, 'afterDatasetsUpdate', [args]);
    }
    ;
    _proto._updateDataset = function _updateDataset(index, mode) {
      const me = this;
      const meta = me.getDatasetMeta(index);
      const args = {
        meta: meta,
        index: index,
        mode: mode
      };
      if (me._plugins.notify(me, 'beforeDatasetUpdate', [args]) === false) {
        return;
      }
      meta.controller._update(mode);
      me._plugins.notify(me, 'afterDatasetUpdate', [args]);
    };
    _proto.render = function render() {
      const me = this;
      if (me._plugins.notify(me, 'beforeRender') === false) {
        return;
      }
      if (animator.has(me)) {
        if (me.attached && !animator.running(me)) {
          animator.start(me);
        }
      } else {
        me.draw();
        onAnimationsComplete({
          chart: me
        });
      }
    };
    _proto.draw = function draw() {
      const me = this;
      let i;
      if (me._resizeBeforeDraw) {
        const _me$_resizeBeforeDraw = me._resizeBeforeDraw,
          width = _me$_resizeBeforeDraw.width,
          height = _me$_resizeBeforeDraw.height;
        me._resize(width, height);
        me._resizeBeforeDraw = null;
      }
      me.clear();
      if (me.width <= 0 || me.height <= 0) {
        return;
      }
      if (me._plugins.notify(me, 'beforeDraw') === false) {
        return;
      }
      const layers = me._layers;
      for (i = 0; i < layers.length && layers[i].z <= 0; ++i) {
        layers[i].draw(me.chartArea);
      }
      me._drawDatasets();
      for (; i < layers.length; ++i) {
        layers[i].draw(me.chartArea);
      }
      me._plugins.notify(me, 'afterDraw');
    }
    ;
    _proto._getSortedDatasetMetas = function _getSortedDatasetMetas(filterVisible) {
      const me = this;
      const metasets = me._sortedMetasets;
      const result = [];
      let i, ilen;
      for (i = 0, ilen = metasets.length; i < ilen; ++i) {
        const meta = metasets[i];
        if (!filterVisible || meta.visible) {
          result.push(meta);
        }
      }
      return result;
    }
    ;
    _proto.getSortedVisibleDatasetMetas = function getSortedVisibleDatasetMetas() {
      return this._getSortedDatasetMetas(true);
    }
    ;
    _proto._drawDatasets = function _drawDatasets() {
      const me = this;
      if (me._plugins.notify(me, 'beforeDatasetsDraw') === false) {
        return;
      }
      const metasets = me.getSortedVisibleDatasetMetas();
      for (let i = metasets.length - 1; i >= 0; --i) {
        me._drawDataset(metasets[i]);
      }
      me._plugins.notify(me, 'afterDatasetsDraw');
    }
    ;
    _proto._drawDataset = function _drawDataset(meta) {
      const me = this;
      const ctx = me.ctx;
      const clip = meta._clip;
      const area = me.chartArea;
      const args = {
        meta: meta,
        index: meta.index
      };
      if (me._plugins.notify(me, 'beforeDatasetDraw', [args]) === false) {
        return;
      }
      clipArea(ctx, {
        left: clip.left === false ? 0 : area.left - clip.left,
        right: clip.right === false ? me.width : area.right + clip.right,
        top: clip.top === false ? 0 : area.top - clip.top,
        bottom: clip.bottom === false ? me.height : area.bottom + clip.bottom
      });
      meta.controller.draw();
      unclipArea(ctx);
      me._plugins.notify(me, 'afterDatasetDraw', [args]);
    };
    _proto.getElementsAtEventForMode = function getElementsAtEventForMode(e, mode, options, useFinalPosition) {
      const method = Interaction.modes[mode];
      if (typeof method === 'function') {
        return method(this, e, options, useFinalPosition);
      }
      return [];
    };
    _proto.getDatasetMeta = function getDatasetMeta(datasetIndex) {
      const me = this;
      const dataset = me.data.datasets[datasetIndex];
      const metasets = me._metasets;
      let meta = metasets.filter(function (x) {
        return x && x._dataset === dataset;
      }).pop();
      if (!meta) {
        meta = metasets[datasetIndex] = {
          type: null,
          data: [],
          dataset: null,
          controller: null,
          hidden: null,
          xAxisID: null,
          yAxisID: null,
          order: dataset.order || 0,
          index: datasetIndex,
          _dataset: dataset,
          _parsed: [],
          _sorted: false
        };
      }
      return meta;
    };
    _proto.getContext = function getContext() {
      return this.$context || (this.$context = Object.create(null, {
        chart: {
          value: this
        },
        type: {
          value: 'chart'
        }
      }));
    };
    _proto.getVisibleDatasetCount = function getVisibleDatasetCount() {
      return this.getSortedVisibleDatasetMetas().length;
    };
    _proto.isDatasetVisible = function isDatasetVisible(datasetIndex) {
      const dataset = this.data.datasets[datasetIndex];
      if (!dataset) {
        return false;
      }
      const meta = this.getDatasetMeta(datasetIndex);
      return typeof meta.hidden === 'boolean' ? !meta.hidden : !dataset.hidden;
    };
    _proto.setDatasetVisibility = function setDatasetVisibility(datasetIndex, visible) {
      const meta = this.getDatasetMeta(datasetIndex);
      meta.hidden = !visible;
    };
    _proto.toggleDataVisibility = function toggleDataVisibility(index) {
      this._hiddenIndices[index] = !this._hiddenIndices[index];
    };
    _proto.getDataVisibility = function getDataVisibility(index) {
      return !this._hiddenIndices[index];
    }
    ;
    _proto._updateDatasetVisibility = function _updateDatasetVisibility(datasetIndex, visible) {
      const me = this;
      const mode = visible ? 'show' : 'hide';
      const meta = me.getDatasetMeta(datasetIndex);
      const anims = meta.controller._resolveAnimations(undefined, mode);
      me.setDatasetVisibility(datasetIndex, visible);
      anims.update(meta, {
        visible: visible
      });
      me.update(function (ctx) {
        return ctx.datasetIndex === datasetIndex ? mode : undefined;
      });
    };
    _proto.hide = function hide(datasetIndex) {
      this._updateDatasetVisibility(datasetIndex, false);
    };
    _proto.show = function show(datasetIndex) {
      this._updateDatasetVisibility(datasetIndex, true);
    }
    ;
    _proto._destroyDatasetMeta = function _destroyDatasetMeta(datasetIndex) {
      const me = this;
      const meta = me._metasets && me._metasets[datasetIndex];
      if (meta) {
        meta.controller._destroy();
        delete me._metasets[datasetIndex];
      }
    };
    _proto.destroy = function destroy() {
      const me = this;
      const canvas = me.canvas;
      let i, ilen;
      me.stop();
      animator.remove(me);
      for (i = 0, ilen = me.data.datasets.length; i < ilen; ++i) {
        me._destroyDatasetMeta(i);
      }
      if (canvas) {
        me.unbindEvents();
        clear(me);
        me.platform.releaseContext(me.ctx);
        me.canvas = null;
        me.ctx = null;
      }
      me._plugins.notify(me, 'destroy');
      delete Chart.instances[me.id];
    };
    _proto.toBase64Image = function toBase64Image() {
      let _this$canvas;
      return (_this$canvas = this.canvas).toDataURL.apply(_this$canvas, arguments);
    }
    ;
    _proto.bindEvents = function bindEvents() {
      const me = this;
      const listeners = me._listeners;
      const platform = me.platform;
      const _add = function _add(type, listener) {
        platform.addEventListener(me, type, listener);
        listeners[type] = listener;
      };
      const _remove = function _remove(type, listener) {
        if (listeners[type]) {
          platform.removeEventListener(me, type, listener);
          delete listeners[type];
        }
      };
      let listener = function listener(e, x, y) {
        e.offsetX = x;
        e.offsetY = y;
        me._eventHandler(e);
      };
      each(me.options.events, function (type) {
        return _add(type, listener);
      });
      if (me.options.responsive) {
        listener = function listener(width, height) {
          if (me.canvas) {
            me.resize(width, height);
          }
        };
        let detached;
        const attached = function attached() {
          _remove('attach', attached);
          me.attached = true;
          me.resize();
          _add('resize', listener);
          _add('detach', detached);
        };
        detached = function detached() {
          me.attached = false;
          _remove('resize', listener);
          _add('attach', attached);
        };
        if (platform.isAttached(me.canvas)) {
          attached();
        } else {
          detached();
        }
      } else {
        me.attached = true;
      }
    }
    ;
    _proto.unbindEvents = function unbindEvents() {
      const me = this;
      const listeners = me._listeners;
      if (!listeners) {
        return;
      }
      delete me._listeners;
      each(listeners, function (listener, type) {
        me.platform.removeEventListener(me, type, listener);
      });
    };
    _proto.updateHoverStyle = function updateHoverStyle(items, mode, enabled) {
      const prefix = enabled ? 'set' : 'remove';
      let meta, item, i, ilen;
      if (mode === 'dataset') {
        meta = this.getDatasetMeta(items[0].datasetIndex);
        meta.controller['_' + prefix + 'DatasetHoverStyle']();
      }
      for (i = 0, ilen = items.length; i < ilen; ++i) {
        item = items[i];
        if (item) {
          this.getDatasetMeta(item.datasetIndex).controller[prefix + 'HoverStyle'](item.element, item.datasetIndex, item.index);
        }
      }
    }
    ;
    _proto.getActiveElements = function getActiveElements() {
      return this._active || [];
    }
    ;
    _proto.setActiveElements = function setActiveElements(activeElements) {
      const me = this;
      const lastActive = me._active || [];
      const active = activeElements.map(function (_ref) {
        const datasetIndex = _ref.datasetIndex,
          index = _ref.index;
        const meta = me.getDatasetMeta(datasetIndex);
        if (!meta) {
          throw new Error('No dataset found at index ' + datasetIndex);
        }
        return {
          datasetIndex: datasetIndex,
          element: meta.data[index],
          index: index
        };
      });
      const changed = !_elementsEqual(active, lastActive);
      if (changed) {
        me._active = active;
        me._updateHoverStyles(active, lastActive);
      }
    }
    ;
    _proto._updateHoverStyles = function _updateHoverStyles(active, lastActive) {
      const me = this;
      const options = me.options || {};
      const hoverOptions = options.hover;
      if (lastActive.length) {
        me.updateHoverStyle(lastActive, hoverOptions.mode, false);
      }
      if (active.length && hoverOptions.mode) {
        me.updateHoverStyle(active, hoverOptions.mode, true);
      }
    }
    ;
    _proto._eventHandler = function _eventHandler(e, replay) {
      const me = this;
      if (me._plugins.notify(me, 'beforeEvent', [e, replay]) === false) {
        return;
      }
      me._handleEvent(e, replay);
      me._plugins.notify(me, 'afterEvent', [e, replay]);
      me.render();
      return me;
    }
    ;
    _proto._handleEvent = function _handleEvent(e, replay) {
      const me = this;
      const lastActive = me._active || [];
      const options = me.options;
      const hoverOptions = options.hover;
      const useFinalPosition = replay;
      let active = [];
      let changed = false;
      if (e.type === 'mouseout') {
        me._lastEvent = null;
      } else {
        active = me.getElementsAtEventForMode(e, hoverOptions.mode, hoverOptions, useFinalPosition);
        me._lastEvent = e.type === 'click' ? me._lastEvent : e;
      }
      callback(options.onHover || options.hover.onHover, [e, active, me], me);
      if (e.type === 'mouseup' || e.type === 'click' || e.type === 'contextmenu') {
        if (_isPointInArea(e, me.chartArea)) {
          callback(options.onClick, [e, active, me], me);
        }
      }
      changed = !_elementsEqual(active, lastActive);
      if (changed || replay) {
        me._active = active;
        me._updateHoverStyles(active, lastActive);
      }
      return changed;
    };
    _createClass(Chart, [{
      key: 'data',
      get: function get() {
        return this.config.data;
      },
      set: function set(data) {
        this.config.data = data;
      }
    }]);
    return Chart;
  }();
  Chart.defaults = defaults;
  Chart.instances = {};
  Chart.registry = registry;
  Chart.version = version;
  Chart.getChart = function (key) {
    const canvas = getCanvas(key);
    return Object.values(Chart.instances).filter(function (c) {
      return c.canvas === canvas;
    }).pop();
  };
  const invalidatePlugins = function invalidatePlugins() {
    return each(Chart.instances, function (chart) {
      return chart._plugins.invalidate();
    });
  };
  Chart.register = function () {
    registry.add.apply(registry, arguments);
    invalidatePlugins();
  };
  Chart.unregister = function () {
    registry.remove.apply(registry, arguments);
    invalidatePlugins();
  };

  const EPSILON = Number.EPSILON || 1e-14;
  function splineCurve(firstPoint, middlePoint, afterPoint, t) {
    const previous = firstPoint.skip ? middlePoint : firstPoint;
    const current = middlePoint;
    const next = afterPoint.skip ? middlePoint : afterPoint;
    const d01 = Math.sqrt(Math.pow(current.x - previous.x, 2) + Math.pow(current.y - previous.y, 2));
    const d12 = Math.sqrt(Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2));
    let s01 = d01 / (d01 + d12);
    let s12 = d12 / (d01 + d12);
    s01 = isNaN(s01) ? 0 : s01;
    s12 = isNaN(s12) ? 0 : s12;
    const fa = t * s01;
    const fb = t * s12;
    return {
      previous: {
        x: current.x - fa * (next.x - previous.x),
        y: current.y - fa * (next.y - previous.y)
      },
      next: {
        x: current.x + fb * (next.x - previous.x),
        y: current.y + fb * (next.y - previous.y)
      }
    };
  }
  function splineCurveMonotone(points) {
    const pointsWithTangents = (points || []).map(function (point) {
      return {
        model: point,
        deltaK: 0,
        mK: 0
      };
    });
    const pointsLen = pointsWithTangents.length;
    let i, pointBefore, pointCurrent, pointAfter;
    for (i = 0; i < pointsLen; ++i) {
      pointCurrent = pointsWithTangents[i];
      if (pointCurrent.model.skip) {
        continue;
      }
      pointBefore = i > 0 ? pointsWithTangents[i - 1] : null;
      pointAfter = i < pointsLen - 1 ? pointsWithTangents[i + 1] : null;
      if (pointAfter && !pointAfter.model.skip) {
        const slopeDeltaX = pointAfter.model.x - pointCurrent.model.x;
        pointCurrent.deltaK = slopeDeltaX !== 0 ? (pointAfter.model.y - pointCurrent.model.y) / slopeDeltaX : 0;
      }
      if (!pointBefore || pointBefore.model.skip) {
        pointCurrent.mK = pointCurrent.deltaK;
      } else if (!pointAfter || pointAfter.model.skip) {
        pointCurrent.mK = pointBefore.deltaK;
      } else if (sign(pointBefore.deltaK) !== sign(pointCurrent.deltaK)) {
        pointCurrent.mK = 0;
      } else {
        pointCurrent.mK = (pointBefore.deltaK + pointCurrent.deltaK) / 2;
      }
    }
    let alphaK, betaK, tauK, squaredMagnitude;
    for (i = 0; i < pointsLen - 1; ++i) {
      pointCurrent = pointsWithTangents[i];
      pointAfter = pointsWithTangents[i + 1];
      if (pointCurrent.model.skip || pointAfter.model.skip) {
        continue;
      }
      if (almostEquals(pointCurrent.deltaK, 0, EPSILON)) {
        pointCurrent.mK = pointAfter.mK = 0;
        continue;
      }
      alphaK = pointCurrent.mK / pointCurrent.deltaK;
      betaK = pointAfter.mK / pointCurrent.deltaK;
      squaredMagnitude = Math.pow(alphaK, 2) + Math.pow(betaK, 2);
      if (squaredMagnitude <= 9) {
        continue;
      }
      tauK = 3 / Math.sqrt(squaredMagnitude);
      pointCurrent.mK = alphaK * tauK * pointCurrent.deltaK;
      pointAfter.mK = betaK * tauK * pointCurrent.deltaK;
    }
    let deltaX;
    for (i = 0; i < pointsLen; ++i) {
      pointCurrent = pointsWithTangents[i];
      if (pointCurrent.model.skip) {
        continue;
      }
      pointBefore = i > 0 ? pointsWithTangents[i - 1] : null;
      pointAfter = i < pointsLen - 1 ? pointsWithTangents[i + 1] : null;
      if (pointBefore && !pointBefore.model.skip) {
        deltaX = (pointCurrent.model.x - pointBefore.model.x) / 3;
        pointCurrent.model.controlPointPreviousX = pointCurrent.model.x - deltaX;
        pointCurrent.model.controlPointPreviousY = pointCurrent.model.y - deltaX * pointCurrent.mK;
      }
      if (pointAfter && !pointAfter.model.skip) {
        deltaX = (pointAfter.model.x - pointCurrent.model.x) / 3;
        pointCurrent.model.controlPointNextX = pointCurrent.model.x + deltaX;
        pointCurrent.model.controlPointNextY = pointCurrent.model.y + deltaX * pointCurrent.mK;
      }
    }
  }
  function capControlPoint(pt, min, max) {
    return Math.max(Math.min(pt, max), min);
  }
  function capBezierPoints(points, area) {
    let i, ilen, point;
    for (i = 0, ilen = points.length; i < ilen; ++i) {
      point = points[i];
      if (!_isPointInArea(point, area)) {
        continue;
      }
      if (i > 0 && _isPointInArea(points[i - 1], area)) {
        point.controlPointPreviousX = capControlPoint(point.controlPointPreviousX, area.left, area.right);
        point.controlPointPreviousY = capControlPoint(point.controlPointPreviousY, area.top, area.bottom);
      }
      if (i < points.length - 1 && _isPointInArea(points[i + 1], area)) {
        point.controlPointNextX = capControlPoint(point.controlPointNextX, area.left, area.right);
        point.controlPointNextY = capControlPoint(point.controlPointNextY, area.top, area.bottom);
      }
    }
  }
  function _updateBezierControlPoints(points, options, area, loop) {
    let i, ilen, point, controlPoints;
    if (options.spanGaps) {
      points = points.filter(function (pt) {
        return !pt.skip;
      });
    }
    if (options.cubicInterpolationMode === 'monotone') {
      splineCurveMonotone(points);
    } else {
      let prev = loop ? points[points.length - 1] : points[0];
      for (i = 0, ilen = points.length; i < ilen; ++i) {
        point = points[i];
        controlPoints = splineCurve(prev, point, points[Math.min(i + 1, ilen - (loop ? 0 : 1)) % ilen], options.tension);
        point.controlPointPreviousX = controlPoints.previous.x;
        point.controlPointPreviousY = controlPoints.previous.y;
        point.controlPointNextX = controlPoints.next.x;
        point.controlPointNextY = controlPoints.next.y;
        prev = point;
      }
    }
    if (options.capBezierPoints) {
      capBezierPoints(points, area);
    }
  }

  function _pointInLine(p1, p2, t, mode) {
    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y)
    };
  }
  function _steppedInterpolation(p1, p2, t, mode) {
    return {
      x: p1.x + t * (p2.x - p1.x),
      y: mode === 'middle' ? t < 0.5 ? p1.y : p2.y : mode === 'after' ? t < 1 ? p1.y : p2.y : t > 0 ? p2.y : p1.y
    };
  }
  function _bezierInterpolation(p1, p2, t, mode) {
    const cp1 = {
      x: p1.controlPointNextX,
      y: p1.controlPointNextY
    };
    const cp2 = {
      x: p2.controlPointPreviousX,
      y: p2.controlPointPreviousY
    };
    const a = _pointInLine(p1, cp1, t);
    const b = _pointInLine(cp1, cp2, t);
    const c = _pointInLine(cp2, p2, t);
    const d = _pointInLine(a, b, t);
    const e = _pointInLine(b, c, t);
    return _pointInLine(d, e, t);
  }

  const getRightToLeftAdapter = function getRightToLeftAdapter(rectX, width) {
    return {
      x: function x(_x) {
        return rectX + rectX + width - _x;
      },
      setWidth: function setWidth(w) {
        width = w;
      },
      textAlign: function textAlign(align) {
        if (align === 'center') {
          return align;
        }
        return align === 'right' ? 'left' : 'right';
      },
      xPlus: function xPlus(x, value) {
        return x - value;
      },
      leftForLtr: function leftForLtr(x, itemWidth) {
        return x - itemWidth;
      }
    };
  };
  const getLeftToRightAdapter = function getLeftToRightAdapter() {
    return {
      x: function x(_x2) {
        return _x2;
      },
      setWidth: function setWidth(w) {
      },
      textAlign: function textAlign(align) {
        return align;
      },
      xPlus: function xPlus(x, value) {
        return x + value;
      },
      leftForLtr: function leftForLtr(x, _itemWidth) {
        return x;
      }
    };
  };
  function getRtlAdapter(rtl, rectX, width) {
    return rtl ? getRightToLeftAdapter(rectX, width) : getLeftToRightAdapter();
  }
  function overrideTextDirection(ctx, direction) {
    let style, original;
    if (direction === 'ltr' || direction === 'rtl') {
      style = ctx.canvas.style;
      original = [style.getPropertyValue('direction'), style.getPropertyPriority('direction')];
      style.setProperty('direction', direction, 'important');
      ctx.prevTextDirection = original;
    }
  }
  function restoreTextDirection(ctx, original) {
    if (original !== undefined) {
      delete ctx.prevTextDirection;
      ctx.canvas.style.setProperty('direction', original[0], original[1]);
    }
  }

  function propertyFn(property) {
    if (property === 'angle') {
      return {
        between: _angleBetween,
        compare: _angleDiff,
        normalize: _normalizeAngle
      };
    }
    return {
      between: function between(n, s, e) {
        return n >= s && n <= e;
      },
      compare: function compare(a, b) {
        return a - b;
      },
      normalize: function normalize(x) {
        return x;
      }
    };
  }
  function makeSubSegment(start, end, loop, count) {
    return {
      start: start % count,
      end: end % count,
      loop: loop && (end - start + 1) % count === 0
    };
  }
  function getSegment(segment, points, bounds) {
    const property = bounds.property,
      startBound = bounds.start,
      endBound = bounds.end;
    const _propertyFn = propertyFn(property),
      between = _propertyFn.between,
      normalize = _propertyFn.normalize;
    const count = points.length;
    let start = segment.start,
      end = segment.end,
      loop = segment.loop;
    let i, ilen;
    if (loop) {
      start += count;
      end += count;
      for (i = 0, ilen = count; i < ilen; ++i) {
        if (!between(normalize(points[start % count][property]), startBound, endBound)) {
          break;
        }
        start--;
        end--;
      }
      start %= count;
      end %= count;
    }
    if (end < start) {
      end += count;
    }
    return {
      start: start,
      end: end,
      loop: loop
    };
  }
  function _boundSegment(segment, points, bounds) {
    if (!bounds) {
      return [segment];
    }
    const property = bounds.property,
      startBound = bounds.start,
      endBound = bounds.end;
    const count = points.length;
    const _propertyFn2 = propertyFn(property),
      compare = _propertyFn2.compare,
      between = _propertyFn2.between,
      normalize = _propertyFn2.normalize;
    const _getSegment = getSegment(segment, points, bounds),
      start = _getSegment.start,
      end = _getSegment.end,
      loop = _getSegment.loop;
    const result = [];
    let inside = false;
    let subStart = null;
    let value, point, prevValue;
    const startIsBefore = function startIsBefore() {
      return between(startBound, prevValue, value) && compare(startBound, prevValue) !== 0;
    };
    const endIsBefore = function endIsBefore() {
      return compare(endBound, value) === 0 || between(endBound, prevValue, value);
    };
    const shouldStart = function shouldStart() {
      return inside || startIsBefore();
    };
    const shouldStop = function shouldStop() {
      return !inside || endIsBefore();
    };
    for (let i = start, prev = start; i <= end; ++i) {
      point = points[i % count];
      if (point.skip) {
        continue;
      }
      value = normalize(point[property]);
      inside = between(value, startBound, endBound);
      if (subStart === null && shouldStart()) {
        subStart = compare(value, startBound) === 0 ? i : prev;
      }
      if (subStart !== null && shouldStop()) {
        result.push(makeSubSegment(subStart, i, loop, count));
        subStart = null;
      }
      prev = i;
      prevValue = value;
    }
    if (subStart !== null) {
      result.push(makeSubSegment(subStart, end, loop, count));
    }
    return result;
  }
  function _boundSegments(line, bounds) {
    const result = [];
    const segments = line.segments;
    for (let i = 0; i < segments.length; i++) {
      const sub = _boundSegment(segments[i], line.points, bounds);
      if (sub.length) {
        result.push.apply(result, sub);
      }
    }
    return result;
  }
  function findStartAndEnd(points, count, loop, spanGaps) {
    let start = 0;
    let end = count - 1;
    if (loop && !spanGaps) {
      while (start < count && !points[start].skip) {
        start++;
      }
    }
    while (start < count && points[start].skip) {
      start++;
    }
    start %= count;
    if (loop) {
      end += start;
    }
    while (end > start && points[end % count].skip) {
      end--;
    }
    end %= count;
    return {
      start: start,
      end: end
    };
  }
  function solidSegments(points, start, max, loop) {
    const count = points.length;
    const result = [];
    let last = start;
    let prev = points[start];
    let end;
    for (end = start + 1; end <= max; ++end) {
      const cur = points[end % count];
      if (cur.skip || cur.stop) {
        if (!prev.skip) {
          loop = false;
          result.push({
            start: start % count,
            end: (end - 1) % count,
            loop: loop
          });
          start = last = cur.stop ? end : null;
        }
      } else {
        last = end;
        if (prev.skip) {
          start = end;
        }
      }
      prev = cur;
    }
    if (last !== null) {
      result.push({
        start: start % count,
        end: last % count,
        loop: loop
      });
    }
    return result;
  }
  function _computeSegments(line) {
    const points = line.points;
    const spanGaps = line.options.spanGaps;
    const count = points.length;
    if (!count) {
      return [];
    }
    const loop = !!line._loop;
    const _findStartAndEnd = findStartAndEnd(points, count, loop, spanGaps),
      start = _findStartAndEnd.start,
      end = _findStartAndEnd.end;
    if (spanGaps === true) {
      return [{
        start: start,
        end: end,
        loop: loop
      }];
    }
    const max = end < start ? end + count : end;
    const completeLoop = !!line._fullLoop && start === 0 && end === count - 1;
    return solidSegments(points, start, max, completeLoop);
  }

  const helpers = /*#__PURE__*/Object.freeze({
    __proto__: null,
    easingEffects: effects,
    color: color,
    getHoverColor: getHoverColor,
    requestAnimFrame: requestAnimFrame,
    fontString: fontString,
    noop: noop,
    uid: uid,
    isNullOrUndef: isNullOrUndef,
    isArray: isArray,
    isObject: isObject,
    isFinite: isNumberFinite,
    valueOrDefault: valueOrDefault,
    callback: callback,
    each: each,
    _elementsEqual: _elementsEqual,
    clone: clone,
    _merger: _merger,
    merge: merge,
    mergeIf: mergeIf,
    _mergerIf: _mergerIf,
    _deprecated: _deprecated,
    resolveObjectKey: resolveObjectKey,
    _capitalize: _capitalize,
    toFontString: toFontString,
    _measureText: _measureText,
    _longestText: _longestText,
    _alignPixel: _alignPixel,
    clear: clear,
    drawPoint: drawPoint,
    _isPointInArea: _isPointInArea,
    clipArea: clipArea,
    unclipArea: unclipArea,
    _steppedLineTo: _steppedLineTo,
    _bezierCurveTo: _bezierCurveTo,
    _lookup: _lookup,
    _lookupByKey: _lookupByKey,
    _rlookupByKey: _rlookupByKey,
    _filterBetween: _filterBetween,
    listenArrayEvents: listenArrayEvents,
    unlistenArrayEvents: unlistenArrayEvents,
    _arrayUnique: _arrayUnique,
    splineCurve: splineCurve,
    splineCurveMonotone: splineCurveMonotone,
    _updateBezierControlPoints: _updateBezierControlPoints,
    _getParentNode: _getParentNode,
    getStyle: getStyle,
    getRelativePosition: getRelativePosition,
    getMaximumSize: getMaximumSize,
    retinaScale: retinaScale,
    supportsEventListenerOptions: supportsEventListenerOptions,
    readUsedSize: readUsedSize,
    _pointInLine: _pointInLine,
    _steppedInterpolation: _steppedInterpolation,
    _bezierInterpolation: _bezierInterpolation,
    toLineHeight: toLineHeight,
    toTRBL: toTRBL,
    toTRBLCorners: toTRBLCorners,
    toPadding: toPadding,
    toFont: toFont,
    resolve: resolve,
    PI: PI,
    TAU: TAU,
    PITAU: PITAU,
    INFINITY: INFINITY,
    RAD_PER_DEG: RAD_PER_DEG,
    HALF_PI: HALF_PI,
    QUARTER_PI: QUARTER_PI,
    TWO_THIRDS_PI: TWO_THIRDS_PI,
    _factorize: _factorize,
    log10: log10,
    isNumber: isNumber,
    almostEquals: almostEquals,
    almostWhole: almostWhole,
    _setMinAndMaxByKey: _setMinAndMaxByKey,
    sign: sign,
    toRadians: toRadians,
    toDegrees: toDegrees,
    _decimalPlaces: _decimalPlaces,
    getAngleFromPoint: getAngleFromPoint,
    distanceBetweenPoints: distanceBetweenPoints,
    _angleDiff: _angleDiff,
    _normalizeAngle: _normalizeAngle,
    _angleBetween: _angleBetween,
    _limitValue: _limitValue,
    _int16Range: _int16Range,
    getRtlAdapter: getRtlAdapter,
    overrideTextDirection: overrideTextDirection,
    restoreTextDirection: restoreTextDirection,
    _boundSegment: _boundSegment,
    _boundSegments: _boundSegments,
    _computeSegments: _computeSegments
  });

  function abstract() {
    throw new Error('This method is not implemented: either no adapter can be found or an incomplete integration was provided.');
  }
  const DateAdapter = function () {
    function DateAdapter(options) {
      this.options = options || {};
    }
    const _proto = DateAdapter.prototype;
    _proto.formats = function formats() {
      return abstract();
    }
    ;
    _proto.parse = function parse(value, format) {
      return abstract();
    }
    ;
    _proto.format = function format(timestamp, _format) {
      return abstract();
    }
    ;
    _proto.add = function add(timestamp, amount, unit) {
      return abstract();
    }
    ;
    _proto.diff = function diff(a, b, unit) {
      return abstract();
    }
    ;
    _proto.startOf = function startOf(timestamp, unit, weekday) {
      return abstract();
    }
    ;
    _proto.endOf = function endOf(timestamp, unit) {
      return abstract();
    };
    return DateAdapter;
  }();
  DateAdapter.override = function (members) {
    _extends(DateAdapter.prototype, members);
  };
  const _adapters = {
    _date: DateAdapter
  };

  function getAllScaleValues(scale) {
    if (!scale._cache.$bar) {
      const metas = scale.getMatchingVisibleMetas('bar');
      let values = [];
      for (let i = 0, ilen = metas.length; i < ilen; i++) {
        values = values.concat(metas[i].controller.getAllParsedValues(scale));
      }
      scale._cache.$bar = _arrayUnique(values.sort(function (a, b) {
        return a - b;
      }));
    }
    return scale._cache.$bar;
  }
  function computeMinSampleSize(scale) {
    const values = getAllScaleValues(scale);
    let min = scale._length;
    let i, ilen, curr, prev;
    const updateMinAndPrev = function updateMinAndPrev() {
      min = Math.min(min, i && Math.abs(curr - prev) || min);
      prev = curr;
    };
    for (i = 0, ilen = values.length; i < ilen; ++i) {
      curr = scale.getPixelForValue(values[i]);
      updateMinAndPrev();
    }
    for (i = 0, ilen = scale.ticks.length; i < ilen; ++i) {
      curr = scale.getPixelForTick(i);
      updateMinAndPrev();
    }
    return min;
  }
  function computeFitCategoryTraits(index, ruler, options, stackCount) {
    const thickness = options.barThickness;
    let size, ratio;
    if (isNullOrUndef(thickness)) {
      size = ruler.min * options.categoryPercentage;
      ratio = options.barPercentage;
    } else {
      size = thickness * stackCount;
      ratio = 1;
    }
    return {
      chunk: size / stackCount,
      ratio: ratio,
      start: ruler.pixels[index] - size / 2
    };
  }
  function computeFlexCategoryTraits(index, ruler, options, stackCount) {
    const pixels = ruler.pixels;
    const curr = pixels[index];
    let prev = index > 0 ? pixels[index - 1] : null;
    let next = index < pixels.length - 1 ? pixels[index + 1] : null;
    const percent = options.categoryPercentage;
    if (prev === null) {
      prev = curr - (next === null ? ruler.end - ruler.start : next - curr);
    }
    if (next === null) {
      next = curr + curr - prev;
    }
    const start = curr - (curr - Math.min(prev, next)) / 2 * percent;
    const size = Math.abs(next - prev) / 2 * percent;
    return {
      chunk: size / stackCount,
      ratio: options.barPercentage,
      start: start
    };
  }
  function parseFloatBar(entry, item, vScale, i) {
    const startValue = vScale.parse(entry[0], i);
    const endValue = vScale.parse(entry[1], i);
    const min = Math.min(startValue, endValue);
    const max = Math.max(startValue, endValue);
    let barStart = min;
    let barEnd = max;
    if (Math.abs(min) > Math.abs(max)) {
      barStart = max;
      barEnd = min;
    }
    item[vScale.axis] = barEnd;
    item._custom = {
      barStart: barStart,
      barEnd: barEnd,
      start: startValue,
      end: endValue,
      min: min,
      max: max
    };
  }
  function parseValue(entry, item, vScale, i) {
    if (isArray(entry)) {
      parseFloatBar(entry, item, vScale, i);
    } else {
      item[vScale.axis] = vScale.parse(entry, i);
    }
    return item;
  }
  function parseArrayOrPrimitive(meta, data, start, count) {
    const iScale = meta.iScale;
    const vScale = meta.vScale;
    const labels = iScale.getLabels();
    const singleScale = iScale === vScale;
    const parsed = [];
    let i, ilen, item, entry;
    for (i = start, ilen = start + count; i < ilen; ++i) {
      entry = data[i];
      item = {};
      item[iScale.axis] = singleScale || iScale.parse(labels[i], i);
      parsed.push(parseValue(entry, item, vScale, i));
    }
    return parsed;
  }
  function isFloatBar(custom) {
    return custom && custom.barStart !== undefined && custom.barEnd !== undefined;
  }
  const BarController = function (_DatasetController) {
    _inheritsLoose(BarController, _DatasetController);
    function BarController() {
      return _DatasetController.apply(this, arguments) || this;
    }
    const _proto = BarController.prototype;
    _proto.parsePrimitiveData = function parsePrimitiveData(meta, data, start, count) {
      return parseArrayOrPrimitive(meta, data, start, count);
    }
    ;
    _proto.parseArrayData = function parseArrayData(meta, data, start, count) {
      return parseArrayOrPrimitive(meta, data, start, count);
    }
    ;
    _proto.parseObjectData = function parseObjectData(meta, data, start, count) {
      const iScale = meta.iScale,
        vScale = meta.vScale;
      const _this$_parsing = this._parsing,
        _this$_parsing$xAxisK = _this$_parsing.xAxisKey,
        xAxisKey = _this$_parsing$xAxisK === void 0 ? 'x' : _this$_parsing$xAxisK,
        _this$_parsing$yAxisK = _this$_parsing.yAxisKey,
        yAxisKey = _this$_parsing$yAxisK === void 0 ? 'y' : _this$_parsing$yAxisK;
      const iAxisKey = iScale.axis === 'x' ? xAxisKey : yAxisKey;
      const vAxisKey = vScale.axis === 'x' ? xAxisKey : yAxisKey;
      const parsed = [];
      let i, ilen, item, obj;
      for (i = start, ilen = start + count; i < ilen; ++i) {
        obj = data[i];
        item = {};
        item[iScale.axis] = iScale.parse(resolveObjectKey(obj, iAxisKey), i);
        parsed.push(parseValue(resolveObjectKey(obj, vAxisKey), item, vScale, i));
      }
      return parsed;
    }
    ;
    _proto.updateRangeFromParsed = function updateRangeFromParsed(range, scale, parsed, stack) {
      _DatasetController.prototype.updateRangeFromParsed.call(this, range, scale, parsed, stack);
      const custom = parsed._custom;
      if (custom && scale === this._cachedMeta.vScale) {
        range.min = Math.min(range.min, custom.min);
        range.max = Math.max(range.max, custom.max);
      }
    }
    ;
    _proto.getLabelAndValue = function getLabelAndValue(index) {
      const me = this;
      const meta = me._cachedMeta;
      const iScale = meta.iScale,
        vScale = meta.vScale;
      const parsed = me.getParsed(index);
      const custom = parsed._custom;
      const value = isFloatBar(custom) ? '[' + custom.start + ', ' + custom.end + ']' : '' + vScale.getLabelForValue(parsed[vScale.axis]);
      return {
        label: '' + iScale.getLabelForValue(parsed[iScale.axis]),
        value: value
      };
    };
    _proto.initialize = function initialize() {
      const me = this;
      me.enableOptionSharing = true;
      _DatasetController.prototype.initialize.call(this);
      const meta = me._cachedMeta;
      meta.stack = me.getDataset().stack;
    };
    _proto.update = function update(mode) {
      const me = this;
      const meta = me._cachedMeta;
      me.updateElements(meta.data, 0, meta.data.length, mode);
    };
    _proto.updateElements = function updateElements(bars, start, count, mode) {
      const me = this;
      const reset = mode === 'reset';
      const vscale = me._cachedMeta.vScale;
      const base = vscale.getBasePixel();
      const horizontal = vscale.isHorizontal();
      const ruler = me._getRuler();
      const firstOpts = me.resolveDataElementOptions(start, mode);
      const sharedOptions = me.getSharedOptions(firstOpts);
      const includeOptions = me.includeOptions(mode, sharedOptions);
      me.updateSharedOptions(sharedOptions, mode, firstOpts);
      for (let i = start; i < start + count; i++) {
        const options = sharedOptions || me.resolveDataElementOptions(i, mode);
        const vpixels = me._calculateBarValuePixels(i, options);
        const ipixels = me._calculateBarIndexPixels(i, ruler, options);
        const properties = {
          horizontal: horizontal,
          base: reset ? base : vpixels.base,
          x: horizontal ? reset ? base : vpixels.head : ipixels.center,
          y: horizontal ? ipixels.center : reset ? base : vpixels.head,
          height: horizontal ? ipixels.size : undefined,
          width: horizontal ? undefined : ipixels.size
        };
        if (includeOptions) {
          properties.options = options;
        }
        me.updateElement(bars[i], i, properties, mode);
      }
    }
    ;
    _proto._getStacks = function _getStacks(last, dataIndex) {
      const me = this;
      const meta = me._cachedMeta;
      const iScale = meta.iScale;
      const metasets = iScale.getMatchingVisibleMetas(me._type);
      const stacked = iScale.options.stacked;
      const ilen = metasets.length;
      const stacks = [];
      let i, item;
      for (i = 0; i < ilen; ++i) {
        item = metasets[i];
        if (typeof dataIndex !== 'undefined') {
          const val = item.controller.getParsed(dataIndex)[item.controller._cachedMeta.vScale.axis];
          if (isNullOrUndef(val) || isNaN(val)) {
            continue;
          }
        }
        if (stacked === false || stacks.indexOf(item.stack) === -1 || stacked === undefined && item.stack === undefined) {
          stacks.push(item.stack);
        }
        if (item.index === last) {
          break;
        }
      }
      if (!stacks.length) {
        stacks.push(undefined);
      }
      return stacks;
    }
    ;
    _proto._getStackCount = function _getStackCount(index) {
      return this._getStacks(undefined, index).length;
    }
    ;
    _proto._getStackIndex = function _getStackIndex(datasetIndex, name) {
      const stacks = this._getStacks(datasetIndex);
      const index = name !== undefined ? stacks.indexOf(name) : -1;
      return index === -1 ? stacks.length - 1 : index;
    }
    ;
    _proto._getRuler = function _getRuler() {
      const me = this;
      const meta = me._cachedMeta;
      const iScale = meta.iScale;
      const pixels = [];
      let i, ilen;
      for (i = 0, ilen = meta.data.length; i < ilen; ++i) {
        pixels.push(iScale.getPixelForValue(me.getParsed(i)[iScale.axis], i));
      }
      const min = computeMinSampleSize(iScale);
      return {
        min: min,
        pixels: pixels,
        start: iScale._startPixel,
        end: iScale._endPixel,
        stackCount: me._getStackCount(),
        scale: iScale
      };
    }
    ;
    _proto._calculateBarValuePixels = function _calculateBarValuePixels(index, options) {
      const me = this;
      const meta = me._cachedMeta;
      const vScale = meta.vScale;
      const baseValue = options.base,
        minBarLength = options.minBarLength;
      const parsed = me.getParsed(index);
      const custom = parsed._custom;
      const floating = isFloatBar(custom);
      let value = parsed[vScale.axis];
      let start = 0;
      let length = meta._stacked ? me.applyStack(vScale, parsed) : value;
      let head, size;
      if (length !== value) {
        start = length - value;
        length = value;
      }
      if (floating) {
        value = custom.barStart;
        length = custom.barEnd - custom.barStart;
        if (value !== 0 && sign(value) !== sign(custom.barEnd)) {
          start = 0;
        }
        start += value;
      }
      const startValue = !isNullOrUndef(baseValue) && !floating ? baseValue : start;
      let base = vScale.getPixelForValue(startValue);
      if (this.chart.getDataVisibility(index)) {
        head = vScale.getPixelForValue(start + length);
      } else {
        head = base;
      }
      size = head - base;
      if (minBarLength !== undefined && Math.abs(size) < minBarLength) {
        size = size < 0 ? -minBarLength : minBarLength;
        if (value === 0) {
          base -= size / 2;
        }
        head = base + size;
      }
      return {
        size: size,
        base: base,
        head: head,
        center: head + size / 2
      };
    }
    ;
    _proto._calculateBarIndexPixels = function _calculateBarIndexPixels(index, ruler, options) {
      const me = this;
      const stackCount = me.chart.options.skipNull ? me._getStackCount(index) : ruler.stackCount;
      const range = options.barThickness === 'flex' ? computeFlexCategoryTraits(index, ruler, options, stackCount) : computeFitCategoryTraits(index, ruler, options, stackCount);
      const stackIndex = me._getStackIndex(me.index, me._cachedMeta.stack);
      const center = range.start + range.chunk * stackIndex + range.chunk / 2;
      const size = Math.min(valueOrDefault(options.maxBarThickness, Infinity), range.chunk * range.ratio);
      return {
        base: center - size / 2,
        head: center + size / 2,
        center: center,
        size: size
      };
    };
    _proto.draw = function draw() {
      const me = this;
      const chart = me.chart;
      const meta = me._cachedMeta;
      const vScale = meta.vScale;
      const rects = meta.data;
      const ilen = rects.length;
      let i = 0;
      clipArea(chart.ctx, chart.chartArea);
      for (; i < ilen; ++i) {
        if (!isNaN(me.getParsed(i)[vScale.axis])) {
          rects[i].draw(me._ctx);
        }
      }
      unclipArea(chart.ctx);
    };
    return BarController;
  }(DatasetController);
  BarController.id = 'bar';
  BarController.defaults = {
    datasetElementType: false,
    dataElementType: 'bar',
    dataElementOptions: ['backgroundColor', 'borderColor', 'borderSkipped', 'borderWidth', 'borderRadius', 'barPercentage', 'barThickness', 'base', 'categoryPercentage', 'maxBarThickness', 'minBarLength'],
    interaction: {
      mode: 'index'
    },
    hover: {},
    datasets: {
      categoryPercentage: 0.8,
      barPercentage: 0.9,
      animation: {
        numbers: {
          type: 'number',
          properties: ['x', 'y', 'base', 'width', 'height']
        }
      }
    },
    scales: {
      _index_: {
        type: 'category',
        offset: true,
        gridLines: {
          offsetGridLines: true
        }
      },
      _value_: {
        type: 'linear',
        beginAtZero: true
      }
    }
  };

  const BubbleController = function (_DatasetController) {
    _inheritsLoose(BubbleController, _DatasetController);
    function BubbleController() {
      return _DatasetController.apply(this, arguments) || this;
    }
    const _proto = BubbleController.prototype;
    _proto.initialize = function initialize() {
      this.enableOptionSharing = true;
      _DatasetController.prototype.initialize.call(this);
    }
    ;
    _proto.parseObjectData = function parseObjectData(meta, data, start, count) {
      const xScale = meta.xScale,
        yScale = meta.yScale;
      const _this$_parsing = this._parsing,
        _this$_parsing$xAxisK = _this$_parsing.xAxisKey,
        xAxisKey = _this$_parsing$xAxisK === void 0 ? 'x' : _this$_parsing$xAxisK,
        _this$_parsing$yAxisK = _this$_parsing.yAxisKey,
        yAxisKey = _this$_parsing$yAxisK === void 0 ? 'y' : _this$_parsing$yAxisK;
      const parsed = [];
      let i, ilen, item;
      for (i = start, ilen = start + count; i < ilen; ++i) {
        item = data[i];
        parsed.push({
          x: xScale.parse(resolveObjectKey(item, xAxisKey), i),
          y: yScale.parse(resolveObjectKey(item, yAxisKey), i),
          _custom: item && item.r && +item.r
        });
      }
      return parsed;
    }
    ;
    _proto.getMaxOverflow = function getMaxOverflow() {
      const me = this;
      const meta = me._cachedMeta;
      const data = meta.data;
      let max = 0;
      for (let i = data.length - 1; i >= 0; --i) {
        max = Math.max(max, data[i].size());
      }
      return max > 0 && max;
    }
    ;
    _proto.getLabelAndValue = function getLabelAndValue(index) {
      const me = this;
      const meta = me._cachedMeta;
      const xScale = meta.xScale,
        yScale = meta.yScale;
      const parsed = me.getParsed(index);
      const x = xScale.getLabelForValue(parsed.x);
      const y = yScale.getLabelForValue(parsed.y);
      const r = parsed._custom;
      return {
        label: meta.label,
        value: '(' + x + ', ' + y + (r ? ', ' + r : '') + ')'
      };
    };
    _proto.update = function update(mode) {
      const me = this;
      const points = me._cachedMeta.data;
      me.updateElements(points, 0, points.length, mode);
    };
    _proto.updateElements = function updateElements(points, start, count, mode) {
      const me = this;
      const reset = mode === 'reset';
      const _me$_cachedMeta = me._cachedMeta,
        xScale = _me$_cachedMeta.xScale,
        yScale = _me$_cachedMeta.yScale;
      const firstOpts = me.resolveDataElementOptions(start, mode);
      const sharedOptions = me.getSharedOptions(firstOpts);
      const includeOptions = me.includeOptions(mode, sharedOptions);
      for (let i = start; i < start + count; i++) {
        const point = points[i];
        const parsed = !reset && me.getParsed(i);
        const x = reset ? xScale.getPixelForDecimal(0.5) : xScale.getPixelForValue(parsed.x);
        const y = reset ? yScale.getBasePixel() : yScale.getPixelForValue(parsed.y);
        const properties = {
          x: x,
          y: y,
          skip: isNaN(x) || isNaN(y)
        };
        if (includeOptions) {
          properties.options = me.resolveDataElementOptions(i, mode);
          if (reset) {
            properties.options.radius = 0;
          }
        }
        me.updateElement(point, i, properties, mode);
      }
      me.updateSharedOptions(sharedOptions, mode, firstOpts);
    }
    ;
    _proto.resolveDataElementOptions = function resolveDataElementOptions(index, mode) {
      const me = this;
      const chart = me.chart;
      const parsed = me.getParsed(index);
      let values = _DatasetController.prototype.resolveDataElementOptions.call(this, index, mode);
      const context = me.getContext(index, mode === 'active');
      if (values.$shared) {
        values = _extends({}, values, {
          $shared: false
        });
      }
      if (mode !== 'active') {
        values.radius = 0;
      }
      values.radius += resolve([parsed && parsed._custom, me._config.radius, chart.options.elements.point.radius], context, index);
      return values;
    };
    return BubbleController;
  }(DatasetController);
  BubbleController.id = 'bubble';
  BubbleController.defaults = {
    datasetElementType: false,
    dataElementType: 'point',
    dataElementOptions: ['backgroundColor', 'borderColor', 'borderWidth', 'hitRadius', 'radius', 'pointStyle', 'rotation'],
    animation: {
      numbers: {
        properties: ['x', 'y', 'borderWidth', 'radius']
      }
    },
    scales: {
      x: {
        type: 'linear'
      },
      y: {
        type: 'linear'
      }
    },
    tooltips: {
      callbacks: {
        title: function title() {
          return '';
        }
      }
    }
  };

  function getRatioAndOffset(rotation, circumference, cutout) {
    let ratioX = 1;
    let ratioY = 1;
    let offsetX = 0;
    let offsetY = 0;
    if (circumference < TAU) {
      let startAngle = rotation % TAU;
      startAngle += startAngle >= PI ? -TAU : startAngle < -PI ? TAU : 0;
      const endAngle = startAngle + circumference;
      const startX = Math.cos(startAngle);
      const startY = Math.sin(startAngle);
      const endX = Math.cos(endAngle);
      const endY = Math.sin(endAngle);
      const contains0 = startAngle <= 0 && endAngle >= 0 || endAngle >= TAU;
      const contains90 = startAngle <= HALF_PI && endAngle >= HALF_PI || endAngle >= TAU + HALF_PI;
      const contains180 = startAngle === -PI || endAngle >= PI;
      const contains270 = startAngle <= -HALF_PI && endAngle >= -HALF_PI || endAngle >= PI + HALF_PI;
      const minX = contains180 ? -1 : Math.min(startX, startX * cutout, endX, endX * cutout);
      const minY = contains270 ? -1 : Math.min(startY, startY * cutout, endY, endY * cutout);
      const maxX = contains0 ? 1 : Math.max(startX, startX * cutout, endX, endX * cutout);
      const maxY = contains90 ? 1 : Math.max(startY, startY * cutout, endY, endY * cutout);
      ratioX = (maxX - minX) / 2;
      ratioY = (maxY - minY) / 2;
      offsetX = -(maxX + minX) / 2;
      offsetY = -(maxY + minY) / 2;
    }
    return {
      ratioX: ratioX,
      ratioY: ratioY,
      offsetX: offsetX,
      offsetY: offsetY
    };
  }
  const DoughnutController = function (_DatasetController) {
    _inheritsLoose(DoughnutController, _DatasetController);
    function DoughnutController(chart, datasetIndex) {
      let _this;
      _this = _DatasetController.call(this, chart, datasetIndex) || this;
      _this.enableOptionSharing = true;
      _this.innerRadius = undefined;
      _this.outerRadius = undefined;
      _this.offsetX = undefined;
      _this.offsetY = undefined;
      return _this;
    }
    const _proto = DoughnutController.prototype;
    _proto.linkScales = function linkScales() {}
    ;
    _proto.parse = function parse(start, count) {
      const data = this.getDataset().data;
      const meta = this._cachedMeta;
      let i, ilen;
      for (i = start, ilen = start + count; i < ilen; ++i) {
        meta._parsed[i] = +data[i];
      }
    }
    ;
    _proto.getRingIndex = function getRingIndex(datasetIndex) {
      let ringIndex = 0;
      for (let j = 0; j < datasetIndex; ++j) {
        if (this.chart.isDatasetVisible(j)) {
          ++ringIndex;
        }
      }
      return ringIndex;
    }
    ;
    _proto._getRotation = function _getRotation() {
      return toRadians(valueOrDefault(this._config.rotation, this.chart.options.rotation) - 90);
    }
    ;
    _proto._getCircumference = function _getCircumference() {
      return toRadians(valueOrDefault(this._config.circumference, this.chart.options.circumference));
    }
    ;
    _proto._getRotationExtents = function _getRotationExtents() {
      let min = TAU;
      let max = -TAU;
      const me = this;
      for (let i = 0; i < me.chart.data.datasets.length; ++i) {
        if (me.chart.isDatasetVisible(i)) {
          const controller = me.chart.getDatasetMeta(i).controller;
          const rotation = controller._getRotation();
          const circumference = controller._getCircumference();
          min = Math.min(min, rotation);
          max = Math.max(max, rotation + circumference);
        }
      }
      return {
        rotation: min,
        circumference: max - min
      };
    }
    ;
    _proto.update = function update(mode) {
      const me = this;
      const chart = me.chart;
      const chartArea = chart.chartArea,
        options = chart.options;
      const meta = me._cachedMeta;
      const arcs = meta.data;
      const cutout = options.cutoutPercentage / 100 || 0;
      const chartWeight = me._getRingWeight(me.index);
      const _me$_getRotationExten = me._getRotationExtents(),
        circumference = _me$_getRotationExten.circumference,
        rotation = _me$_getRotationExten.rotation;
      const _getRatioAndOffset = getRatioAndOffset(rotation, circumference, cutout),
        ratioX = _getRatioAndOffset.ratioX,
        ratioY = _getRatioAndOffset.ratioY,
        offsetX = _getRatioAndOffset.offsetX,
        offsetY = _getRatioAndOffset.offsetY;
      const spacing = me.getMaxBorderWidth() + me.getMaxOffset(arcs);
      const maxWidth = (chartArea.right - chartArea.left - spacing) / ratioX;
      const maxHeight = (chartArea.bottom - chartArea.top - spacing) / ratioY;
      const outerRadius = Math.max(Math.min(maxWidth, maxHeight) / 2, 0);
      const innerRadius = Math.max(outerRadius * cutout, 0);
      const radiusLength = (outerRadius - innerRadius) / me._getVisibleDatasetWeightTotal();
      me.offsetX = offsetX * outerRadius;
      me.offsetY = offsetY * outerRadius;
      meta.total = me.calculateTotal();
      me.outerRadius = outerRadius - radiusLength * me._getRingWeightOffset(me.index);
      me.innerRadius = Math.max(me.outerRadius - radiusLength * chartWeight, 0);
      me.updateElements(arcs, 0, arcs.length, mode);
    }
    ;
    _proto._circumference = function _circumference(i, reset) {
      const me = this;
      const opts = me.chart.options;
      const meta = me._cachedMeta;
      const circumference = me._getCircumference();
      return reset && opts.animation.animateRotate ? 0 : this.chart.getDataVisibility(i) ? me.calculateCircumference(meta._parsed[i] * circumference / TAU) : 0;
    };
    _proto.updateElements = function updateElements(arcs, start, count, mode) {
      const me = this;
      const reset = mode === 'reset';
      const chart = me.chart;
      const chartArea = chart.chartArea;
      const opts = chart.options;
      const animationOpts = opts.animation;
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;
      const animateScale = reset && animationOpts.animateScale;
      const innerRadius = animateScale ? 0 : me.innerRadius;
      const outerRadius = animateScale ? 0 : me.outerRadius;
      const firstOpts = me.resolveDataElementOptions(start, mode);
      const sharedOptions = me.getSharedOptions(firstOpts);
      const includeOptions = me.includeOptions(mode, sharedOptions);
      let startAngle = me._getRotation();
      let i;
      for (i = 0; i < start; ++i) {
        startAngle += me._circumference(i, reset);
      }
      for (i = start; i < start + count; ++i) {
        const circumference = me._circumference(i, reset);
        const arc = arcs[i];
        const properties = {
          x: centerX + me.offsetX,
          y: centerY + me.offsetY,
          startAngle: startAngle,
          endAngle: startAngle + circumference,
          circumference: circumference,
          outerRadius: outerRadius,
          innerRadius: innerRadius
        };
        if (includeOptions) {
          properties.options = sharedOptions || me.resolveDataElementOptions(i, mode);
        }
        startAngle += circumference;
        me.updateElement(arc, i, properties, mode);
      }
      me.updateSharedOptions(sharedOptions, mode, firstOpts);
    };
    _proto.calculateTotal = function calculateTotal() {
      const meta = this._cachedMeta;
      const metaData = meta.data;
      let total = 0;
      let i;
      for (i = 0; i < metaData.length; i++) {
        const value = meta._parsed[i];
        if (!isNaN(value) && this.chart.getDataVisibility(i)) {
          total += Math.abs(value);
        }
      }
      return total;
    };
    _proto.calculateCircumference = function calculateCircumference(value) {
      const total = this._cachedMeta.total;
      if (total > 0 && !isNaN(value)) {
        return TAU * (Math.abs(value) / total);
      }
      return 0;
    };
    _proto.getLabelAndValue = function getLabelAndValue(index) {
      const me = this;
      const meta = me._cachedMeta;
      const chart = me.chart;
      const labels = chart.data.labels || [];
      return {
        label: labels[index] || '',
        value: meta._parsed[index]
      };
    };
    _proto.getMaxBorderWidth = function getMaxBorderWidth(arcs) {
      const me = this;
      let max = 0;
      const chart = me.chart;
      let i, ilen, meta, controller, options;
      if (!arcs) {
        for (i = 0, ilen = chart.data.datasets.length; i < ilen; ++i) {
          if (chart.isDatasetVisible(i)) {
            meta = chart.getDatasetMeta(i);
            arcs = meta.data;
            controller = meta.controller;
            if (controller !== me) {
              controller.configure();
            }
            break;
          }
        }
      }
      if (!arcs) {
        return 0;
      }
      for (i = 0, ilen = arcs.length; i < ilen; ++i) {
        options = controller.resolveDataElementOptions(i);
        if (options.borderAlign !== 'inner') {
          max = Math.max(max, options.borderWidth || 0, options.hoverBorderWidth || 0);
        }
      }
      return max;
    };
    _proto.getMaxOffset = function getMaxOffset(arcs) {
      let max = 0;
      for (let i = 0, ilen = arcs.length; i < ilen; ++i) {
        const options = this.resolveDataElementOptions(i);
        max = Math.max(max, options.offset || 0, options.hoverOffset || 0);
      }
      return max;
    }
    ;
    _proto._getRingWeightOffset = function _getRingWeightOffset(datasetIndex) {
      let ringWeightOffset = 0;
      for (let i = 0; i < datasetIndex; ++i) {
        if (this.chart.isDatasetVisible(i)) {
          ringWeightOffset += this._getRingWeight(i);
        }
      }
      return ringWeightOffset;
    }
    ;
    _proto._getRingWeight = function _getRingWeight(datasetIndex) {
      return Math.max(valueOrDefault(this.chart.data.datasets[datasetIndex].weight, 1), 0);
    }
    ;
    _proto._getVisibleDatasetWeightTotal = function _getVisibleDatasetWeightTotal() {
      return this._getRingWeightOffset(this.chart.data.datasets.length) || 1;
    };
    return DoughnutController;
  }(DatasetController);
  DoughnutController.id = 'doughnut';
  DoughnutController.defaults = {
    datasetElementType: false,
    dataElementType: 'arc',
    dataElementOptions: ['backgroundColor', 'borderColor', 'borderWidth', 'borderAlign', 'offset'],
    animation: {
      numbers: {
        type: 'number',
        properties: ['circumference', 'endAngle', 'innerRadius', 'outerRadius', 'startAngle', 'x', 'y', 'offset', 'borderWidth']
      },
      animateRotate: true,
      animateScale: false
    },
    aspectRatio: 1,
    legend: {
      labels: {
        generateLabels: function generateLabels(chart) {
          const data = chart.data;
          if (data.labels.length && data.datasets.length) {
            return data.labels.map(function (label, i) {
              const meta = chart.getDatasetMeta(0);
              const style = meta.controller.getStyle(i);
              return {
                text: label,
                fillStyle: style.backgroundColor,
                strokeStyle: style.borderColor,
                lineWidth: style.borderWidth,
                hidden: !chart.getDataVisibility(i),
                index: i
              };
            });
          }
          return [];
        }
      },
      onClick: function onClick(e, legendItem, legend) {
        legend.chart.toggleDataVisibility(legendItem.index);
        legend.chart.update();
      }
    },
    cutoutPercentage: 50,
    rotation: 0,
    circumference: 360,
    tooltips: {
      callbacks: {
        title: function title() {
          return '';
        },
        label: function label(tooltipItem) {
          let dataLabel = tooltipItem.label;
          const value = ': ' + tooltipItem.formattedValue;
          if (isArray(dataLabel)) {
            dataLabel = dataLabel.slice();
            dataLabel[0] += value;
          } else {
            dataLabel += value;
          }
          return dataLabel;
        }
      }
    }
  };

  const LineController = function (_DatasetController) {
    _inheritsLoose(LineController, _DatasetController);
    function LineController() {
      return _DatasetController.apply(this, arguments) || this;
    }
    const _proto = LineController.prototype;
    _proto.initialize = function initialize() {
      this.enableOptionSharing = true;
      _DatasetController.prototype.initialize.call(this);
    };
    _proto.update = function update(mode) {
      const me = this;
      const meta = me._cachedMeta;
      const line = meta.dataset,
        _meta$data = meta.data,
        points = _meta$data === void 0 ? [] : _meta$data;
      const animationsDisabled = me.chart._animationsDisabled;
      let _getStartAndCountOfVi = getStartAndCountOfVisiblePoints(meta, points, animationsDisabled),
        start = _getStartAndCountOfVi.start,
        count = _getStartAndCountOfVi.count;
      me._drawStart = start;
      me._drawCount = count;
      if (scaleRangesChanged(meta) && !animationsDisabled) {
        start = 0;
        count = points.length;
      }
      if (mode !== 'resize') {
        const properties = {
          points: points,
          options: me.resolveDatasetElementOptions()
        };
        me.updateElement(line, undefined, properties, mode);
      }
      me.updateElements(points, start, count, mode);
    };
    _proto.updateElements = function updateElements(points, start, count, mode) {
      const me = this;
      const reset = mode === 'reset';
      const _me$_cachedMeta = me._cachedMeta,
        xScale = _me$_cachedMeta.xScale,
        yScale = _me$_cachedMeta.yScale,
        _stacked = _me$_cachedMeta._stacked;
      const firstOpts = me.resolveDataElementOptions(start, mode);
      const sharedOptions = me.getSharedOptions(firstOpts);
      const includeOptions = me.includeOptions(mode, sharedOptions);
      const spanGaps = valueOrDefault(me._config.spanGaps, me.chart.options.spanGaps);
      const maxGapLength = isNumber(spanGaps) ? spanGaps : Number.POSITIVE_INFINITY;
      let prevParsed = start > 0 && me.getParsed(start - 1);
      for (let i = start; i < start + count; ++i) {
        const point = points[i];
        const parsed = me.getParsed(i);
        const x = xScale.getPixelForValue(parsed.x, i);
        const y = reset ? yScale.getBasePixel() : yScale.getPixelForValue(_stacked ? me.applyStack(yScale, parsed) : parsed.y, i);
        const properties = {
          x: x,
          y: y,
          skip: isNaN(x) || isNaN(y),
          stop: i > 0 && parsed.x - prevParsed.x > maxGapLength
        };
        if (includeOptions) {
          properties.options = sharedOptions || me.resolveDataElementOptions(i, mode);
        }
        me.updateElement(point, i, properties, mode);
        prevParsed = parsed;
      }
      me.updateSharedOptions(sharedOptions, mode, firstOpts);
    }
    ;
    _proto.resolveDatasetElementOptions = function resolveDatasetElementOptions(active) {
      const me = this;
      const config = me._config;
      const options = me.chart.options;
      const lineOptions = options.elements.line;
      const values = _DatasetController.prototype.resolveDatasetElementOptions.call(this, active);
      const showLine = valueOrDefault(config.showLine, options.showLine);
      values.spanGaps = valueOrDefault(config.spanGaps, options.spanGaps);
      values.tension = valueOrDefault(config.tension, lineOptions.tension);
      values.stepped = resolve([config.stepped, lineOptions.stepped]);
      if (!showLine) {
        values.borderWidth = 0;
      }
      return values;
    }
    ;
    _proto.getMaxOverflow = function getMaxOverflow() {
      const me = this;
      const meta = me._cachedMeta;
      const border = meta.dataset.options.borderWidth || 0;
      const data = meta.data || [];
      if (!data.length) {
        return border;
      }
      const firstPoint = data[0].size();
      const lastPoint = data[data.length - 1].size();
      return Math.max(border, firstPoint, lastPoint) / 2;
    };
    _proto.draw = function draw() {
      this._cachedMeta.dataset.updateControlPoints(this.chart.chartArea);
      _DatasetController.prototype.draw.call(this);
    };
    return LineController;
  }(DatasetController);
  LineController.id = 'line';
  LineController.defaults = {
    datasetElementType: 'line',
    datasetElementOptions: ['backgroundColor', 'borderCapStyle', 'borderColor', 'borderDash', 'borderDashOffset', 'borderJoinStyle', 'borderWidth', 'capBezierPoints', 'cubicInterpolationMode', 'fill'],
    dataElementType: 'point',
    dataElementOptions: {
      backgroundColor: 'pointBackgroundColor',
      borderColor: 'pointBorderColor',
      borderWidth: 'pointBorderWidth',
      hitRadius: 'pointHitRadius',
      hoverHitRadius: 'pointHitRadius',
      hoverBackgroundColor: 'pointHoverBackgroundColor',
      hoverBorderColor: 'pointHoverBorderColor',
      hoverBorderWidth: 'pointHoverBorderWidth',
      hoverRadius: 'pointHoverRadius',
      pointStyle: 'pointStyle',
      radius: 'pointRadius',
      rotation: 'pointRotation'
    },
    showLine: true,
    spanGaps: false,
    interaction: {
      mode: 'index'
    },
    hover: {},
    scales: {
      _index_: {
        type: 'category'
      },
      _value_: {
        type: 'linear'
      }
    }
  };
  function getStartAndCountOfVisiblePoints(meta, points, animationsDisabled) {
    const pointCount = points.length;
    let start = 0;
    let count = pointCount;
    if (meta._sorted) {
      const iScale = meta.iScale,
        _parsed = meta._parsed;
      const axis = iScale.axis;
      const _iScale$getUserBounds = iScale.getUserBounds(),
        min = _iScale$getUserBounds.min,
        max = _iScale$getUserBounds.max,
        minDefined = _iScale$getUserBounds.minDefined,
        maxDefined = _iScale$getUserBounds.maxDefined;
      if (minDefined) {
        start = _limitValue(Math.min(_lookupByKey(_parsed, iScale.axis, min).lo, animationsDisabled ? pointCount : _lookupByKey(points, axis, iScale.getPixelForValue(min)).lo), 0, pointCount - 1);
      }
      if (maxDefined) {
        count = _limitValue(Math.max(_lookupByKey(_parsed, iScale.axis, max).hi + 1, animationsDisabled ? 0 : _lookupByKey(points, axis, iScale.getPixelForValue(max)).hi + 1), start, pointCount) - start;
      } else {
        count = pointCount - start;
      }
    }
    return {
      start: start,
      count: count
    };
  }
  function scaleRangesChanged(meta) {
    const xScale = meta.xScale,
      yScale = meta.yScale,
      _scaleRanges = meta._scaleRanges;
    const newRanges = {
      xmin: xScale.min,
      xmax: xScale.max,
      ymin: yScale.min,
      ymax: yScale.max
    };
    if (!_scaleRanges) {
      meta._scaleRanges = newRanges;
      return true;
    }
    const changed = _scaleRanges.xmin !== xScale.min || _scaleRanges.xmax !== xScale.max || _scaleRanges.ymin !== yScale.min || _scaleRanges.ymax !== yScale.max;
    _extends(_scaleRanges, newRanges);
    return changed;
  }

  function getStartAngleRadians(deg) {
    return toRadians(deg) - 0.5 * PI;
  }
  const PolarAreaController = function (_DatasetController) {
    _inheritsLoose(PolarAreaController, _DatasetController);
    function PolarAreaController(chart, datasetIndex) {
      let _this;
      _this = _DatasetController.call(this, chart, datasetIndex) || this;
      _this.innerRadius = undefined;
      _this.outerRadius = undefined;
      return _this;
    }
    const _proto = PolarAreaController.prototype;
    _proto.update = function update(mode) {
      const arcs = this._cachedMeta.data;
      this._updateRadius();
      this.updateElements(arcs, 0, arcs.length, mode);
    }
    ;
    _proto._updateRadius = function _updateRadius() {
      const me = this;
      const chart = me.chart;
      const chartArea = chart.chartArea;
      const opts = chart.options;
      const minSize = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
      const outerRadius = Math.max(minSize / 2, 0);
      const innerRadius = Math.max(opts.cutoutPercentage ? outerRadius / 100 * opts.cutoutPercentage : 1, 0);
      const radiusLength = (outerRadius - innerRadius) / chart.getVisibleDatasetCount();
      me.outerRadius = outerRadius - radiusLength * me.index;
      me.innerRadius = me.outerRadius - radiusLength;
    };
    _proto.updateElements = function updateElements(arcs, start, count, mode) {
      const me = this;
      const reset = mode === 'reset';
      const chart = me.chart;
      const dataset = me.getDataset();
      const opts = chart.options;
      const animationOpts = opts.animation;
      const scale = me._cachedMeta.rScale;
      const centerX = scale.xCenter;
      const centerY = scale.yCenter;
      const datasetStartAngle = getStartAngleRadians(opts.startAngle);
      let angle = datasetStartAngle;
      let i;
      me._cachedMeta.count = me.countVisibleElements();
      for (i = 0; i < start; ++i) {
        angle += me._computeAngle(i, mode);
      }
      for (i = start; i < start + count; i++) {
        const arc = arcs[i];
        let startAngle = angle;
        let endAngle = angle + me._computeAngle(i, mode);
        let outerRadius = this.chart.getDataVisibility(i) ? scale.getDistanceFromCenterForValue(dataset.data[i]) : 0;
        angle = endAngle;
        if (reset) {
          if (animationOpts.animateScale) {
            outerRadius = 0;
          }
          if (animationOpts.animateRotate) {
            startAngle = datasetStartAngle;
            endAngle = datasetStartAngle;
          }
        }
        const properties = {
          x: centerX,
          y: centerY,
          innerRadius: 0,
          outerRadius: outerRadius,
          startAngle: startAngle,
          endAngle: endAngle,
          options: me.resolveDataElementOptions(i, mode)
        };
        me.updateElement(arc, i, properties, mode);
      }
    };
    _proto.countVisibleElements = function countVisibleElements() {
      const _this2 = this;
      const dataset = this.getDataset();
      const meta = this._cachedMeta;
      let count = 0;
      meta.data.forEach(function (element, index) {
        if (!isNaN(dataset.data[index]) && _this2.chart.getDataVisibility(index)) {
          count++;
        }
      });
      return count;
    }
    ;
    _proto._computeAngle = function _computeAngle(index, mode) {
      const me = this;
      const meta = me._cachedMeta;
      const count = meta.count;
      const dataset = me.getDataset();
      if (isNaN(dataset.data[index]) || !this.chart.getDataVisibility(index)) {
        return 0;
      }
      const context = me.getContext(index, mode === 'active');
      return toRadians(resolve([me.chart.options.elements.arc.angle, 360 / count], context, index));
    };
    return PolarAreaController;
  }(DatasetController);
  PolarAreaController.id = 'polarArea';
  PolarAreaController.defaults = {
    dataElementType: 'arc',
    dataElementOptions: ['backgroundColor', 'borderColor', 'borderWidth', 'borderAlign', 'offset'],
    animation: {
      numbers: {
        type: 'number',
        properties: ['x', 'y', 'startAngle', 'endAngle', 'innerRadius', 'outerRadius']
      },
      animateRotate: true,
      animateScale: true
    },
    aspectRatio: 1,
    datasets: {
      indexAxis: 'r'
    },
    scales: {
      r: {
        type: 'radialLinear',
        angleLines: {
          display: false
        },
        beginAtZero: true,
        gridLines: {
          circular: true
        },
        pointLabels: {
          display: false
        }
      }
    },
    startAngle: 0,
    legend: {
      labels: {
        generateLabels: function generateLabels(chart) {
          const data = chart.data;
          if (data.labels.length && data.datasets.length) {
            return data.labels.map(function (label, i) {
              const meta = chart.getDatasetMeta(0);
              const style = meta.controller.getStyle(i);
              return {
                text: label,
                fillStyle: style.backgroundColor,
                strokeStyle: style.borderColor,
                lineWidth: style.borderWidth,
                hidden: !chart.getDataVisibility(i),
                index: i
              };
            });
          }
          return [];
        }
      },
      onClick: function onClick(e, legendItem, legend) {
        legend.chart.toggleDataVisibility(legendItem.index);
        legend.chart.update();
      }
    },
    tooltips: {
      callbacks: {
        title: function title() {
          return '';
        },
        label: function label(context) {
          return context.chart.data.labels[context.dataIndex] + ': ' + context.formattedValue;
        }
      }
    }
  };

  const PieController = function (_DoughnutController) {
    _inheritsLoose(PieController, _DoughnutController);
    function PieController() {
      return _DoughnutController.apply(this, arguments) || this;
    }
    return PieController;
  }(DoughnutController);
  PieController.id = 'pie';
  PieController.defaults = {
    cutoutPercentage: 0
  };

  const RadarController = function (_DatasetController) {
    _inheritsLoose(RadarController, _DatasetController);
    function RadarController() {
      return _DatasetController.apply(this, arguments) || this;
    }
    const _proto = RadarController.prototype;
    _proto.getLabelAndValue = function getLabelAndValue(index) {
      const me = this;
      const vScale = me._cachedMeta.vScale;
      const parsed = me.getParsed(index);
      return {
        label: vScale.getLabels()[index],
        value: '' + vScale.getLabelForValue(parsed[vScale.axis])
      };
    };
    _proto.update = function update(mode) {
      const me = this;
      const meta = me._cachedMeta;
      const line = meta.dataset;
      const points = meta.data || [];
      const labels = meta.iScale.getLabels();
      if (mode !== 'resize') {
        const properties = {
          points: points,
          _loop: true,
          _fullLoop: labels.length === points.length,
          options: me.resolveDatasetElementOptions()
        };
        me.updateElement(line, undefined, properties, mode);
      }
      me.updateElements(points, 0, points.length, mode);
    };
    _proto.updateElements = function updateElements(points, start, count, mode) {
      const me = this;
      const dataset = me.getDataset();
      const scale = me._cachedMeta.rScale;
      const reset = mode === 'reset';
      for (let i = start; i < start + count; i++) {
        const point = points[i];
        const options = me.resolveDataElementOptions(i, mode);
        const pointPosition = scale.getPointPositionForValue(i, dataset.data[i]);
        const x = reset ? scale.xCenter : pointPosition.x;
        const y = reset ? scale.yCenter : pointPosition.y;
        const properties = {
          x: x,
          y: y,
          angle: pointPosition.angle,
          skip: isNaN(x) || isNaN(y),
          options: options
        };
        me.updateElement(point, i, properties, mode);
      }
    }
    ;
    _proto.resolveDatasetElementOptions = function resolveDatasetElementOptions(active) {
      const me = this;
      const config = me._config;
      const options = me.chart.options;
      const values = _DatasetController.prototype.resolveDatasetElementOptions.call(this, active);
      const showLine = valueOrDefault(config.showLine, options.showLine);
      values.spanGaps = valueOrDefault(config.spanGaps, options.spanGaps);
      values.tension = valueOrDefault(config.tension, options.elements.line.tension);
      if (!showLine) {
        values.borderWidth = 0;
      }
      return values;
    };
    return RadarController;
  }(DatasetController);
  RadarController.id = 'radar';
  RadarController.defaults = {
    datasetElementType: 'line',
    datasetElementOptions: ['backgroundColor', 'borderColor', 'borderCapStyle', 'borderDash', 'borderDashOffset', 'borderJoinStyle', 'borderWidth', 'fill'],
    dataElementType: 'point',
    dataElementOptions: {
      backgroundColor: 'pointBackgroundColor',
      borderColor: 'pointBorderColor',
      borderWidth: 'pointBorderWidth',
      hitRadius: 'pointHitRadius',
      hoverBackgroundColor: 'pointHoverBackgroundColor',
      hoverBorderColor: 'pointHoverBorderColor',
      hoverBorderWidth: 'pointHoverBorderWidth',
      hoverRadius: 'pointHoverRadius',
      pointStyle: 'pointStyle',
      radius: 'pointRadius',
      rotation: 'pointRotation'
    },
    aspectRatio: 1,
    spanGaps: false,
    scales: {
      r: {
        type: 'radialLinear'
      }
    },
    datasets: {
      indexAxis: 'r'
    },
    elements: {
      line: {
        fill: 'start',
        tension: 0
      }
    }
  };

  const ScatterController = function (_LineController) {
    _inheritsLoose(ScatterController, _LineController);
    function ScatterController() {
      return _LineController.apply(this, arguments) || this;
    }
    return ScatterController;
  }(LineController);
  ScatterController.id = 'scatter';
  ScatterController.defaults = {
    scales: {
      x: {
        type: 'linear'
      },
      y: {
        type: 'linear'
      }
    },
    datasets: {
      showLine: false,
      fill: false
    },
    tooltips: {
      callbacks: {
        title: function title() {
          return '';
        },
        label: function label(item) {
          return '(' + item.label + ', ' + item.formattedValue + ')';
        }
      }
    }
  };

  const controllers = /*#__PURE__*/Object.freeze({
    __proto__: null,
    BarController: BarController,
    BubbleController: BubbleController,
    DoughnutController: DoughnutController,
    LineController: LineController,
    PolarAreaController: PolarAreaController,
    PieController: PieController,
    RadarController: RadarController,
    ScatterController: ScatterController
  });

  function clipArc(ctx, element) {
    const startAngle = element.startAngle,
      endAngle = element.endAngle,
      pixelMargin = element.pixelMargin,
      x = element.x,
      y = element.y,
      outerRadius = element.outerRadius,
      innerRadius = element.innerRadius;
    let angleMargin = pixelMargin / outerRadius;
    ctx.beginPath();
    ctx.arc(x, y, outerRadius, startAngle - angleMargin, endAngle + angleMargin);
    if (innerRadius > pixelMargin) {
      angleMargin = pixelMargin / innerRadius;
      ctx.arc(x, y, innerRadius, endAngle + angleMargin, startAngle - angleMargin, true);
    } else {
      ctx.arc(x, y, pixelMargin, endAngle + HALF_PI, startAngle - HALF_PI);
    }
    ctx.closePath();
    ctx.clip();
  }
  function pathArc(ctx, element) {
    const x = element.x,
      y = element.y,
      startAngle = element.startAngle,
      endAngle = element.endAngle,
      pixelMargin = element.pixelMargin;
    const outerRadius = Math.max(element.outerRadius - pixelMargin, 0);
    const innerRadius = element.innerRadius + pixelMargin;
    ctx.beginPath();
    ctx.arc(x, y, outerRadius, startAngle, endAngle);
    ctx.arc(x, y, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
  }
  function drawArc(ctx, element) {
    if (element.fullCircles) {
      element.endAngle = element.startAngle + TAU;
      pathArc(ctx, element);
      for (let i = 0; i < element.fullCircles; ++i) {
        ctx.fill();
      }
      element.endAngle = element.startAngle + element.circumference % TAU;
    }
    pathArc(ctx, element);
    ctx.fill();
  }
  function drawFullCircleBorders(ctx, element, inner) {
    const x = element.x,
      y = element.y,
      startAngle = element.startAngle,
      endAngle = element.endAngle,
      pixelMargin = element.pixelMargin;
    const outerRadius = Math.max(element.outerRadius - pixelMargin, 0);
    const innerRadius = element.innerRadius + pixelMargin;
    let i;
    if (inner) {
      element.endAngle = element.startAngle + TAU;
      clipArc(ctx, element);
      element.endAngle = endAngle;
      if (element.endAngle === element.startAngle) {
        element.endAngle += TAU;
        element.fullCircles--;
      }
    }
    ctx.beginPath();
    ctx.arc(x, y, innerRadius, startAngle + TAU, startAngle, true);
    for (i = 0; i < element.fullCircles; ++i) {
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, outerRadius, startAngle, startAngle + TAU);
    for (i = 0; i < element.fullCircles; ++i) {
      ctx.stroke();
    }
  }
  function drawBorder(ctx, element) {
    const x = element.x,
      y = element.y,
      startAngle = element.startAngle,
      endAngle = element.endAngle,
      pixelMargin = element.pixelMargin,
      options = element.options;
    const outerRadius = element.outerRadius;
    const innerRadius = element.innerRadius + pixelMargin;
    const inner = options.borderAlign === 'inner';
    if (!options.borderWidth) {
      return;
    }
    if (inner) {
      ctx.lineWidth = options.borderWidth * 2;
      ctx.lineJoin = 'round';
    } else {
      ctx.lineWidth = options.borderWidth;
      ctx.lineJoin = 'bevel';
    }
    if (element.fullCircles) {
      drawFullCircleBorders(ctx, element, inner);
    }
    if (inner) {
      clipArc(ctx, element);
    }
    ctx.beginPath();
    ctx.arc(x, y, outerRadius, startAngle, endAngle);
    ctx.arc(x, y, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    ctx.stroke();
  }
  const ArcElement = function (_Element) {
    _inheritsLoose(ArcElement, _Element);
    function ArcElement(cfg) {
      let _this;
      _this = _Element.call(this) || this;
      _this.options = undefined;
      _this.circumference = undefined;
      _this.startAngle = undefined;
      _this.endAngle = undefined;
      _this.innerRadius = undefined;
      _this.outerRadius = undefined;
      _this.pixelMargin = 0;
      _this.fullCircles = 0;
      if (cfg) {
        _extends(_assertThisInitialized(_this), cfg);
      }
      return _this;
    }
    const _proto = ArcElement.prototype;
    _proto.inRange = function inRange(chartX, chartY, useFinalPosition) {
      const point = this.getProps(['x', 'y'], useFinalPosition);
      const _getAngleFromPoint = getAngleFromPoint(point, {
          x: chartX,
          y: chartY
        }),
        angle = _getAngleFromPoint.angle,
        distance = _getAngleFromPoint.distance;
      const _this$getProps = this.getProps(['startAngle', 'endAngle', 'innerRadius', 'outerRadius', 'circumference'], useFinalPosition),
        startAngle = _this$getProps.startAngle,
        endAngle = _this$getProps.endAngle,
        innerRadius = _this$getProps.innerRadius,
        outerRadius = _this$getProps.outerRadius,
        circumference = _this$getProps.circumference;
      const betweenAngles = circumference >= TAU || _angleBetween(angle, startAngle, endAngle);
      const withinRadius = distance >= innerRadius && distance <= outerRadius;
      return betweenAngles && withinRadius;
    }
    ;
    _proto.getCenterPoint = function getCenterPoint(useFinalPosition) {
      const _this$getProps2 = this.getProps(['x', 'y', 'startAngle', 'endAngle', 'innerRadius', 'outerRadius'], useFinalPosition),
        x = _this$getProps2.x,
        y = _this$getProps2.y,
        startAngle = _this$getProps2.startAngle,
        endAngle = _this$getProps2.endAngle,
        innerRadius = _this$getProps2.innerRadius,
        outerRadius = _this$getProps2.outerRadius;
      const halfAngle = (startAngle + endAngle) / 2;
      const halfRadius = (innerRadius + outerRadius) / 2;
      return {
        x: x + Math.cos(halfAngle) * halfRadius,
        y: y + Math.sin(halfAngle) * halfRadius
      };
    }
    ;
    _proto.tooltipPosition = function tooltipPosition(useFinalPosition) {
      return this.getCenterPoint(useFinalPosition);
    };
    _proto.draw = function draw(ctx) {
      const me = this;
      const options = me.options;
      const offset = options.offset || 0;
      me.pixelMargin = options.borderAlign === 'inner' ? 0.33 : 0;
      me.fullCircles = Math.floor(me.circumference / TAU);
      if (me.circumference === 0) {
        return;
      }
      ctx.save();
      if (offset && me.circumference < TAU) {
        const halfAngle = (me.startAngle + me.endAngle) / 2;
        ctx.translate(Math.cos(halfAngle) * offset, Math.sin(halfAngle) * offset);
      }
      ctx.fillStyle = options.backgroundColor;
      ctx.strokeStyle = options.borderColor;
      drawArc(ctx, me);
      drawBorder(ctx, me);
      ctx.restore();
    };
    return ArcElement;
  }(Element$1);
  ArcElement.id = 'arc';
  ArcElement.defaults = {
    borderAlign: 'center',
    borderColor: '#fff',
    borderWidth: 2,
    offset: 0
  };
  ArcElement.defaultRoutes = {
    backgroundColor: 'color'
  };

  function setStyle(ctx, vm) {
    ctx.lineCap = vm.borderCapStyle;
    ctx.setLineDash(vm.borderDash);
    ctx.lineDashOffset = vm.borderDashOffset;
    ctx.lineJoin = vm.borderJoinStyle;
    ctx.lineWidth = vm.borderWidth;
    ctx.strokeStyle = vm.borderColor;
  }
  function lineTo(ctx, previous, target) {
    ctx.lineTo(target.x, target.y);
  }
  function getLineMethod(options) {
    if (options.stepped) {
      return _steppedLineTo;
    }
    if (options.tension) {
      return _bezierCurveTo;
    }
    return lineTo;
  }
  function pathVars(points, segment, params) {
    params = params || {};
    const count = points.length;
    const start = Math.max(params.start || 0, segment.start);
    const end = Math.min(params.end || count - 1, segment.end);
    return {
      count: count,
      start: start,
      loop: segment.loop,
      ilen: end < start ? count + end - start : end - start
    };
  }
  function pathSegment(ctx, line, segment, params) {
    const points = line.points,
      options = line.options;
    const _pathVars = pathVars(points, segment, params),
      count = _pathVars.count,
      start = _pathVars.start,
      loop = _pathVars.loop,
      ilen = _pathVars.ilen;
    const lineMethod = getLineMethod(options);
    let _ref = params || {},
      _ref$move = _ref.move,
      move = _ref$move === void 0 ? true : _ref$move,
      reverse = _ref.reverse;
    let i, point, prev;
    for (i = 0; i <= ilen; ++i) {
      point = points[(start + (reverse ? ilen - i : i)) % count];
      if (point.skip) {
        continue;
      } else if (move) {
        ctx.moveTo(point.x, point.y);
        move = false;
      } else {
        lineMethod(ctx, prev, point, reverse, options.stepped);
      }
      prev = point;
    }
    if (loop) {
      point = points[(start + (reverse ? ilen : 0)) % count];
      lineMethod(ctx, prev, point, reverse, options.stepped);
    }
    return !!loop;
  }
  function fastPathSegment(ctx, line, segment, params) {
    const points = line.points;
    const _pathVars2 = pathVars(points, segment, params),
      count = _pathVars2.count,
      start = _pathVars2.start,
      ilen = _pathVars2.ilen;
    const _ref2 = params || {},
      _ref2$move = _ref2.move,
      move = _ref2$move === void 0 ? true : _ref2$move,
      reverse = _ref2.reverse;
    let avgX = 0;
    let countX = 0;
    let i, point, prevX, minY, maxY, lastY;
    const pointIndex = function pointIndex(index) {
      return (start + (reverse ? ilen - index : index)) % count;
    };
    const drawX = function drawX() {
      if (minY !== maxY) {
        ctx.lineTo(avgX, maxY);
        ctx.lineTo(avgX, minY);
        ctx.lineTo(avgX, lastY);
      }
    };
    if (move) {
      point = points[pointIndex(0)];
      ctx.moveTo(point.x, point.y);
    }
    for (i = 0; i <= ilen; ++i) {
      point = points[pointIndex(i)];
      if (point.skip) {
        continue;
      }
      const x = point.x;
      const y = point.y;
      const truncX = x | 0;
      if (truncX === prevX) {
        if (y < minY) {
          minY = y;
        } else if (y > maxY) {
          maxY = y;
        }
        avgX = (countX * avgX + x) / ++countX;
      } else {
        drawX();
        ctx.lineTo(x, y);
        prevX = truncX;
        countX = 0;
        minY = maxY = y;
      }
      lastY = y;
    }
    drawX();
  }
  function _getSegmentMethod(line) {
    const opts = line.options;
    const borderDash = opts.borderDash && opts.borderDash.length;
    const useFastPath = !line._loop && !opts.tension && !opts.stepped && !borderDash;
    return useFastPath ? fastPathSegment : pathSegment;
  }
  function _getInterpolationMethod(options) {
    if (options.stepped) {
      return _steppedInterpolation;
    }
    if (options.tension) {
      return _bezierInterpolation;
    }
    return _pointInLine;
  }
  const LineElement = function (_Element) {
    _inheritsLoose(LineElement, _Element);
    function LineElement(cfg) {
      let _this;
      _this = _Element.call(this) || this;
      _this.options = undefined;
      _this._loop = undefined;
      _this._fullLoop = undefined;
      _this._points = undefined;
      _this._segments = undefined;
      _this._pointsUpdated = false;
      if (cfg) {
        _extends(_assertThisInitialized(_this), cfg);
      }
      return _this;
    }
    const _proto = LineElement.prototype;
    _proto.updateControlPoints = function updateControlPoints(chartArea) {
      const me = this;
      const options = me.options;
      if (options.tension && !options.stepped && !me._pointsUpdated) {
        const loop = options.spanGaps ? me._loop : me._fullLoop;
        _updateBezierControlPoints(me._points, options, chartArea, loop);
        me._pointsUpdated = true;
      }
    };
    _proto.first = function first() {
      const segments = this.segments;
      const points = this.points;
      return segments.length && points[segments[0].start];
    }
    ;
    _proto.last = function last() {
      const segments = this.segments;
      const points = this.points;
      const count = segments.length;
      return count && points[segments[count - 1].end];
    }
    ;
    _proto.interpolate = function interpolate(point, property) {
      const me = this;
      const options = me.options;
      const value = point[property];
      const points = me.points;
      const segments = _boundSegments(me, {
        property: property,
        start: value,
        end: value
      });
      if (!segments.length) {
        return;
      }
      const result = [];
      const _interpolate = _getInterpolationMethod(options);
      let i, ilen;
      for (i = 0, ilen = segments.length; i < ilen; ++i) {
        const _segments$i = segments[i],
          start = _segments$i.start,
          end = _segments$i.end;
        const p1 = points[start];
        const p2 = points[end];
        if (p1 === p2) {
          result.push(p1);
          continue;
        }
        const t = Math.abs((value - p1[property]) / (p2[property] - p1[property]));
        const interpolated = _interpolate(p1, p2, t, options.stepped);
        interpolated[property] = point[property];
        result.push(interpolated);
      }
      return result.length === 1 ? result[0] : result;
    }
    ;
    _proto.pathSegment = function pathSegment(ctx, segment, params) {
      const segmentMethod = _getSegmentMethod(this);
      return segmentMethod(ctx, this, segment, params);
    }
    ;
    _proto.path = function path(ctx, start, count) {
      const me = this;
      const segments = me.segments;
      const ilen = segments.length;
      const segmentMethod = _getSegmentMethod(me);
      let loop = me._loop;
      start = start || 0;
      count = count || me.points.length - start;
      for (let i = 0; i < ilen; ++i) {
        loop &= segmentMethod(ctx, me, segments[i], {
          start: start,
          end: start + count - 1
        });
      }
      return !!loop;
    }
    ;
    _proto.draw = function draw(ctx, chartArea, start, count) {
      const options = this.options || {};
      const points = this.points || [];
      if (!points.length || !options.borderWidth) {
        return;
      }
      ctx.save();
      setStyle(ctx, options);
      ctx.beginPath();
      if (this.path(ctx, start, count)) {
        ctx.closePath();
      }
      ctx.stroke();
      ctx.restore();
      this._pointsUpdated = false;
    };
    _createClass(LineElement, [{
      key: 'points',
      set: function set(points) {
        this._points = points;
        delete this._segments;
      },
      get: function get() {
        return this._points;
      }
    }, {
      key: 'segments',
      get: function get() {
        return this._segments || (this._segments = _computeSegments(this));
      }
    }]);
    return LineElement;
  }(Element$1);
  LineElement.id = 'line';
  LineElement.defaults = {
    borderCapStyle: 'butt',
    borderDash: [],
    borderDashOffset: 0,
    borderJoinStyle: 'miter',
    borderWidth: 3,
    capBezierPoints: true,
    fill: true,
    tension: 0
  };
  LineElement.defaultRoutes = {
    backgroundColor: 'color',
    borderColor: 'color'
  };

  const PointElement = function (_Element) {
    _inheritsLoose(PointElement, _Element);
    function PointElement(cfg) {
      let _this;
      _this = _Element.call(this) || this;
      _this.options = undefined;
      _this.skip = undefined;
      _this.stop = undefined;
      if (cfg) {
        _extends(_assertThisInitialized(_this), cfg);
      }
      return _this;
    }
    const _proto = PointElement.prototype;
    _proto.inRange = function inRange(mouseX, mouseY, useFinalPosition) {
      const options = this.options;
      const _this$getProps = this.getProps(['x', 'y'], useFinalPosition),
        x = _this$getProps.x,
        y = _this$getProps.y;
      return Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2) < Math.pow(options.hitRadius + options.radius, 2);
    };
    _proto.inXRange = function inXRange(mouseX, useFinalPosition) {
      const options = this.options;
      const _this$getProps2 = this.getProps(['x'], useFinalPosition),
        x = _this$getProps2.x;
      return Math.abs(mouseX - x) < options.radius + options.hitRadius;
    };
    _proto.inYRange = function inYRange(mouseY, useFinalPosition) {
      const options = this.options;
      const _this$getProps3 = this.getProps(['x'], useFinalPosition),
        y = _this$getProps3.y;
      return Math.abs(mouseY - y) < options.radius + options.hitRadius;
    };
    _proto.getCenterPoint = function getCenterPoint(useFinalPosition) {
      const _this$getProps4 = this.getProps(['x', 'y'], useFinalPosition),
        x = _this$getProps4.x,
        y = _this$getProps4.y;
      return {
        x: x,
        y: y
      };
    };
    _proto.size = function size() {
      const options = this.options || {};
      const radius = Math.max(options.radius, options.hoverRadius) || 0;
      const borderWidth = radius && options.borderWidth || 0;
      return (radius + borderWidth) * 2;
    };
    _proto.draw = function draw(ctx) {
      const me = this;
      const options = me.options;
      if (me.skip || options.radius <= 0) {
        return;
      }
      ctx.strokeStyle = options.borderColor;
      ctx.lineWidth = options.borderWidth;
      ctx.fillStyle = options.backgroundColor;
      drawPoint(ctx, options, me.x, me.y);
    };
    _proto.getRange = function getRange() {
      const options = this.options || {};
      return options.radius + options.hitRadius;
    };
    return PointElement;
  }(Element$1);
  PointElement.id = 'point';
  PointElement.defaults = {
    borderWidth: 1,
    hitRadius: 1,
    hoverBorderWidth: 1,
    hoverRadius: 4,
    pointStyle: 'circle',
    radius: 3
  };
  PointElement.defaultRoutes = {
    backgroundColor: 'color',
    borderColor: 'color'
  };

  function getBarBounds(bar, useFinalPosition) {
    const _bar$getProps = bar.getProps(['x', 'y', 'base', 'width', 'height'], useFinalPosition),
      x = _bar$getProps.x,
      y = _bar$getProps.y,
      base = _bar$getProps.base,
      width = _bar$getProps.width,
      height = _bar$getProps.height;
    let left, right, top, bottom, half;
    if (bar.horizontal) {
      half = height / 2;
      left = Math.min(x, base);
      right = Math.max(x, base);
      top = y - half;
      bottom = y + half;
    } else {
      half = width / 2;
      left = x - half;
      right = x + half;
      top = Math.min(y, base);
      bottom = Math.max(y, base);
    }
    return {
      left: left,
      top: top,
      right: right,
      bottom: bottom
    };
  }
  function parseBorderSkipped(bar) {
    let edge = bar.options.borderSkipped;
    const res = {};
    if (!edge) {
      return res;
    }
    edge = bar.horizontal ? parseEdge(edge, 'left', 'right', bar.base > bar.x) : parseEdge(edge, 'bottom', 'top', bar.base < bar.y);
    res[edge] = true;
    return res;
  }
  function parseEdge(edge, a, b, reverse) {
    if (reverse) {
      edge = swap(edge, a, b);
      edge = startEnd(edge, b, a);
    } else {
      edge = startEnd(edge, a, b);
    }
    return edge;
  }
  function swap(orig, v1, v2) {
    return orig === v1 ? v2 : orig === v2 ? v1 : orig;
  }
  function startEnd(v, start, end) {
    return v === 'start' ? start : v === 'end' ? end : v;
  }
  function skipOrLimit(skip, value, min, max) {
    return skip ? 0 : Math.max(Math.min(value, max), min);
  }
  function parseBorderWidth(bar, maxW, maxH) {
    const value = bar.options.borderWidth;
    const skip = parseBorderSkipped(bar);
    const o = toTRBL(value);
    return {
      t: skipOrLimit(skip.top, o.top, 0, maxH),
      r: skipOrLimit(skip.right, o.right, 0, maxW),
      b: skipOrLimit(skip.bottom, o.bottom, 0, maxH),
      l: skipOrLimit(skip.left, o.left, 0, maxW)
    };
  }
  function parseBorderRadius(bar, maxW, maxH) {
    const value = bar.options.borderRadius;
    const o = toTRBLCorners(value);
    const maxR = Math.min(maxW, maxH);
    const skip = parseBorderSkipped(bar);
    return {
      topLeft: skipOrLimit(skip.top || skip.left, o.topLeft, 0, maxR),
      topRight: skipOrLimit(skip.top || skip.right, o.topRight, 0, maxR),
      bottomLeft: skipOrLimit(skip.bottom || skip.left, o.bottomLeft, 0, maxR),
      bottomRight: skipOrLimit(skip.bottom || skip.right, o.bottomRight, 0, maxR)
    };
  }
  function boundingRects(bar) {
    const bounds = getBarBounds(bar);
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    const border = parseBorderWidth(bar, width / 2, height / 2);
    const radius = parseBorderRadius(bar, width / 2, height / 2);
    return {
      outer: {
        x: bounds.left,
        y: bounds.top,
        w: width,
        h: height,
        radius: radius
      },
      inner: {
        x: bounds.left + border.l,
        y: bounds.top + border.t,
        w: width - border.l - border.r,
        h: height - border.t - border.b,
        radius: {
          topLeft: Math.max(0, radius.topLeft - Math.max(border.t, border.l)),
          topRight: Math.max(0, radius.topRight - Math.max(border.t, border.r)),
          bottomLeft: Math.max(0, radius.bottomLeft - Math.max(border.b, border.l)),
          bottomRight: Math.max(0, radius.bottomRight - Math.max(border.b, border.r))
        }
      }
    };
  }
  function _inRange(bar, x, y, useFinalPosition) {
    const skipX = x === null;
    const skipY = y === null;
    const skipBoth = skipX && skipY;
    const bounds = bar && !skipBoth && getBarBounds(bar, useFinalPosition);
    return bounds && (skipX || x >= bounds.left && x <= bounds.right) && (skipY || y >= bounds.top && y <= bounds.bottom);
  }
  function hasRadius(radius) {
    return radius.topLeft || radius.topRight || radius.bottomLeft || radius.bottomRight;
  }
  function addRoundedRectPath(ctx, rect) {
    const x = rect.x,
      y = rect.y,
      w = rect.w,
      h = rect.h,
      radius = rect.radius;
    ctx.arc(x + radius.topLeft, y + radius.topLeft, radius.topLeft, -HALF_PI, PI, true);
    ctx.lineTo(x, y + h - radius.bottomLeft);
    ctx.arc(x + radius.bottomLeft, y + h - radius.bottomLeft, radius.bottomLeft, PI, HALF_PI, true);
    ctx.lineTo(x + w - radius.bottomRight, y + h);
    ctx.arc(x + w - radius.bottomRight, y + h - radius.bottomRight, radius.bottomRight, HALF_PI, 0, true);
    ctx.lineTo(x + w, y + radius.topRight);
    ctx.arc(x + w - radius.topRight, y + radius.topRight, radius.topRight, 0, -HALF_PI, true);
    ctx.lineTo(x + radius.topLeft, y);
  }
  function addNormalRectPath(ctx, rect) {
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
  }
  const BarElement = function (_Element) {
    _inheritsLoose(BarElement, _Element);
    function BarElement(cfg) {
      let _this;
      _this = _Element.call(this) || this;
      _this.options = undefined;
      _this.horizontal = undefined;
      _this.base = undefined;
      _this.width = undefined;
      _this.height = undefined;
      if (cfg) {
        _extends(_assertThisInitialized(_this), cfg);
      }
      return _this;
    }
    const _proto = BarElement.prototype;
    _proto.draw = function draw(ctx) {
      const options = this.options;
      const _boundingRects = boundingRects(this),
        inner = _boundingRects.inner,
        outer = _boundingRects.outer;
      const addRectPath = hasRadius(outer.radius) ? addRoundedRectPath : addNormalRectPath;
      ctx.save();
      if (outer.w !== inner.w || outer.h !== inner.h) {
        ctx.beginPath();
        addRectPath(ctx, outer);
        ctx.clip();
        addRectPath(ctx, inner);
        ctx.fillStyle = options.borderColor;
        ctx.fill('evenodd');
      }
      ctx.beginPath();
      addRectPath(ctx, inner);
      ctx.fillStyle = options.backgroundColor;
      ctx.fill();
      ctx.restore();
    };
    _proto.inRange = function inRange(mouseX, mouseY, useFinalPosition) {
      return _inRange(this, mouseX, mouseY, useFinalPosition);
    };
    _proto.inXRange = function inXRange(mouseX, useFinalPosition) {
      return _inRange(this, mouseX, null, useFinalPosition);
    };
    _proto.inYRange = function inYRange(mouseY, useFinalPosition) {
      return _inRange(this, null, mouseY, useFinalPosition);
    };
    _proto.getCenterPoint = function getCenterPoint(useFinalPosition) {
      const _this$getProps = this.getProps(['x', 'y', 'base', 'horizontal'], useFinalPosition),
        x = _this$getProps.x,
        y = _this$getProps.y,
        base = _this$getProps.base,
        horizontal = _this$getProps.horizontal;
      return {
        x: horizontal ? (x + base) / 2 : x,
        y: horizontal ? y : (y + base) / 2
      };
    };
    _proto.getRange = function getRange(axis) {
      return axis === 'x' ? this.width / 2 : this.height / 2;
    };
    return BarElement;
  }(Element$1);
  BarElement.id = 'bar';
  BarElement.defaults = {
    borderSkipped: 'start',
    borderWidth: 0,
    borderRadius: 0
  };
  BarElement.defaultRoutes = {
    backgroundColor: 'color',
    borderColor: 'color'
  };

  const elements = /*#__PURE__*/Object.freeze({
    __proto__: null,
    ArcElement: ArcElement,
    LineElement: LineElement,
    PointElement: PointElement,
    BarElement: BarElement
  });

  function getLineByIndex(chart, index) {
    const meta = chart.getDatasetMeta(index);
    const visible = meta && chart.isDatasetVisible(index);
    return visible ? meta.dataset : null;
  }
  function parseFillOption(line) {
    const options = line.options;
    const fillOption = options.fill;
    let fill = valueOrDefault(fillOption && fillOption.target, fillOption);
    if (fill === undefined) {
      fill = !!options.backgroundColor;
    }
    if (fill === false || fill === null) {
      return false;
    }
    if (fill === true) {
      return 'origin';
    }
    return fill;
  }
  function decodeFill(line, index, count) {
    const fill = parseFillOption(line);
    if (isObject(fill)) {
      return isNaN(fill.value) ? false : fill;
    }
    let target = parseFloat(fill);
    if (isNumberFinite(target) && Math.floor(target) === target) {
      if (fill[0] === '-' || fill[0] === '+') {
        target = index + target;
      }
      if (target === index || target < 0 || target >= count) {
        return false;
      }
      return target;
    }
    return ['origin', 'start', 'end', 'stack'].indexOf(fill) >= 0 && fill;
  }
  function computeLinearBoundary(source) {
    const _source$scale = source.scale,
      scale = _source$scale === void 0 ? {} : _source$scale,
      fill = source.fill;
    let target = null;
    let horizontal;
    if (fill === 'start') {
      target = scale.bottom;
    } else if (fill === 'end') {
      target = scale.top;
    } else if (isObject(fill)) {
      target = scale.getPixelForValue(fill.value);
    } else if (scale.getBasePixel) {
      target = scale.getBasePixel();
    }
    if (isNumberFinite(target)) {
      horizontal = scale.isHorizontal();
      return {
        x: horizontal ? target : null,
        y: horizontal ? null : target
      };
    }
    return null;
  }
  const simpleArc = function () {
    function simpleArc(opts) {
      this.x = opts.x;
      this.y = opts.y;
      this.radius = opts.radius;
    }
    const _proto = simpleArc.prototype;
    _proto.pathSegment = function pathSegment(ctx, bounds, opts) {
      const x = this.x,
        y = this.y,
        radius = this.radius;
      bounds = bounds || {
        start: 0,
        end: TAU
      };
      if (opts.reverse) {
        ctx.arc(x, y, radius, bounds.end, bounds.start, true);
      } else {
        ctx.arc(x, y, radius, bounds.start, bounds.end);
      }
      return !opts.bounds;
    };
    _proto.interpolate = function interpolate(point, property) {
      const x = this.x,
        y = this.y,
        radius = this.radius;
      const angle = point.angle;
      if (property === 'angle') {
        return {
          x: x + Math.cos(angle) * radius,
          y: y + Math.sin(angle) * radius,
          angle: angle
        };
      }
    };
    return simpleArc;
  }();
  function computeCircularBoundary(source) {
    const scale = source.scale,
      fill = source.fill;
    const options = scale.options;
    const length = scale.getLabels().length;
    const target = [];
    const start = options.reverse ? scale.max : scale.min;
    const end = options.reverse ? scale.min : scale.max;
    let i, center, value;
    if (fill === 'start') {
      value = start;
    } else if (fill === 'end') {
      value = end;
    } else if (isObject(fill)) {
      value = fill.value;
    } else {
      value = scale.getBaseValue();
    }
    if (options.gridLines.circular) {
      center = scale.getPointPositionForValue(0, start);
      return new simpleArc({
        x: center.x,
        y: center.y,
        radius: scale.getDistanceFromCenterForValue(value)
      });
    }
    for (i = 0; i < length; ++i) {
      target.push(scale.getPointPositionForValue(i, value));
    }
    return target;
  }
  function computeBoundary(source) {
    const scale = source.scale || {};
    if (scale.getPointPositionForValue) {
      return computeCircularBoundary(source);
    }
    return computeLinearBoundary(source);
  }
  function pointsFromSegments(boundary, line) {
    const _ref = boundary || {},
      _ref$x = _ref.x,
      x = _ref$x === void 0 ? null : _ref$x,
      _ref$y = _ref.y,
      y = _ref$y === void 0 ? null : _ref$y;
    const linePoints = line.points;
    const points = [];
    line.segments.forEach(function (segment) {
      const first = linePoints[segment.start];
      const last = linePoints[segment.end];
      if (y !== null) {
        points.push({
          x: first.x,
          y: y
        });
        points.push({
          x: last.x,
          y: y
        });
      } else if (x !== null) {
        points.push({
          x: x,
          y: first.y
        });
        points.push({
          x: x,
          y: last.y
        });
      }
    });
    return points;
  }
  function buildStackLine(source) {
    const chart = source.chart,
      scale = source.scale,
      index = source.index,
      line = source.line;
    const points = [];
    const segments = line.segments;
    const sourcePoints = line.points;
    const linesBelow = getLinesBelow(chart, index);
    linesBelow.push(createBoundaryLine({
      x: null,
      y: scale.bottom
    }, line));
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      for (let j = segment.start; j <= segment.end; j++) {
        addPointsBelow(points, sourcePoints[j], linesBelow);
      }
    }
    return new LineElement({
      points: points,
      options: {}
    });
  }
  const isLineAndNotInHideAnimation = function isLineAndNotInHideAnimation(meta) {
    return meta.type === 'line' && !meta.hidden;
  };
  function getLinesBelow(chart, index) {
    const below = [];
    const metas = chart.getSortedVisibleDatasetMetas();
    for (let i = 0; i < metas.length; i++) {
      const meta = metas[i];
      if (meta.index === index) {
        break;
      }
      if (isLineAndNotInHideAnimation(meta)) {
        below.unshift(meta.dataset);
      }
    }
    return below;
  }
  function addPointsBelow(points, sourcePoint, linesBelow) {
    const postponed = [];
    for (let j = 0; j < linesBelow.length; j++) {
      const line = linesBelow[j];
      const _findPoint = findPoint(line, sourcePoint, 'x'),
        first = _findPoint.first,
        last = _findPoint.last,
        point = _findPoint.point;
      if (!point || first && last) {
        continue;
      }
      if (first) {
        postponed.unshift(point);
      } else {
        points.push(point);
        if (!last) {
          break;
        }
      }
    }
    points.push.apply(points, postponed);
  }
  function findPoint(line, sourcePoint, property) {
    const point = line.interpolate(sourcePoint, property);
    if (!point) {
      return {};
    }
    const pointValue = point[property];
    const segments = line.segments;
    const linePoints = line.points;
    let first = false;
    let last = false;
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const firstValue = linePoints[segment.start][property];
      const lastValue = linePoints[segment.end][property];
      if (pointValue >= firstValue && pointValue <= lastValue) {
        first = pointValue === firstValue;
        last = pointValue === lastValue;
        break;
      }
    }
    return {
      first: first,
      last: last,
      point: point
    };
  }
  function getTarget(source) {
    const chart = source.chart,
      fill = source.fill,
      line = source.line;
    if (isNumberFinite(fill)) {
      return getLineByIndex(chart, fill);
    }
    if (fill === 'stack') {
      return buildStackLine(source);
    }
    const boundary = computeBoundary(source);
    if (boundary instanceof simpleArc) {
      return boundary;
    }
    return createBoundaryLine(boundary, line);
  }
  function createBoundaryLine(boundary, line) {
    let points = [];
    let _loop = false;
    if (isArray(boundary)) {
      _loop = true;
      points = boundary;
    } else {
      points = pointsFromSegments(boundary, line);
    }
    return points.length ? new LineElement({
      points: points,
      options: {
        tension: 0
      },
      _loop: _loop,
      _fullLoop: _loop
    }) : null;
  }
  function resolveTarget(sources, index, propagate) {
    const source = sources[index];
    let fill = source.fill;
    const visited = [index];
    let target;
    if (!propagate) {
      return fill;
    }
    while (fill !== false && visited.indexOf(fill) === -1) {
      if (!isNumberFinite(fill)) {
        return fill;
      }
      target = sources[fill];
      if (!target) {
        return false;
      }
      if (target.visible) {
        return fill;
      }
      visited.push(fill);
      fill = target.fill;
    }
    return false;
  }
  function _clip(ctx, target, clipY) {
    ctx.beginPath();
    target.path(ctx);
    ctx.lineTo(target.last().x, clipY);
    ctx.lineTo(target.first().x, clipY);
    ctx.closePath();
    ctx.clip();
  }
  function getBounds(property, first, last, loop) {
    if (loop) {
      return;
    }
    let start = first[property];
    let end = last[property];
    if (property === 'angle') {
      start = _normalizeAngle(start);
      end = _normalizeAngle(end);
    }
    return {
      property: property,
      start: start,
      end: end
    };
  }
  function _getEdge(a, b, prop, fn) {
    if (a && b) {
      return fn(a[prop], b[prop]);
    }
    return a ? a[prop] : b ? b[prop] : 0;
  }
  function _segments(line, target, property) {
    const segments = line.segments;
    const points = line.points;
    const tpoints = target.points;
    const parts = [];
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const bounds = getBounds(property, points[segment.start], points[segment.end], segment.loop);
      if (!target.segments) {
        parts.push({
          source: segment,
          target: bounds,
          start: points[segment.start],
          end: points[segment.end]
        });
        continue;
      }
      const subs = _boundSegments(target, bounds);
      for (let j = 0; j < subs.length; ++j) {
        const sub = subs[j];
        const subBounds = getBounds(property, tpoints[sub.start], tpoints[sub.end], sub.loop);
        const fillSources = _boundSegment(segment, points, subBounds);
        for (let k = 0; k < fillSources.length; k++) {
          var _start, _end;
          parts.push({
            source: fillSources[k],
            target: sub,
            start: (_start = {}, _start[property] = _getEdge(bounds, subBounds, 'start', Math.max), _start),
            end: (_end = {}, _end[property] = _getEdge(bounds, subBounds, 'end', Math.min), _end)
          });
        }
      }
    }
    return parts;
  }
  function clipBounds(ctx, scale, bounds) {
    const _scale$chart$chartAre = scale.chart.chartArea,
      top = _scale$chart$chartAre.top,
      bottom = _scale$chart$chartAre.bottom;
    const _ref2 = bounds || {},
      property = _ref2.property,
      start = _ref2.start,
      end = _ref2.end;
    if (property === 'x') {
      ctx.beginPath();
      ctx.rect(start, top, end - start, bottom - top);
      ctx.clip();
    }
  }
  function interpolatedLineTo(ctx, target, point, property) {
    const interpolatedPoint = target.interpolate(point, property);
    if (interpolatedPoint) {
      ctx.lineTo(interpolatedPoint.x, interpolatedPoint.y);
    }
  }
  function _fill(ctx, cfg) {
    const line = cfg.line,
      target = cfg.target,
      property = cfg.property,
      color = cfg.color,
      scale = cfg.scale;
    const segments = _segments(line, target, property);
    ctx.fillStyle = color;
    for (let i = 0, ilen = segments.length; i < ilen; ++i) {
      const _segments$i = segments[i],
        src = _segments$i.source,
        tgt = _segments$i.target,
        start = _segments$i.start,
        end = _segments$i.end;
      ctx.save();
      clipBounds(ctx, scale, getBounds(property, start, end));
      ctx.beginPath();
      const lineLoop = !!line.pathSegment(ctx, src);
      if (lineLoop) {
        ctx.closePath();
      } else {
        interpolatedLineTo(ctx, target, end, property);
      }
      const targetLoop = !!target.pathSegment(ctx, tgt, {
        move: lineLoop,
        reverse: true
      });
      const loop = lineLoop && targetLoop;
      if (!loop) {
        interpolatedLineTo(ctx, target, start, property);
      }
      ctx.closePath();
      ctx.fill(loop ? 'evenodd' : 'nonzero');
      ctx.restore();
    }
  }
  function doFill(ctx, cfg) {
    const line = cfg.line,
      target = cfg.target,
      above = cfg.above,
      below = cfg.below,
      area = cfg.area,
      scale = cfg.scale;
    const property = line._loop ? 'angle' : 'x';
    ctx.save();
    if (property === 'x' && below !== above) {
      _clip(ctx, target, area.top);
      _fill(ctx, {
        line: line,
        target: target,
        color: above,
        scale: scale,
        property: property
      });
      ctx.restore();
      ctx.save();
      _clip(ctx, target, area.bottom);
    }
    _fill(ctx, {
      line: line,
      target: target,
      color: below,
      scale: scale,
      property: property
    });
    ctx.restore();
  }
  const plugin_filler = {
    id: 'filler',
    afterDatasetsUpdate: function afterDatasetsUpdate(chart, _args, options) {
      const count = (chart.data.datasets || []).length;
      const propagate = options.propagate;
      const sources = [];
      let meta, i, line, source;
      for (i = 0; i < count; ++i) {
        meta = chart.getDatasetMeta(i);
        line = meta.dataset;
        source = null;
        if (line && line.options && line instanceof LineElement) {
          source = {
            visible: chart.isDatasetVisible(i),
            index: i,
            fill: decodeFill(line, i, count),
            chart: chart,
            scale: meta.vScale,
            line: line
          };
        }
        meta.$filler = source;
        sources.push(source);
      }
      for (i = 0; i < count; ++i) {
        source = sources[i];
        if (!source || source.fill === false) {
          continue;
        }
        source.fill = resolveTarget(sources, i, propagate);
      }
    },
    beforeDatasetsDraw: function beforeDatasetsDraw(chart) {
      const metasets = chart.getSortedVisibleDatasetMetas();
      const area = chart.chartArea;
      let i, meta;
      for (i = metasets.length - 1; i >= 0; --i) {
        meta = metasets[i].$filler;
        if (meta) {
          meta.line.updateControlPoints(area);
        }
      }
    },
    beforeDatasetDraw: function beforeDatasetDraw(chart, args) {
      const area = chart.chartArea;
      const ctx = chart.ctx;
      const source = args.meta.$filler;
      if (!source || source.fill === false) {
        return;
      }
      const target = getTarget(source);
      const line = source.line,
        scale = source.scale;
      const lineOpts = line.options;
      const fillOption = lineOpts.fill;
      const color = lineOpts.backgroundColor;
      const _ref3 = fillOption || {},
        _ref3$above = _ref3.above,
        above = _ref3$above === void 0 ? color : _ref3$above,
        _ref3$below = _ref3.below,
        below = _ref3$below === void 0 ? color : _ref3$below;
      if (target && line.points.length) {
        clipArea(ctx, area);
        doFill(ctx, {
          line: line,
          target: target,
          above: above,
          below: below,
          area: area,
          scale: scale
        });
        unclipArea(ctx);
      }
    },
    defaults: {
      propagate: true
    }
  };

  function getBoxWidth(labelOpts, fontSize) {
    const boxWidth = labelOpts.boxWidth;
    return labelOpts.usePointStyle && boxWidth > fontSize || isNullOrUndef(boxWidth) ? fontSize : boxWidth;
  }
  function getBoxHeight(labelOpts, fontSize) {
    const boxHeight = labelOpts.boxHeight;
    return labelOpts.usePointStyle && boxHeight > fontSize || isNullOrUndef(boxHeight) ? fontSize : boxHeight;
  }
  const Legend = function (_Element) {
    _inheritsLoose(Legend, _Element);
    function Legend(config) {
      let _this;
      _this = _Element.call(this) || this;
      _extends(_assertThisInitialized(_this), config);
      _this.legendHitBoxes = [];
      _this._hoveredItem = null;
      _this.doughnutMode = false;
      _this.chart = config.chart;
      _this.options = config.options;
      _this.ctx = config.ctx;
      _this.legendItems = undefined;
      _this.columnWidths = undefined;
      _this.columnHeights = undefined;
      _this.lineWidths = undefined;
      _this._minSize = undefined;
      _this.maxHeight = undefined;
      _this.maxWidth = undefined;
      _this.top = undefined;
      _this.bottom = undefined;
      _this.left = undefined;
      _this.right = undefined;
      _this.height = undefined;
      _this.width = undefined;
      _this._margins = undefined;
      _this.paddingTop = undefined;
      _this.paddingBottom = undefined;
      _this.paddingLeft = undefined;
      _this.paddingRight = undefined;
      _this.position = undefined;
      _this.weight = undefined;
      _this.fullWidth = undefined;
      return _this;
    }
    const _proto = Legend.prototype;
    _proto.beforeUpdate = function beforeUpdate() {};
    _proto.update = function update(maxWidth, maxHeight, margins) {
      const me = this;
      me.beforeUpdate();
      me.maxWidth = maxWidth;
      me.maxHeight = maxHeight;
      me._margins = margins;
      me.beforeSetDimensions();
      me.setDimensions();
      me.afterSetDimensions();
      me.beforeBuildLabels();
      me.buildLabels();
      me.afterBuildLabels();
      me.beforeFit();
      me.fit();
      me.afterFit();
      me.afterUpdate();
    };
    _proto.afterUpdate = function afterUpdate() {};
    _proto.beforeSetDimensions = function beforeSetDimensions() {};
    _proto.setDimensions = function setDimensions() {
      const me = this;
      if (me.isHorizontal()) {
        me.width = me.maxWidth;
        me.left = 0;
        me.right = me.width;
      } else {
        me.height = me.maxHeight;
        me.top = 0;
        me.bottom = me.height;
      }
      me.paddingLeft = 0;
      me.paddingTop = 0;
      me.paddingRight = 0;
      me.paddingBottom = 0;
      me._minSize = {
        width: 0,
        height: 0
      };
    };
    _proto.afterSetDimensions = function afterSetDimensions() {};
    _proto.beforeBuildLabels = function beforeBuildLabels() {};
    _proto.buildLabels = function buildLabels() {
      const me = this;
      const labelOpts = me.options.labels || {};
      let legendItems = callback(labelOpts.generateLabels, [me.chart], me) || [];
      if (labelOpts.filter) {
        legendItems = legendItems.filter(function (item) {
          return labelOpts.filter(item, me.chart.data);
        });
      }
      if (labelOpts.sort) {
        legendItems = legendItems.sort(function (a, b) {
          return labelOpts.sort(a, b, me.chart.data);
        });
      }
      if (me.options.reverse) {
        legendItems.reverse();
      }
      me.legendItems = legendItems;
    };
    _proto.afterBuildLabels = function afterBuildLabels() {};
    _proto.beforeFit = function beforeFit() {};
    _proto.fit = function fit() {
      const me = this;
      const opts = me.options;
      const labelOpts = opts.labels;
      const display = opts.display;
      const ctx = me.ctx;
      const labelFont = toFont(labelOpts.font, me.chart.options.font);
      const fontSize = labelFont.size;
      const boxWidth = getBoxWidth(labelOpts, fontSize);
      const boxHeight = getBoxHeight(labelOpts, fontSize);
      const itemHeight = Math.max(boxHeight, fontSize);
      const hitboxes = me.legendHitBoxes = [];
      const minSize = me._minSize;
      const isHorizontal = me.isHorizontal();
      const titleHeight = me._computeTitleHeight();
      if (isHorizontal) {
        minSize.width = me.maxWidth;
        minSize.height = display ? 10 : 0;
      } else {
        minSize.width = display ? 10 : 0;
        minSize.height = me.maxHeight;
      }
      if (!display) {
        me.width = minSize.width = me.height = minSize.height = 0;
        return;
      }
      ctx.font = labelFont.string;
      if (isHorizontal) {
        const lineWidths = me.lineWidths = [0];
        let totalHeight = titleHeight;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        me.legendItems.forEach(function (legendItem, i) {
          const width = boxWidth + fontSize / 2 + ctx.measureText(legendItem.text).width;
          if (i === 0 || lineWidths[lineWidths.length - 1] + width + 2 * labelOpts.padding > minSize.width) {
            totalHeight += itemHeight + labelOpts.padding;
            lineWidths[lineWidths.length - (i > 0 ? 0 : 1)] = 0;
          }
          hitboxes[i] = {
            left: 0,
            top: 0,
            width: width,
            height: itemHeight
          };
          lineWidths[lineWidths.length - 1] += width + labelOpts.padding;
        });
        minSize.height += totalHeight;
      } else {
        const vPadding = labelOpts.padding;
        const columnWidths = me.columnWidths = [];
        const columnHeights = me.columnHeights = [];
        let totalWidth = labelOpts.padding;
        let currentColWidth = 0;
        let currentColHeight = 0;
        const heightLimit = minSize.height - titleHeight;
        me.legendItems.forEach(function (legendItem, i) {
          const itemWidth = boxWidth + fontSize / 2 + ctx.measureText(legendItem.text).width;
          if (i > 0 && currentColHeight + fontSize + 2 * vPadding > heightLimit) {
            totalWidth += currentColWidth + labelOpts.padding;
            columnWidths.push(currentColWidth);
            columnHeights.push(currentColHeight);
            currentColWidth = 0;
            currentColHeight = 0;
          }
          currentColWidth = Math.max(currentColWidth, itemWidth);
          currentColHeight += fontSize + vPadding;
          hitboxes[i] = {
            left: 0,
            top: 0,
            width: itemWidth,
            height: itemHeight
          };
        });
        totalWidth += currentColWidth;
        columnWidths.push(currentColWidth);
        columnHeights.push(currentColHeight);
        minSize.width += totalWidth;
      }
      me.width = Math.min(minSize.width, opts.maxWidth || INFINITY);
      me.height = Math.min(minSize.height, opts.maxHeight || INFINITY);
    };
    _proto.afterFit = function afterFit() {}
    ;
    _proto.isHorizontal = function isHorizontal() {
      return this.options.position === 'top' || this.options.position === 'bottom';
    }
    ;
    _proto.draw = function draw() {
      const me = this;
      const opts = me.options;
      const labelOpts = opts.labels;
      const defaultColor = defaults.color;
      const legendHeight = me.height;
      const columnHeights = me.columnHeights;
      const legendWidth = me.width;
      const lineWidths = me.lineWidths;
      if (!opts.display) {
        return;
      }
      me.drawTitle();
      const rtlHelper = getRtlAdapter(opts.rtl, me.left, me._minSize.width);
      const ctx = me.ctx;
      const labelFont = toFont(labelOpts.font, me.chart.options.font);
      const fontColor = labelFont.color;
      const fontSize = labelFont.size;
      let cursor;
      ctx.textAlign = rtlHelper.textAlign('left');
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = fontColor;
      ctx.fillStyle = fontColor;
      ctx.font = labelFont.string;
      const boxWidth = getBoxWidth(labelOpts, fontSize);
      const boxHeight = getBoxHeight(labelOpts, fontSize);
      const height = Math.max(fontSize, boxHeight);
      const hitboxes = me.legendHitBoxes;
      const drawLegendBox = function drawLegendBox(x, y, legendItem) {
        if (isNaN(boxWidth) || boxWidth <= 0 || isNaN(boxHeight) || boxHeight < 0) {
          return;
        }
        ctx.save();
        const lineWidth = valueOrDefault(legendItem.lineWidth, 1);
        ctx.fillStyle = valueOrDefault(legendItem.fillStyle, defaultColor);
        ctx.lineCap = valueOrDefault(legendItem.lineCap, 'butt');
        ctx.lineDashOffset = valueOrDefault(legendItem.lineDashOffset, 0);
        ctx.lineJoin = valueOrDefault(legendItem.lineJoin, 'miter');
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = valueOrDefault(legendItem.strokeStyle, defaultColor);
        if (ctx.setLineDash) {
          ctx.setLineDash(valueOrDefault(legendItem.lineDash, []));
        }
        if (labelOpts && labelOpts.usePointStyle) {
          const drawOptions = {
            radius: boxWidth * Math.SQRT2 / 2,
            pointStyle: legendItem.pointStyle,
            rotation: legendItem.rotation,
            borderWidth: lineWidth
          };
          const centerX = rtlHelper.xPlus(x, boxWidth / 2);
          const centerY = y + fontSize / 2;
          drawPoint(ctx, drawOptions, centerX, centerY);
        } else {
          const yBoxTop = y + Math.max((fontSize - boxHeight) / 2, 0);
          ctx.fillRect(rtlHelper.leftForLtr(x, boxWidth), yBoxTop, boxWidth, boxHeight);
          if (lineWidth !== 0) {
            ctx.strokeRect(rtlHelper.leftForLtr(x, boxWidth), yBoxTop, boxWidth, boxHeight);
          }
        }
        ctx.restore();
      };
      const fillText = function fillText(x, y, legendItem, textWidth) {
        const halfFontSize = fontSize / 2;
        const xLeft = rtlHelper.xPlus(x, boxWidth + halfFontSize);
        const yMiddle = y + height / 2;
        ctx.fillText(legendItem.text, xLeft, yMiddle);
        if (legendItem.hidden) {
          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.moveTo(xLeft, yMiddle);
          ctx.lineTo(rtlHelper.xPlus(xLeft, textWidth), yMiddle);
          ctx.stroke();
        }
      };
      const alignmentOffset = function alignmentOffset(dimension, blockSize) {
        switch (opts.align) {
          case 'start':
            return labelOpts.padding;
          case 'end':
            return dimension - blockSize;
          default:
            return (dimension - blockSize + labelOpts.padding) / 2;
        }
      };
      const isHorizontal = me.isHorizontal();
      const titleHeight = this._computeTitleHeight();
      if (isHorizontal) {
        cursor = {
          x: me.left + alignmentOffset(legendWidth, lineWidths[0]),
          y: me.top + labelOpts.padding + titleHeight,
          line: 0
        };
      } else {
        cursor = {
          x: me.left + labelOpts.padding,
          y: me.top + alignmentOffset(legendHeight, columnHeights[0]) + titleHeight,
          line: 0
        };
      }
      overrideTextDirection(me.ctx, opts.textDirection);
      const itemHeight = height + labelOpts.padding;
      me.legendItems.forEach(function (legendItem, i) {
        const textWidth = ctx.measureText(legendItem.text).width;
        const width = boxWidth + fontSize / 2 + textWidth;
        let x = cursor.x;
        let y = cursor.y;
        rtlHelper.setWidth(me._minSize.width);
        if (isHorizontal) {
          if (i > 0 && x + width + labelOpts.padding > me.left + me._minSize.width) {
            y = cursor.y += itemHeight;
            cursor.line++;
            x = cursor.x = me.left + alignmentOffset(legendWidth, lineWidths[cursor.line]);
          }
        } else if (i > 0 && y + itemHeight > me.top + me._minSize.height) {
          x = cursor.x = x + me.columnWidths[cursor.line] + labelOpts.padding;
          cursor.line++;
          y = cursor.y = me.top + alignmentOffset(legendHeight, columnHeights[cursor.line]);
        }
        const realX = rtlHelper.x(x);
        drawLegendBox(realX, y, legendItem);
        hitboxes[i].left = rtlHelper.leftForLtr(realX, hitboxes[i].width);
        hitboxes[i].top = y;
        fillText(realX, y, legendItem, textWidth);
        if (isHorizontal) {
          cursor.x += width + labelOpts.padding;
        } else {
          cursor.y += itemHeight;
        }
      });
      restoreTextDirection(me.ctx, opts.textDirection);
    }
    ;
    _proto.drawTitle = function drawTitle() {
      const me = this;
      const opts = me.options;
      const titleOpts = opts.title;
      const titleFont = toFont(titleOpts.font, me.chart.options.font);
      const titlePadding = toPadding(titleOpts.padding);
      if (!titleOpts.display) {
        return;
      }
      const rtlHelper = getRtlAdapter(opts.rtl, me.left, me._minSize.width);
      const ctx = me.ctx;
      const position = titleOpts.position;
      let x, textAlign;
      const halfFontSize = titleFont.size / 2;
      let y = me.top + titlePadding.top + halfFontSize;
      let left = me.left;
      let maxWidth = me.width;
      if (this.isHorizontal()) {
        maxWidth = Math.max.apply(Math, me.lineWidths);
        switch (opts.align) {
          case 'start':
            break;
          case 'end':
            left = me.right - maxWidth;
            break;
          default:
            left = (me.left + me.right) / 2 - maxWidth / 2;
            break;
        }
      } else {
        const maxHeight = Math.max.apply(Math, me.columnHeights);
        switch (opts.align) {
          case 'start':
            break;
          case 'end':
            y += me.height - maxHeight;
            break;
          default:
            y += (me.height - maxHeight) / 2;
            break;
        }
      }
      switch (position) {
        case 'start':
          x = left;
          textAlign = 'left';
          break;
        case 'end':
          x = left + maxWidth;
          textAlign = 'right';
          break;
        default:
          x = left + maxWidth / 2;
          textAlign = 'center';
          break;
      }
      ctx.textAlign = rtlHelper.textAlign(textAlign);
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = titleFont.color;
      ctx.fillStyle = titleFont.color;
      ctx.font = titleFont.string;
      ctx.fillText(titleOpts.text, x, y);
    }
    ;
    _proto._computeTitleHeight = function _computeTitleHeight() {
      const titleOpts = this.options.title;
      const titleFont = toFont(titleOpts.font, this.chart.options.font);
      const titlePadding = toPadding(titleOpts.padding);
      return titleOpts.display ? titleFont.lineHeight + titlePadding.height : 0;
    }
    ;
    _proto._getLegendItemAt = function _getLegendItemAt(x, y) {
      const me = this;
      let i, hitBox, lh;
      if (x >= me.left && x <= me.right && y >= me.top && y <= me.bottom) {
        lh = me.legendHitBoxes;
        for (i = 0; i < lh.length; ++i) {
          hitBox = lh[i];
          if (x >= hitBox.left && x <= hitBox.left + hitBox.width && y >= hitBox.top && y <= hitBox.top + hitBox.height) {
            return me.legendItems[i];
          }
        }
      }
      return null;
    }
    ;
    _proto.handleEvent = function handleEvent(e) {
      const me = this;
      const opts = me.options;
      const type = e.type === 'mouseup' ? 'click' : e.type;
      if (type === 'mousemove') {
        if (!opts.onHover && !opts.onLeave) {
          return;
        }
      } else if (type === 'click') {
        if (!opts.onClick) {
          return;
        }
      } else {
        return;
      }
      const hoveredItem = me._getLegendItemAt(e.x, e.y);
      if (type === 'click') {
        if (hoveredItem) {
          callback(opts.onClick, [e, hoveredItem, me], me);
        }
      } else {
        if (opts.onLeave && hoveredItem !== me._hoveredItem) {
          if (me._hoveredItem) {
            callback(opts.onLeave, [e, me._hoveredItem, me], me);
          }
          me._hoveredItem = hoveredItem;
        }
        if (hoveredItem) {
          callback(opts.onHover, [e, hoveredItem, me], me);
        }
      }
    };
    return Legend;
  }(Element$1);
  function resolveOptions(options) {
    return options !== false && merge(Object.create(null), [defaults.plugins.legend, options]);
  }
  function createNewLegendAndAttach(chart, legendOpts) {
    const legend = new Legend({
      ctx: chart.ctx,
      options: legendOpts,
      chart: chart
    });
    layouts.configure(chart, legend, legendOpts);
    layouts.addBox(chart, legend);
    chart.legend = legend;
  }
  const plugin_legend = {
    id: 'legend',
    _element: Legend,
    beforeInit: function beforeInit(chart) {
      const legendOpts = resolveOptions(chart.options.legend);
      if (legendOpts) {
        createNewLegendAndAttach(chart, legendOpts);
      }
    },
    beforeUpdate: function beforeUpdate(chart) {
      const legendOpts = resolveOptions(chart.options.legend);
      const legend = chart.legend;
      if (legendOpts) {
        if (legend) {
          layouts.configure(chart, legend, legendOpts);
          legend.options = legendOpts;
        } else {
          createNewLegendAndAttach(chart, legendOpts);
        }
      } else if (legend) {
        layouts.removeBox(chart, legend);
        delete chart.legend;
      }
    },
    afterUpdate: function afterUpdate(chart) {
      if (chart.legend) {
        chart.legend.buildLabels();
      }
    },
    afterEvent: function afterEvent(chart, e) {
      const legend = chart.legend;
      if (legend) {
        legend.handleEvent(e);
      }
    },
    defaults: {
      display: true,
      position: 'top',
      align: 'center',
      fullWidth: true,
      reverse: false,
      weight: 1000,
      onClick: function onClick(e, legendItem, legend) {
        const index = legendItem.datasetIndex;
        const ci = legend.chart;
        if (ci.isDatasetVisible(index)) {
          ci.hide(index);
          legendItem.hidden = true;
        } else {
          ci.show(index);
          legendItem.hidden = false;
        }
      },
      onHover: null,
      onLeave: null,
      labels: {
        boxWidth: 40,
        padding: 10,
        generateLabels: function generateLabels(chart) {
          const datasets = chart.data.datasets;
          const labels = chart.legend.options.labels;
          const usePointStyle = labels.usePointStyle;
          const overrideStyle = labels.pointStyle;
          return chart._getSortedDatasetMetas().map(function (meta) {
            const style = meta.controller.getStyle(usePointStyle ? 0 : undefined);
            const borderWidth = isObject(style.borderWidth) ? (valueOrDefault(style.borderWidth.top, 0) + valueOrDefault(style.borderWidth.left, 0) + valueOrDefault(style.borderWidth.bottom, 0) + valueOrDefault(style.borderWidth.right, 0)) / 4 : style.borderWidth;
            return {
              text: datasets[meta.index].label,
              fillStyle: style.backgroundColor,
              hidden: !meta.visible,
              lineCap: style.borderCapStyle,
              lineDash: style.borderDash,
              lineDashOffset: style.borderDashOffset,
              lineJoin: style.borderJoinStyle,
              lineWidth: borderWidth,
              strokeStyle: style.borderColor,
              pointStyle: overrideStyle || style.pointStyle,
              rotation: style.rotation,
              datasetIndex: meta.index
            };
          }, this);
        }
      },
      title: {
        display: false,
        position: 'center',
        text: ''
      }
    }
  };

  const Title = function (_Element) {
    _inheritsLoose(Title, _Element);
    function Title(config) {
      let _this;
      _this = _Element.call(this) || this;
      _extends(_assertThisInitialized(_this), config);
      _this.chart = config.chart;
      _this.options = config.options;
      _this.ctx = config.ctx;
      _this._margins = undefined;
      _this._padding = undefined;
      _this.top = undefined;
      _this.bottom = undefined;
      _this.left = undefined;
      _this.right = undefined;
      _this.width = undefined;
      _this.height = undefined;
      _this.maxWidth = undefined;
      _this.maxHeight = undefined;
      _this.position = undefined;
      _this.weight = undefined;
      _this.fullWidth = undefined;
      return _this;
    }
    const _proto = Title.prototype;
    _proto.beforeUpdate = function beforeUpdate() {};
    _proto.update = function update(maxWidth, maxHeight, margins) {
      const me = this;
      me.beforeUpdate();
      me.maxWidth = maxWidth;
      me.maxHeight = maxHeight;
      me._margins = margins;
      me.beforeSetDimensions();
      me.setDimensions();
      me.afterSetDimensions();
      me.beforeBuildLabels();
      me.buildLabels();
      me.afterBuildLabels();
      me.beforeFit();
      me.fit();
      me.afterFit();
      me.afterUpdate();
    };
    _proto.afterUpdate = function afterUpdate() {};
    _proto.beforeSetDimensions = function beforeSetDimensions() {};
    _proto.setDimensions = function setDimensions() {
      const me = this;
      if (me.isHorizontal()) {
        me.width = me.maxWidth;
        me.left = 0;
        me.right = me.width;
      } else {
        me.height = me.maxHeight;
        me.top = 0;
        me.bottom = me.height;
      }
    };
    _proto.afterSetDimensions = function afterSetDimensions() {};
    _proto.beforeBuildLabels = function beforeBuildLabels() {};
    _proto.buildLabels = function buildLabels() {};
    _proto.afterBuildLabels = function afterBuildLabels() {};
    _proto.beforeFit = function beforeFit() {};
    _proto.fit = function fit() {
      const me = this;
      const opts = me.options;
      const minSize = {};
      const isHorizontal = me.isHorizontal();
      if (!opts.display) {
        me.width = minSize.width = me.height = minSize.height = 0;
        return;
      }
      const lineCount = isArray(opts.text) ? opts.text.length : 1;
      me._padding = toPadding(opts.padding);
      const textSize = lineCount * toFont(opts.font, me.chart.options.font).lineHeight + me._padding.height;
      me.width = minSize.width = isHorizontal ? me.maxWidth : textSize;
      me.height = minSize.height = isHorizontal ? textSize : me.maxHeight;
    };
    _proto.afterFit = function afterFit() {}
    ;
    _proto.isHorizontal = function isHorizontal() {
      const pos = this.options.position;
      return pos === 'top' || pos === 'bottom';
    }
    ;
    _proto.draw = function draw() {
      const me = this;
      const ctx = me.ctx;
      const opts = me.options;
      if (!opts.display) {
        return;
      }
      const fontOpts = toFont(opts.font, me.chart.options.font);
      const lineHeight = fontOpts.lineHeight;
      const offset = lineHeight / 2 + me._padding.top;
      let rotation = 0;
      const top = me.top;
      const left = me.left;
      const bottom = me.bottom;
      const right = me.right;
      let maxWidth, titleX, titleY;
      let align;
      if (me.isHorizontal()) {
        switch (opts.align) {
          case 'start':
            titleX = left;
            align = 'left';
            break;
          case 'end':
            titleX = right;
            align = 'right';
            break;
          default:
            titleX = left + (right - left) / 2;
            align = 'center';
            break;
        }
        titleY = top + offset;
        maxWidth = right - left;
      } else {
        titleX = opts.position === 'left' ? left + offset : right - offset;
        switch (opts.align) {
          case 'start':
            titleY = opts.position === 'left' ? bottom : top;
            align = 'left';
            break;
          case 'end':
            titleY = opts.position === 'left' ? top : bottom;
            align = 'right';
            break;
          default:
            titleY = top + (bottom - top) / 2;
            align = 'center';
            break;
        }
        maxWidth = bottom - top;
        rotation = PI * (opts.position === 'left' ? -0.5 : 0.5);
      }
      ctx.save();
      ctx.fillStyle = fontOpts.color;
      ctx.font = fontOpts.string;
      ctx.translate(titleX, titleY);
      ctx.rotate(rotation);
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      const text = opts.text;
      if (isArray(text)) {
        let y = 0;
        for (let i = 0; i < text.length; ++i) {
          ctx.fillText(text[i], 0, y, maxWidth);
          y += lineHeight;
        }
      } else {
        ctx.fillText(text, 0, 0, maxWidth);
      }
      ctx.restore();
    };
    return Title;
  }(Element$1);
  function createNewTitleBlockAndAttach(chart, titleOpts) {
    const title = new Title({
      ctx: chart.ctx,
      options: titleOpts,
      chart: chart
    });
    layouts.configure(chart, title, titleOpts);
    layouts.addBox(chart, title);
    chart.titleBlock = title;
  }
  const plugin_title = {
    id: 'title',
    _element: Title,
    beforeInit: function beforeInit(chart) {
      const titleOpts = chart.options.title;
      if (titleOpts) {
        createNewTitleBlockAndAttach(chart, titleOpts);
      }
    },
    beforeUpdate: function beforeUpdate(chart) {
      const titleOpts = chart.options.title;
      const titleBlock = chart.titleBlock;
      if (titleOpts) {
        mergeIf(titleOpts, defaults.plugins.title);
        if (titleBlock) {
          layouts.configure(chart, titleBlock, titleOpts);
          titleBlock.options = titleOpts;
        } else {
          createNewTitleBlockAndAttach(chart, titleOpts);
        }
      } else if (titleBlock) {
        layouts.removeBox(chart, titleBlock);
        delete chart.titleBlock;
      }
    },
    defaults: {
      align: 'center',
      display: false,
      font: {
        style: 'bold'
      },
      fullWidth: true,
      padding: 10,
      position: 'top',
      text: '',
      weight: 2000
    }
  };

  const positioners = {
    average: function average(items) {
      if (!items.length) {
        return false;
      }
      let i, len;
      let x = 0;
      let y = 0;
      let count = 0;
      for (i = 0, len = items.length; i < len; ++i) {
        const el = items[i].element;
        if (el && el.hasValue()) {
          const pos = el.tooltipPosition();
          x += pos.x;
          y += pos.y;
          ++count;
        }
      }
      return {
        x: x / count,
        y: y / count
      };
    },
    nearest: function nearest(items, eventPosition) {
      let x = eventPosition.x;
      let y = eventPosition.y;
      let minDistance = Number.POSITIVE_INFINITY;
      let i, len, nearestElement;
      for (i = 0, len = items.length; i < len; ++i) {
        const el = items[i].element;
        if (el && el.hasValue()) {
          const center = el.getCenterPoint();
          const d = distanceBetweenPoints(eventPosition, center);
          if (d < minDistance) {
            minDistance = d;
            nearestElement = el;
          }
        }
      }
      if (nearestElement) {
        const tp = nearestElement.tooltipPosition();
        x = tp.x;
        y = tp.y;
      }
      return {
        x: x,
        y: y
      };
    }
  };
  function pushOrConcat(base, toPush) {
    if (toPush) {
      if (isArray(toPush)) {
        Array.prototype.push.apply(base, toPush);
      } else {
        base.push(toPush);
      }
    }
    return base;
  }
  function splitNewlines(str) {
    if ((typeof str === 'string' || str instanceof String) && str.indexOf('\n') > -1) {
      return str.split('\n');
    }
    return str;
  }
  function createTooltipItem(chart, item) {
    const element = item.element,
      datasetIndex = item.datasetIndex,
      index = item.index;
    const controller = chart.getDatasetMeta(datasetIndex).controller;
    const _controller$getLabelA = controller.getLabelAndValue(index),
      label = _controller$getLabelA.label,
      value = _controller$getLabelA.value;
    return {
      chart: chart,
      label: label,
      dataPoint: controller.getParsed(index),
      formattedValue: value,
      dataset: controller.getDataset(),
      dataIndex: index,
      datasetIndex: datasetIndex,
      element: element
    };
  }
  function resolveOptions$1(options, fallbackFont) {
    options = merge(Object.create(null), [defaults.plugins.tooltip, options]);
    options.bodyFont = toFont(options.bodyFont, fallbackFont);
    options.titleFont = toFont(options.titleFont, fallbackFont);
    options.footerFont = toFont(options.footerFont, fallbackFont);
    options.boxHeight = valueOrDefault(options.boxHeight, options.bodyFont.size);
    options.boxWidth = valueOrDefault(options.boxWidth, options.bodyFont.size);
    return options;
  }
  function getTooltipSize(tooltip) {
    const ctx = tooltip._chart.ctx;
    const body = tooltip.body,
      footer = tooltip.footer,
      options = tooltip.options,
      title = tooltip.title;
    const bodyFont = options.bodyFont,
      footerFont = options.footerFont,
      titleFont = options.titleFont,
      boxWidth = options.boxWidth,
      boxHeight = options.boxHeight;
    const titleLineCount = title.length;
    const footerLineCount = footer.length;
    const bodyLineItemCount = body.length;
    let height = options.yPadding * 2;
    let width = 0;
    let combinedBodyLength = body.reduce(function (count, bodyItem) {
      return count + bodyItem.before.length + bodyItem.lines.length + bodyItem.after.length;
    }, 0);
    combinedBodyLength += tooltip.beforeBody.length + tooltip.afterBody.length;
    if (titleLineCount) {
      height += titleLineCount * titleFont.size + (titleLineCount - 1) * options.titleSpacing + options.titleMarginBottom;
    }
    if (combinedBodyLength) {
      const bodyLineHeight = options.displayColors ? Math.max(boxHeight, bodyFont.size) : bodyFont.size;
      height += bodyLineItemCount * bodyLineHeight + (combinedBodyLength - bodyLineItemCount) * bodyFont.size + (combinedBodyLength - 1) * options.bodySpacing;
    }
    if (footerLineCount) {
      height += options.footerMarginTop + footerLineCount * footerFont.size + (footerLineCount - 1) * options.footerSpacing;
    }
    let widthPadding = 0;
    const maxLineWidth = function maxLineWidth(line) {
      width = Math.max(width, ctx.measureText(line).width + widthPadding);
    };
    ctx.save();
    ctx.font = titleFont.string;
    each(tooltip.title, maxLineWidth);
    ctx.font = bodyFont.string;
    each(tooltip.beforeBody.concat(tooltip.afterBody), maxLineWidth);
    widthPadding = options.displayColors ? boxWidth + 2 : 0;
    each(body, function (bodyItem) {
      each(bodyItem.before, maxLineWidth);
      each(bodyItem.lines, maxLineWidth);
      each(bodyItem.after, maxLineWidth);
    });
    widthPadding = 0;
    ctx.font = footerFont.string;
    each(tooltip.footer, maxLineWidth);
    ctx.restore();
    width += 2 * options.xPadding;
    return {
      width: width,
      height: height
    };
  }
  function determineAlignment(chart, options, size) {
    const x = size.x,
      y = size.y,
      width = size.width,
      height = size.height;
    const chartArea = chart.chartArea;
    let xAlign = 'center';
    let yAlign = 'center';
    if (y < height / 2) {
      yAlign = 'top';
    } else if (y > chart.height - height / 2) {
      yAlign = 'bottom';
    }
    let lf, rf;
    const midX = (chartArea.left + chartArea.right) / 2;
    const midY = (chartArea.top + chartArea.bottom) / 2;
    if (yAlign === 'center') {
      lf = function lf(value) {
        return value <= midX;
      };
      rf = function rf(value) {
        return value > midX;
      };
    } else {
      lf = function lf(value) {
        return value <= width / 2;
      };
      rf = function rf(value) {
        return value >= chart.width - width / 2;
      };
    }
    const olf = function olf(value) {
      return value + width + options.caretSize + options.caretPadding > chart.width;
    };
    const orf = function orf(value) {
      return value - width - options.caretSize - options.caretPadding < 0;
    };
    const yf = function yf(value) {
      return value <= midY ? 'top' : 'bottom';
    };
    if (lf(x)) {
      xAlign = 'left';
      if (olf(x)) {
        xAlign = 'center';
        yAlign = yf(y);
      }
    } else if (rf(x)) {
      xAlign = 'right';
      if (orf(x)) {
        xAlign = 'center';
        yAlign = yf(y);
      }
    }
    return {
      xAlign: options.xAlign ? options.xAlign : xAlign,
      yAlign: options.yAlign ? options.yAlign : yAlign
    };
  }
  function alignX(size, xAlign, chartWidth) {
    let x = size.x,
      width = size.width;
    if (xAlign === 'right') {
      x -= width;
    } else if (xAlign === 'center') {
      x -= width / 2;
      if (x + width > chartWidth) {
        x = chartWidth - width;
      }
      if (x < 0) {
        x = 0;
      }
    }
    return x;
  }
  function alignY(size, yAlign, paddingAndSize) {
    let y = size.y,
      height = size.height;
    if (yAlign === 'top') {
      y += paddingAndSize;
    } else if (yAlign === 'bottom') {
      y -= height + paddingAndSize;
    } else {
      y -= height / 2;
    }
    return y;
  }
  function getBackgroundPoint(options, size, alignment, chart) {
    const caretSize = options.caretSize,
      caretPadding = options.caretPadding,
      cornerRadius = options.cornerRadius;
    const xAlign = alignment.xAlign,
      yAlign = alignment.yAlign;
    const paddingAndSize = caretSize + caretPadding;
    const radiusAndPadding = cornerRadius + caretPadding;
    let x = alignX(size, xAlign, chart.width);
    const y = alignY(size, yAlign, paddingAndSize);
    if (yAlign === 'center') {
      if (xAlign === 'left') {
        x += paddingAndSize;
      } else if (xAlign === 'right') {
        x -= paddingAndSize;
      }
    } else if (xAlign === 'left') {
      x -= radiusAndPadding;
    } else if (xAlign === 'right') {
      x += radiusAndPadding;
    }
    return {
      x: x,
      y: y
    };
  }
  function getAlignedX(tooltip, align) {
    const options = tooltip.options;
    return align === 'center' ? tooltip.x + tooltip.width / 2 : align === 'right' ? tooltip.x + tooltip.width - options.xPadding : tooltip.x + options.xPadding;
  }
  function getBeforeAfterBodyLines(callback) {
    return pushOrConcat([], splitNewlines(callback));
  }
  const Tooltip = function (_Element) {
    _inheritsLoose(Tooltip, _Element);
    function Tooltip(config) {
      let _this;
      _this = _Element.call(this) || this;
      _this.opacity = 0;
      _this._active = [];
      _this._chart = config._chart;
      _this._eventPosition = undefined;
      _this._size = undefined;
      _this._cachedAnimations = undefined;
      _this.$animations = undefined;
      _this.options = undefined;
      _this.dataPoints = undefined;
      _this.title = undefined;
      _this.beforeBody = undefined;
      _this.body = undefined;
      _this.afterBody = undefined;
      _this.footer = undefined;
      _this.xAlign = undefined;
      _this.yAlign = undefined;
      _this.x = undefined;
      _this.y = undefined;
      _this.height = undefined;
      _this.width = undefined;
      _this.caretX = undefined;
      _this.caretY = undefined;
      _this.labelColors = undefined;
      _this.labelPointStyles = undefined;
      _this.labelTextColors = undefined;
      _this.initialize();
      return _this;
    }
    const _proto = Tooltip.prototype;
    _proto.initialize = function initialize() {
      const me = this;
      const chartOpts = me._chart.options;
      me.options = resolveOptions$1(chartOpts.tooltips, chartOpts.font);
      me._cachedAnimations = undefined;
    }
    ;
    _proto._resolveAnimations = function _resolveAnimations() {
      const me = this;
      const cached = me._cachedAnimations;
      if (cached) {
        return cached;
      }
      const chart = me._chart;
      const options = me.options;
      const opts = options.enabled && chart.options.animation && options.animation;
      const animations = new Animations(me._chart, opts);
      me._cachedAnimations = Object.freeze(animations);
      return animations;
    };
    _proto.getTitle = function getTitle(context) {
      const me = this;
      const opts = me.options;
      const callbacks = opts.callbacks;
      const beforeTitle = callbacks.beforeTitle.apply(me, [context]);
      const title = callbacks.title.apply(me, [context]);
      const afterTitle = callbacks.afterTitle.apply(me, [context]);
      let lines = [];
      lines = pushOrConcat(lines, splitNewlines(beforeTitle));
      lines = pushOrConcat(lines, splitNewlines(title));
      lines = pushOrConcat(lines, splitNewlines(afterTitle));
      return lines;
    };
    _proto.getBeforeBody = function getBeforeBody(tooltipItems) {
      return getBeforeAfterBodyLines(this.options.callbacks.beforeBody.apply(this, [tooltipItems]));
    };
    _proto.getBody = function getBody(tooltipItems) {
      const me = this;
      const callbacks = me.options.callbacks;
      const bodyItems = [];
      each(tooltipItems, function (context) {
        const bodyItem = {
          before: [],
          lines: [],
          after: []
        };
        pushOrConcat(bodyItem.before, splitNewlines(callbacks.beforeLabel.call(me, context)));
        pushOrConcat(bodyItem.lines, callbacks.label.call(me, context));
        pushOrConcat(bodyItem.after, splitNewlines(callbacks.afterLabel.call(me, context)));
        bodyItems.push(bodyItem);
      });
      return bodyItems;
    };
    _proto.getAfterBody = function getAfterBody(tooltipItems) {
      return getBeforeAfterBodyLines(this.options.callbacks.afterBody.apply(this, [tooltipItems]));
    }
    ;
    _proto.getFooter = function getFooter(tooltipItems) {
      const me = this;
      const callbacks = me.options.callbacks;
      const beforeFooter = callbacks.beforeFooter.apply(me, [tooltipItems]);
      const footer = callbacks.footer.apply(me, [tooltipItems]);
      const afterFooter = callbacks.afterFooter.apply(me, [tooltipItems]);
      let lines = [];
      lines = pushOrConcat(lines, splitNewlines(beforeFooter));
      lines = pushOrConcat(lines, splitNewlines(footer));
      lines = pushOrConcat(lines, splitNewlines(afterFooter));
      return lines;
    }
    ;
    _proto._createItems = function _createItems() {
      const me = this;
      const active = me._active;
      const options = me.options;
      const data = me._chart.data;
      const labelColors = [];
      const labelPointStyles = [];
      const labelTextColors = [];
      let tooltipItems = [];
      let i, len;
      for (i = 0, len = active.length; i < len; ++i) {
        tooltipItems.push(createTooltipItem(me._chart, active[i]));
      }
      if (options.filter) {
        tooltipItems = tooltipItems.filter(function (element, index, array) {
          return options.filter(element, index, array, data);
        });
      }
      if (options.itemSort) {
        tooltipItems = tooltipItems.sort(function (a, b) {
          return options.itemSort(a, b, data);
        });
      }
      each(tooltipItems, function (context) {
        labelColors.push(options.callbacks.labelColor.call(me, context));
        labelPointStyles.push(options.callbacks.labelPointStyle.call(me, context));
        labelTextColors.push(options.callbacks.labelTextColor.call(me, context));
      });
      me.labelColors = labelColors;
      me.labelPointStyles = labelPointStyles;
      me.labelTextColors = labelTextColors;
      me.dataPoints = tooltipItems;
      return tooltipItems;
    };
    _proto.update = function update(changed) {
      const me = this;
      const options = me.options;
      const active = me._active;
      let properties;
      if (!active.length) {
        if (me.opacity !== 0) {
          properties = {
            opacity: 0
          };
        }
      } else {
        const position = positioners[options.position].call(me, active, me._eventPosition);
        const tooltipItems = me._createItems();
        me.title = me.getTitle(tooltipItems);
        me.beforeBody = me.getBeforeBody(tooltipItems);
        me.body = me.getBody(tooltipItems);
        me.afterBody = me.getAfterBody(tooltipItems);
        me.footer = me.getFooter(tooltipItems);
        const size = me._size = getTooltipSize(me);
        const positionAndSize = _extends({}, position, size);
        const alignment = determineAlignment(me._chart, options, positionAndSize);
        const backgroundPoint = getBackgroundPoint(options, positionAndSize, alignment, me._chart);
        me.xAlign = alignment.xAlign;
        me.yAlign = alignment.yAlign;
        properties = {
          opacity: 1,
          x: backgroundPoint.x,
          y: backgroundPoint.y,
          width: size.width,
          height: size.height,
          caretX: position.x,
          caretY: position.y
        };
      }
      if (properties) {
        me._resolveAnimations().update(me, properties);
      }
      if (changed && options.custom) {
        options.custom.call(me, {
          chart: me._chart,
          tooltip: me
        });
      }
    };
    _proto.drawCaret = function drawCaret(tooltipPoint, ctx, size) {
      const caretPosition = this.getCaretPosition(tooltipPoint, size);
      ctx.lineTo(caretPosition.x1, caretPosition.y1);
      ctx.lineTo(caretPosition.x2, caretPosition.y2);
      ctx.lineTo(caretPosition.x3, caretPosition.y3);
    };
    _proto.getCaretPosition = function getCaretPosition(tooltipPoint, size) {
      const xAlign = this.xAlign,
        yAlign = this.yAlign,
        options = this.options;
      const cornerRadius = options.cornerRadius,
        caretSize = options.caretSize;
      const ptX = tooltipPoint.x,
        ptY = tooltipPoint.y;
      const width = size.width,
        height = size.height;
      let x1, x2, x3, y1, y2, y3;
      if (yAlign === 'center') {
        y2 = ptY + height / 2;
        if (xAlign === 'left') {
          x1 = ptX;
          x2 = x1 - caretSize;
          y1 = y2 + caretSize;
          y3 = y2 - caretSize;
        } else {
          x1 = ptX + width;
          x2 = x1 + caretSize;
          y1 = y2 - caretSize;
          y3 = y2 + caretSize;
        }
        x3 = x1;
      } else {
        if (xAlign === 'left') {
          x2 = ptX + cornerRadius + caretSize;
        } else if (xAlign === 'right') {
          x2 = ptX + width - cornerRadius - caretSize;
        } else {
          x2 = this.caretX;
        }
        if (yAlign === 'top') {
          y1 = ptY;
          y2 = y1 - caretSize;
          x1 = x2 - caretSize;
          x3 = x2 + caretSize;
        } else {
          y1 = ptY + height;
          y2 = y1 + caretSize;
          x1 = x2 + caretSize;
          x3 = x2 - caretSize;
        }
        y3 = y1;
      }
      return {
        x1: x1,
        x2: x2,
        x3: x3,
        y1: y1,
        y2: y2,
        y3: y3
      };
    };
    _proto.drawTitle = function drawTitle(pt, ctx) {
      const me = this;
      const options = me.options;
      const title = me.title;
      const length = title.length;
      let titleFont, titleSpacing, i;
      if (length) {
        const rtlHelper = getRtlAdapter(options.rtl, me.x, me.width);
        pt.x = getAlignedX(me, options.titleAlign);
        ctx.textAlign = rtlHelper.textAlign(options.titleAlign);
        ctx.textBaseline = 'middle';
        titleFont = options.titleFont;
        titleSpacing = options.titleSpacing;
        ctx.fillStyle = options.titleFont.color;
        ctx.font = titleFont.string;
        for (i = 0; i < length; ++i) {
          ctx.fillText(title[i], rtlHelper.x(pt.x), pt.y + titleFont.size / 2);
          pt.y += titleFont.size + titleSpacing;
          if (i + 1 === length) {
            pt.y += options.titleMarginBottom - titleSpacing;
          }
        }
      }
    }
    ;
    _proto._drawColorBox = function _drawColorBox(ctx, pt, i, rtlHelper) {
      const me = this;
      const options = me.options;
      const labelColors = me.labelColors[i];
      const labelPointStyle = me.labelPointStyles[i];
      const boxHeight = options.boxHeight,
        boxWidth = options.boxWidth,
        bodyFont = options.bodyFont;
      const colorX = getAlignedX(me, 'left');
      const rtlColorX = rtlHelper.x(colorX);
      const yOffSet = boxHeight < bodyFont.size ? (bodyFont.size - boxHeight) / 2 : 0;
      const colorY = pt.y + yOffSet;
      if (options.usePointStyle) {
        const drawOptions = {
          radius: Math.min(boxWidth, boxHeight) / 2,
          pointStyle: labelPointStyle.pointStyle,
          rotation: labelPointStyle.rotation,
          borderWidth: 1
        };
        const centerX = rtlHelper.leftForLtr(rtlColorX, boxWidth) + boxWidth / 2;
        const centerY = colorY + boxHeight / 2;
        ctx.strokeStyle = options.multiKeyBackground;
        ctx.fillStyle = options.multiKeyBackground;
        drawPoint(ctx, drawOptions, centerX, centerY);
        ctx.strokeStyle = labelColors.borderColor;
        ctx.fillStyle = labelColors.backgroundColor;
        drawPoint(ctx, drawOptions, centerX, centerY);
      } else {
        ctx.fillStyle = options.multiKeyBackground;
        ctx.fillRect(rtlHelper.leftForLtr(rtlColorX, boxWidth), colorY, boxWidth, boxHeight);
        ctx.lineWidth = 1;
        ctx.strokeStyle = labelColors.borderColor;
        ctx.strokeRect(rtlHelper.leftForLtr(rtlColorX, boxWidth), colorY, boxWidth, boxHeight);
        ctx.fillStyle = labelColors.backgroundColor;
        ctx.fillRect(rtlHelper.leftForLtr(rtlHelper.xPlus(rtlColorX, 1), boxWidth - 2), colorY + 1, boxWidth - 2, boxHeight - 2);
      }
      ctx.fillStyle = me.labelTextColors[i];
    };
    _proto.drawBody = function drawBody(pt, ctx) {
      const me = this;
      const body = me.body,
        options = me.options;
      const bodyFont = options.bodyFont,
        bodySpacing = options.bodySpacing,
        bodyAlign = options.bodyAlign,
        displayColors = options.displayColors,
        boxHeight = options.boxHeight,
        boxWidth = options.boxWidth;
      let bodyLineHeight = bodyFont.size;
      let xLinePadding = 0;
      const rtlHelper = getRtlAdapter(options.rtl, me.x, me.width);
      const fillLineOfText = function fillLineOfText(line) {
        ctx.fillText(line, rtlHelper.x(pt.x + xLinePadding), pt.y + bodyLineHeight / 2);
        pt.y += bodyLineHeight + bodySpacing;
      };
      const bodyAlignForCalculation = rtlHelper.textAlign(bodyAlign);
      let bodyItem, textColor, lines, i, j, ilen, jlen;
      ctx.textAlign = bodyAlign;
      ctx.textBaseline = 'middle';
      ctx.font = bodyFont.string;
      pt.x = getAlignedX(me, bodyAlignForCalculation);
      ctx.fillStyle = bodyFont.color;
      each(me.beforeBody, fillLineOfText);
      xLinePadding = displayColors && bodyAlignForCalculation !== 'right' ? bodyAlign === 'center' ? boxWidth / 2 + 1 : boxWidth + 2 : 0;
      for (i = 0, ilen = body.length; i < ilen; ++i) {
        bodyItem = body[i];
        textColor = me.labelTextColors[i];
        ctx.fillStyle = textColor;
        each(bodyItem.before, fillLineOfText);
        lines = bodyItem.lines;
        if (displayColors && lines.length) {
          me._drawColorBox(ctx, pt, i, rtlHelper);
          bodyLineHeight = Math.max(bodyFont.size, boxHeight);
        }
        for (j = 0, jlen = lines.length; j < jlen; ++j) {
          fillLineOfText(lines[j]);
          bodyLineHeight = bodyFont.size;
        }
        each(bodyItem.after, fillLineOfText);
      }
      xLinePadding = 0;
      bodyLineHeight = bodyFont.size;
      each(me.afterBody, fillLineOfText);
      pt.y -= bodySpacing;
    };
    _proto.drawFooter = function drawFooter(pt, ctx) {
      const me = this;
      const options = me.options;
      const footer = me.footer;
      const length = footer.length;
      let footerFont, i;
      if (length) {
        const rtlHelper = getRtlAdapter(options.rtl, me.x, me.width);
        pt.x = getAlignedX(me, options.footerAlign);
        pt.y += options.footerMarginTop;
        ctx.textAlign = rtlHelper.textAlign(options.footerAlign);
        ctx.textBaseline = 'middle';
        footerFont = options.footerFont;
        ctx.fillStyle = options.footerFont.color;
        ctx.font = footerFont.string;
        for (i = 0; i < length; ++i) {
          ctx.fillText(footer[i], rtlHelper.x(pt.x), pt.y + footerFont.size / 2);
          pt.y += footerFont.size + options.footerSpacing;
        }
      }
    };
    _proto.drawBackground = function drawBackground(pt, ctx, tooltipSize) {
      const xAlign = this.xAlign,
        yAlign = this.yAlign,
        options = this.options;
      const x = pt.x,
        y = pt.y;
      const width = tooltipSize.width,
        height = tooltipSize.height;
      const radius = options.cornerRadius;
      ctx.fillStyle = options.backgroundColor;
      ctx.strokeStyle = options.borderColor;
      ctx.lineWidth = options.borderWidth;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      if (yAlign === 'top') {
        this.drawCaret(pt, ctx, tooltipSize);
      }
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      if (yAlign === 'center' && xAlign === 'right') {
        this.drawCaret(pt, ctx, tooltipSize);
      }
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      if (yAlign === 'bottom') {
        this.drawCaret(pt, ctx, tooltipSize);
      }
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      if (yAlign === 'center' && xAlign === 'left') {
        this.drawCaret(pt, ctx, tooltipSize);
      }
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      if (options.borderWidth > 0) {
        ctx.stroke();
      }
    }
    ;
    _proto._updateAnimationTarget = function _updateAnimationTarget() {
      const me = this;
      const chart = me._chart;
      const options = me.options;
      const anims = me.$animations;
      const animX = anims && anims.x;
      const animY = anims && anims.y;
      if (animX || animY) {
        const position = positioners[options.position].call(me, me._active, me._eventPosition);
        if (!position) {
          return;
        }
        const size = me._size = getTooltipSize(me);
        const positionAndSize = _extends({}, position, me._size);
        const alignment = determineAlignment(chart, options, positionAndSize);
        const point = getBackgroundPoint(options, positionAndSize, alignment, chart);
        if (animX._to !== point.x || animY._to !== point.y) {
          me.xAlign = alignment.xAlign;
          me.yAlign = alignment.yAlign;
          me.width = size.width;
          me.height = size.height;
          me.caretX = position.x;
          me.caretY = position.y;
          me._resolveAnimations().update(me, point);
        }
      }
    };
    _proto.draw = function draw(ctx) {
      const me = this;
      const options = me.options;
      let opacity = me.opacity;
      if (!opacity) {
        return;
      }
      me._updateAnimationTarget();
      const tooltipSize = {
        width: me.width,
        height: me.height
      };
      const pt = {
        x: me.x,
        y: me.y
      };
      opacity = Math.abs(opacity) < 1e-3 ? 0 : opacity;
      const hasTooltipContent = me.title.length || me.beforeBody.length || me.body.length || me.afterBody.length || me.footer.length;
      if (options.enabled && hasTooltipContent) {
        ctx.save();
        ctx.globalAlpha = opacity;
        me.drawBackground(pt, ctx, tooltipSize);
        overrideTextDirection(ctx, options.textDirection);
        pt.y += options.yPadding;
        me.drawTitle(pt, ctx);
        me.drawBody(pt, ctx);
        me.drawFooter(pt, ctx);
        restoreTextDirection(ctx, options.textDirection);
        ctx.restore();
      }
    }
    ;
    _proto.getActiveElements = function getActiveElements() {
      return this._active || [];
    }
    ;
    _proto.setActiveElements = function setActiveElements(activeElements, eventPosition) {
      const me = this;
      const lastActive = me._active;
      const active = activeElements.map(function (_ref) {
        const datasetIndex = _ref.datasetIndex,
          index = _ref.index;
        const meta = me._chart.getDatasetMeta(datasetIndex);
        if (!meta) {
          throw new Error('Cannot find a dataset at index ' + datasetIndex);
        }
        return {
          datasetIndex: datasetIndex,
          element: meta.data[index],
          index: index
        };
      });
      const changed = !_elementsEqual(lastActive, active);
      const positionChanged = me._positionChanged(active, eventPosition);
      if (changed || positionChanged) {
        me._active = active;
        me._eventPosition = eventPosition;
        me.update(true);
      }
    }
    ;
    _proto.handleEvent = function handleEvent(e, replay) {
      const me = this;
      const options = me.options;
      const lastActive = me._active || [];
      let changed = false;
      let active = [];
      if (e.type !== 'mouseout') {
        active = me._chart.getElementsAtEventForMode(e, options.mode, options, replay);
        if (options.reverse) {
          active.reverse();
        }
      }
      const positionChanged = me._positionChanged(active, e);
      changed = replay || !_elementsEqual(active, lastActive) || positionChanged;
      if (changed) {
        me._active = active;
        if (options.enabled || options.custom) {
          me._eventPosition = {
            x: e.x,
            y: e.y
          };
          me.update(true);
        }
      }
      return changed;
    }
    ;
    _proto._positionChanged = function _positionChanged(active, e) {
      const me = this;
      const position = positioners[me.options.position].call(me, active, e);
      return me.caretX !== position.x || me.caretY !== position.y;
    };
    return Tooltip;
  }(Element$1);
  Tooltip.positioners = positioners;
  const plugin_tooltip = {
    id: 'tooltip',
    _element: Tooltip,
    positioners: positioners,
    afterInit: function afterInit(chart) {
      const tooltipOpts = chart.options.tooltips;
      if (tooltipOpts) {
        chart.tooltip = new Tooltip({
          _chart: chart
        });
      }
    },
    beforeUpdate: function beforeUpdate(chart) {
      if (chart.tooltip) {
        chart.tooltip.initialize();
      }
    },
    reset: function reset(chart) {
      if (chart.tooltip) {
        chart.tooltip.initialize();
      }
    },
    afterDraw: function afterDraw(chart) {
      const tooltip = chart.tooltip;
      const args = {
        tooltip: tooltip
      };
      if (chart._plugins.notify(chart, 'beforeTooltipDraw', [args]) === false) {
        return;
      }
      if (tooltip) {
        tooltip.draw(chart.ctx);
      }
      chart._plugins.notify(chart, 'afterTooltipDraw', [args]);
    },
    afterEvent: function afterEvent(chart, e, replay) {
      if (chart.tooltip) {
        const useFinalPosition = replay;
        chart.tooltip.handleEvent(e, useFinalPosition);
      }
    },
    defaults: {
      enabled: true,
      custom: null,
      position: 'average',
      backgroundColor: 'rgba(0,0,0,0.8)',
      titleFont: {
        style: 'bold',
        color: '#fff'
      },
      titleSpacing: 2,
      titleMarginBottom: 6,
      titleAlign: 'left',
      bodySpacing: 2,
      bodyFont: {
        color: '#fff'
      },
      bodyAlign: 'left',
      footerSpacing: 2,
      footerMarginTop: 6,
      footerFont: {
        color: '#fff',
        style: 'bold'
      },
      footerAlign: 'left',
      yPadding: 6,
      xPadding: 6,
      caretPadding: 2,
      caretSize: 5,
      cornerRadius: 6,
      multiKeyBackground: '#fff',
      displayColors: true,
      borderColor: 'rgba(0,0,0,0)',
      borderWidth: 0,
      animation: {
        duration: 400,
        easing: 'easeOutQuart',
        numbers: {
          type: 'number',
          properties: ['x', 'y', 'width', 'height', 'caretX', 'caretY']
        },
        opacity: {
          easing: 'linear',
          duration: 200
        }
      },
      callbacks: {
        beforeTitle: noop,
        title: function title(tooltipItems) {
          if (tooltipItems.length > 0) {
            const item = tooltipItems[0];
            const labels = item.chart.data.labels;
            const labelCount = labels ? labels.length : 0;
            if (item.label) {
              return item.label;
            } else if (labelCount > 0 && item.dataIndex < labelCount) {
              return labels[item.dataIndex];
            }
          }
          return '';
        },
        afterTitle: noop,
        beforeBody: noop,
        beforeLabel: noop,
        label: function label(tooltipItem) {
          let label = tooltipItem.dataset.label || '';
          if (label) {
            label += ': ';
          }
          const value = tooltipItem.formattedValue;
          if (!isNullOrUndef(value)) {
            label += value;
          }
          return label;
        },
        labelColor: function labelColor(tooltipItem) {
          const meta = tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex);
          const options = meta.controller.getStyle(tooltipItem.dataIndex);
          return {
            borderColor: options.borderColor,
            backgroundColor: options.backgroundColor
          };
        },
        labelTextColor: function labelTextColor() {
          return this.options.bodyFont.color;
        },
        labelPointStyle: function labelPointStyle(tooltipItem) {
          const meta = tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex);
          const options = meta.controller.getStyle(tooltipItem.dataIndex);
          return {
            pointStyle: options.pointStyle,
            rotation: options.rotation
          };
        },
        afterLabel: noop,
        afterBody: noop,
        beforeFooter: noop,
        footer: noop,
        afterFooter: noop
      }
    }
  };

  const plugins = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Filler: plugin_filler,
    Legend: plugin_legend,
    Title: plugin_title,
    Tooltip: plugin_tooltip
  });

  const CategoryScale = function (_Scale) {
    _inheritsLoose(CategoryScale, _Scale);
    function CategoryScale(cfg) {
      let _this;
      _this = _Scale.call(this, cfg) || this;
      _this._startValue = undefined;
      _this._valueRange = 0;
      return _this;
    }
    const _proto = CategoryScale.prototype;
    _proto.parse = function parse(raw, index) {
      const labels = this.getLabels();
      if (labels[index] === raw) {
        return index;
      }
      const first = labels.indexOf(raw);
      const last = labels.lastIndexOf(raw);
      return first === -1 || first !== last ? index : first;
    };
    _proto.determineDataLimits = function determineDataLimits() {
      const me = this;
      const max = me.getLabels().length - 1;
      me.min = Math.max(me._userMin || 0, 0);
      me.max = Math.min(me._userMax || max, max);
    };
    _proto.buildTicks = function buildTicks() {
      const me = this;
      const min = me.min;
      const max = me.max;
      const offset = me.options.offset;
      const ticks = [];
      let labels = me.getLabels();
      labels = min === 0 && max === labels.length - 1 ? labels : labels.slice(min, max + 1);
      me._valueRange = Math.max(labels.length - (offset ? 0 : 1), 1);
      me._startValue = me.min - (offset ? 0.5 : 0);
      for (let value = min; value <= max; value++) {
        ticks.push({
          value: value
        });
      }
      return ticks;
    };
    _proto.getLabelForValue = function getLabelForValue(value) {
      const me = this;
      const labels = me.getLabels();
      if (value >= 0 && value < labels.length) {
        return labels[value];
      }
      return value;
    }
    ;
    _proto.configure = function configure() {
      const me = this;
      _Scale.prototype.configure.call(this);
      if (!me.isHorizontal()) {
        me._reversePixels = !me._reversePixels;
      }
    }
    ;
    _proto.getPixelForValue = function getPixelForValue(value) {
      const me = this;
      if (typeof value !== 'number') {
        value = me.parse(value);
      }
      return me.getPixelForDecimal((value - me._startValue) / me._valueRange);
    }
    ;
    _proto.getPixelForTick = function getPixelForTick(index) {
      const me = this;
      const ticks = me.ticks;
      if (index < 0 || index > ticks.length - 1) {
        return null;
      }
      return me.getPixelForValue(ticks[index].value);
    };
    _proto.getValueForPixel = function getValueForPixel(pixel) {
      const me = this;
      const value = Math.round(me._startValue + me.getDecimalForPixel(pixel) * me._valueRange);
      return Math.min(Math.max(value, 0), me.ticks.length - 1);
    };
    _proto.getBasePixel = function getBasePixel() {
      return this.bottom;
    };
    return CategoryScale;
  }(Scale);
  CategoryScale.id = 'category';
  CategoryScale.defaults = {
    ticks: {
      callback: CategoryScale.prototype.getLabelForValue
    }
  };

  function niceNum(range) {
    const exponent = Math.floor(log10(range));
    const fraction = range / Math.pow(10, exponent);
    let niceFraction;
    if (fraction <= 1.0) {
      niceFraction = 1;
    } else if (fraction <= 2) {
      niceFraction = 2;
    } else if (fraction <= 5) {
      niceFraction = 5;
    } else {
      niceFraction = 10;
    }
    return niceFraction * Math.pow(10, exponent);
  }
  function generateTicks(generationOptions, dataRange) {
    const ticks = [];
    const MIN_SPACING = 1e-14;
    const stepSize = generationOptions.stepSize,
      min = generationOptions.min,
      max = generationOptions.max,
      precision = generationOptions.precision;
    const unit = stepSize || 1;
    const maxNumSpaces = generationOptions.maxTicks - 1;
    const rmin = dataRange.min,
      rmax = dataRange.max;
    let spacing = niceNum((rmax - rmin) / maxNumSpaces / unit) * unit;
    let factor, niceMin, niceMax, numSpaces;
    if (spacing < MIN_SPACING && isNullOrUndef(min) && isNullOrUndef(max)) {
      return [{
        value: rmin
      }, {
        value: rmax
      }];
    }
    numSpaces = Math.ceil(rmax / spacing) - Math.floor(rmin / spacing);
    if (numSpaces > maxNumSpaces) {
      spacing = niceNum(numSpaces * spacing / maxNumSpaces / unit) * unit;
    }
    if (stepSize || isNullOrUndef(precision)) {
      factor = Math.pow(10, _decimalPlaces(spacing));
    } else {
      factor = Math.pow(10, precision);
      spacing = Math.ceil(spacing * factor) / factor;
    }
    niceMin = Math.floor(rmin / spacing) * spacing;
    niceMax = Math.ceil(rmax / spacing) * spacing;
    if (stepSize && !isNullOrUndef(min) && !isNullOrUndef(max)) {
      if (almostWhole((max - min) / stepSize, spacing / 1000)) {
        niceMin = min;
        niceMax = max;
      }
    }
    numSpaces = (niceMax - niceMin) / spacing;
    if (almostEquals(numSpaces, Math.round(numSpaces), spacing / 1000)) {
      numSpaces = Math.round(numSpaces);
    } else {
      numSpaces = Math.ceil(numSpaces);
    }
    niceMin = Math.round(niceMin * factor) / factor;
    niceMax = Math.round(niceMax * factor) / factor;
    ticks.push({
      value: isNullOrUndef(min) ? niceMin : min
    });
    for (let j = 1; j < numSpaces; ++j) {
      ticks.push({
        value: Math.round((niceMin + j * spacing) * factor) / factor
      });
    }
    ticks.push({
      value: isNullOrUndef(max) ? niceMax : max
    });
    return ticks;
  }
  const LinearScaleBase = function (_Scale) {
    _inheritsLoose(LinearScaleBase, _Scale);
    function LinearScaleBase(cfg) {
      let _this;
      _this = _Scale.call(this, cfg) || this;
      _this.start = undefined;
      _this.end = undefined;
      _this._startValue = undefined;
      _this._endValue = undefined;
      _this._valueRange = 0;
      return _this;
    }
    const _proto = LinearScaleBase.prototype;
    _proto.parse = function parse(raw, index) {
      if (isNullOrUndef(raw)) {
        return NaN;
      }
      if ((typeof raw === 'number' || raw instanceof Number) && !isFinite(+raw)) {
        return NaN;
      }
      return +raw;
    };
    _proto.handleTickRangeOptions = function handleTickRangeOptions() {
      const me = this;
      const opts = me.options;
      if (opts.beginAtZero) {
        const minSign = sign(me.min);
        const maxSign = sign(me.max);
        if (minSign < 0 && maxSign < 0) {
          me.max = 0;
        } else if (minSign > 0 && maxSign > 0) {
          me.min = 0;
        }
      }
      const setMin = opts.min !== undefined || opts.suggestedMin !== undefined;
      const setMax = opts.max !== undefined || opts.suggestedMax !== undefined;
      if (opts.min !== undefined) {
        me.min = opts.min;
      } else if (opts.suggestedMin !== undefined) {
        if (me.min === null) {
          me.min = opts.suggestedMin;
        } else {
          me.min = Math.min(me.min, opts.suggestedMin);
        }
      }
      if (opts.max !== undefined) {
        me.max = opts.max;
      } else if (opts.suggestedMax !== undefined) {
        if (me.max === null) {
          me.max = opts.suggestedMax;
        } else {
          me.max = Math.max(me.max, opts.suggestedMax);
        }
      }
      if (setMin !== setMax) {
        if (me.min >= me.max) {
          if (setMin) {
            me.max = me.min + 1;
          } else {
            me.min = me.max - 1;
          }
        }
      }
      if (me.min === me.max) {
        me.max++;
        if (!opts.beginAtZero) {
          me.min--;
        }
      }
    };
    _proto.getTickLimit = function getTickLimit() {
      const me = this;
      const tickOpts = me.options.ticks;
      let maxTicksLimit = tickOpts.maxTicksLimit,
        stepSize = tickOpts.stepSize;
      let maxTicks;
      if (stepSize) {
        maxTicks = Math.ceil(me.max / stepSize) - Math.floor(me.min / stepSize) + 1;
      } else {
        maxTicks = me.computeTickLimit();
        maxTicksLimit = maxTicksLimit || 11;
      }
      if (maxTicksLimit) {
        maxTicks = Math.min(maxTicksLimit, maxTicks);
      }
      return maxTicks;
    }
    ;
    _proto.computeTickLimit = function computeTickLimit() {
      return Number.POSITIVE_INFINITY;
    };
    _proto.buildTicks = function buildTicks() {
      const me = this;
      const opts = me.options;
      const tickOpts = opts.ticks;
      let maxTicks = me.getTickLimit();
      maxTicks = Math.max(2, maxTicks);
      const numericGeneratorOptions = {
        maxTicks: maxTicks,
        min: opts.min,
        max: opts.max,
        precision: tickOpts.precision,
        stepSize: valueOrDefault(tickOpts.fixedStepSize, tickOpts.stepSize)
      };
      const ticks = generateTicks(numericGeneratorOptions, me);
      _setMinAndMaxByKey(ticks, me, 'value');
      if (opts.reverse) {
        ticks.reverse();
        me.start = me.max;
        me.end = me.min;
      } else {
        me.start = me.min;
        me.end = me.max;
      }
      return ticks;
    }
    ;
    _proto.configure = function configure() {
      const me = this;
      const ticks = me.ticks;
      let start = me.min;
      let end = me.max;
      _Scale.prototype.configure.call(this);
      if (me.options.offset && ticks.length) {
        const offset = (end - start) / Math.max(ticks.length - 1, 1) / 2;
        start -= offset;
        end += offset;
      }
      me._startValue = start;
      me._endValue = end;
      me._valueRange = end - start;
    };
    _proto.getLabelForValue = function getLabelForValue(value) {
      return new Intl.NumberFormat(this.options.locale).format(value);
    };
    return LinearScaleBase;
  }(Scale);

  const LinearScale = function (_LinearScaleBase) {
    _inheritsLoose(LinearScale, _LinearScaleBase);
    function LinearScale() {
      return _LinearScaleBase.apply(this, arguments) || this;
    }
    const _proto = LinearScale.prototype;
    _proto.determineDataLimits = function determineDataLimits() {
      const me = this;
      const options = me.options;
      const _me$getMinMax = me.getMinMax(true),
        min = _me$getMinMax.min,
        max = _me$getMinMax.max;
      me.min = isNumberFinite(min) ? min : valueOrDefault(options.suggestedMin, 0);
      me.max = isNumberFinite(max) ? max : valueOrDefault(options.suggestedMax, 1);
      if (options.stacked && min > 0) {
        me.min = 0;
      }
      me.handleTickRangeOptions();
    }
    ;
    _proto.computeTickLimit = function computeTickLimit() {
      const me = this;
      if (me.isHorizontal()) {
        return Math.ceil(me.width / 40);
      }
      const tickFont = me._resolveTickFontOptions(0);
      return Math.ceil(me.height / tickFont.lineHeight);
    }
    ;
    _proto.getPixelForValue = function getPixelForValue(value) {
      const me = this;
      return me.getPixelForDecimal((value - me._startValue) / me._valueRange);
    };
    _proto.getValueForPixel = function getValueForPixel(pixel) {
      return this._startValue + this.getDecimalForPixel(pixel) * this._valueRange;
    };
    return LinearScale;
  }(LinearScaleBase);
  LinearScale.id = 'linear';
  LinearScale.defaults = {
    ticks: {
      callback: Ticks.formatters.numeric
    }
  };

  function isMajor(tickVal) {
    const remain = tickVal / Math.pow(10, Math.floor(log10(tickVal)));
    return remain === 1;
  }
  function finiteOrDefault(value, def) {
    return isNumberFinite(value) ? value : def;
  }
  function generateTicks$1(generationOptions, dataRange) {
    const endExp = Math.floor(log10(dataRange.max));
    const endSignificand = Math.ceil(dataRange.max / Math.pow(10, endExp));
    const ticks = [];
    let tickVal = finiteOrDefault(generationOptions.min, Math.pow(10, Math.floor(log10(dataRange.min))));
    let exp = Math.floor(log10(tickVal));
    let significand = Math.floor(tickVal / Math.pow(10, exp));
    let precision = exp < 0 ? Math.pow(10, Math.abs(exp)) : 1;
    do {
      ticks.push({
        value: tickVal,
        major: isMajor(tickVal)
      });
      ++significand;
      if (significand === 10) {
        significand = 1;
        ++exp;
        precision = exp >= 0 ? 1 : precision;
      }
      tickVal = Math.round(significand * Math.pow(10, exp) * precision) / precision;
    } while (exp < endExp || exp === endExp && significand < endSignificand);
    const lastTick = finiteOrDefault(generationOptions.max, tickVal);
    ticks.push({
      value: lastTick,
      major: isMajor(tickVal)
    });
    return ticks;
  }
  const LogarithmicScale = function (_Scale) {
    _inheritsLoose(LogarithmicScale, _Scale);
    function LogarithmicScale(cfg) {
      let _this;
      _this = _Scale.call(this, cfg) || this;
      _this.start = undefined;
      _this.end = undefined;
      _this._startValue = undefined;
      _this._valueRange = 0;
      return _this;
    }
    const _proto = LogarithmicScale.prototype;
    _proto.parse = function parse(raw, index) {
      const value = LinearScaleBase.prototype.parse.apply(this, [raw, index]);
      if (value === 0) {
        this._zero = true;
        return undefined;
      }
      return isNumberFinite(value) && value > 0 ? value : NaN;
    };
    _proto.determineDataLimits = function determineDataLimits() {
      const me = this;
      const _me$getMinMax = me.getMinMax(true),
        min = _me$getMinMax.min,
        max = _me$getMinMax.max;
      me.min = isNumberFinite(min) ? Math.max(0, min) : null;
      me.max = isNumberFinite(max) ? Math.max(0, max) : null;
      if (me.options.beginAtZero) {
        me._zero = true;
      }
      me.handleTickRangeOptions();
    };
    _proto.handleTickRangeOptions = function handleTickRangeOptions() {
      const me = this;
      const _me$options = me.options,
        suggestedMax = _me$options.suggestedMax,
        suggestedMin = _me$options.suggestedMin;
      const DEFAULT_MIN = 1;
      const DEFAULT_MAX = 10;
      let min = me.min;
      let max = me.max;
      if (!isNullOrUndef(suggestedMin)) {
        min = Math.min(min, suggestedMin);
      }
      if (!isNullOrUndef(suggestedMax)) {
        max = Math.max(max, suggestedMax);
      }
      if (min === max) {
        if (min <= 0) {
          min = DEFAULT_MIN;
          max = DEFAULT_MAX;
        } else {
          min = Math.pow(10, Math.floor(log10(min)) - 1);
          max = Math.pow(10, Math.floor(log10(max)) + 1);
        }
      }
      if (min <= 0) {
        min = Math.pow(10, Math.floor(log10(max)) - 1);
      }
      if (max <= 0) {
        max = Math.pow(10, Math.floor(log10(min)) + 1);
      }
      if (!me._userMin && me._zero && min === Math.pow(10, Math.floor(log10(me.min)))) {
        min = Math.pow(10, Math.floor(log10(min)) - 1);
      }
      me.min = min;
      me.max = max;
    };
    _proto.buildTicks = function buildTicks() {
      const me = this;
      const opts = me.options;
      const generationOptions = {
        min: me._userMin,
        max: me._userMax
      };
      const ticks = generateTicks$1(generationOptions, me);
      let reverse = !me.isHorizontal();
      _setMinAndMaxByKey(ticks, me, 'value');
      if (opts.reverse) {
        reverse = !reverse;
        me.start = me.max;
        me.end = me.min;
      } else {
        me.start = me.min;
        me.end = me.max;
      }
      if (reverse) {
        ticks.reverse();
      }
      return ticks;
    }
    ;
    _proto.getLabelForValue = function getLabelForValue(value) {
      return value === undefined ? '0' : new Intl.NumberFormat(this.options.locale).format(value);
    }
    ;
    _proto.configure = function configure() {
      const me = this;
      const start = me.min;
      _Scale.prototype.configure.call(this);
      me._startValue = log10(start);
      me._valueRange = log10(me.max) - log10(start);
    };
    _proto.getPixelForValue = function getPixelForValue(value) {
      const me = this;
      if (value === undefined || value === 0) {
        value = me.min;
      }
      return me.getPixelForDecimal(value === me.min ? 0 : (log10(value) - me._startValue) / me._valueRange);
    };
    _proto.getValueForPixel = function getValueForPixel(pixel) {
      const me = this;
      const decimal = me.getDecimalForPixel(pixel);
      return Math.pow(10, me._startValue + decimal * me._valueRange);
    };
    return LogarithmicScale;
  }(Scale);
  LogarithmicScale.id = 'logarithmic';
  LogarithmicScale.defaults = {
    ticks: {
      callback: Ticks.formatters.logarithmic,
      major: {
        enabled: true
      }
    }
  };

  function getTickBackdropHeight(opts) {
    const tickOpts = opts.ticks;
    if (tickOpts.display && opts.display) {
      return valueOrDefault(tickOpts.font && tickOpts.font.size, defaults.font.size) + tickOpts.backdropPaddingY * 2;
    }
    return 0;
  }
  function measureLabelSize(ctx, lineHeight, label) {
    if (isArray(label)) {
      return {
        w: _longestText(ctx, ctx.font, label),
        h: label.length * lineHeight
      };
    }
    return {
      w: ctx.measureText(label).width,
      h: lineHeight
    };
  }
  function determineLimits(angle, pos, size, min, max) {
    if (angle === min || angle === max) {
      return {
        start: pos - size / 2,
        end: pos + size / 2
      };
    } else if (angle < min || angle > max) {
      return {
        start: pos - size,
        end: pos
      };
    }
    return {
      start: pos,
      end: pos + size
    };
  }
  function fitWithPointLabels(scale) {
    const furthestLimits = {
      l: 0,
      r: scale.width,
      t: 0,
      b: scale.height - scale.paddingTop
    };
    const furthestAngles = {};
    let i, textSize, pointPosition;
    scale._pointLabelSizes = [];
    const valueCount = scale.chart.data.labels.length;
    for (i = 0; i < valueCount; i++) {
      pointPosition = scale.getPointPosition(i, scale.drawingArea + 5);
      const context = scale.getContext(i);
      const plFont = toFont(resolve([scale.options.pointLabels.font], context, i), scale.chart.options.font);
      scale.ctx.font = plFont.string;
      textSize = measureLabelSize(scale.ctx, plFont.lineHeight, scale.pointLabels[i]);
      scale._pointLabelSizes[i] = textSize;
      const angleRadians = scale.getIndexAngle(i);
      const angle = toDegrees(angleRadians);
      const hLimits = determineLimits(angle, pointPosition.x, textSize.w, 0, 180);
      const vLimits = determineLimits(angle, pointPosition.y, textSize.h, 90, 270);
      if (hLimits.start < furthestLimits.l) {
        furthestLimits.l = hLimits.start;
        furthestAngles.l = angleRadians;
      }
      if (hLimits.end > furthestLimits.r) {
        furthestLimits.r = hLimits.end;
        furthestAngles.r = angleRadians;
      }
      if (vLimits.start < furthestLimits.t) {
        furthestLimits.t = vLimits.start;
        furthestAngles.t = angleRadians;
      }
      if (vLimits.end > furthestLimits.b) {
        furthestLimits.b = vLimits.end;
        furthestAngles.b = angleRadians;
      }
    }
    scale._setReductions(scale.drawingArea, furthestLimits, furthestAngles);
  }
  function getTextAlignForAngle(angle) {
    if (angle === 0 || angle === 180) {
      return 'center';
    } else if (angle < 180) {
      return 'left';
    }
    return 'right';
  }
  function fillText(ctx, text, position, lineHeight) {
    let y = position.y + lineHeight / 2;
    let i, ilen;
    if (isArray(text)) {
      for (i = 0, ilen = text.length; i < ilen; ++i) {
        ctx.fillText(text[i], position.x, y);
        y += lineHeight;
      }
    } else {
      ctx.fillText(text, position.x, y);
    }
  }
  function adjustPointPositionForLabelHeight(angle, textSize, position) {
    if (angle === 90 || angle === 270) {
      position.y -= textSize.h / 2;
    } else if (angle > 270 || angle < 90) {
      position.y -= textSize.h;
    }
  }
  function drawPointLabels(scale) {
    const ctx = scale.ctx;
    const opts = scale.options;
    const pointLabelOpts = opts.pointLabels;
    const tickBackdropHeight = getTickBackdropHeight(opts);
    const outerDistance = scale.getDistanceFromCenterForValue(opts.ticks.reverse ? scale.min : scale.max);
    ctx.save();
    ctx.textBaseline = 'middle';
    for (let i = scale.chart.data.labels.length - 1; i >= 0; i--) {
      const extra = i === 0 ? tickBackdropHeight / 2 : 0;
      const pointLabelPosition = scale.getPointPosition(i, outerDistance + extra + 5);
      const context = scale.getContext(i);
      const plFont = toFont(resolve([pointLabelOpts.font], context, i), scale.chart.options.font);
      ctx.font = plFont.string;
      ctx.fillStyle = plFont.color;
      const angle = toDegrees(scale.getIndexAngle(i));
      ctx.textAlign = getTextAlignForAngle(angle);
      adjustPointPositionForLabelHeight(angle, scale._pointLabelSizes[i], pointLabelPosition);
      fillText(ctx, scale.pointLabels[i], pointLabelPosition, plFont.lineHeight);
    }
    ctx.restore();
  }
  function drawRadiusLine(scale, gridLineOpts, radius, index) {
    const ctx = scale.ctx;
    const circular = gridLineOpts.circular;
    const valueCount = scale.chart.data.labels.length;
    const context = scale.getContext(index);
    const lineColor = resolve([gridLineOpts.color], context, index - 1);
    const lineWidth = resolve([gridLineOpts.lineWidth], context, index - 1);
    let pointPosition;
    if (!circular && !valueCount || !lineColor || !lineWidth) {
      return;
    }
    ctx.save();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    if (ctx.setLineDash) {
      ctx.setLineDash(resolve([gridLineOpts.borderDash, []], context));
      ctx.lineDashOffset = resolve([gridLineOpts.borderDashOffset], context, index - 1);
    }
    ctx.beginPath();
    if (circular) {
      ctx.arc(scale.xCenter, scale.yCenter, radius, 0, TAU);
    } else {
      pointPosition = scale.getPointPosition(0, radius);
      ctx.moveTo(pointPosition.x, pointPosition.y);
      for (let i = 1; i < valueCount; i++) {
        pointPosition = scale.getPointPosition(i, radius);
        ctx.lineTo(pointPosition.x, pointPosition.y);
      }
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  function numberOrZero$1(param) {
    return isNumber(param) ? param : 0;
  }
  const RadialLinearScale = function (_LinearScaleBase) {
    _inheritsLoose(RadialLinearScale, _LinearScaleBase);
    function RadialLinearScale(cfg) {
      let _this;
      _this = _LinearScaleBase.call(this, cfg) || this;
      _this.xCenter = undefined;
      _this.yCenter = undefined;
      _this.drawingArea = undefined;
      _this.pointLabels = [];
      return _this;
    }
    const _proto = RadialLinearScale.prototype;
    _proto.init = function init(options) {
      _LinearScaleBase.prototype.init.call(this, options);
      this.axis = 'r';
    };
    _proto.setDimensions = function setDimensions() {
      const me = this;
      me.width = me.maxWidth;
      me.height = me.maxHeight;
      me.paddingTop = getTickBackdropHeight(me.options) / 2;
      me.xCenter = Math.floor(me.width / 2);
      me.yCenter = Math.floor((me.height - me.paddingTop) / 2);
      me.drawingArea = Math.min(me.height - me.paddingTop, me.width) / 2;
    };
    _proto.determineDataLimits = function determineDataLimits() {
      const me = this;
      const _me$getMinMax = me.getMinMax(false),
        min = _me$getMinMax.min,
        max = _me$getMinMax.max;
      me.min = isNumberFinite(min) && !isNaN(min) ? min : 0;
      me.max = isNumberFinite(max) && !isNaN(max) ? max : 0;
      me.handleTickRangeOptions();
    }
    ;
    _proto.computeTickLimit = function computeTickLimit() {
      return Math.ceil(this.drawingArea / getTickBackdropHeight(this.options));
    };
    _proto.generateTickLabels = function generateTickLabels(ticks) {
      const me = this;
      LinearScaleBase.prototype.generateTickLabels.call(me, ticks);
      me.pointLabels = me.chart.data.labels.map(function (value, index) {
        const label = callback(me.options.pointLabels.callback, [value, index], me);
        return label || label === 0 ? label : '';
      });
    };
    _proto.fit = function fit() {
      const me = this;
      const opts = me.options;
      if (opts.display && opts.pointLabels.display) {
        fitWithPointLabels(me);
      } else {
        me.setCenterPoint(0, 0, 0, 0);
      }
    }
    ;
    _proto._setReductions = function _setReductions(largestPossibleRadius, furthestLimits, furthestAngles) {
      const me = this;
      let radiusReductionLeft = furthestLimits.l / Math.sin(furthestAngles.l);
      let radiusReductionRight = Math.max(furthestLimits.r - me.width, 0) / Math.sin(furthestAngles.r);
      let radiusReductionTop = -furthestLimits.t / Math.cos(furthestAngles.t);
      let radiusReductionBottom = -Math.max(furthestLimits.b - (me.height - me.paddingTop), 0) / Math.cos(furthestAngles.b);
      radiusReductionLeft = numberOrZero$1(radiusReductionLeft);
      radiusReductionRight = numberOrZero$1(radiusReductionRight);
      radiusReductionTop = numberOrZero$1(radiusReductionTop);
      radiusReductionBottom = numberOrZero$1(radiusReductionBottom);
      me.drawingArea = Math.min(Math.floor(largestPossibleRadius - (radiusReductionLeft + radiusReductionRight) / 2), Math.floor(largestPossibleRadius - (radiusReductionTop + radiusReductionBottom) / 2));
      me.setCenterPoint(radiusReductionLeft, radiusReductionRight, radiusReductionTop, radiusReductionBottom);
    };
    _proto.setCenterPoint = function setCenterPoint(leftMovement, rightMovement, topMovement, bottomMovement) {
      const me = this;
      const maxRight = me.width - rightMovement - me.drawingArea;
      const maxLeft = leftMovement + me.drawingArea;
      const maxTop = topMovement + me.drawingArea;
      const maxBottom = me.height - me.paddingTop - bottomMovement - me.drawingArea;
      me.xCenter = Math.floor((maxLeft + maxRight) / 2 + me.left);
      me.yCenter = Math.floor((maxTop + maxBottom) / 2 + me.top + me.paddingTop);
    };
    _proto.getIndexAngle = function getIndexAngle(index) {
      const chart = this.chart;
      const angleMultiplier = TAU / chart.data.labels.length;
      const options = chart.options || {};
      const startAngle = options.startAngle || 0;
      return _normalizeAngle(index * angleMultiplier + toRadians(startAngle));
    };
    _proto.getDistanceFromCenterForValue = function getDistanceFromCenterForValue(value) {
      const me = this;
      if (isNullOrUndef(value)) {
        return NaN;
      }
      const scalingFactor = me.drawingArea / (me.max - me.min);
      if (me.options.reverse) {
        return (me.max - value) * scalingFactor;
      }
      return (value - me.min) * scalingFactor;
    };
    _proto.getValueForDistanceFromCenter = function getValueForDistanceFromCenter(distance) {
      if (isNullOrUndef(distance)) {
        return NaN;
      }
      const me = this;
      const scaledDistance = distance / (me.drawingArea / (me.max - me.min));
      return me.options.reverse ? me.max - scaledDistance : me.min + scaledDistance;
    };
    _proto.getPointPosition = function getPointPosition(index, distanceFromCenter) {
      const me = this;
      const angle = me.getIndexAngle(index) - HALF_PI;
      return {
        x: Math.cos(angle) * distanceFromCenter + me.xCenter,
        y: Math.sin(angle) * distanceFromCenter + me.yCenter,
        angle: angle
      };
    };
    _proto.getPointPositionForValue = function getPointPositionForValue(index, value) {
      return this.getPointPosition(index, this.getDistanceFromCenterForValue(value));
    };
    _proto.getBasePosition = function getBasePosition(index) {
      return this.getPointPositionForValue(index || 0, this.getBaseValue());
    }
    ;
    _proto.drawGrid = function drawGrid() {
      const me = this;
      const ctx = me.ctx;
      const opts = me.options;
      const gridLineOpts = opts.gridLines;
      const angleLineOpts = opts.angleLines;
      let i, offset, position;
      if (opts.pointLabels.display) {
        drawPointLabels(me);
      }
      if (gridLineOpts.display) {
        me.ticks.forEach(function (tick, index) {
          if (index !== 0) {
            offset = me.getDistanceFromCenterForValue(me.ticks[index].value);
            drawRadiusLine(me, gridLineOpts, offset, index);
          }
        });
      }
      if (angleLineOpts.display) {
        ctx.save();
        for (i = me.chart.data.labels.length - 1; i >= 0; i--) {
          const context = me.getContext(i);
          const lineWidth = resolve([angleLineOpts.lineWidth, gridLineOpts.lineWidth], context, i);
          const color = resolve([angleLineOpts.color, gridLineOpts.color], context, i);
          if (!lineWidth || !color) {
            continue;
          }
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = color;
          if (ctx.setLineDash) {
            ctx.setLineDash(resolve([angleLineOpts.borderDash, gridLineOpts.borderDash, []], context));
            ctx.lineDashOffset = resolve([angleLineOpts.borderDashOffset, gridLineOpts.borderDashOffset, 0.0], context, i);
          }
          offset = me.getDistanceFromCenterForValue(opts.ticks.reverse ? me.min : me.max);
          position = me.getPointPosition(i, offset);
          ctx.beginPath();
          ctx.moveTo(me.xCenter, me.yCenter);
          ctx.lineTo(position.x, position.y);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    ;
    _proto.drawLabels = function drawLabels() {
      const me = this;
      const ctx = me.ctx;
      const opts = me.options;
      const tickOpts = opts.ticks;
      if (!tickOpts.display) {
        return;
      }
      const startAngle = me.getIndexAngle(0);
      let offset, width;
      ctx.save();
      ctx.translate(me.xCenter, me.yCenter);
      ctx.rotate(startAngle);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      me.ticks.forEach(function (tick, index) {
        if (index === 0 && !opts.reverse) {
          return;
        }
        const context = me.getContext(index);
        const tickFont = me._resolveTickFontOptions(index);
        ctx.font = tickFont.string;
        offset = me.getDistanceFromCenterForValue(me.ticks[index].value);
        const showLabelBackdrop = resolve([tickOpts.showLabelBackdrop], context, index);
        if (showLabelBackdrop) {
          width = ctx.measureText(tick.label).width;
          ctx.fillStyle = resolve([tickOpts.backdropColor], context, index);
          ctx.fillRect(-width / 2 - tickOpts.backdropPaddingX, -offset - tickFont.size / 2 - tickOpts.backdropPaddingY, width + tickOpts.backdropPaddingX * 2, tickFont.size + tickOpts.backdropPaddingY * 2);
        }
        ctx.fillStyle = tickFont.color;
        ctx.fillText(tick.label, 0, -offset);
      });
      ctx.restore();
    }
    ;
    _proto.drawTitle = function drawTitle() {};
    return RadialLinearScale;
  }(LinearScaleBase);
  RadialLinearScale.id = 'radialLinear';
  RadialLinearScale.defaults = {
    display: true,
    animate: true,
    position: 'chartArea',
    angleLines: {
      display: true,
      color: 'rgba(0,0,0,0.1)',
      lineWidth: 1,
      borderDash: [],
      borderDashOffset: 0.0
    },
    gridLines: {
      circular: false
    },
    ticks: {
      showLabelBackdrop: true,
      backdropColor: 'rgba(255,255,255,0.75)',
      backdropPaddingY: 2,
      backdropPaddingX: 2,
      callback: Ticks.formatters.numeric
    },
    pointLabels: {
      display: true,
      font: {
        size: 10
      },
      callback: function callback(label) {
        return label;
      }
    }
  };

  const MAX_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;
  const INTERVALS = {
    millisecond: {
      common: true,
      size: 1,
      steps: 1000
    },
    second: {
      common: true,
      size: 1000,
      steps: 60
    },
    minute: {
      common: true,
      size: 60000,
      steps: 60
    },
    hour: {
      common: true,
      size: 3600000,
      steps: 24
    },
    day: {
      common: true,
      size: 86400000,
      steps: 30
    },
    week: {
      common: false,
      size: 604800000,
      steps: 4
    },
    month: {
      common: true,
      size: 2.628e9,
      steps: 12
    },
    quarter: {
      common: false,
      size: 7.884e9,
      steps: 4
    },
    year: {
      common: true,
      size: 3.154e10
    }
  };
  const UNITS =
  Object.keys(INTERVALS);
  function sorter(a, b) {
    return a - b;
  }
  function _parse(scale, input) {
    if (isNullOrUndef(input)) {
      return null;
    }
    const adapter = scale._adapter;
    const options = scale.options.time;
    const parser = options.parser,
      round = options.round,
      isoWeekday = options.isoWeekday;
    let value = input;
    if (typeof parser === 'function') {
      value = parser(value);
    }
    if (!isNumberFinite(value)) {
      value = typeof parser === 'string' ? adapter.parse(value, parser) : adapter.parse(value);
    }
    if (value === null) {
      return value;
    }
    if (round) {
      value = round === 'week' && (isNumber(isoWeekday) || isoWeekday === true) ? scale._adapter.startOf(value, 'isoWeek', isoWeekday) : scale._adapter.startOf(value, round);
    }
    return +value;
  }
  function determineUnitForAutoTicks(minUnit, min, max, capacity) {
    const ilen = UNITS.length;
    for (let i = UNITS.indexOf(minUnit); i < ilen - 1; ++i) {
      const interval = INTERVALS[UNITS[i]];
      const factor = interval.steps ? interval.steps : MAX_INTEGER;
      if (interval.common && Math.ceil((max - min) / (factor * interval.size)) <= capacity) {
        return UNITS[i];
      }
    }
    return UNITS[ilen - 1];
  }
  function determineUnitForFormatting(scale, numTicks, minUnit, min, max) {
    for (let i = UNITS.length - 1; i >= UNITS.indexOf(minUnit); i--) {
      const unit = UNITS[i];
      if (INTERVALS[unit].common && scale._adapter.diff(max, min, unit) >= numTicks - 1) {
        return unit;
      }
    }
    return UNITS[minUnit ? UNITS.indexOf(minUnit) : 0];
  }
  function determineMajorUnit(unit) {
    for (let i = UNITS.indexOf(unit) + 1, ilen = UNITS.length; i < ilen; ++i) {
      if (INTERVALS[UNITS[i]].common) {
        return UNITS[i];
      }
    }
  }
  function addTick(ticks, time, timestamps) {
    if (!timestamps) {
      ticks[time] = true;
    } else if (timestamps.length) {
      const _lookup2 = _lookup(timestamps, time),
        lo = _lookup2.lo,
        hi = _lookup2.hi;
      const timestamp = timestamps[lo] >= time ? timestamps[lo] : timestamps[hi];
      ticks[timestamp] = true;
    }
  }
  function setMajorTicks(scale, ticks, map, majorUnit) {
    const adapter = scale._adapter;
    const first = +adapter.startOf(ticks[0].value, majorUnit);
    const last = ticks[ticks.length - 1].value;
    let major, index;
    for (major = first; major <= last; major = +adapter.add(major, 1, majorUnit)) {
      index = map[major];
      if (index >= 0) {
        ticks[index].major = true;
      }
    }
    return ticks;
  }
  function ticksFromTimestamps(scale, values, majorUnit) {
    const ticks = [];
    const map = {};
    const ilen = values.length;
    let i, value;
    for (i = 0; i < ilen; ++i) {
      value = values[i];
      map[value] = i;
      ticks.push({
        value: value,
        major: false
      });
    }
    return ilen === 0 || !majorUnit ? ticks : setMajorTicks(scale, ticks, map, majorUnit);
  }
  const TimeScale = function (_Scale) {
    _inheritsLoose(TimeScale, _Scale);
    function TimeScale(props) {
      let _this;
      _this = _Scale.call(this, props) || this;
      _this._cache = {
        data: [],
        labels: [],
        all: []
      };
      _this._unit = 'day';
      _this._majorUnit = undefined;
      _this._offsets = {};
      _this._normalized = false;
      return _this;
    }
    const _proto = TimeScale.prototype;
    _proto.init = function init(scaleOpts, opts) {
      const time = scaleOpts.time || (scaleOpts.time = {});
      const adapter = this._adapter = new _adapters._date(scaleOpts.adapters.date);
      mergeIf(time.displayFormats, adapter.formats());
      _Scale.prototype.init.call(this, scaleOpts);
      this._normalized = opts.normalized;
    }
    ;
    _proto.parse = function parse(raw, index) {
      if (raw === undefined) {
        return NaN;
      }
      return _parse(this, raw);
    };
    _proto.invalidateCaches = function invalidateCaches() {
      this._cache = {
        data: [],
        labels: [],
        all: []
      };
    };
    _proto.determineDataLimits = function determineDataLimits() {
      const me = this;
      const options = me.options;
      const adapter = me._adapter;
      const unit = options.time.unit || 'day';
      let _me$getUserBounds = me.getUserBounds(),
        min = _me$getUserBounds.min,
        max = _me$getUserBounds.max,
        minDefined = _me$getUserBounds.minDefined,
        maxDefined = _me$getUserBounds.maxDefined;
      function _applyBounds(bounds) {
        if (!minDefined && !isNaN(bounds.min)) {
          min = Math.min(min, bounds.min);
        }
        if (!maxDefined && !isNaN(bounds.max)) {
          max = Math.max(max, bounds.max);
        }
      }
      if (!minDefined || !maxDefined) {
        _applyBounds(me._getLabelBounds());
        if (options.bounds !== 'ticks' || options.ticks.source !== 'labels') {
          _applyBounds(me.getMinMax(false));
        }
      }
      min = isNumberFinite(min) && !isNaN(min) ? min : +adapter.startOf(Date.now(), unit);
      max = isNumberFinite(max) && !isNaN(max) ? max : +adapter.endOf(Date.now(), unit) + 1;
      me.min = Math.min(min, max);
      me.max = Math.max(min + 1, max);
    }
    ;
    _proto._getLabelBounds = function _getLabelBounds() {
      const arr = this.getLabelTimestamps();
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      if (arr.length) {
        min = arr[0];
        max = arr[arr.length - 1];
      }
      return {
        min: min,
        max: max
      };
    }
    ;
    _proto.buildTicks = function buildTicks() {
      const me = this;
      const options = me.options;
      const timeOpts = options.time;
      const tickOpts = options.ticks;
      const timestamps = tickOpts.source === 'labels' ? me.getLabelTimestamps() : me._generate();
      if (options.bounds === 'ticks' && timestamps.length) {
        me.min = me._userMin || timestamps[0];
        me.max = me._userMax || timestamps[timestamps.length - 1];
      }
      const min = me.min;
      const max = me.max;
      const ticks = _filterBetween(timestamps, min, max);
      me._unit = timeOpts.unit || (tickOpts.autoSkip ? determineUnitForAutoTicks(timeOpts.minUnit, me.min, me.max, me._getLabelCapacity(min)) : determineUnitForFormatting(me, ticks.length, timeOpts.minUnit, me.min, me.max));
      me._majorUnit = !tickOpts.major.enabled || me._unit === 'year' ? undefined : determineMajorUnit(me._unit);
      me.initOffsets(timestamps);
      if (options.reverse) {
        ticks.reverse();
      }
      return ticksFromTimestamps(me, ticks, me._majorUnit);
    }
    ;
    _proto.initOffsets = function initOffsets(timestamps) {
      const me = this;
      let start = 0;
      let end = 0;
      let first, last;
      if (me.options.offset && timestamps.length) {
        first = me.getDecimalForValue(timestamps[0]);
        if (timestamps.length === 1) {
          start = 1 - first;
        } else {
          start = (me.getDecimalForValue(timestamps[1]) - first) / 2;
        }
        last = me.getDecimalForValue(timestamps[timestamps.length - 1]);
        if (timestamps.length === 1) {
          end = last;
        } else {
          end = (last - me.getDecimalForValue(timestamps[timestamps.length - 2])) / 2;
        }
      }
      me._offsets = {
        start: start,
        end: end,
        factor: 1 / (start + 1 + end)
      };
    }
    ;
    _proto._generate = function _generate() {
      const me = this;
      const adapter = me._adapter;
      const min = me.min;
      const max = me.max;
      const options = me.options;
      const timeOpts = options.time;
      const minor = timeOpts.unit || determineUnitForAutoTicks(timeOpts.minUnit, min, max, me._getLabelCapacity(min));
      const stepSize = valueOrDefault(timeOpts.stepSize, 1);
      const weekday = minor === 'week' ? timeOpts.isoWeekday : false;
      const hasWeekday = isNumber(weekday) || weekday === true;
      const ticks = {};
      let first = min;
      let time;
      if (hasWeekday) {
        first = +adapter.startOf(first, 'isoWeek', weekday);
      }
      first = +adapter.startOf(first, hasWeekday ? 'day' : minor);
      if (adapter.diff(max, min, minor) > 100000 * stepSize) {
        throw new Error(min + ' and ' + max + ' are too far apart with stepSize of ' + stepSize + ' ' + minor);
      }
      const timestamps = options.ticks.source === 'data' && me.getDataTimestamps();
      for (time = first; time < max; time = +adapter.add(time, stepSize, minor)) {
        addTick(ticks, time, timestamps);
      }
      if (time === max || options.bounds === 'ticks') {
        addTick(ticks, time, timestamps);
      }
      return Object.keys(ticks).sort(function (a, b) {
        return a - b;
      }).map(function (x) {
        return +x;
      });
    }
    ;
    _proto.getLabelForValue = function getLabelForValue(value) {
      const me = this;
      const adapter = me._adapter;
      const timeOpts = me.options.time;
      if (timeOpts.tooltipFormat) {
        return adapter.format(value, timeOpts.tooltipFormat);
      }
      return adapter.format(value, timeOpts.displayFormats.datetime);
    }
    ;
    _proto._tickFormatFunction = function _tickFormatFunction(time, index, ticks, format) {
      const me = this;
      const options = me.options;
      const formats = options.time.displayFormats;
      const unit = me._unit;
      const majorUnit = me._majorUnit;
      const minorFormat = unit && formats[unit];
      const majorFormat = majorUnit && formats[majorUnit];
      const tick = ticks[index];
      const major = majorUnit && majorFormat && tick && tick.major;
      const label = me._adapter.format(time, format || (major ? majorFormat : minorFormat));
      const formatter = options.ticks.callback;
      return formatter ? formatter(label, index, ticks) : label;
    }
    ;
    _proto.generateTickLabels = function generateTickLabels(ticks) {
      let i, ilen, tick;
      for (i = 0, ilen = ticks.length; i < ilen; ++i) {
        tick = ticks[i];
        tick.label = this._tickFormatFunction(tick.value, i, ticks);
      }
    }
    ;
    _proto.getDecimalForValue = function getDecimalForValue(value) {
      const me = this;
      return (value - me.min) / (me.max - me.min);
    }
    ;
    _proto.getPixelForValue = function getPixelForValue(value) {
      const me = this;
      const offsets = me._offsets;
      const pos = me.getDecimalForValue(value);
      return me.getPixelForDecimal((offsets.start + pos) * offsets.factor);
    }
    ;
    _proto.getValueForPixel = function getValueForPixel(pixel) {
      const me = this;
      const offsets = me._offsets;
      const pos = me.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
      return me.min + pos * (me.max - me.min);
    }
    ;
    _proto._getLabelSize = function _getLabelSize(label) {
      const me = this;
      const ticksOpts = me.options.ticks;
      const tickLabelWidth = me.ctx.measureText(label).width;
      const angle = toRadians(me.isHorizontal() ? ticksOpts.maxRotation : ticksOpts.minRotation);
      const cosRotation = Math.cos(angle);
      const sinRotation = Math.sin(angle);
      const tickFontSize = me._resolveTickFontOptions(0).size;
      return {
        w: tickLabelWidth * cosRotation + tickFontSize * sinRotation,
        h: tickLabelWidth * sinRotation + tickFontSize * cosRotation
      };
    }
    ;
    _proto._getLabelCapacity = function _getLabelCapacity(exampleTime) {
      const me = this;
      const timeOpts = me.options.time;
      const displayFormats = timeOpts.displayFormats;
      const format = displayFormats[timeOpts.unit] || displayFormats.millisecond;
      const exampleLabel = me._tickFormatFunction(exampleTime, 0, ticksFromTimestamps(me, [exampleTime], me._majorUnit), format);
      const size = me._getLabelSize(exampleLabel);
      const capacity = Math.floor(me.isHorizontal() ? me.width / size.w : me.height / size.h) - 1;
      return capacity > 0 ? capacity : 1;
    }
    ;
    _proto.getDataTimestamps = function getDataTimestamps() {
      const me = this;
      let timestamps = me._cache.data || [];
      let i, ilen;
      if (timestamps.length) {
        return timestamps;
      }
      const metas = me.getMatchingVisibleMetas();
      if (me._normalized && metas.length) {
        return me._cache.data = metas[0].controller.getAllParsedValues(me);
      }
      for (i = 0, ilen = metas.length; i < ilen; ++i) {
        timestamps = timestamps.concat(metas[i].controller.getAllParsedValues(me));
      }
      return me._cache.data = me.normalize(timestamps);
    }
    ;
    _proto.getLabelTimestamps = function getLabelTimestamps() {
      const me = this;
      const timestamps = me._cache.labels || [];
      let i, ilen;
      if (timestamps.length) {
        return timestamps;
      }
      const labels = me.getLabels();
      for (i = 0, ilen = labels.length; i < ilen; ++i) {
        timestamps.push(_parse(me, labels[i]));
      }
      return me._cache.labels = me._normalized ? timestamps : me.normalize(timestamps);
    }
    ;
    _proto.normalize = function normalize(values) {
      return _arrayUnique(values.sort(sorter));
    };
    return TimeScale;
  }(Scale);
  TimeScale.id = 'time';
  TimeScale.defaults = {
    bounds: 'data',
    adapters: {},
    time: {
      parser: false,
      unit: false,
      round: false,
      isoWeekday: false,
      minUnit: 'millisecond',
      displayFormats: {}
    },
    ticks: {
      source: 'auto',
      major: {
        enabled: false
      }
    }
  };

  function interpolate(table, val, reverse) {
    let prevSource, nextSource, prevTarget, nextTarget;
    if (reverse) {
      prevSource = Math.floor(val);
      nextSource = Math.ceil(val);
      prevTarget = table[prevSource];
      nextTarget = table[nextSource];
    } else {
      const result = _lookup(table, val);
      prevTarget = result.lo;
      nextTarget = result.hi;
      prevSource = table[prevTarget];
      nextSource = table[nextTarget];
    }
    const span = nextSource - prevSource;
    return span ? prevTarget + (nextTarget - prevTarget) * (val - prevSource) / span : prevTarget;
  }
  const TimeSeriesScale = function (_TimeScale) {
    _inheritsLoose(TimeSeriesScale, _TimeScale);
    function TimeSeriesScale(props) {
      let _this;
      _this = _TimeScale.call(this, props) || this;
      _this._table = [];
      _this._maxIndex = undefined;
      return _this;
    }
    const _proto = TimeSeriesScale.prototype;
    _proto.initOffsets = function initOffsets() {
      const me = this;
      const timestamps = me._getTimestampsForTable();
      me._table = me.buildLookupTable(timestamps);
      me._maxIndex = me._table.length - 1;
      _TimeScale.prototype.initOffsets.call(this, timestamps);
    }
    ;
    _proto.buildLookupTable = function buildLookupTable(timestamps) {
      const me = this;
      const min = me.min,
        max = me.max;
      if (!timestamps.length) {
        return [{
          time: min,
          pos: 0
        }, {
          time: max,
          pos: 1
        }];
      }
      const items = [min];
      let i, ilen, curr;
      for (i = 0, ilen = timestamps.length; i < ilen; ++i) {
        curr = timestamps[i];
        if (curr > min && curr < max) {
          items.push(curr);
        }
      }
      items.push(max);
      return items;
    }
    ;
    _proto._getTimestampsForTable = function _getTimestampsForTable() {
      const me = this;
      let timestamps = me._cache.all || [];
      if (timestamps.length) {
        return timestamps;
      }
      const data = me.getDataTimestamps();
      const label = me.getLabelTimestamps();
      if (data.length && label.length) {
        timestamps = me.normalize(data.concat(label));
      } else {
        timestamps = data.length ? data : label;
      }
      timestamps = me._cache.all = timestamps;
      return timestamps;
    }
    ;
    _proto.getPixelForValue = function getPixelForValue(value, index) {
      const me = this;
      const offsets = me._offsets;
      const pos = me._normalized && me._maxIndex > 0 && !isNullOrUndef(index) ? index / me._maxIndex : me.getDecimalForValue(value);
      return me.getPixelForDecimal((offsets.start + pos) * offsets.factor);
    }
    ;
    _proto.getDecimalForValue = function getDecimalForValue(value) {
      return interpolate(this._table, value) / this._maxIndex;
    }
    ;
    _proto.getValueForPixel = function getValueForPixel(pixel) {
      const me = this;
      const offsets = me._offsets;
      const decimal = me.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
      return interpolate(me._table, decimal * this._maxIndex, true);
    };
    return TimeSeriesScale;
  }(TimeScale);
  TimeSeriesScale.id = 'timeseries';
  TimeSeriesScale.defaults = TimeScale.defaults;

  const scales = /*#__PURE__*/Object.freeze({
    __proto__: null,
    CategoryScale: CategoryScale,
    LinearScale: LinearScale,
    LogarithmicScale: LogarithmicScale,
    RadialLinearScale: RadialLinearScale,
    TimeScale: TimeScale,
    TimeSeriesScale: TimeSeriesScale
  });

  Chart.register(controllers, scales, elements, plugins);
  Chart.helpers = _extends({}, helpers);
  Chart._adapters = _adapters;
  Chart.Animation = Animation;
  Chart.Animations = Animations;
  Chart.animator = animator;
  Chart.controllers = registry.controllers.items;
  Chart.DatasetController = DatasetController;
  Chart.Element = Element$1;
  Chart.elements = elements;
  Chart.Interaction = Interaction;
  Chart.layouts = layouts;
  Chart.platforms = platforms;
  Chart.Scale = Scale;
  Chart.Ticks = Ticks;
  _extends(Chart, controllers, scales, elements, plugins, platforms);
  Chart.Chart = Chart;
  if (typeof window !== 'undefined') {
    window.Chart = Chart;
  }

  return Chart;

})();

export { Chart };
