
import {
  Subject, debounce, parseReadingId, isDefined,
  log, error,
  dateFormat,
  getReadingID,
  triggerEvent, isAppVisible,
} from './ftui.helper.js';

class FhemService {
  constructor() {

    this.config = {
      enableDebug: false,
      fhemDir: '',
      csrf: '',
      debuglevel: 0,
      refreshInterval: 0,
      refresh: {},
      update: {
        filter: '',
      },
    };
    this.states = {
      lastRefresh: 0,
      fhemConnectionIsRestarting: false,
      isOffline: false,
      refresh: {
        lastTimestamp: new Date(),
        timer: null,
        request: null,
        result: null,
      },
      connection: {
        lastEventTimestamp: new Date(),
        timer: null,
        result: null,
      },
    };

    // define debounced function
    this.debouncedUpdateFhem = debounce(this.updateFhem, this);

    this.debugEvents = new Subject();
    this.errorEvents = new Subject();
    this.readingsMap = new Map();
  }

  setConfig(config) {
    Object.assign(this.config, config);
  }

  getReadingEvents(readingName) {
    if (isDefined(readingName)) {
      const readingItem = this.getReadingItem(readingName);
      return readingItem.events;
    } else {
      // empty dummy object
      return { subscribe: () => { }, unsubscribe: () => { } }
    }
  }

  getReadingItem(readingIdOrName) {
    const [readingId, device, reading] = parseReadingId(readingIdOrName);
    if (!this.readingsMap.has(readingId)) {
      this.readingsMap.set(readingId, { data: { id: readingId }, events: new Subject(), device: device, reading: reading });
    }
    if (this.readingsMap.has(readingId)) {
      return this.readingsMap.get(readingId);
    } else {
      return {};
    }
  }

  updateReadingItem(readingID, newData, doPublish = true) {
    log(3, 'FhemService.updateReadingItem - update for ', readingID, 'newData=', newData, 'doPublish=', doPublish);
    const readingItem = this.getReadingItem(readingID);
    if (readingItem.data) {
      readingItem.data = Object.assign(readingItem.data, newData);
      if (doPublish) {
        readingItem.events.publish(readingItem.data);
      }
    }
  }

  createFilterParameter() {
    const readingsArray = Array.from(this.readingsMap.values())
      .filter(value => value.events.observers.length && value.device !== 'local');
    const devs = [... new Set(readingsArray.map(value => value.device))];
    const reads = [... new Set(readingsArray.map(value => value.reading || 'STATE'))];
    const devicelist = devs.length ? devs.join() : '';
    const readinglist = reads.length ? reads.join(' ') : '';

    this.config.update.filter = this.config.updateFilter ? this.config.updateFilter : devicelist + ', ' + readinglist;
    this.config.refresh.filter = this.config.refreshFilter ? this.config.refreshFilter : devicelist + ' ' + readinglist;

    // force Refresh
    this.states.lastRefresh = 0;
    log(2, '[fhemService] - created filter with ' + devs.length + ' devices')
  }

