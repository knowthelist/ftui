class Ftui {
  constructor() {
    this.version = '3.3.0';
    this.config = {
      enableDebug: false,
      dir: '',
      filename: '',
      basedir: '',
      fhemDir: '',
      debuglevel: 0,
      enableInstantUpdates: true,
      lang: 'de',
      toastPosition: 'bottomLeft',
      refreshInterval: 0,
      refresh: {},
      update: {},
      styleList: [
        'lib/vanilla-notify/vanilla-notify.css',
        'font/ftui/ftui-icons.css',
        'font/materialdesignicons/materialdesignicons.min.css',
        'font/fontawesome/all.min.css',
        'font/ftui/ftui-icons.css'
      ],
      libList: [
        'lib/vanilla-notify/vanilla-notify.min.js'
      ]
    };
    this.states = {
      width: 0,
      lastSetOnline: 0,
      lastRefresh: 0,
      fhemConnectionIsRestarting: false,
      isOffline: false,
      refresh: {
        lastTimestamp: new Date(),
        timer: null,
        request: null,
        result: null,
        lastErrorToast: null
      },
      update: {
        lastUpdateTimestamp: new Date(),
        lastEventTimestamp: new Date(),
        timer: null,
        result: null,
        lastErrorToast: null
      }
    };

    this.readings = new Map();
    this.scripts = [];

    // start FTUI
    this.init();
  }

  init() {
    this.config.meta = document.getElementsByTagName('META');
    this.config.enableInstantUpdates = (this.getMetaString('enable_instant_updates', '1') !== '0');
    this.config.refreshFilter = this.getMetaString('refresh_filter');
    this.config.updateFilter = this.getMetaString('update_filter');

    this.config.debuglevel = this.getMetaNumber('debug');
    this.config.updateCheckInterval = this.getMetaNumber('update_check_interval', 5);
    this.config.enableDebug = (this.config.debuglevel > 0);
    this.config.enableToast = this.getMetaNumber('toast', 5); // 1,2,3...= n Toast-Messages, 0: No Toast-Messages
    this.config.toastPosition = this.getMetaString('toast_position', 'bottomLeft');
    this.config.refreshInterval = this.getMetaNumber('refresh_only_interval', 30);
    this.config.refreshDelay = this.getMetaString('refresh_restart_delay', 3);
    // self path
    const url = window.location.pathname;
    this.config.filename = url.substring(url.lastIndexOf('/') + 1);
    this.log(1, 'Filename: ' + this.config.filename);
    const fhemUrl = this.getMetaString('fhemweb_url');
    this.config.fhemDir = fhemUrl || window.location.origin + '/fhem/';
    if (fhemUrl && new RegExp('^((?!http://|https://).)*$').test(fhemUrl)) {
      this.config.fhemDir = window.location.origin + '/' + fhemUrl + '/';
    }
    this.config.fhemDir = this.config.fhemDir.replace('///', '//');
    this.log(1, 'FHEM dir: ' + this.config.fhemDir);
    // lang
    const userLang = navigator.language || navigator.userLanguage;
    this.config.lang = this.getMetaString('lang', ((this.isDefined(userLang)) ? userLang.split('-')[0] : 'de'));
    // credentials
    this.config.username = this.getMetaString('username');
    this.config.password = this.getMetaString('password');

    const initDeferreds = [this.getCSrf()];

    this.loadStyles();
    this.loadLibs();

    try {
      // try to use localStorage
      localStorage.setItem('ftui_version', this.version);
      localStorage.removeItem('ftui_version');
    } catch (e) {
      // there was an error so...
      this.toast('You are in Privacy Mode<br>Please deactivate Privacy Mode and then reload the page.', 'error');
    }

    // detect clickEventType
    const android = this.getAndroidVersion();
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const hasTouch = ((android && parseFloat(android) < 5) || iOS);
    this.config.clickEventType = (hasTouch) ? 'touchstart' : 'mousedown';
    this.config.moveEventType = ((hasTouch) ? 'touchmove' : 'mousemove');
    this.config.releaseEventType = ((hasTouch) ? 'touchend' : 'mouseup');
    this.config.leaveEventType = ((hasTouch) ? 'touchleave' : 'mouseout');
    this.config.enterEventType = ((hasTouch) ? 'touchenter' : 'mouseenter');

    // add background for modal dialogs
    const shade = `<div id="shade" class="hide"/>`;
    document.body.insertAdjacentHTML('beforeend', shade);
    document.getElementById('shade').addEventListener(this.config.clickEventType, () => {
      this.triggerEvent('shadeClicked');
    });

    // init Page after CSFS Token has been retrieved
    Promise.all(initDeferreds).then(() => {
      this.initPage('html');
    }).catch(error => {
      this.log(1, 'initDeferreds -' + error, 'error');
    });

    document.addEventListener('initWidgetsDone', () => {
      // restart  connection
      if (this.config.enableInstantUpdates) {
        this.states.fhemConnectionIsRestarting = true;
        this.restartFhemConnection();
      }

      // start Refresh delayed
      this.startRefreshInterval(500);

      // trigger refreshs
      this.triggerEvent('changedSelection');
    });

    // call health check periodically
    setInterval(() => {
      ftui.scheduleHealthCheck();
    }, this.config.updateCheckInterval * 60 * 1000);
  }

  initPage(area = 'html') {
    window.performance.mark('start initPage-' + area);

    this.states.startTime = new Date();
    this.log(2, 'initPage - area=' + area);

    this.log(1, 'init templates - Done');
    this.initWidgets(area).then(() => {
      window.performance.mark('end initPage-' + area);
      window.performance.measure('initPage-' + area, 'start initPage-' + area, 'end initPage-' + area);
      const dur = 'initPage (' + area + '): in ' + (new Date() - this.states.startTime) + 'ms';
      if (this.config.debuglevel > 1) this.toast(dur);
      this.log(1, dur);
    }).catch(error => {
      this.log(1, 'initWidgets -' + error, 'error');
    });
  }

  initWidgets(area) {
    const initDefer = this.deferred();
    const widgetTypes = [];
    // Fetch all the children of <ftui-*> that are not defined yet.
    const undefinedWidgets = this.selectElements(':not(:defined)', area);

    undefinedWidgets.forEach(elem => {
      if (!widgetTypes.includes(elem.localName)) {
        widgetTypes.push(elem.localName);
      }
    });

    const regexp = new RegExp('^ftui-[a-z]+$', 'i');
    widgetTypes.filter(type => {
      const match = regexp.test(type);
      return match;
    }).forEach(type => {
      this.dynamicload(this.config.basedir + 'widget/' + type.replace('-', '.') + '.js', true, 'module')
    });

    const promises = [...undefinedWidgets].map(widget => {
      return customElements.whenDefined(widget.localName);
    });

    // get current values of readings not before all widgets are loaded
    Promise.all(promises).then(() => {
      this.createFilterParameter();
      this.log(1, 'initWidgets - Done');
      const event = new CustomEvent('initWidgetsDone', { area: area });
      document.dispatchEvent(event);

      initDefer.resolve();
    })
      .catch(error => {
        this.log(1, 'initWidgets -' + error, 'error');
      });
    return initDefer.promise();
  }

  loadLibs() {
    this.config.libList.forEach((lib) => this.dynamicload(this.config.basedir + lib), false);
  }

  loadStyles() {
    this.config.styleList.forEach((link) => this.appendStyleLink(this.config.basedir + link));
  }

  parseReadingId(readingID) {
    const [, device, reading] = /^([^-:]+)[-:](.*)$/.exec(readingID) || ['', readingID, ''];
    const paramid = (reading) ? [device, reading].join('-') : device;
    return [paramid, device, reading];
  }

  getReadingEvents(readingName) {
    if (this.isDefined(readingName)) {
      const [readingId, device, reading] = this.parseReadingId(readingName);
      if (!this.readings.has(readingId)) {
        this.readings.set(readingId, { data: {}, events: new Events(), device: device, reading: reading });
      }
      return this.readings.get(readingId).events;
    } else {
      // empty dummy object
      return { subscribe: () => { } }
    }
  }

  getReadingData(readingID) {
    const id = readingID.replace(':', '-');
    if (this.readings.has(id)) {
      return this.readings.get(id).data;
    } else {
      return null;
    }
  }

  updateReadingData(readingID, readingData, doPublish) {
    this.log(3, ['updateReadingData - update for ', readingID].join(''));
    const reading = this.readings.get(readingID);
    reading.data = readingData;
    if (doPublish) {
      reading.events.publish(readingData);
    }
  }

  createFilterParameter() {
    const readingsArray = Array.from(this.readings.values());
    const devs = [... new Set(readingsArray.map(value => value.device))];
    const reads = [... new Set(readingsArray.map(value => value.reading || 'STATE'))];
    const devicelist = devs.length ? devs.join() : '';
    const readinglist = reads.length ? reads.join(' ') : '';

    this.config.update.filter = this.config.updateFilter ? this.config.updateFilter : devicelist + ', ' + readinglist;
    this.config.refresh.filter = this.config.refreshFilter ? this.config.refreshFilter : devicelist + ' ' + readinglist;

    // force Refresh
    this.states.lastRefresh = 0;
  }

  isFhemWebInternal(deviceName) {
    return deviceName.includes('FHEMWEB') && deviceName.match(/WEB_\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}_\d{5}/);
  }

  forceRefresh() {
    this.states.lastRefresh = 0;
    this.refresh();
  }

  startRefreshInterval(delay) {
    this.log(1, 'refresh: start in (ms):' + (delay || this.config.refreshInterval * 1000));
    clearInterval(this.states.refresh.timer);
    this.states.refresh.timer = setTimeout(() => {
      // get current values of readings every x seconds
      this.refresh();
      this.startRefreshInterval();
    }, (delay || this.config.refreshInterval * 1000));
  }

  refresh(silent) {
    const ltime = Date.now() / 1000;
    if (this.config.refresh.filter.length < 2 ||
      (ltime - this.states.lastRefresh) < this.config.refreshInterval) { return; }
    this.log(1, 'start refresh');
    window.performance.mark('start refresh');
    this.states.lastRefresh = ltime;

    // invalidate all readings for detection of outdated ones
    this.readings.forEach((reading) => reading.data.valid = false);

    window.performance.mark('start get jsonlist2');
    this.states.refresh.request =
      this.sendToFhem('jsonlist2 ' + this.config.refresh.filter)
        .then(res => res.json())
        .then(fhemJSON => this.parseRefreshResult(fhemJSON, silent)
        );
  }

  parseRefreshResult(fhemJSON, silent) {
    window.performance.mark('end get jsonlist2');
    window.performance.measure('get jsonlist2', 'start get jsonlist2', 'end get jsonlist2');
    window.performance.mark('start read jsonlist2');

    // import the whole fhemJSON
    if (fhemJSON && fhemJSON.Results) {
      fhemJSON.Results.forEach(device => {
        if (!this.isFhemWebInternal(device.Name)) {
          this.parseRefreshResultSection(device.Name, device.Internals);
          this.parseRefreshResultSection(device.Name, device.Attributes);
          this.parseRefreshResultSection(device.Name, device.Readings);
        }
      });

      // finished
      window.performance.mark('end refresh');
      window.performance.measure('refresh', 'start refresh', 'end refresh');
      const duration = window.performance.getEntriesByName('refresh', 'measure')[0].duration;
      if (this.config.debuglevel > 1) {
        const paramCount = fhemJSON.Results.length;
        this.toast('Full refresh done in ' +
          duration.toFixed(0) + 'ms for ' +
          paramCount + ' parameter(s)');
      }
      this.log(1, 'refresh: Done');
      if (this.states.refresh.lastErrorToast) {
        this.states.refresh.lastErrorToast.reset();
      }
      this.states.refresh.duration = duration * 1000;
      this.states.refresh.lastTimestamp = new Date();
      this.states.refresh.result = 'ok';

      if (!silent) {
        this.onUpdateDone();
      }
    } else {
      const err = 'request failed: Result is null';
      this.log(1, 'refresh: ' + err);
      this.states.refresh.result = err;
      this.toast('<u>Refresh ' + err + ' </u><br>', 'error');

    }
    window.performance.mark('end read jsonlist2');
    window.performance.measure('read jsonlist2', 'start read jsonlist2', 'end read jsonlist2');
    if (this.config.debuglevel > 1) {
      let performance = '';
      window.performance.getEntriesByType('measure').forEach(entry => {
        performance += [entry.name, ':', entry.duration.toFixed(0), 'ms', '<br>'].join(' ');
      })
      window.performance.clearMeasures();
      window.performance.clearMarks();
      this.toast(performance);
    }
  }

  parseRefreshResultSection(device, section) {
    for (const reading in section) {
      const parameterId = (reading === 'STATE') ? device : [device, reading].join('-');
      let parameter = section[reading];
      if (typeof parameter !== 'object') {
        parameter = {
          'Value': parameter,
          'Time': ''
        };
      }

      // is there a subscription, then check and update widgets
      if (this.readings.has(parameterId)) {
        const parameterData = this.getReadingData(parameterId);
        const doPublish = (parameterData.value !== parameter.Value || parameterData.time !== parameter.Time);

        this.log(5, ['handleUpdate()', ' paramerId=', parameterId, ' value=', parameter.Value,
          ' time=', parameter.Time, ' isUpdate=', doPublish].join(''));

        // write into internal cache object
        parameterData.valid = true;
        parameterData.value = parameter.Value;
        parameterData.time = parameter.Time;
        parameterData.update = new Date().format('YYYY-MM-DD hh:mm:ss');

        // update widgets only if necessary
        this.updateReadingData(parameterId, parameterData, doPublish);
      }
    }
  }

  startFhemConnection() {
    if (this.states.update.websocket) {
      this.log(3, 'valid this.states.update.websocket found');
      return;
    }
    if (this.states.update.lastErrorToast) {
      this.states.update.lastErrorToast.reset();
    }
    if (this.config.debuglevel > 1) {
      this.toast('FHEM connection started');
    }
    this.states.update.URL = this.config.fhemDir.replace(/^http/i, 'ws') + '?XHR=1&inform=type=status;filter=' +
      this.config.update.filter + ';since=' + this.states.update.lastEventTimestamp.getTime() + ';fmt=JSON' +
      '&timestamp=' + Date.now();

    this.log(1, 'websockets URL=' + this.states.update.URL);
    this.states.fhemConnectionIsRestarting = false;
    this.states.update.lastEventTimestamp = new Date();
    this.config.refreshInterval = this.getMetaNumber('refresh_interval', 15 * 60); // 15 minutes

    this.states.update.websocket = new WebSocket(this.states.update.URL);
    this.states.update.websocket.onclose = (event) => {
      let reason;
      if (event.code == 1006) {
        reason = 'The connection was closed abnormally, e.g., without sending or receiving a Close control frame';
      } else { reason = 'Unknown reason'; }
      this.log(1, 'websocket (url=' + event.target.url + ') closed!  reason=' + reason);
      // if current socket closes then restart websocket
      if (event.target.url === this.states.update.URL) {
        this.restartFhemConnection(reason);
      }
    };
    this.states.update.websocket.onerror = (event) => {
      this.log(1, 'Error with fhem connection');
      if (this.config.debuglevel > 1 && event.target.url === this.states.update.URL) {
        this.states.update.lastErrorToast = this.toast('Error with fhem connection', 'error');
      }

    };
    this.states.update.websocket.onmessage = (msg) => {
      this.handleFhemEvent(msg.data);
    };
  }

  stopFhemConnection() {
    this.log(2, 'stopFhemConnection');
    clearInterval(this.states.update.timer);
    if (this.states.update.websocket) {
      if (ftui.states.update.websocket.readyState === WebSocket.OPEN) {
        this.states.update.websocket.close();
      }
      this.states.update.websocket = null;
      this.log(2, 'stopped websocket');
    }
  }

  restartFhemConnection(msg, error) {
    this.log(2, 'restartFhemConnection');
    let delay;
    clearTimeout(this.states.update.timer);
    if (msg) {
      this.toast('Disconnected from FHEM<br>' + msg, error);
    }

    this.stopFhemConnection();

    if (this.states.fhemConnectionIsRestarting) {
      delay = 0;
    } else {
      this.toast('Retry to connect in 10 seconds');
      delay = 10000;
    }

    this.states.update.timer = setTimeout(() => {
      this.startFhemConnection();
    }, delay);
  }

  handleFhemEvent(data) {
    data.split(/\n/).forEach(line => {
      if (this.isDefined(line) && line !== '' && line.endsWith(']') && !this.isFhemWebInternal(line)) {
        const [id, value, html] = JSON.parse(line);
        const isTimestamp = id.match(/-ts$/);
        const parameterId = isTimestamp ? id.replace(/-ts$/, '') : id;

        if (this.readings.has(parameterId)) {
          const parameterData = this.readings.get(parameterId).data;
          const isSTATE = (value !== html);
          const isTrigger = (value === '' && html === '');
          const doPublish = (isTimestamp || isSTATE || isTrigger);

          parameterData.update = new Date().format('YYYY-MM-DD hh:mm:ss');
          parameterData.valid = true;
          if (isTimestamp) {
            parameterData.time = value;
          } else if (isSTATE) {
            parameterData.time = parameterData.update;
            parameterData.value = value;
          } else if (!isTimestamp) {
            parameterData.value = value;
          }
          this.updateReadingData(parameterId, parameterData, doPublish);
        }
      }
    });
    this.states.update.lastEventTimestamp = new Date();
  }

  sendFhemCommand(cmdline) {
    if (!this.states.isOffline) {
      this.sendToFhem(cmdline)
        .then(this.handleFetchErrors)
        .then(response => this.log(3, response))
        .catch(error => this.toast('<u>FHEM Command failed</u><br>' + error + '<br>cmd=' + cmdline, 'error'));
      return true;
    } else {
      this.toast('<u>App is offline</u><br>sendToFhem failed', 'error');
      return false;
    }
  }

  sendToFhem(cmdline = '') {
    const url = new URL(this.config.fhemDir);
    const params = {
      cmd: cmdline,
      fwcsrf: this.config.csrf,
      XHR: '1'
    };
    url.search = new URLSearchParams(params)
    const dataType = (cmdline.substr(0, 8) === 'jsonlist') ? 'application/json' : 'text/plain"';
    this.log(1, 'send to FHEM: ' + cmdline);
    return fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': dataType
      },
      username: this.config.username,
      password: this.config.password
    });
  }

  onUpdateDone() {
    this.triggerEvent('updateDone');
    this.checkInvalidElements();
  }

  checkInvalidElements() {
    this.selectAll('[hide-invalid][state-reading]').forEach(elem => {
      const reading = this.getReadingData(elem.stateReading);
      if (reading && reading.valid === true) {
        elem.classList.remove('is-invalid');
      } else {
        elem.classList.add('is-invalid');
      }
    });
    this.selectAll('[hide-invalid][text-reading]').forEach(elem => {
      const reading = this.getReadingData(elem.textReading);
      if (reading && reading.valid === true) {
        elem.classList.remove('is-invalid');
      } else {
        elem.classList.add('is-invalid');
      }
    });
  }

  updateOnlineStatus() {
    ftui.log(5, 'online offline');
    if (navigator.onLine) { this.setOnline(); } else { this.setOffline(); }
  }

  setOnline() {
    const ltime = Date.now() / 1000;
    if ((ltime - this.states.lastSetOnline) > 60) {
      if (this.config.enableDebug) this.toast('FHEM connected');
      this.states.lastSetOnline = ltime;
      this.states.isOffline = false;
      // force refresh
      this.states.lastRefresh = 0;
      this.startRefreshInterval(1000);
      if (this.config.enableInstantUpdates) {
        this.restartFhemConnection();
      }
      this.log(1, 'FTUI is online');
    }
  }

  setOffline() {
    if (this.config.enableDebug) this.toast('Lost connection to FHEM');
    clearInterval(this.states.refresh.timer);
    this.states.isOffline = true;
    this.stopFhemConnection();
    this.log(1, 'FTUI is offline');
  }

  dynamicload(url, async = true, type = 'text/javascript') {
    this.log(3, 'dynamic load file:' + url + ' / async:' + async + ' / type:' + type);

    let deferred = this.deferred();
    let isAdded = false;

    // check if it is already included
    let i = this.scripts.length;
    while (i--) {
      if (this.scripts[i].url === url) {
        isAdded = true;
        break;
      }
    }
    if (!isAdded) {
      // not yet -> load
      if (url.match(new RegExp('^.*.(js)$'))) {
        const script = document.createElement('script');
        script.type = type;
        script.async = !!(async);
        script.src = url;
        script.onload = () => {
          this.log(3, 'dynamidynamic load done:' + url);
          deferred.resolve();
        };
        document.getElementsByTagName('head')[0].appendChild(script);
      } else {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        link.media = 'all';
        deferred.resolve();
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      const scriptObject = {};
      scriptObject.deferred = deferred;
      scriptObject.url = url;
      this.scripts.push(scriptObject);
    } else {
      // already loaded
      this.log(3, 'dynamic load not neccesary for:' + url);
      deferred = this.scripts[i].deferred;
    }

    return deferred.promise();
  }

  getCSrf() {
    return fetch(this.config.fhemDir + '?XHR=1', {
      cache: 'no-cache'
    })
      .then(response => {
        this.config.csrf = response.headers.get('X-FHEM-csrfToken');
        this.log(1, 'Got csrf from FHEM:' + this.config.csrf);
      });
  }

  scheduleHealthCheck() {
    // request dummy fhem event
    if (ftui.states.update.websocket.readyState === WebSocket.OPEN) {
      this.states.update.websocket.send('uptime');
    }
    // check in 3 seconds
    setTimeout(() => {
      ftui.healthCheck();
    }, 3000);
  }

  healthCheck() {
    const timeDiff = new Date() - this.states.update.lastEventTimestamp;
    if (timeDiff / 1000 > 60 && this.config.enableInstantUpdates) {
      this.log(1, 'No update event since ' + timeDiff / 1000 + 'secondes -> restart connection');
      this.setOnline();
    }
  }

  // helper functions

  delay(callback, delay = 0) {
    let handle;
    return (...args) => {
      clearTimeout(handle);
      handle = setTimeout(callback.bind(this), delay, ...args);
    }
  }

  rgbToHsl(rgb) {
    let r = parseInt(rgb.substring(0, 2), 16);
    let g = parseInt(rgb.substring(2, 4), 16);
    let b = parseInt(rgb.substring(4, 6), 16);
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);

    const min = Math.min(r, g, b);
    let h; let s; const l = (max + min) / 2;

    if (max == min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return [h, s, l];
  }

  hslToRgb(h, s, l) {
    let r, g, b;
    const hex = function (x) {
      return ('0' + parseInt(x).toString(16)).slice(-2);
    };

    let hue2rgb;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      hue2rgb = function (p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [hex(Math.round(r * 255)), hex(Math.round(g * 255)), hex(Math.round(b * 255))].join('');
  }

  rgbToHex(rgb) {
    const tokens = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (tokens && tokens.length === 4) ? '#' +
      ('0' + parseInt(tokens[1], 10).toString(16)).slice(-2) +
      ('0' + parseInt(tokens[2], 10).toString(16)).slice(-2) +
      ('0' + parseInt(tokens[3], 10).toString(16)).slice(-2) : rgb;
  }

  getGradientColor(start_color, end_color, percent) {
    // strip the leading # if it's there
    start_color = this.rgbToHex(start_color).replace(/^\s*#|\s*$/g, '');
    end_color = this.rgbToHex(end_color).replace(/^\s*#|\s*$/g, '');

    // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
    if (start_color.length == 3) {
      start_color = start_color.replace(/(.)/g, '$1$1');
    }

    if (end_color.length == 3) {
      end_color = end_color.replace(/(.)/g, '$1$1');
    }

    // get colors
    const start_red = parseInt(start_color.substr(0, 2), 16);

    const start_green = parseInt(start_color.substr(2, 2), 16);

    const start_blue = parseInt(start_color.substr(4, 2), 16);

    const end_red = parseInt(end_color.substr(0, 2), 16);

    const end_green = parseInt(end_color.substr(2, 2), 16);

    const end_blue = parseInt(end_color.substr(4, 2), 16);

    // calculate new color
    let diff_red = end_red - start_red;
    let diff_green = end_green - start_green;
    let diff_blue = end_blue - start_blue;

    diff_red = ((diff_red * percent) + start_red).toString(16).split('.')[0];
    diff_green = ((diff_green * percent) + start_green).toString(16).split('.')[0];
    diff_blue = ((diff_blue * percent) + start_blue).toString(16).split('.')[0];

    // ensure 2 digits by color
    if (diff_red.length == 1) { diff_red = '0' + diff_red; }

    if (diff_green.length == 1) { diff_green = '0' + diff_green; }

    if (diff_blue.length == 1) { diff_blue = '0' + diff_blue; }

    return '#' + diff_red + diff_green + diff_blue;
  }

  getPart(value, part) {
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

  showModal(modal) {
    const shade = document.getElementById('shade');
    if (modal) {
      shade.classList.remove('hidden');
    } else {
      shade.classList.add('hidden');
    }
  }

  precision(a) {
    const s = a + '';

    const d = s.indexOf('.') + 1;
    return !d ? 0 : s.length - d;
  }

  isDefined(v) {
    return (typeof v !== 'undefined');
  }

  // global date format functions
  dateFromString(str) {
    const m = str.match(/(\d+)-(\d+)-(\d+)[_\s](\d+):(\d+):(\d+).*/);
    const m2 = str.match(/^(\d+)$/);
    const m3 = str.match(/(\d\d).(\d\d).(\d\d\d\d)/);

    const offset = new Date().getTimezoneOffset();
    return (m) ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])
      : (m2) ? new Date(70, 0, 1, 0, 0, m2[1], 0)
        : (m3) ? new Date(+m3[3], +m3[2] - 1, +m3[1], 0, -offset, 0, 0) : new Date();
  }

  dateFormat(date, format) {
    const YYYY = date.getFullYear().toString();
    const YY = date.getYear().toString();
    const MM = (date.getMonth() + 1).toString(); // getMonth() is zero-based
    const dd = date.getDate().toString();
    const hh = date.getHours().toString();
    const mm = date.getMinutes().toString();
    const ss = date.getSeconds().toString();
    const eeee = date.eeee();
    const eee = date.eee();
    const ee = date.ee();
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

  diffMinutes(date1, date2) {
    const diff = new Date(date2 - date1);
    return (diff / 1000 / 60).toFixed(0);
  }

  diffSeconds(date1, date2) {
    const diff = new Date(date2 - date1);
    return (diff / 1000).toFixed(1);
  }

  durationFromSeconds(time) {
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

  round(number, precision) {
    const shift = (number, precision, reverseShift) => {
      if (reverseShift) {
        precision = -precision;
      }
      const numArray = ('' + number).split('e');
      return +(numArray[0] + 'e' + (numArray[1] ? (+numArray[1] + precision) : precision));
    };
    return shift(Math.round(shift(number, precision, false)), precision, true);
  }

  getAndroidVersion(ua) {
    ua = (ua || navigator.userAgent).toLowerCase();
    const match = ua.match(/android\s([0-9.]*)/);
    return match ? match[1] : false;
  }

  toast(text, error) {
    // https://github.com/MLaritz/Vanilla-Notify

    if (this.config.enableToast !== 0 && window.vNotify) {
      if (error && error === 'error') {
        return vNotify.error({
          text: text,
          visibleDuration: 20000, // in milli seconds
          position: this.config.toastPosition
        });
      } else if (error && error === 'info') {
        return vNotify.info({
          text: text,
          visibleDuration: 5000, // in milli seconds
          position: this.config.toastPosition
        });
      }
      else {
        return vNotify.notify({
          text: text,
          position: this.config.toastPosition
        });
      }
    }
  }

  log(level, text, error) {
    if (this.config.debuglevel >= level) {
      if (error) {
        // eslint-disable-next-line no-console
        console.error(text);
      } else {
        // eslint-disable-next-line no-console
        console.log(text);
      }
    }
  }

  deferred() {
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

  getMetaNumber(key, defaultVal) {
    return Number.parseInt(this.getMetaString(key, defaultVal));
  }

  getMetaString(name, defaultVal) {
    if (this.config.meta[name]) {
      return this.config.meta[name].content;
    }
    return defaultVal;
  }

  appendStyleLink(file) {
    const newLink = document.createElement('link');
    newLink.href = file;
    newLink.setAttribute('rel', 'stylesheet');
    newLink.setAttribute('type', 'text/css');
    document.head.appendChild(newLink);
  }

  triggerEvent(eventName) {
    const event = new CustomEvent(eventName);
    document.dispatchEvent(event);
  }

  handleFetchErrors(response) {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response;
  }

  parseArray(value) {
    if (typeof value === 'string') {
      value = this.parseJSON(!value.match(/^[[]/) ? '[' + value + ']' : value);
    }
    return value;
  }

  parseObject(value) {
    if (typeof value === 'string') {
      value = this.parseJSON(!value.match(/^{/) ? '{' + value + '}' : value);
    }
    return value;
  }

  parseJSON(json) {
    let parsed;
    if (json) {
      try {
        parsed = JSON.parse(json);
      } catch (e) {
        this.log(1, 'Error while parseJSON: error=' + e + ' json=' + json, 'error');
      }
    }
    return parsed;
  }

  isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  matchingValue(mapAttribute, searchKey) {
    if (ftui.isDefined(mapAttribute)) {
      const map = this.parseObject(mapAttribute);
      const filteredKeys = Object.keys(map)
        .filter(key => {
          return (
            searchKey === key ||
            parseFloat(searchKey) >= parseFloat(key) ||
            searchKey.match('^' + key + '$')
          );
        })
        .map(key => key)
        .sort((a, b) => {
          if (isNaN(a) && isNaN(b)) return a < b ? -1 : a == b ? 0 : 1;
          else if (isNaN(a)) return 1;
          else if (isNaN(b)) return -1;
          else return a - b;
        });
      // take last item of matching keys 
      return map[filteredKeys.slice(-1)[0]];
    } else {
      return null;
    }
  }

  // DOM functions

  selectElements(selector, context) {
    return (document).querySelector(context).querySelectorAll(selector);
  }

  selectAll(selector) {
    return document.querySelectorAll(selector);
  }

  selectOne(selector) {
    return document.querySelector(selector);
  }

  getAllTagMatches(regEx) {
    return Array.prototype.slice.call(document.querySelectorAll('*')).filter((el) => {
      return el.tagName.match(regEx);
    });
  }
}


// global helper functions

String.prototype.toDate = function () {
  return ftui.dateFromString(this);
};

String.prototype.parseJson = function () {
  return ftui.parseJSON(this);
};

String.prototype.toMinFromMs = function () {
  let x = Number(this) / 1000;
  const ss = (Math.floor(x % 60)).toString();
  const mm = (Math.floor(x /= 60)).toString();
  return mm + ':' + (ss[1] ? ss : '0' + ss[0]);
};

String.prototype.toMinFromSec = function () {
  let x = Number(this);
  const ss = (Math.floor(x % 60)).toString();
  const mm = (Math.floor(x /= 60)).toString();
  return mm + ':' + (ss[1] ? ss : '0' + ss[0]);
};

String.prototype.toHoursFromMin = function () {
  const x = Number(this);
  const hh = (Math.floor(x / 60)).toString();
  const mm = (x - (hh * 60)).toString();
  return hh + ':' + (mm[1] ? mm : '0' + mm[0]);
};

String.prototype.toHoursFromSec = function () {
  const x = Number(this);
  const hh = (Math.floor(x / 3600)).toString();
  const ss = (Math.floor(x % 60)).toString();
  const mm = (Math.floor(x / 60) - (hh * 60)).toString();
  return hh + ':' + (mm[1] ? mm : '0' + mm[0]) + ':' + (ss[1] ? ss : '0' + ss[0]);
};

String.prototype.addFactor = function (factor) {
  const x = Number(this);
  return x * factor;
};

Date.prototype.addMinutes = function (minutes) {
  return new Date(this.getTime() + minutes * 60000);
};

Date.prototype.ago = function (format) {
  const now = new Date();
  const ms = (now - this);
  let x = ms / 1000;
  const seconds = Math.floor(x % 60);
  x /= 60;
  const minutes = Math.floor(x % 60);
  x /= 60;
  const hours = Math.floor(x % 24);
  x /= 24;
  const days = Math.floor(x);
  const strUnits = (ftui.config.lang === 'de') ? ['Tag(e)', 'Stunde(n)', 'Minute(n)', 'Sekunde(n)'] : ['day(s)', 'hour(s)', 'minute(s)',
    'second(s)'];
  let ret;
  if (ftui.isDefined(format)) {
    ret = format.replace('dd', days);
    ret = ret.replace('hh', (hours > 9) ? hours : '0' + hours);
    ret = ret.replace('mm', (minutes > 9) ? minutes : '0' + minutes);
    ret = ret.replace('ss', (seconds > 9) ? seconds : '0' + seconds);
    ret = ret.replace('h', hours);
    ret = ret.replace('m', minutes);
    ret = ret.replace('s', seconds);
  } else {
    ret = (days > 0) ? days + ' ' + strUnits[0] + ' ' : '';
    ret += (hours > 0) ? hours + ' ' + strUnits[1] + ' ' : '';
    ret += (minutes > 0) ? minutes + ' ' + strUnits[2] + ' ' : '';
    ret += seconds + ' ' + strUnits[3];
  }
  return ret;
};

Date.prototype.format = function (format) {
  const YYYY = this.getFullYear().toString();
  const YY = this.getYear().toString();
  const MM = (this.getMonth() + 1).toString(); // getMonth() is zero-based
  const dd = this.getDate().toString();
  const hh = this.getHours().toString();
  const mm = this.getMinutes().toString();
  const ss = this.getSeconds().toString();
  const eeee = this.eeee();
  const eee = this.eee();
  const ee = this.ee();
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
};

Date.prototype.yyyymmdd = function () {
  const yyyy = this.getFullYear().toString();
  const mm = (this.getMonth() + 1).toString(); // getMonth() is zero-based
  const dd = this.getDate().toString();
  return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]); // padding
};

Date.prototype.ddmmyyyy = function () {
  const yyyy = this.getFullYear().toString();
  const mm = (this.getMonth() + 1).toString(); // getMonth() is zero-based
  const dd = this.getDate().toString();
  return (dd[1] ? dd : '0' + dd[0]) + '.' + (mm[1] ? mm : '0' + mm[0]) + '.' + yyyy; // padding
};

Date.prototype.hhmm = function () {
  const hh = this.getHours().toString();
  const mm = this.getMinutes().toString();
  return (hh[1] ? hh : '0' + hh[0]) + ':' + (mm[1] ? mm : '0' + mm[0]); // padding
};

Date.prototype.hhmmss = function () {
  const hh = this.getHours().toString();
  const mm = this.getMinutes().toString();
  const ss = this.getSeconds().toString();
  return (hh[1] ? hh : '0' + hh[0]) + ':' + (mm[1] ? mm : '0' + mm[0]) + ':' + (ss[1] ? ss : '0' + ss[0]); // padding
};

Date.prototype.ddmm = function () {
  const mm = (this.getMonth() + 1).toString(); // getMonth() is zero-based
  const dd = this.getDate().toString();
  return (dd[1] ? dd : '0' + dd[0]) + '.' + (mm[1] ? mm : '0' + mm[0]) + '.'; // padding
};

Date.prototype.ddmmhhmm = function () {
  const MM = (this.getMonth() + 1).toString(); // getMonth() is zero-based
  const dd = this.getDate().toString();
  const hh = this.getHours().toString();
  const mm = this.getMinutes().toString();
  return (dd[1] ? dd : '0' + dd[0]) + '.' + (MM[1] ? MM : '0' + MM[0]) + '. ' +
    (hh[1] ? hh : '0' + hh[0]) + ':' + (mm[1] ? mm : '0' + mm[0]);
};

Date.prototype.eeee = function () {
  const weekday_de = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (ftui.config.lang === 'de') { return weekday_de[this.getDay()]; }
  return weekday[this.getDay()];
};

Date.prototype.eee = function () {
  const weekday_de = ['Son', 'Mon', 'Die', 'Mit', 'Don', 'Fre', 'Sam'];
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (ftui.config.lang === 'de') { return weekday_de[this.getDay()]; }
  return weekday[this.getDay()];
};

Date.prototype.ee = function () {
  const weekday_de = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const weekday = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  if (ftui.config.lang === 'de') { return weekday_de[this.getDay()]; }
  return weekday[this.getDay()];
};


const menu = document.querySelector('#menu');
menu && menu.addEventListener('click', event => {
  event.target.classList.toggle('show');
});

// initially loading the page
// or navigating to the page from another page in the same window or tab
window.addEventListener('pageshow', () => {
  if (!window.ftui) {
    // load FTUI
    window.ftui = new Ftui();
  } else {
    // navigating from another page
    ftui.setOnline();
  }
});

window.addEventListener('beforeunload', () => {
  ftui.log(5, 'beforeunload');
  ftui.setOffline();
});

window.addEventListener('online', () => ftui.updateOnlineStatus());
window.addEventListener('offline', () => ftui.updateOnlineStatus());
// after the page became visible, check server connection
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // page is hidden
  } else {
    // page is visible
    ftui.log(1, 'Page became visible again -> start healthCheck in 3 secondes ');
    ftui.scheduleHealthCheck();
  }
});

window.onerror = function (msg, url, lineNo, columnNo, error) {
  const file = url.split('/').pop();
  ftui.toast([file + ':' + lineNo, error].join('<br/>'), 'error');
  return false;
};

// helper classes

class Events {
  constructor() {
    this.observers = [];
  }

  subscribe(observer, context) {
    if (void 0 === context) { context = observer; }
    this.observers.push({ observer: observer });
  }

  publish(args) {
    this.observers.forEach(topic => topic.observer(args));
  }
}
