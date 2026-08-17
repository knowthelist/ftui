import { Subject, isDefined, log, error, dateFormat, isAppVisible } from './ftui.helper.js';
import { backendService } from './backend.service.js';
import { config, initializeConfig } from '../../config.js';

class IoBrokerService {
  constructor() {
    this.config = {
      ioBrokerEnabled: false,
      ioBrokerUrl: '',
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
    };
    this.missingConfigWarningShown = false;
    this.debugEvents = { publish: () => {} };
    this.errorEvents = { publish: () => {} };
    this.init();
  }

  async init() {
    await initializeConfig();
    this.applyConfig(config.ioBroker);
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
    return this.getStateItem(stateId).events;
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
    const ids = this.createFilterParameter();
    if (!ids.length) return;
    try {
      const url = new URL(this.endpoint(this.config.stateEndpoint));
      if (this.config.stateQueryParameter) {
        url.searchParams.set(this.config.stateQueryParameter, ids.join(','));
      }
      const response = await fetch(url, this.requestOptions());
      if (!response.ok) throw new Error(response.statusText || 'ioBroker request failed');
      const payload = await response.json();
      this.normalizeStates(payload).forEach(([stateId, state]) => {
        if (this.statesMap.has(stateId)) this.updateStateItem(stateId, this.parseState(stateId, state));
      });
      this.states.lastRefresh = Date.now() / 1000;
      this.debugEvents.publish('ioBroker refresh completed');
    } catch (refreshError) {
      this.errorEvents.publish('<u>ioBroker refresh failed</u><br>' + refreshError);
      error(1, '[ioBroker] refresh failed', refreshError);
    }
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
    if (!response.ok) throw new Error(response.statusText || 'ioBroker command failed');
    return response;
  }

  forceRefresh() { return this.refresh(); }
  disconnect() {}
  scheduleHealthCheck() {}
}

export const ioBrokerService = new IoBrokerService();