  isFhemWebInternal(deviceName) {
    return deviceName.includes('FHEMWEB') && deviceName.match(/WEB_\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}_\d{5}/);
  }

  forceRefresh() {
    this.states.lastRefresh = 0;
    this.startRefreshInterval(1000);
    this.reconnect(5);
  }

  startRefreshInterval(delay) {
    log(1, '[refresh] next start in (ms):' + (delay || this.config.refreshInterval * 1000));
    clearInterval(this.states.refresh.timer);
    this.states.refresh.timer = setTimeout(() => {
      // get current values of readings every x seconds
      this.refresh();
      this.startRefreshInterval();
    }, (delay || this.config.refreshInterval * 1000));
  }

  refresh() {
    const now = Date.now() / 1000;
    if (
      !isAppVisible() ||
      (this.config.refresh.filter
        && this.config.refresh.filter.length < 2)
      || (now - this.states.lastRefresh) < this.config.refreshInterval
    ) { return; }
    log(1, '[refresh] start now');
    window.performance.mark('start refresh');
    this.states.lastRefresh = now;

    // invalidate all readings for detection of outdated ones
    this.readingsMap.forEach(reading => reading.data.invalid = true);
    window.performance.mark('start get jsonlist2');
    this.states.refresh.request =
      this.sendCommand('jsonlist2 ' + this.config.refresh.filter)
        .then(res => res.json())
        .catch(error => this.debugEvents.publish('<u>FHEM Command failed</u><br>' + error))
        .then(fhemJSON => this.parseRefreshResult(fhemJSON),
        );
  }

  parseRefreshResult(fhemJSON = {}) {
    window.performance.mark('end get jsonlist2');
    window.performance.measure('get jsonlist2', 'start get jsonlist2', 'end get jsonlist2');
    window.performance.mark('start read jsonlist2');

    // import the whole fhemJSON
    if (fhemJSON.Results) {
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
        this.debugEvents.publish('Full refresh done in ' +
          duration.toFixed(0) + 'ms for ' +
          paramCount + ' parameter(s)');
      }
      log(1, '[refresh] done');
      this.states.refresh.duration = duration * 1000;
      this.states.refresh.lastTimestamp = new Date();
      this.states.refresh.result = 'ok';
      const now = dateFormat(new Date(), 'YYYY-MM-DD hh:mm:ss');
      this.updateReadingItem('ftui-lastEvent', {
        invalid: false,
        value: '',
        time: now,
        update: now,
      });

      this.onUpdateDone();
    } else {
      const err = 'request failed: Result is null';
      error(1, '[refresh] error ' + err);
      this.states.refresh.result = err;
      this.debugEvents.publish('<u>Refresh ' + err + ' </u><br>');

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
      this.debugEvents.publish(performance);
    }
  }

  parseRefreshResultSection(device, section) {
    for (const reading in section) {
      const parameterId = getReadingID(device, reading);
      let parameter = section[reading];
      if (typeof parameter !== 'object') {
        parameter = {
          'Value': parameter,
          'Time': '',
        };
      }

      // is there a subscription, then check and update components
      if (this.readingsMap.has(parameterId)) {
        const parameterData = this.getReadingItem(parameterId).data;
        const doPublish = (parameterData.value !== parameter.Value || parameterData.time !== parameter.Time);
        const now = dateFormat(new Date(), 'YYYY-MM-DD hh:mm:ss');

        log(5, ['handleUpdate()', ' paramerId=', parameterId, ' value=', parameter.Value,
          ' time=', parameter.Time, ' isUpdate=', doPublish].join(''));

        // write into internal cache object
        parameterData.id = parameterId;
        parameterData.invalid = false;
        parameterData.value = parameter.Value;
        parameterData.time = parameter.Time || now;
        parameterData.update = now

        // update components only if necessary
        this.updateReadingItem(parameterId, parameterData, true);
      }
    }
  }

  connect() {
    if (this.states.connection.websocket) {
      log(3, '[websocket] a valid instance has been found - do not newly connect');
      return;
    }
    if (this.config.debuglevel > 1) {
      this.debugEvents.publish('FHEM connection started');
    }
    this.states.connection.URL = this.config.fhemDir.replace(/^http/i, 'ws') + '?XHR=1&inform=type=status;filter=' +
      this.config.update.filter + ';since=' + this.states.connection.lastEventTimestamp.getTime() + ';fmt=JSON' +
      '&timestamp=' + Date.now();

    log(1, '[websocket] create new connection - URL = ' + this.states.connection.URL);
    this.states.connection.lastEventTimestamp = new Date();

    this.states.connection.websocket = new WebSocket(this.states.connection.URL);
    this.states.connection.websocket.onclose = (event) => {
      let reason;
      if (event.code == 1006) {
        reason = 'The connection was closed abnormally, e.g., without sending or receiving a Close control frame';
      } else { reason = 'Unknown reason'; }
      log(1, '[websocket] closed! reason=' + reason + ' - URL = ' + event.target.url);
      // if current socket closes then restart websocket
      if (event.target.url === this.states.connection.URL) {
        this.debugEvents.publish('Disconnected from FHEM<br>' + reason + '<br>Retry in 5s');
        log(2, '[websocket] disconnected - retry to connect');
        this.reconnect(5);
      }
    };
    this.states.connection.websocket.onerror = (event) => {
      error(1, '[websocket] error event', event);
      if (this.config.debuglevel > 1 && event.target.url === this.states.connection.URL) {
        this.errorEvents.publish('Error with fhem connection');
      }

    };
    this.states.connection.websocket.onmessage = (msg) => {
      this.handleFhemEvent(msg.data);
    };
    log(2, '[websocket] created');
  }

  disconnect() {
    log(2, '[websocket] try to stop connection');
    clearInterval(this.states.connection.timer);
    if (this.states.connection.websocket) {
      if (this.states.connection.websocket.readyState === WebSocket.OPEN) {
        this.states.connection.websocket.close();
      }
      this.states.connection.websocket = null;
      log(2, '[websocket] stopped');
    } else {
      log(2, '[websocket] no connection found');
    }
  }

  reconnect(delay = 0) {
    if (isAppVisible()) {
      log(2, '[websocket] restart connection');
      clearTimeout(this.states.connection.timer);
      this.disconnect();

      this.states.connection.timer = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      log(2, '[websocket] app is not visible => do not restart connection');
    }

  }

  handleFhemEvent(data) {
    data.split(/\n/).forEach(line => {
      if (isDefined(line) && line !== '' && line.endsWith(']') && !this.isFhemWebInternal(line)) {
        const [id, value, html] = JSON.parse(line);
        const isTimestamp = id.match(/-ts$/);
        const parameterId = isTimestamp ? id.replace(/-ts$/, '') : id;
        if (this.readingsMap.has(parameterId)) {
          const parameterData = this.readingsMap.get(parameterId).data;
          const isSTATE = (value !== html);
          const isTrigger = (value === '' && html === '');
          const doPublish = (isTimestamp || isSTATE || isTrigger);

          parameterData.update = dateFormat(new Date(), 'YYYY-MM-DD hh:mm:ss');
          parameterData.id = parameterId;
          parameterData.invalid = false;
          if (isTimestamp) {
            parameterData.time = value;
          } else if (isSTATE) {
            parameterData.time = parameterData.update;
            parameterData.value = value;
          } else if (!isTimestamp) {
            parameterData.value = value;
          }
          this.updateReadingItem(parameterId, parameterData, doPublish);
          this.updateReadingItem('ftui-lastEvent', {
            invalid: false,
            value: parameterData.value,
            time: parameterData.time,
            update: parameterData.update,
          });
        }
      }
    });
    this.states.connection.lastEventTimestamp = new Date();
  }

  updateFhem(cmdLine) {
    if (!this.states.isOffline) {
      this.sendCommand(cmdLine)
        .then(response => log(3, response))
        .catch(error => this.errorEvents.publish('<u>FHEM Command failed</u><br>' + error + '<br>cmd=' + cmdLine));
      this.debugEvents.publish(cmdLine);
    } else {
      this.errorEvents.publish('<u>App is offline</u><br>sendToFhem failed');
    }
  }

  sendCommand(cmdline = '', async = '0') {
    const url = new URL(this.config.fhemDir);
    const params = {
      cmd: cmdline,
      asyncCmd: async,
      fwcsrf: this.config.csrf,
      XHR: '1',
    };
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Basic " + btoa(this.config.username + ':' + this.config.password) );
    const options = {
      headers: myHeaders,
      cache: 'no-cache',
      mode: 'cors'
    };
    url.search = new URLSearchParams(params)
    log(1, '[fhemService] send to FHEM: ' + cmdline);
    return fetch(url, options);
  }

  checkText(response) {
    if (response.status >= 200 && response.status <= 299) {
      return response.text();
    } else {
      throw Error(response.statusText);
    }
  }

  onUpdateDone() {
    triggerEvent('updateDone');
    this.publishInvalidReadings();
  }

  publishInvalidReadings() {
    this.readingsMap.forEach(reading => {
      if (reading.data.invalid) {
        reading.data.update = dateFormat(new Date(), 'YYYY-MM-DD hh:mm:ss');
        reading.events.publish(reading.data);
      }
    })
  }

  fetchCSrf() {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Basic " + btoa(this.config.username + ':' + this.config.password) );
    const options = {
      headers: myHeaders,
      cache: 'no-cache',
      mode: 'cors'
    };
    return fetch(this.config.fhemDir + '?XHR=1', options ) 
        .then(response => {
          this.config.csrf = response.headers.get('X-FHEM-csrfToken');
          log(1, 'Got csrf from FHEM:' + this.config.csrf);
        });
  }

  scheduleHealthCheck() {
    // request dummy fhem event
    if (this.states.connection.websocket &&
      this.states.connection.websocket.readyState === WebSocket.OPEN) {
      this.states.connection.websocket.send('uptime');
    }
    // check in 3 seconds
    setTimeout(() => {
      this.healthCheck();
    }, 3000);
  }

  healthCheck() {
    const timeDiff = new Date() - this.states.connection.lastEventTimestamp;
    if (isAppVisible() && timeDiff / 1000 > 6) {
      log(1, 'No update event since ' + timeDiff / 1000 + 'secondes -> restart connection');
      this.reconnect();
      this.refresh();
    }
  }

}

// instance singleton here
export const fhemService = new FhemService();
