import { Subject, isDefined, log, error, dateFormat, isAppVisible } from './ftui.helper.js';
import { backendService } from './backend.service.js';
import { config, initializeConfig } from '../../config.js';

class IoBrokerService {
  constructor() {
    this.config = {
      ioBrokerEnabled: false,
      ioBrokerUrl: '',
      websocketUrl: '',
      username: '',
      password: '',
      token: '',
      stateEndpoint: '/states',
      writeEndpoint: '/setState',
      writeMethod: 'POST',
      stateQueryParameter: 'pattern',
      writePayload: { id: '$id', state: { val: '$value', ack: false } },
      writeQueryParameters: {},
      refresh: { filter: '' },
      update: { filter: '' },
    };
    this.statesMap = new Map();
    this.states = {
      lastRefresh: 0,
      isOffline: false,
      refresh: { timer: null, request: null },
      websocket: {
        socket: null,
        connecting: null,
        reconnectTimer: null,
        intentionalClose: false,
      },
    };
    this.missingConfigWarningShown = false;
    this.debugEvents = { publish: () => {} };
    this.errorEvents = { publish: () => {} };
    this.init();
  }

  async init() {
    await initializeConfig();
    this.applyConfig(config.ioBroker);
    this.connectWebsocket();
    this.debugEvents = { publish: message => backendService.debugEvents.publish(message) };
    this.errorEvents = { publish: message => backendService.errorEvents.publish(message) };
  }

  setConfig(configValue) {
    const serviceConfig = configValue.ioBroker || {};
    this.config = {
      ...this.config,
      ...configValue,
      ioBrokerEnabled: typeof serviceConfig.enabled === 'boolean'
        ? serviceConfig.enabled : this.config.ioBrokerEnabled,
      ioBrokerUrl: typeof serviceConfig.url === 'string'
        ? serviceConfig.url.trim().replace(/\/$/, '') : this.config.ioBrokerUrl,
      websocketUrl: typeof serviceConfig.websocketUrl === 'string'
        ? serviceConfig.websocketUrl.trim().replace(/\/$/, '') : this.config.websocketUrl,
      username: typeof serviceConfig.username === 'string' ? serviceConfig.username : this.config.username,
      password: typeof serviceConfig.password === 'string' ? serviceConfig.password : this.config.password,
      token: typeof serviceConfig.token === 'string' ? serviceConfig.token.trim() : this.config.token,
      stateEndpoint: typeof serviceConfig.stateEndpoint === 'string'
        ? serviceConfig.stateEndpoint : this.config.stateEndpoint,
      writeEndpoint: typeof serviceConfig.writeEndpoint === 'string'
        ? serviceConfig.writeEndpoint : this.config.writeEndpoint,
      writeMethod: typeof serviceConfig.writeMethod === 'string'
        ? serviceConfig.writeMethod.toUpperCase() : this.config.writeMethod,
      stateQueryParameter: typeof serviceConfig.stateQueryParameter === 'string'
        ? serviceConfig.stateQueryParameter : this.config.stateQueryParameter,
      writePayload: Object.prototype.hasOwnProperty.call(serviceConfig, 'writePayload')
        && (serviceConfig.writePayload === null || typeof serviceConfig.writePayload === 'object')
        ? serviceConfig.writePayload : this.config.writePayload,
      writeQueryParameters: serviceConfig.writeQueryParameters
        && typeof serviceConfig.writeQueryParameters === 'object'
        ? serviceConfig.writeQueryParameters : this.config.writeQueryParameters,
      refresh: { ...this.config.refresh, ...(configValue.refresh || {}) },
      update: { ...this.config.update, ...(configValue.update || {}) },
    };
  }

  applyConfig(serviceConfig = {}) {
    this.setConfig({ ioBroker: serviceConfig });
  }

  isConfigured() {
    return this.config.ioBrokerEnabled === true && Boolean(this.config.ioBrokerUrl);
  }

  getReadingEvents(stateId) {
    if (!isDefined(stateId)) return { subscribe: () => {}, unsubscribe: () => {} };
    const events = this.getStateItem(stateId).events;
    this.connectWebsocket();
    if (this.states.websocket.socket && this.states.websocket.socket.connected) {
      this.subscribeWebsocketStates();
    }
    return events;
  }

  getStateItem(stateId) {
    if (!this.statesMap.has(stateId)) {
      this.statesMap.set(stateId, {
        data: { id: 'io-' + stateId },
        events: new Subject(),
      });
    }
    return this.statesMap.get(stateId);
  }

  updateStateItem(stateId, newData, publish = true) {
    const item = this.getStateItem(stateId);
    item.data = Object.assign(item.data, newData);
    if (publish) item.events.publish(item.data);
  }

  createFilterParameter() {
    const states = Array.from(this.statesMap.keys());
    this.config.update.filter = states.join(',');
    return states;
  }

