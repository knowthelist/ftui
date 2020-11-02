
import * as ftui from './ftui.helper.js';
import { Subject } from './ftui.subject.js';

class FhemService {
  constructor() {

    this.config = {
      enableDebug: false,
      fhemDir: '',
      debuglevel: 0,
      refreshInterval: 0,
      refresh: {},
      update: {},
    };
    this.states = {
      lastRefresh: 0,
      fhemConnectionIsRestarting: false,
      isOffline: false,
      refresh: {
        lastTimestamp: new Date(),
        timer: null,
        request: null,
        result: null
      },
      connection: {
        lastEventTimestamp: new Date(),
        timer: null,
        result: null
      }
    };


    // define debounced function
    this.debouncedUpdateFhem = ftui.debounce(this.updateFhem, this);

    this.debugEvents = new Subject();
    this.errorEvents = new Subject();

    this.readings = new Map();
  }

  setConfig(config) {
    Object.assign(this.config, config);
  }

  getReadingEvents(readingName) {
    if (ftui.isDefined(readingName)) {
      const [readingId, device, reading] = ftui.parseReadingId(readingName);
      if (!this.readings.has(readingId)) {
        this.readings.set(readingId, { data: { id: readingId }, events: new Subject(), device: device, reading: reading });
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
      return {};
    }
  }

  updateReadingValue(readingID, value) {
    const read = this.readings.get(readingID);

    if (read?.data) {
      const now = ftui.dateFormat(new Date(), 'YYYY-MM-DD hh:mm:ss');
      read.data.id = readingID;
      read.data.invalid = false;
      read.data.value = value;
      read.data.time = now;
      read.data.update = now
      read.events.publish(read.data);
    }
  }

  updateReadingData(readingID, readingData, doPublish) {
    ftui.log(3, 'updateReadingData - update for ', readingID, 'readingData=', readingData, 'doPublish=', doPublish);
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
    this.startRefreshInterval(1000);
    this.reconnect(5);
  }

  startRefreshInterval(delay) {
    ftui.log(1, 'refresh: start in (ms):' + (delay || this.config.refreshInterval * 1000));
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
      this.config.refresh.filter
      && this.config.refresh.filter.length < 2
      || (now - this.states.lastRefresh) < this.config.refreshInterval
    ) { return; }
    ftui.log(1, 'start refresh');
    window.performance.mark('start refresh');
    this.states.lastRefresh = now;

    // invalidate all readings for detection of outdated ones
    this.readings.forEach(reading => reading.data.invalid = true);

    window.performance.mark('start get jsonlist2');
    this.states.refresh.request =
      this.sendCommand('jsonlist2 ' + this.config.refresh.filter)
        .then(res => res.json())
        .then(fhemJSON => this.parseRefreshResult(fhemJSON)
        );
  }

