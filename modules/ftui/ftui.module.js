

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
        'modules/vanilla-notify/vanilla-notify.css'
      ],
      libList: [
        'modules/vanilla-notify/vanilla-notify.min.js'
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
        result: null
      },
      update: {
        lastUpdateTimestamp: new Date(),
        lastEventTimestamp: new Date(),
        timer: null,
        result: null
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
    const fhemUrl = this.getMetaString('fhemweb_url');
    this.config.filename = url.substring(url.lastIndexOf('/') + 1);
    this.config.fhemDir = fhemUrl || window.location.origin + '/fhem/';
    if (fhemUrl && new RegExp('^((?!http://|https://).)*$').test(fhemUrl)) {
      this.config.fhemDir = window.location.origin + '/' + fhemUrl + '/';
    }
    this.config.fhemDir = this.config.fhemDir.replace('///', '//');
    this.log(1, 'Filename: ' + this.config.filename);
    this.log(1, 'FHEM dir: ' + this.config.fhemDir);
    // lang
    const userLang = navigator.language || navigator.userLanguage;
    this.config.lang = this.getMetaString('lang', ((this.isDefined(userLang)) ? userLang.split('-')[0] : 'de'));
    // credentials
    this.config.username = this.getMetaString('username');
    this.config.password = this.getMetaString('password');

    this.loadStyles();
    this.loadLibs();
    this.appendOverlay();

    // init Page after CSFS Token has been retrieved
    Promise.all([this.fetchCSrf()]).then(() => {
      this.initPage('html');
    }).catch(error => {
      this.log(1, 'initDeferreds -' + error, 'error');
    });

    document.addEventListener('initComponentsDone', () => {
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
    this.initComponents(area).then(() => {
      window.performance.mark('end initPage-' + area);
      window.performance.measure('initPage-' + area, 'start initPage-' + area, 'end initPage-' + area);
      const dur = 'initPage (' + area + '): in ' + (new Date() - this.states.startTime) + 'ms';
      if (this.config.debuglevel > 1) this.toast(dur);
      this.log(1, dur);
    }).catch(error => {
      this.log(1, 'initComponents -' + error, 'error');
    });
  }

  initComponents(area) {
    const initDefer = this.deferred();
    const componentTypes = [];
    const undefinedComponents = this.selectElements(':not(:defined)', area);

    // Fetch all the children of <ftui-*> that are not defined yet.
    undefinedComponents.forEach(elem => {
      if (!componentTypes.includes(elem.localName)) {
        componentTypes.push(elem.localName);
      }
    });

    componentTypes.forEach(type => {
      const nameParts = type.split('-');
      const group = nameParts[1];
      const name = nameParts[2] ? nameParts[1] + '-' + nameParts[2] : nameParts[1];
      this.loadModule(`../../components/${group}/${name}.component.js`)
    });

    const promises = [...undefinedComponents].map(component => {
      return customElements.whenDefined(component.localName);
    });

    // get current values of readings not before all components are loaded
    Promise.all(promises)
      .then(() => {
        this.createFilterParameter();
        this.log(1, 'initComponents - Done');
        const event = new CustomEvent('initComponentsDone', { area: area });
        document.dispatchEvent(event);
        initDefer.resolve();
      })
      .catch(error => {
        this.log(1, 'initComponents -' + error, 'error');
      });
    return initDefer.promise();
  }

  async loadModule(path) {
    await import(path);
  }


  loadLibs() {
    this.config.libList.forEach((lib) => this.dynamicload(this.config.basedir + lib), false);
  }

  loadStyles() {
    this.config.styleList.forEach((link) => this.appendStyleLink(this.config.basedir + link));
  }

  getReadingID(device, reading) {
    return (reading === 'STATE') ? device : [device, reading].join('-');
  }

  /**
   * Parses a given readingId and returns parameter id, device name and reading name
   * @param  {} readingId
   */
  parseReadingId(readingId) {
    const [, device, reading] = /^(.+)[-:\s](.*)$/.exec(readingId) || ['', readingId, ''];
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

  // ToDo: Do not repeat yourself 
  getReadingData(readingID) {
    const id = readingID.replace(':', '-');
    if (this.readings.has(id)) {
      return this.readings.get(id).data;
    } else {
      return null;
    }
  }

  updateReadingValue(readingID, value) {
    const reading = this.readings.get(readingID);
    if (reading?.data) {
      const now = ftui.dateFormat(new Date(), 'YYYY-MM-DD hh:mm:ss');
      reading.data.id = readingID;
      reading.data.valid = true;
      reading.data.value = value;
      reading.data.time = now;
      reading.data.update = now
      reading.events.publish(reading.data);
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
  // end ToDo

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
    if (
      this.config.refresh.filter
      && this.config.refresh.filter.length < 2
      || (ltime - this.states.lastRefresh) < this.config.refreshInterval
    ) { return; }
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
      const parameterId = this.getReadingID(device, reading);
      let parameter = section[reading];
      if (typeof parameter !== 'object') {
        parameter = {
          'Value': parameter,
          'Time': ''
        };
      }

      // is there a subscription, then check and update components
      if (this.readings.has(parameterId)) {
        const parameterData = this.getReadingData(parameterId);
        const doPublish = (parameterData.value !== parameter.Value || parameterData.time !== parameter.Time);
        const now = ftui.dateFormat(new Date(), 'YYYY-MM-DD hh:mm:ss');

        this.log(5, ['handleUpdate()', ' paramerId=', parameterId, ' value=', parameter.Value,
          ' time=', parameter.Time, ' isUpdate=', doPublish].join(''));

        // write into internal cache object
        parameterData.id = parameterId;
        parameterData.valid = true;
        parameterData.value = parameter.Value;
        parameterData.time = parameter.Time || now;
        parameterData.update = now

        // update components only if necessary
        this.updateReadingData(parameterId, parameterData, doPublish);
      }
    }
  }

  startFhemConnection() {
    if (this.states.update.websocket) {
      this.log(3, 'valid this.states.update.websocket found');
      return;
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
        this.toast('Error with fhem connection', 'error');
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

          parameterData.update = ftui.dateFormat(new Date(), 'YYYY-MM-DD hh:mm:ss');
          parameterData.id = parameterId;
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

  sendToFhem(cmdline = '', async = '0') {
    const url = new URL(this.config.fhemDir);
    const params = {
      cmd: cmdline,
      asyncCmd: async,
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
    this.log(2, 'online offline');
    if (navigator.onLine) { this.setOnline(); } else { this.setOffline(); }
  }

  setOnline() {
    const ltime = Date.now() / 1000;
    this.log(2, 'setOnline', ltime, this.states.lastSetOnline);
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
          this.log(3, 'dynamicload load done:' + url);
          deferred.resolve();
        };
        script.onerror = (error) => {
          this.error(3, 'dynamicload load failure:', url, error);
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

  fetchCSrf() {
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
    if (ftui.states.update.websocket &&
      ftui.states.update.websocket.readyState === WebSocket.OPEN) {
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

  appendOverlay() {
    const shade = `<div id="overlay" class="hide"/>`;
    document.body.insertAdjacentHTML('beforeend', shade);
    document.getElementById('overlay').addEventListener('click', () => {
      this.triggerEvent('overlayClicked');
    });
  }



  // helper functions

  debounce(callback, delay = 0) {
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

  isVisible(element) {
    return (element.offsetParent !== null);
  }

  isDefined(value) {
    return (typeof value !== 'undefined');
  }

  isString(value) {
    return (typeof value === 'string' && !this.isNumeric(value));
  }

  isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
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
    const eeee = (ftui.config.lang === 'de') ? weekday_de[d] : weekday[d];
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

  log(level, ...args) {
    if (this.config.debuglevel >= level) {
      // eslint-disable-next-line no-console
      console.log.apply(this, args);
    }
  }

  error(level, ...args) {
    if (this.config.debuglevel >= level) {
      // eslint-disable-next-line no-console
      console.error.apply(this, args);
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
    let parsed = {};
    if (json) {
      try {
        parsed = JSON.parse(json);
      } catch (e) {
        this.log(1, 'Error while parseJSON: error=' + e + ' json=' + json, 'error');
      }
    }
    return parsed;
  }

  isEqual(pattern, value) {
    return value === pattern ||
      parseFloat(value) === parseFloat(pattern) ||
      String(value).match('^' + pattern + '$');
  }

  isEqualOrGreater(pattern, value) {
    return value === pattern ||
      parseFloat(value) >= parseFloat(pattern) ||
      String(value).match('^' + pattern + '$');
  }

  getMatchingValue(map, searchKey) {
    const key = this.getMatchingKey(map, searchKey);
    return map[key];
  }

  getMatchingKey(map, searchKey) {
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

  getMatchingKeys(map, searchKey) {
    if (this.isDefined(map)) {
      //console.log(map)
      return Object.keys(map)
        .filter(key => this.isEqualOrGreater(key, searchKey))
        .map(key => key);
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

// Event observable
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

export const ftui = new Ftui();
