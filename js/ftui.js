class Ftui {
  constructor() {
    this.version = '3.3.0';
    this.config = {
      DEBUG: false,
      dir: '',
      filename: '',
      basedir: '',
      fhemDir: '',
      debuglevel: 0,
      doLongPoll: true,
      lang: 'de',
      toastPosition: 'bottomLeft',
      shortpollInterval: 0
    };
    this.poll = {
      short: {
        lastTimestamp: new Date(),
        timer: null,
        request: null,
        result: null,
        lastErrorToast: null
      },
      long: {
        xhr: null,
        currLine: 0,
        lastUpdateTimestamp: new Date(),
        lastEventTimestamp: new Date(),
        timer: null,
        result: null,
        lastErrorToast: null
      }
    };
    this.states = {
      width: 0,
      lastSetOnline: 0,
      lastShortpoll: 0,
      longPollRestart: false,
      inits: []
    };
    this.parameterData = {};
    this.paramIdMap = {};
    this.timestampMap = {};
    this.subscriptions = {};
    this.subscriptionTs = {};
    this.scripts = [];
    this.notifications = {};


    this.init();
  }

  Notifications(id) {
    let notification = id && this.notifications[id];
    if (!notification) {
      notification = new Notification();
      if (id) {
        this.notifications[id] = notification;
      }
    }
    return notification;
  }



  init() {
    //this.hideWidgets('html');

    this.config.meta = document.getElementsByTagName('META');
    const longpoll = this.getMetaString('longpoll', '1');
    this.config.doLongPoll = (longpoll !== '0');
    this.config.shortPollFilter = this.getMetaString('shortpoll_filter');
    this.config.longPollFilter = this.getMetaString('longpoll_filter');

    this.config.debuglevel = this.getMetaNumber('debug');
    this.config.maxLongpollAge = this.getMetaNumber('longpoll_maxage', 240);
    this.config.DEBUG = (this.config.debuglevel > 0);
    this.config.TOAST = this.getMetaNumber('toast', 5); // 1,2,3...= n Toast-Messages, 0: No Toast-Messages
    this.config.toastPosition = this.getMetaString('toast_position', 'bottomLeft');
    this.config.shortpollInterval = this.getMetaNumber('shortpoll_only_interval', 30);
    this.config.shortPollDelay = this.getMetaString('shortpoll_restart_delay', 3000);
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
    this.config.lang = this.getMetaString('lang', ((this.isValid(userLang)) ? userLang.split('-')[0] : 'de'));
    // credentials
    this.config.username = this.getMetaString('username');
    this.config.password = this.getMetaString('password');
    // subscriptions
    this.devs = [this.config.webDevice];
    this.reads = ['STATE'];

    const initDeferreds = [this.getCSrf()];

    // init Toast
    if (!window.vNotify) {
      this.dynamicload(this.config.basedir + 'lib/vanilla-notify.min.js', false).then(() => {
        this.configureToast();
      });
    } else {
      this.configureToast();
    }

    // after the page became visible, check server connection
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // page is hidden
      } else {
        // page is visible
        this.log(1, 'Page became visible again -> start healthCheck in 3 secondes ');
        setTimeout(() => {
          this.healthCheck();
        }, 3000);
      }
    });

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
    const onlyTouch = ((android && parseFloat(android) < 5) || iOS);
    this.config.clickEventType = (onlyTouch) ? 'touchstart' : 'touchstart mousedown';
    this.config.moveEventType = ((onlyTouch) ? 'touchmove' : 'touchmove mousemove');
    this.config.releaseEventType = ((onlyTouch) ? 'touchend' : 'touchend mouseup');
    this.config.leaveEventType = ((onlyTouch) ? 'touchleave' : 'touchleave mouseout');
    this.config.enterEventType = ((onlyTouch) ? 'touchenter' : 'touchenter mouseenter');

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
      // restart longpoll
      this.states.longPollRestart = true;
      this.restartLongPoll();
      this.initHeaderLinks();

      // start shortpoll delayed
      this.startShortPollInterval(500);

      // trigger refreshs
      this.triggerEvent('changedSelection');
    });

    setInterval(() => {
      this.healthCheck();
    }, 60000);
  }

  initPage(area) {
    area = (this.isValid(area)) ? area : 'html';
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
    area = (this.isValid(area)) ? area : 'html';
    const widgetTypes = [];
    // Fetch all the children of <ftui-*> that are not defined yet.
    const undefineWidgets = this.selectElements(':not(:defined)', area);

    undefineWidgets.forEach(elem => {
      const type = elem.localName;
      // ToDo: use filter
      if (!widgetTypes.includes(type)) {
        widgetTypes.push(type);
      }
    });


    const regexp = new RegExp('^ftui-[a-z]+$', 'i');
    widgetTypes
      .filter(type => {

        const match = regexp.test(type);
        return match;
      })
      .forEach(type => {
        this.dynamicload(this.config.basedir + 'js/' + type.replace('-', '.') + '.js', true, 'module')
      });

    const promises = [...undefineWidgets].map(widget => {
      //console.log(widget);
      return customElements.whenDefined(widget.localName);
    });

    // get current values of readings not before all widgets are loaded
    Promise.all(promises).then(() => {
      this.updateParameters();
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

  configureToast() {
    if (window.vNotify && !this.selectOne('link[href$="css/vanilla-notify.css"]')) {
      this.appendStyleLink(this.config.basedir + 'css/vanilla-notify.css');
    }
  }

  initHeaderLinks() {

    if (this.selectAll('[class*=oa-]').length && !this.selectAll('link[href$="css/openautomation.min.css"]').length) {
      this.appendStyleLink(this.config.basedir + 'css/openautomation.min.css');
    }
    if (this.selectAll('[class*=fs-]').length && !this.selectAll('link[href$="css/fhemSVG.css"]').length) {
      this.appendStyleLink(this.config.basedir + 'lib/fhemSVG.css');
    }
    if (this.selectAll('[class*=mdi-]').length && !this.selectAll('link[href$="css/materialdesignicons.min.css"]').length) {
      this.appendStyleLink(this.config.basedir + 'css/materialdesignicons.min.css');
    }
    if (this.selectAll('[class*=wi-]').length && !this.selectAll('link[href$="css/weather-icons.min.css"]').length) {
      this.appendStyleLink(this.config.basedir + 'css/weather-icons.min.css');
    }
    if (this.selectAll('[class*=wi-wind]').length && !this.selectAll('link[href$="css/weather-icons-wind.min.css"]').length) {
      this.appendStyleLink(this.config.basedir + 'css/weather-icons-wind.min.css');
    }
    if (this.selectAll('[class*=fa-]').length ||
      !this.selectAll('link[href$="css/font-awesome.min.css"]').length
    ) {
      this.appendStyleLink(this.config.basedir + 'css/font-awesome.min.css');
    }
  }

  parseDeviceReading(deviceReading) {
    const [, device, reading] = /^([^-:]+)[-:](.*)$/.exec(deviceReading) || ['', deviceReading, 'STATE'];
    const paramid = (reading === 'STATE') ? device : [device, reading].join('-');
    return [paramid, device, reading];
  }

  addReading(deviceReading) {
    if (this.isValid(deviceReading)) {
      const [paramid, device, reading] = this.parseDeviceReading(deviceReading);
      if (!this.subscriptions[paramid]) {
        this.subscriptions[paramid] = { device: device, reading: reading };
      }
      return this.Notifications(paramid);
    } else {
      return { subscribe: () => { } }
    }
  }

  updateParameters() {

    this.devs = [... new Set(Object.values(this.subscriptions).map(value => (value.device)))];
    this.reads = [... new Set(Object.values(this.subscriptions).map(value => (value.reading)))];

    // build filter
    const devicelist = (this.devs.length) ? this.devs.join() : '.*';
    const readinglist = (this.reads.length) ? this.reads.join(' ') : '';

    this.poll.long.filter = this.config.longPollFilter ? this.config.longPollFilter : devicelist + ', ' + readinglist;
    this.poll.short.filter = this.config.shortPollFilter ? this.config.shortPollFilter : devicelist + ' ' + readinglist;

    // force shortpoll
    this.states.lastShortpoll = 0;
  }

  isFhemWebInternal(deviceName) {
    return deviceName.includes('FHEMWEB') && deviceName.match(/WEB_\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}_\d{5}/);
  }

  startLongpoll() {
    this.log(2, 'startLongpoll: ' + this.config.doLongPoll);
    this.poll.long.lastEventTimestamp = new Date();
    if (this.config.doLongPoll) {
      this.config.shortpollInterval = this.getMetaNumber('shortpoll_interval', 15 * 60); // 15 minutes
      this.poll.long.timer = setTimeout(() => {
        this.longPoll();
      }, 0);
    }
  }

  stopLongpoll() {
    this.log(2, 'stopLongpoll');
    clearInterval(this.poll.long.timer);
    if (this.poll.long.websocket) {
      if (this.poll.long.websocket.readyState === WebSocket.OPEN) {
        this.poll.long.websocket.close();
      }
      this.poll.long.websocket = undefined;
      this.log(2, 'stopped websocket');
    }
  }

  restartLongPoll(msg, error) {
    this.log(2, 'restartLongpoll');
    let delay;
    clearTimeout(this.poll.long.timer);
    if (msg) {
      this.toast('Disconnected from FHEM<br>' + msg, error);
    }

    this.stopLongpoll();

    if (this.states.longPollRestart) {
      delay = 0;
    } else {
      this.toast('Retry to connect in 10 seconds');
      delay = 10000;
    }

    this.poll.long.timer = setTimeout(() => {
      this.startLongpoll();
    }, delay);
  }

  forceRefresh() {
    this.states.lastShortpoll = 0;
    this.shortPoll();
  }

  startShortPollInterval(delay) {
    this.log(1, 'shortpoll: start in (ms):' + (delay || this.config.shortpollInterval * 1000));
    clearInterval(this.poll.short.timer);
    this.poll.short.timer = setTimeout(() => {
      // get current values of readings every x seconds
      this.shortPoll();
      this.startShortPollInterval();
    }, (delay || this.config.shortpollInterval * 1000));
  }

  shortPoll(silent) {
    const ltime = Date.now() / 1000;
    if ((ltime - this.states.lastShortpoll) < this.config.shortpollInterval) { return; }
    this.log(1, 'start shortpoll');
    window.performance.mark('start shortpoll');
    this.states.lastShortpoll = ltime;

    // invalidate all readings for detection of outdated ones
    // let i = this.devs.length;
    // while (i--) {
    //   const params = this.deviceStates[this.devs[i]];
    //   for (const reading in params) {
    //     params[reading].valid = false;
    //   }
    // }
    window.performance.mark('start get jsonlist2');
    this.poll.short.request =
      this.sendToFhem('jsonlist2 ' + this.poll.short.filter)
        .then(res => res.json())
        .then(fhemJSON => this.parseShortpollResult(fhemJSON, silent)
        )
    // .catch(error => {
    //   this.log(1, 'shortPoll: request failed: 111111' + error, 'error');
    //   this.poll.short.result = error;
    //   this.states.lastSetOnline = 0;
    //   this.states.lastShortpoll = 0;
    // });
  }

  parseShortpollResult(fhemJSON, silent) {

    window.performance.mark('end get jsonlist2');
    window.performance.measure('get jsonlist2', 'start get jsonlist2', 'end get jsonlist2');
    window.performance.mark('start read jsonlist2');

    // import the whole fhemJSON
    if (fhemJSON && fhemJSON.Results) {
      fhemJSON.Results.forEach(device => {
        if (!this.isFhemWebInternal(device.Name)) {
          this.parseShortpollReading(device.Name, device.Internals);
          this.parseShortpollReading(device.Name, device.Attributes);
          this.parseShortpollReading(device.Name, device.Readings);
        }
      });

      // finished
      window.performance.mark('end shortpoll');
      window.performance.measure('shortpoll', 'start shortpoll', 'end shortpoll');
      const duration = window.performance.getEntriesByName('shortpoll', 'measure')[0].duration;
      if (this.config.debuglevel > 1) {
        const paramCount = fhemJSON.Results.length;
        this.toast('Full refresh done in ' +
          duration.toFixed(0) + 'ms for ' +
          paramCount + ' parameter(s)');
      }
      this.log(1, 'shortPoll: Done');
      if (this.poll.short.lastErrorToast) {
        this.poll.short.lastErrorToast.reset();
      }
      this.poll.short.duration = duration * 1000;
      this.poll.short.lastTimestamp = new Date();
      this.poll.short.result = 'ok';

      if (!silent) {
        this.onUpdateDone();
      }
    } else {
      const err = 'request failed: Result is null';
      this.log(1, 'shortPoll: ' + err);
      this.poll.short.result = err;
      this.toast('<u>ShortPoll ' + err + ' </u><br>', 'error');

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

  parseShortpollReading(device, section) {
    for (const reading in section) {
      const paramerId = (reading === 'STATE') ? device : [device, reading].join('-');
      let deviceReading = section[reading];
      if (typeof deviceReading !== 'object') {
        // this.log(5,'paramid='+paramid+' newParam='+newParam);

        deviceReading = {
          'Value': deviceReading,
          'Time': ''
        };
      }

      // is there a subscription, then check and update widgets
      if (this.subscriptions[paramerId]) {
        const param = this.parameterData[paramerId] || {};
        const isUpdate = (!param || param.value !== deviceReading.Value || param.time !== deviceReading.Time);

        this.log(5, ['handleUpdate()', ' paramerId=', paramerId, ' value=', deviceReading.Value,
          ' time=', deviceReading.Time, ' isUpdate=', isUpdate].join(''));

        // write into internal cache object
        param.value = deviceReading.Value;
        param.time = deviceReading.Time;
        param.update = new Date().format('YYYY-MM-DD hh:mm:ss');

        // update widgets only if necessary
        if (isUpdate) {
          this.log(3, ['handleUpdate() publish update for ', paramerId].join(''));
          this.parameterData[paramerId] = param;
          // console.log(paramerId, this.parameterData[paramerId], param.value);
          this.Notifications(paramerId).publish(param);
        }
      }
    }
  }

  longPoll() {

    if (this.poll.long.websocket) {
      this.log(3, 'valid this.poll.long.websocket found');
      return;
    }
    if (this.poll.long.lastErrorToast) {
      this.poll.long.lastErrorToast.reset();
    }
    if (this.config.debuglevel > 1) {
      this.toast('Longpoll started');
    }
    this.poll.long.URL = this.config.fhemDir.replace(/^http/i, 'ws') + '?XHR=1&inform=type=status;filter=' +
      this.poll.long.filter + ';since=' + this.poll.long.lastEventTimestamp.getTime() + ';fmt=JSON' +
      '&timestamp=' + Date.now();
    // "&fwcsrf=" + this.config.csrf;

    this.log(1, 'websockets URL=' + this.poll.long.URL);
    this.states.longPollRestart = false;

    this.poll.long.websocket = new WebSocket(this.poll.long.URL);
    this.poll.long.websocket.onclose = (event) => {
      let reason;
      if (event.code == 1000) {
        reason =
          'Normal closure, meaning that the purpose for which the connection was established has been fulfilled.';
      } else if (event.code == 1001) {
        reason =
          'An endpoint is "going away", such as a server going down or a browser having navigated away from a page.';
      } else if (event.code == 1002) { reason = 'An endpoint is terminating the connection due to a protocol error'; } else if (event.code == 1003) {
        reason =
          'An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).';
      } else if (event.code == 1004) { reason = 'Reserved. The specific meaning might be defined in the future.'; } else if (event.code == 1005) { reason = 'No status code was actually present.'; } else if (event.code == 1006) { reason = 'The connection was closed abnormally, e.g., without sending or receiving a Close control frame'; } else if (event.code == 1007) {
        reason =
          'An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).';
      } else if (event.code == 1008) {
        reason =
          'An endpoint is terminating the connection because it has received a message that "violates its policy". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.';
      } else if (event.code == 1009) {
        reason =
          'An endpoint is terminating the connection because it has received a message that is too big for it to process.';
      } else if (event.code == 1010) // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
      {
        reason =
          'An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn\'t return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: ' +
          event.reason;
      } else if (event.code == 1011) {
        reason =
          'A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.';
      } else if (event.code == 1015) {
        reason =
          'The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can\'t be verified).';
      } else { reason = 'Unknown reason'; }
      this.log(1, 'websocket (url=' + event.target.url + ') closed!  reason=' + reason);
      // if current socket closes then restart websocket
      if (event.target.url === this.poll.long.URL) {
        this.restartLongPoll(reason);
      }
    };
    this.poll.long.websocket.onerror = (event) => {
      this.log(1, 'Error while longpoll: ' + event.data);
      if (this.config.debuglevel > 1 && event.target.url === this.poll.long.URL) {
        this.poll.long.lastErrorToast = this.toast('Error while longpoll', 'error');
      }

    };
    this.poll.long.websocket.onmessage = (msg) => {
      this.handleLongpollUpdates(msg.data);
    };
  }

  handleLongpollUpdates(data) {
    const lines = data.split(/\n/);
    lines.forEach(line => {
      this.log(5, line);
      const lastChar = line.slice(-1);
      if (this.isValid(line) && line !== '' && lastChar === ']' && !this.isFhemWebInternal(line)) {

        const dataJSON = JSON.parse(line);
        const id = dataJSON[0];
        const value = dataJSON[1];
        const html = dataJSON[2];
        const isSTATE = (value !== html);
        const isTimestamp = id.match(/-ts$/);
        const isTrigger = (value === '' && html === '');
        const paramId = isTimestamp ? id.replace(/-ts$/, '') : id;
        const param = this.parameterData[paramId] || {};

        this.log(4, dataJSON);
        param.update = new Date().format('YYYY-MM-DD hh:mm:ss');
        if (isTimestamp) {
          param.time = value;
        } else if (isSTATE) {
          param.time = param.update;
          param.value = value;
        } else if (!isTimestamp) {
          param.value = value;
        }
        this.parameterData[paramId] = param;

        if (isTimestamp || isSTATE || isTrigger) {
          this.Notifications(paramId).publish(param);
        }
      }
    });
    this.poll.long.lastEventTimestamp = new Date();
  }

  sendFhemCommand(cmdline) {
    this.sendToFhem(cmdline)
      .then(this.handleFetchErrors)
      .then(response => this.log(3, response))
      .catch(error => this.toast('<u>FHEM Command failed</u><br>' + error + '<br>cmd=' + cmdline, 'error'));
  }

  sendToFhem(cmdline) {
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
    this.selectAll('.autohide[data-get]').forEach(elem => {
      const valid = elem.getReading('get').valid;
      if (valid && valid === true) {
        elem.classList.remove('invalid');
      } else {
        elem.classList.add('invalid');
      }
    });
  }

  setOnline() {
    const ltime = Date.now() / 1000;
    if ((ltime - this.states.lastSetOnline) > 60) {
      if (this.config.DEBUG) this.toast('FHEM connected');
      this.states.lastSetOnline = ltime;
      // force shortpoll
      this.states.lastShortpoll = 0;
      this.startShortPollInterval(1000);
      if (!this.config.doLongPoll) {
        const longpoll = this.selectAll('meta[name="longpoll"]["content"]').content || '1';
        this.config.doLongPoll = (longpoll != '0');
        this.states.longPollRestart = false;
        if (this.config.doLongPoll) {
          this.startLongpoll();
        }
      }
      this.log(1, 'FTUI is online');
    }
  }

  setOffline() {
    if (this.config.DEBUG) this.toast('Lost connection to FHEM');
    this.config.doLongPoll = false;
    this.states.longPollRestart = true;
    clearInterval(this.poll.short.timer);
    this.stopLongpoll();
    this.log(1, 'FTUI is offline');
  }

  getDeviceParameter(devname, paraname) {
    if (devname && devname.length) {
      const params = this.deviceStates[devname];
      return (params && params[paraname]) ? params[paraname] : null;
    }
    return null;
  }

  dynamicload(url, async, type = 'text/javascript') {
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

  healthCheck() {
    const timeDiff = new Date() - this.poll.long.lastEventTimestamp;
    if (timeDiff / 1000 > this.config.maxLongpollAge &&
      this.config.maxLongpollAge > 0 &&
      this.config.doLongPoll) {
      this.log(1, 'No longpoll event since ' + timeDiff / 1000 + 'secondes -> restart polling');
      this.setOnline();
      this.restartLongPoll();
    }
  }

  // FS20: {
  //   'dimmerArray': [0, 6, 12, 18, 25, 31, 37, 43, 50, 56, 62, 68, 75, 81, 87, 93, 100],
  //   'dimmerValue': function (value) {
  //     const idx = this.indexOfNumeric(this.dimmerArray, value);
  //     return (idx > -1) ? this.dimmerArray[idx] : 0;
  //   }
  // },

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
    if (this.isValid(part)) {
      if (this.isNumeric(part)) {
        const tokens = (this.isValid(value)) ? value.toString().split(' ') : '';
        return (tokens.length >= part && part > 0) ? tokens[part - 1] : value;
      } else {
        let ret = '';
        if (this.isValid(value)) {
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

  // 1. numeric, 2. regex, 3. negation double, 4. indexof
  indexOfGeneric(array, find) {
    if (!array) return -1;
    for (let i = 0, len = array.length; i < len; i++) {
      // leave the loop on first none numeric item
      if (!this.isNumeric(array[i])) { return this.indexOfRegex(array, find); }
    }
    return this.indexOfNumeric(array, find);
  }

  indexOfNumeric(array, val) {
    let ret = -1;
    for (let i = 0, len = array.length; i < len; i++) {
      if (Number(val) >= Number(array[i])) { ret = i; }
    }
    return ret;
  }

  indexOfRegex(array, find) {
    const len = array.length;
    for (let i = 0; i < len; i++) {
      try {
        const match = find.match(new RegExp('^' + array[i] + '$'));
        if (match) { return i; }
      } catch (e) {
        // Ignore
      }
    }

    // negation double
    if (len === 2 && array[0] === '!' + array[1] && find !== array[0]) {
      return 0;
    }
    if (len === 2 && array[1] === '!' + array[0] && find !== array[1]) {
      return 1;
    }

    // last chance: index of
    return array.indexOf(find);
  }

  isValid(v) {
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

  mapColor(value) {
    return this.getStyle('.' + value, 'color') || value;
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

  parseJsonFromString(str) {
    return JSON.parse(str);
  }

  getAndroidVersion(ua) {
    ua = (ua || navigator.userAgent).toLowerCase();
    const match = ua.match(/android\s([0-9.]*)/);
    return match ? match[1] : false;
  }

  toast(text, error) {
    // https://github.com/MLaritz/Vanilla-Notify

    if (this.config.TOAST !== 0 && window.vNotify) {
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
        this.log(1, 'Error while parseJSON: ' + e, 'error');
      }
    }
    return parsed;
  }

  isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  matchingValue(mapAttribute, searchKey) {
    let matchValue = null;
    const map = this.parseObject(mapAttribute);
    Object.entries(map).forEach(([key, value]) => {
      if (searchKey === key ||
        parseFloat(searchKey) >= parseFloat(key) ||
        searchKey.match('^' + key + '$')) {
        matchValue = value;
      }
    });
    return matchValue;
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

// -------------Notifications----------
class Notification {
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



// global helper functions

String.prototype.toDate = function () {
  return ftui.dateFromString(this);
};

String.prototype.parseJson = function () {
  return ftui.parseJsonFromString(this);
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
  if (ftui.isValid(format)) {
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

window.addEventListener('beforeunload', () => {
  ftui.log(5, 'beforeunload');
  ftui.setOffline();
});

window.addEventListener('online offline', () => {
  ftui.log(5, 'online offline');
  if (navigator.onLine) { ftui.setOnline(); } else { ftui.setOffline(); }
});

window.onerror = function (msg, url, lineNo, columnNo, error) {
  const file = url.split('/').pop();
  ftui.toast([file + ':' + lineNo, error].join('<br/>'), 'error');
  return false;
};

window.ftui = new Ftui();