  parseRefreshResult(fhemJSON) {
    window.performance.mark('end get jsonlist2');
    window.performance.measure('get jsonlist2', 'start get jsonlist2', 'end get jsonlist2');
    window.performance.mark('start read jsonlist2');

    // import the whole fhemJSON
    if (fhemJSON?.Results) {
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
      ftui.log(1, 'refresh: Done');
      this.states.refresh.duration = duration * 1000;
      this.states.refresh.lastTimestamp = new Date();
      this.states.refresh.result = 'ok';

      this.onUpdateDone();
    } else {
      const err = 'request failed: Result is null';
      ftui.log(1, 'refresh: ' + err);
      this.states.refresh.result = err;
      this.errorEvents.publish('<u>Refresh ' + err + ' </u><br>');

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
      const parameterId = ftui.getReadingID(device, reading);
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

        ftui.log(5, ['handleUpdate()', ' paramerId=', parameterId, ' value=', parameter.Value,
          ' time=', parameter.Time, ' isUpdate=', doPublish].join(''));

        // write into internal cache object
        parameterData.id = parameterId;
        parameterData.invalid = false;
        parameterData.value = parameter.Value;
        parameterData.time = parameter.Time || now;
        parameterData.update = now

        // update components only if necessary
        this.updateReadingData(parameterId, parameterData, doPublish);
      }
    }
  }

  connect() {
    if (this.states.connection.websocket) {
      ftui.log(3, 'A valid instance of websocket has been found');
      return;
    }
    if (this.config.debuglevel > 1) {
      this.debugEvents.publish('FHEM connection started');
    }
    this.states.connection.URL = this.config.fhemDir.replace(/^http/i, 'ws') + '?XHR=1&inform=type=status;filter=' +
      this.config.update.filter + ';since=' + this.states.connection.lastEventTimestamp.getTime() + ';fmt=JSON' +
      '&timestamp=' + Date.now();

    ftui.log(1, 'websockets URL=' + this.states.connection.URL);
    this.states.connection.lastEventTimestamp = new Date();

    this.states.connection.websocket = new WebSocket(this.states.connection.URL);
    this.states.connection.websocket.onclose = (event) => {
      let reason;
      if (event.code == 1006) {
        reason = 'The connection was closed abnormally, e.g., without sending or receiving a Close control frame';
      } else { reason = 'Unknown reason'; }
      ftui.log(1, 'websocket (url=' + event.target.url + ') closed!  reason=' + reason);
      // if current socket closes then restart websocket
      if (event.target.url === this.states.connection.URL) {
        this.debugEvents.publish('Disconnected from FHEM<br>' + reason + '<br>Retry in 5s');
        this.reconnect(5);
      }
    };
    this.states.connection.websocket.onerror = (event) => {
      ftui.log(1, 'Error with fhem connection');
      if (this.config.debuglevel > 1 && event.target.url === this.states.connection.URL) {
        this.errorEvents.publish('Error with fhem connection');
      }

    };
    this.states.connection.websocket.onmessage = (msg) => {
      this.handleFhemEvent(msg.data);
    };
  }

  disconnect() {
    ftui.log(2, 'stopFhemConnection');
    clearInterval(this.states.connection.timer);
    clearInterval(this.states.refresh.timer);

    if (this.states.connection.websocket) {
      if (this.states.connection.websocket.readyState === WebSocket.OPEN) {
        this.states.connection.websocket.close();
      }
      this.states.connection.websocket = null;
      ftui.log(2, 'stopped websocket');
    }
  }

  reconnect(delay = 0) {
    ftui.log(2, 'restart FHEM connection');
    clearTimeout(this.states.connection.timer);

    this.disconnect();

    this.states.connection.timer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  handleFhemEvent(data) {
    data.split(/\n/).forEach(line => {
      if (ftui.isDefined(line) && line !== '' && line.endsWith(']') && !this.isFhemWebInternal(line)) {
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
          parameterData.invalid = false;
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
    this.states.connection.lastEventTimestamp = new Date();
  }

  updateFhem(cmdLine) {
    if (!this.states.isOffline) {
      this.sendCommand(cmdLine)
        .then(response => ftui.log(3, response))
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
      XHR: '1'
    };
    url.search = new URLSearchParams(params)
    const dataType = (cmdline.substr(0, 8) === 'jsonlist') ? 'application/json' : 'text/plain"';
    ftui.log(1, 'send to FHEM: ' + cmdline);
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
    ftui.triggerEvent('updateDone');
    this.publishInvalidReadings();
  }

  publishInvalidReadings() {
    this.readings.forEach(reading => {
      if (reading.data.invalid) {
        reading.data.update = ftui.dateFormat(new Date(), 'YYYY-MM-DD hh:mm:ss');
        reading.events.publish(reading.data);
      }
    })
  }

  fetchCSrf() {
    return fetch(this.config.fhemDir + '?XHR=1', {
      cache: 'no-cache'
    })
      .then(response => {
        this.config.csrf = response.headers.get('X-FHEM-csrfToken');
        ftui.log(1, 'Got csrf from FHEM:' + this.config.csrf);
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
    if (timeDiff / 1000 > 60) {
      ftui.log(1, 'No update event since ' + timeDiff / 1000 + 'secondes -> restart connection');
      this.reconnect();
    }
  }

}

// instance singleton here
export const fhemService = new FhemService();