  requestOptions() {
    const headers = { Accept: 'application/json' };
    if (this.config.token) headers.Authorization = 'Bearer ' + this.config.token;
    const options = { cache: 'no-cache', headers };
    if (!this.config.token && (this.config.username || this.config.password)) {
      headers.Authorization = 'Basic ' + btoa(this.config.username + ':' + this.config.password);
    }
    return options;
  }

  resolveWritePayload(value, stateId, parsedValue) {
    if (typeof value === 'string') {
      if (value === '$id') return stateId;
      if (value === '$value') return parsedValue;
      return value.replace(/\$id/g, stateId).replace(/\$value/g, String(parsedValue));
    }
    if (Array.isArray(value)) return value.map(item => this.resolveWritePayload(item, stateId, parsedValue));
    if (value && typeof value === 'object') {
      return Object.keys(value).reduce((result, key) => {
        result[key] = this.resolveWritePayload(value[key], stateId, parsedValue);
        return result;
      }, {});
    }
    return value;
  }

  endpoint(path, stateId) {
    const resolved = String(path || '').replace('{id}', encodeURIComponent(stateId || ''));
    return this.config.ioBrokerUrl + (resolved.charAt(0) === '/' ? resolved : '/' + resolved);
  }

  isWebsocketConfigured() {
    return this.config.ioBrokerEnabled === true && Boolean(this.config.websocketUrl);
  }

  loadWebsocketClient() {
    if (window.io && typeof window.io.connect === 'function') return Promise.resolve();
    if (this.websocketClientRequest) return this.websocketClientRequest;

    this.websocketClientRequest = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = this.config.websocketUrl + '/socket.io/socket.io.js';
      script.onload = () => {
        if (window.io && typeof window.io.connect === 'function') {
          resolve();
        } else {
          reject(new Error('ioBroker websocket client did not load'));
        }
      };
      script.onerror = () => reject(new Error('Cannot load ioBroker websocket client'));
      document.head.appendChild(script);
    }).catch(loadError => {
      this.websocketClientRequest = null;
      throw loadError;
    });
    return this.websocketClientRequest;
  }

  subscribeWebsocketStates() {
    const socket = this.states.websocket.socket;
    if (!socket || !socket.connected) return;
    const stateIds = Array.from(this.statesMap.keys());
    if (stateIds.length) socket.emit('subscribe', stateIds);
  }

  scheduleWebsocketReconnect() {
    if (this.states.websocket.intentionalClose || this.states.websocket.reconnectTimer) return;
    this.states.websocket.reconnectTimer = setTimeout(() => {
      this.states.websocket.reconnectTimer = null;
      this.connectWebsocket();
    }, 5000);
  }

  connectWebsocket() {
    if (!this.isWebsocketConfigured() || !this.statesMap.size
      || this.states.websocket.socket || this.states.websocket.connecting) return;

    this.states.websocket.intentionalClose = false;
    this.states.websocket.connecting = this.loadWebsocketClient().then(() => {
      if (this.states.websocket.socket) return;
      const socket = window.io.connect(this.config.websocketUrl, {
        path: '/socket.io',
        query: 'ws=true',
        name: 'ftui',
        token: this.config.token || undefined,
        transports: ['websocket'],
        reconnection: false,
      });
      this.states.websocket.socket = socket;

      const authenticate = () => {
        socket.emit('authenticate', (isAuthenticated) => {
          if (!isAuthenticated) {
            this.errorEvents.publish('ioBroker websocket authentication failed');
            return;
          }
          this.debugEvents.publish({ backend: 'io', connectionStatus: 'connected' });
          this.debugEvents.publish({ text: 'ioBroker websocket connected', level: 1 });
          this.subscribeWebsocketStates();
        });
      };

      socket.on('connect', authenticate);
      socket.on('reauthenticate', authenticate);
      socket.on('stateChange', (stateId, state) => {
        if (this.statesMap.has(stateId)) {
          this.updateStateItem(stateId, this.parseState(stateId, state));
        }
      });
      socket.on('disconnect', () => {
        this.states.websocket.socket = null;
        if (!this.states.websocket.intentionalClose) {
          this.debugEvents.publish({ text: 'ioBroker websocket disconnected<br>Retry in 5s', level: 1 });
          this.scheduleWebsocketReconnect();
        }
      });
      socket.on('connect_error', connectionError => {
        error(1, '[ioBroker] websocket connection failed', connectionError);
      });
      socket.on('error', socketError => {
        error(1, '[ioBroker] websocket error', socketError);
      });
    }).catch(connectionError => {
      error(1, '[ioBroker] websocket setup failed', connectionError);
      this.scheduleWebsocketReconnect();
    }).finally(() => {
      this.states.websocket.connecting = null;
    });
  }

  normalizeStates(payload) {
    payload = payload && payload.result ? payload.result : payload;
    if (Array.isArray(payload)) {
      return payload.map(item => [item.id || item._id || item.entity_id, item]).filter(item => item[0]);
    }
    return Object.entries(payload || {});
  }

  parseState(stateId, state) {
    const value = state && Object.prototype.hasOwnProperty.call(state, 'val') ? state.val : state;
    const timestamp = state && (state.ts || state.lc);
    return {
      id: 'io-' + stateId,
      device: 'io',
      reading: stateId,
      value,
      val: value,
      state: value,
      ack: state && state.ack,
      ts: timestamp,
      lc: state && state.lc,
      q: state && state.q,
      from: state && state.from,
      time: timestamp ? new Date(timestamp).toISOString() : dateFormat(new Date(), 'YYYY-MM-DD hh:mm:ss'),
      update: dateFormat(new Date(), 'YYYY-MM-DD hh:mm:ss'),
      invalid: false,
    };
  }

  async refresh() {
    if (!this.isConfigured() || !this.statesMap.size || !isAppVisible()) {
      if (this.statesMap.size && !this.isConfigured() && !this.missingConfigWarningShown) {
        this.missingConfigWarningShown = true;
        this.errorEvents.publish('ioBroker bindings are active but ioBroker is not configured');
      }
      return;
    }
    if (this.states.refresh.request) return this.states.refresh.request;

    const ids = this.createFilterParameter();
    if (!ids.length) return;
    this.states.refresh.request = (async () => {
      const stateIds = this.config.stateQueryParameter === 'pattern' ? ids : [ids.join(',')];
      const payloads = await Promise.all(stateIds.map(async stateId => {
        const url = new URL(this.endpoint(this.config.stateEndpoint));
        if (this.config.stateQueryParameter) {
          url.searchParams.set(this.config.stateQueryParameter, stateId);
        }
        const response = await fetch(url, this.requestOptions());
        if (!response.ok) {
          const responseText = await response.text();
          const detail = responseText ? ': ' + responseText.slice(0, 300) : '';
          throw new Error((response.status + ' ' + (response.statusText || 'ioBroker request failed')) + detail);
        }
        return response.json();
      }));
      payloads.forEach(payload => this.normalizeStates(payload).forEach(([stateId, state]) => {
        if (this.statesMap.has(stateId)) this.updateStateItem(stateId, this.parseState(stateId, state));
      }));
      this.states.lastRefresh = Date.now() / 1000;
      this.debugEvents.publish({ text: 'ioBroker refresh completed', level: 3 });
    })().catch(refreshError => {
      this.errorEvents.publish('<u>ioBroker refresh failed</u><br>' + refreshError);
      error(1, '[ioBroker] refresh failed', refreshError);
    }).finally(() => {
      this.states.refresh.request = null;
    });
    return this.states.refresh.request;
  }

  async sendCommand(command) {
    if (!this.isConfigured()) throw new Error('ioBroker is not configured');
    const parts = String(command).trim().split(/\s+/);
    const stateId = parts.shift();
    const value = parts.join(' ');
    if (!stateId || !value) throw new Error('ioBroker command requires a state ID and value');
    let parsedValue = value;
    if (value === 'true' || value === 'false') parsedValue = value === 'true';
    else if (value !== '' && !isNaN(value)) parsedValue = Number(value);
    const options = this.requestOptions();
    options.method = this.config.writeMethod;
    const url = new URL(this.endpoint(this.config.writeEndpoint, stateId));
    Object.keys(this.config.writeQueryParameters).forEach(key => {
      const parameter = this.resolveWritePayload(this.config.writeQueryParameters[key], stateId, parsedValue);
      url.searchParams.set(key, String(parameter));
    });
    if (this.config.writePayload !== null
      && options.method !== 'GET' && options.method !== 'HEAD') {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(this.resolveWritePayload(this.config.writePayload, stateId, parsedValue));
    }
    const response = await fetch(url, options);
    if (!response.ok) {
      const responseText = await response.text();
      const detail = responseText ? ': ' + responseText.slice(0, 300) : '';
      const commandError = new Error((response.status + ' ' + (response.statusText || 'ioBroker command failed')) + detail);
      this.errorEvents.publish('<u>ioBroker command failed</u><br>' + commandError);
      throw commandError;
    }
    this.debugEvents.publish({
      text: 'ioBroker command sent: ' + stateId + ' = ' + parsedValue,
      level: 2,
    });
    return response;
  }

  forceRefresh() { return this.refresh(); }
  disconnect() {
    this.states.websocket.intentionalClose = true;
    clearTimeout(this.states.websocket.reconnectTimer);
    this.states.websocket.reconnectTimer = null;
    if (this.states.websocket.socket) {
      this.states.websocket.socket.close();
      this.states.websocket.socket = null;
    }
  }
  scheduleHealthCheck() {}
}

export const ioBrokerService = new IoBrokerService();
