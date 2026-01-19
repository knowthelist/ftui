/**

  Home Assistant Service for FTUI
*
* Copyright (c) 2025 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*
* https://github.com/knowthelist/ftui
*
* Add this to your configuration.yaml to allow connections from FTUI:

  http:
    cors_allowed_origins:
      - http://fhem.home.arpa:8083
      - http://fhem:8083
    use_x_forwarded_for: true
    trusted_proxies:
      - 172.168.101.0/24
*/

import {
  Subject, debounce, isDefined,
  log, error,
  dateFormat,
  isAppVisible,
} from './ftui.helper.js';
import { backendService } from './backend.service.js';
import { config, initializeConfig } from '../../config.js';

class HomeAssistantService {
  constructor() {
    this.init();
  }

  async init() {

    this.config = {
      refresh: {
        filter: ''
      },
      update: {
        filter: ''
      },
    };

    await initializeConfig();

    this.config.haUrl = config.homeAssistant.url;
    this.config.token = config.homeAssistant.token;
    this.pendingSubscriptions = new Set();

    this.states = {
      lastRefresh: 0,
      haConnectionIsRestarting: false,
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

    this.statesMap = new Map();
    this.messageId = 1;
    this.subscriptionCallbacks = new Map();

    // Helper methods for events
    this.debugEvents = {
      publish: (msg) => backendService.debugEvents.publish(msg)
    };
    this.errorEvents = {
      publish: (msg) => backendService.errorEvents.publish(msg)
    };

    // define debounced function
    this.debouncedUpdateHA = debounce(this.updateHA, this);

    this._serviceHandlers = {
      light: this._handleLightCommand.bind(this),
      switch: this._handleSwitchCommand.bind(this),
      media_player: this._handleMediaPlayerCommand.bind(this),
      number: this._handleNumberCommand.bind(this)
    };
  }
  
  setConfig(config) {
    this.config = {
      ...this.config,
      ...config,
      refresh: {
        ...this.config.refresh,
        ...(config.refresh || {}),
      },
      update: {
        ...this.config.update,
        ...(config.update || {}),
      }
    };
  }

  createFilterParameter() {
    // Get all entities that have active observers (subscriptions)
    const entitiesArray = Array.from(this.statesMap.values())
      .filter(value => value.events.observers.length > 0);
    // Get unique domains and entities
    const domains = [... new Set(entitiesArray.map(value => value.domain))];
    const entities = [... new Set(entitiesArray.map(value => value.domain + '.' + value.entity))];
    // Store filters in config
    this.config.update.filter = entities.join(',');

    // force Refresh on next call
    this.states.lastRefresh = 0;
    log(2, '[haService] - created filter with ' + entities.length + ' entities for domains: ' + domains.join(','));
    return entities;
  }

  getStateEvents(entityId) {
    if (isDefined(entityId)) {
      const stateItem = this.getStateItem(entityId);
      return stateItem.events;
    } else {
      return { subscribe: () => { }, unsubscribe: () => { } }
    }
  }

  getReadingEvents(entityId) {
    // Subscribe to entity state changes
    this.subscribeToEvents(entityId);
    // Return the subject that will receive state updates
    return this.getStateEvents(entityId);
  }

  getStateItem(entityId) {
    if (!this.statesMap.has(entityId)) {
      this.statesMap.set(entityId, {
        data: { id: entityId },
        events: new Subject(),
        domain: entityId.split('.')[0],
        entity: entityId.split('.')[1]
      });
    }
    return this.statesMap.get(entityId);
  }

  updateStateItem(entityId, newData, doPublish = true) {
    log(3, 'HAService.updateStateItem - update for ', entityId, 'newData=', newData, 'doPublish=', doPublish);
    const stateItem = this.getStateItem(entityId);
    if (stateItem.data) {
      stateItem.data = Object.assign(stateItem.data, newData);
      if (doPublish) {
        stateItem.events.publish(stateItem.data);
      }
    }
  }

  subscribeToEvents(entityIds) {
    const entitiesToSubscribe = Array.isArray(entityIds) ? entityIds : [entityIds];

    // Add to pending subscriptions
    entitiesToSubscribe.forEach(entityId => {
      this.pendingSubscriptions.add(entityId);
      // Initialize the state map entry
      this.getStateItem(entityId);
    });

    // If we're not connected or authenticating, initiate connection
    if (!this.states.connection.websocket ||
      this.states.connection.websocket.readyState !== WebSocket.OPEN) {
      log(1, '[websocket] No active connection, attempting to connect...');
      this.connect();
      return;
    }

    // If we're connected and authenticated, subscribe immediately
    this.processPendingSubscriptions();
  }

  processPendingSubscriptions() {
    if (this.pendingSubscriptions.size === 0) {
      return;
    }

    const subscriptionMessage = {
      id: this.messageId++,
      type: 'subscribe_entities',
      entity_ids: Array.from(this.pendingSubscriptions)
    };

    log(2, '[websocket] Subscribing to entities:', Array.from(this.pendingSubscriptions));
    this.states.connection.websocket.send(JSON.stringify(subscriptionMessage));

    // Store callback for this subscription
    this.subscriptionCallbacks.set(subscriptionMessage.id, {
      entityIds: Array.from(this.pendingSubscriptions),
      callback: (event) => this.handleStateChange(event)
    });

    // Clear pending subscriptions
    this.pendingSubscriptions.clear();
  }

  handleStateChange(event) {
    if (event.type === 'event' && event.event.event_type === 'state_changed') {
      const { entity_id, new_state, old_state } = event.event.data;

      if (this.statesMap.has(entity_id)) {
        const now = dateFormat(new Date(), 'YYYY-MM-DD hh:mm:ss');
        // Format state data to match FHEM event structure that components expect
        const stateData = {
          id: 'ha-' + entity_id,  // Add ha. prefix back to match subscription
          device: entity_id.split('.')[0],
          reading: entity_id.split('.')[1],
          value: new_state.state,
          time: new_state.last_updated,
          update: now,
          state: new_state.state,
          old_state: old_state ? old_state.state : undefined,
          invalid: false,
          ...new_state.attributes || {} // Flatten attributes directly into stateData
        };

        log(3, '[websocket] State change for:', entity_id, 'New value:', new_state.state);
        this.updateStateItem(entity_id, stateData);

        // Update last event
        this.updateStateItem('ha-lastEvent', {
          invalid: false,
          name: entity_id,
          value: new_state.state,
          time: new_state.last_updated,
          update: now
        });
      }
    }
  }

  connect() {
    if (this.states.connection.websocket) {
      log(3, '[websocket] a valid instance has been found - do not newly connect');
      return;
    }

    const auth = {
      type: 'auth',
      access_token: this.config.token
    };

    const url = this.config.haUrl.replace(/^http/i, 'ws') + '/api/websocket';
    log(2, '[websocket] connecting to Home Assistant at ' + url);
    this.states.connection.websocket = new WebSocket(url);
    this.states.connection.websocket.onopen = () => {
      log(2, '[websocket] connected - send auth');
      this.states.connection.websocket.send(JSON.stringify(auth));
    };

    this.states.connection.websocket.onclose = (event) => {
      log(1, '[websocket] closed! - URL = ' + event.target.url);
      if (event.target.url === url) {
        backendService.debugEvents.publish('Disconnected from Home Assistant<br>Retry in 5s');
        this.reconnect(5);
      }
    };

    this.states.connection.websocket.onerror = (event) => {
      error(1, '[websocket] error event', event);
      if (this.config.debuglevel > 1) {
        backendService.errorEvents.publish('Error with Home Assistant connection');
      }
    };

    this.states.connection.websocket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      log(2, '[websocket] message received', data);
      this.handleHAEvent(data);
    };
  }

  createStateData(entityId, value, timestamp, attributes = {}) {
    const now = dateFormat(new Date(), 'YYYY-MM-DD hh:mm:ss');
    return {
      id: 'ha-' + entityId,
      device: entityId.split('.')[0],
      reading: entityId.split('.')[1],
      value: value,
      time: timestamp || now,
      update: now,
      state: value,
      invalid: false,
      ...attributes
    };
  }

  updateLastEvent(entityId, value, timestamp, context = null) {
    const now = dateFormat(new Date(), 'YYYY-MM-DD hh:mm:ss');
    this.updateStateItem('ha-lastEvent', {
      invalid: false,
      name: entityId,
      value: value,
      time: timestamp || now,
      update: now,
      ...(context ? { context } : {})
    });
  }

  handleAuthResult(data) {
    if (data.type === 'auth_ok') {
      log(2, '[websocket] Authentication successful');
      this.resubscribeEntities();
      this.processPendingSubscriptions();
      return true;
    }
    if (data.type === 'auth_invalid') {
      error(1, '[websocket] Authentication failed');
      this.errorEvents.publish('Authentication failed with Home Assistant');
      return true;
    }
    return false;
  }

  handleGetStates(data) {
    if (!(data.type === 'result' && Array.isArray(data.result))) {
      return false;
    }

    const now = dateFormat(new Date(), 'YYYY-MM-DD hh:mm:ss');
    this.states.lastRefresh = now;

    data.result
      .filter(state => this.statesMap.has(state.entity_id))
      .forEach(state => {
        const stateData = this.createStateData(
          state.entity_id,
          state.state,
          state.last_updated,
          state.attributes || {}
        );

        log(3, '[websocket] Refresh state for:', state.entity_id, 'Value:', state.state);
        this.updateStateItem(state.entity_id, stateData);
      });

    log(2, '[refresh] Completed refresh of ' + data.result.length + ' entities');
    this.debugEvents.publish('Refresh completed');
    return true;
  }

  handleInitialStates(data) {
    if (!(data.type === 'event' && data.event && data.event.a)) {
      return false;
    }

    Object.entries(data.event.a).forEach(([entityId, state]) => {
      if (this.statesMap.has(entityId)) {
        const timestamp = state.lc ?
          dateFormat(new Date(state.lc * 1000), 'YYYY-MM-DD hh:mm:ss') :
          null;

        const stateData = this.createStateData(
          entityId,
          state.s,
          timestamp,
          state.a || {}
        );

        log(3, '[websocket] Initial state for:', entityId, 'Value:', state.s);
        this.updateStateItem(entityId, stateData);
        this.updateLastEvent(entityId, state.s, timestamp);
      }
    });

    this.states.lastRefresh = dateFormat(new Date(), 'YYYY-MM-DD hh:mm:ss');
    return true;
  }

  handleStateChanges(data) {
    if (!(data.event && data.event.c)) {
      return false;
    }

    Object.entries(data.event.c).forEach(([entityId, change]) => {
      if (entityId.includes('.') && this.statesMap.has(entityId)) {
        const eventData = change['+'];
        const timestamp = eventData.lc ?
          dateFormat(new Date(eventData.lc * 1000), 'YYYY-MM-DD hh:mm:ss') :
          null;

        const stateData = this.createStateData(
          entityId,
          eventData.s,
          timestamp,
          eventData.a || {}
        );

        log(3, '[websocket] State change for:', entityId, 'New value:', eventData.s);
        this.updateStateItem(entityId, stateData);
        this.updateLastEvent(entityId, eventData.s, timestamp, eventData.c);
      }
    });
    return true;
  }

  handleHAEvent(data) {
    log(2, '[websocket] handleHAEvent', data);

    // Chain of responsibility pattern
    return this.handleAuthResult(data) ||
      this.handleGetStates(data) ||
      this.handleInitialStates(data) ||
      this.handleStateChanges(data) ||
      this.handlePing(data);
  }

  handlePing(data) {
    if (data.type === 'pong') {
      log(3, '[websocket] Received pong response');
      return true;
    }
    return false;
  }
  // Helper method to resubscribe to entities after reconnection
  resubscribeEntities() {
    const entityIds = new Set();
    this.statesMap.forEach((value, key) => {
      if (value.events.observers.length > 0) {
        entityIds.add(key);
      }
    });

    if (entityIds.size > 0) {
      log(2, '[websocket] Resubscribing to entities:', Array.from(entityIds));
      this.subscribeToEvents(Array.from(entityIds));
    }
  }

  /**
   * Send a command to Home Assistant services API
   * @param {string} domain - The domain (e.g., 'light', 'switch', 'input_boolean')
   * @param {string} service - The service to call (e.g., 'turn_on', 'turn_off', 'toggle')
   * @param {Object} data - Service data including entity_id and any additional parameters
   * @returns {Promise} Response from HA API
   */
  async sendCommand(domain, service, data = {}) {
    if (this.states.isOffline) {
      this.errorEvents.publish('<u>App is offline</u><br>Command to HA failed');
      return;
    }

    try {
      const response = await fetch(`${this.config.haUrl}/api/services/${domain}/${service}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      this.debugEvents.publish(`Called ${domain}.${service} with ${JSON.stringify(data)}`);
      return result;
    } catch (error) {
      this.errorEvents.publish('<u>HA Command failed</u><br>' + error);
      throw error;
    }
  }

  _hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    const bigint = parseInt(hex, 16);
    return [
      (bigint >> 16) & 255,
      (bigint >> 8) & 255,
      bigint & 255
    ];
  }

  _handleLightCommand(entity, args) {
    let action = 'turn_on';
    let params = { entity_id: entity };
    const command = args[0] ? args[0].toLowerCase() : '';

    switch (command) {
      case 'off':
        action = 'turn_off';
        break;
      case 'on':
        action = 'turn_on';
        break;
      case 'toggle':
        action = 'toggle';
        break;
      case 'brightness':
        action = 'turn_on';
        params.brightness = parseInt(args[1]);
        break;
      default:
        if (args[0] && args[0].startsWith('#')) {
          action = 'turn_on';
          params.rgb_color = this._hexToRgb(args[0]);
        }
    }

    return { service: 'light', action, params };
  }

  _handleSwitchCommand(entity, args) {
    let action = 'turn_on';
    const command = args[0] ? args[0].toLowerCase() : '';

    switch (command) {
      case 'off':
        action = 'turn_off';
        break;
      case 'on':
        action = 'turn_on';
        break;
      case 'toggle':
        action = 'toggle';
        break;
      default:
        action = 'turn_on';
    }

    return { service: 'switch', action, params: { entity_id: entity } };
  }

  _handleMediaPlayerCommand(entity, args) {
    const command = args[0];
    let action = 'turn_on';
    let params = { entity_id: entity };

    if (!command) {
      return { service: 'media_player', action, params };
    }

    const lowerCommand = command.toLowerCase();
    
    // Check for standard media control commands
    switch (lowerCommand) {
      case 'off':
      case 'turn_off':
        action = 'turn_off';
        break;
      case 'on':
      case 'turn_on':
        action = 'turn_on';
        break;
      case 'play':
        action = 'media_play';
        break;
      case 'pause':
        action = 'media_pause';
        break;
      case 'stop':
        action = 'media_stop';
        break;
      case 'next':
      case 'next_track':
        action = 'media_next_track';
        break;
      case 'previous':
      case 'prev':
      case 'previous_track':
        action = 'media_previous_track';
        break;
      default:
        // Assume it's a source selection
        action = 'select_source';
        params.source = command;
        break;
    }

    return { service: 'media_player', action, params };
  }

  _handleNumberCommand(entity, args) {
    return {
      service: 'number',
      action: 'set_value',
      params: {
        entity_id: entity,
        value: parseFloat(args[0])
      }
    };
  }

  /**
   * Helper method to parse command strings and call appropriate HA services
   * Example commands:
   * - "light.turn_on entity_id=light.living_room brightness=255"
   * - "switch.toggle entity_id=switch.kitchen"
   * @param {string} command - Command string in format "domain.service key1=value1 key2=value2"
   */
  async parseAndSendCommand(command) {
    try {
      const [entity, ...args] = command.split(' ');
      const domain = entity.split('.')[0];  // e.g., 'light' from 'light.kitchen'

      // Get the appropriate service handler or use default parameter parsing
      const handler = this._serviceHandlers[domain];
      if (handler) {
        const { service, action, params } = handler(entity, args);
        return await this.sendCommand(domain, action, params);
      }

      // Default parameter parsing for domains without specific handlers
      // Format: domain.entity action param1=value1 param2=value2
      const action = args[0];
      const params = { entity_id: entity };
      
      // Parse any additional parameters
      args.slice(1).forEach(param => {
        const [key, value] = param.split('=');
        params[key] = value === 'true' ? true :
          value === 'false' ? false :
          !isNaN(value) ? Number(value) :
          value;
      });

      return await this.sendCommand(domain, action, params);
    } catch (error) {
      this.errorEvents.publish('<u>Invalid command format</u><br>' + error);
      throw error;
    }
  }

  /**
   * Update an entity state directly
   * Note: Prefer using sendCommand for most operations as it uses the services API
   */
  async updateHA(entityId, state, attributes = {}) {
    if (this.states.isOffline) {
      this.errorEvents.publish('<u>App is offline</u><br>Update to HA failed');
      return;
    }

    try {
      const response = await fetch(`${this.config.haUrl}/api/states/${entityId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state,
          attributes
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.debugEvents.publish(`Updated ${entityId} to ${state}`);
    } catch (error) {
      this.errorEvents.publish('<u>HA Command failed</u><br>' + error);
      throw error;
    }
  }

  reconnect(delay = 5) {
    if (this.states.haConnectionIsRestarting) {
      log(2, '[websocket] reconnection already in progress');
      return;
    }

    this.states.haConnectionIsRestarting = true;
    log(2, '[websocket] try reconnect in ' + delay + 's');

    // Clear existing connection
    if (this.states.connection.websocket) {
      this.states.connection.websocket.close();
      this.states.connection.websocket = null;
    }

    // Clear any existing timer
    if (this.states.connection.timer) {
      clearTimeout(this.states.connection.timer);
    }

    // Set reconnection timer
    this.states.connection.timer = setTimeout(() => {
      this.states.haConnectionIsRestarting = false;
      this.connect();
    }, delay * 1000);
  }

  async refresh() {
    if (this.states.isOffline) {
      this.errorEvents.publish('<u>App is offline</u><br>Refresh failed');
      return;
    }

    const now = Date.now() / 1000;
    if (!isAppVisible() ||
      (this.config.update.filter && this.config.update.filter.length < 2) ||
      (now - this.states.lastRefresh) < this.config.refreshInterval) {
      return;
    }

    try {
      // Get filtered entities list
      const entities = this.createFilterParameter();
      if (entities.length === 0) {
        return;
      }

      // Check WebSocket connection
      if (!this.states.connection.websocket ||
        this.states.connection.websocket.readyState !== WebSocket.OPEN) {
        log(1, '[refresh] No active connection, attempting to connect...');
        this.connect();
        return;
      }

      // Create get_states message (will filter results after receiving)
      const message = {
        id: this.messageId++,
        type: 'subscribe_entities',
        entity_ids: entities
      };

      // Send the request through WebSocket
      log(2, '[refresh] Requesting states for entities:', entities);
      this.states.connection.websocket.send(JSON.stringify(message));

      const timestamp = dateFormat(new Date(), 'YYYY-MM-DD hh:mm:ss');
      this.states.lastRefresh = now;

      log(2, '[HA Service] Refresh completed, updated ' + this.statesMap.size + ' entities');
      this.debugEvents.publish('Refresh completed');
    } catch (error) {
      this.errorEvents.publish('<u>Refresh failed</u><br>' + error);
      log(1, '[HA Service] Refresh error:', error);
    }
  }

  startRefreshInterval(delay = 0) {
    // Clear any existing timer
    this.stopRefreshInterval();
    this.states.refresh.timer = setTimeout(() => {
      // get current values of readings every x seconds
      this.refresh();
      this.startRefreshInterval();
    }, (delay || this.config.refreshInterval * 1000));
    log(2, '[HA Service] Started refresh interval: ' + this.config.refreshInterval + 's');
  }

  stopRefreshInterval() {
    if (this.states.refresh.timer) {
      clearInterval(this.states.refresh.timer);
      this.states.refresh.timer = null;
      log(2, '[HA Service] Stopped refresh interval');
    }
  }

  forceRefresh() {
    return this.refresh();
  }

  disconnect() {
    if (this.states.connection.websocket) {
      this.states.connection.websocket.close();
      this.states.connection.websocket = null;
    }
  }

  scheduleHealthCheck() {
    // Check websocket connection health
    if (!this.states.connection.websocket ||
      this.states.connection.websocket.readyState !== WebSocket.OPEN) {
      log(1, '[ha] Health check: No active connection, attempting to reconnect...');
      this.connect();
    } else {
      // Send ping message to check connection
      const pingMessage = {
        id: this.messageId++,
        type: 'ping'
      };
      try {
        this.states.connection.websocket.send(JSON.stringify(pingMessage));
      } catch (err) {
        error(1, '[ha] Health check failed:', err);
        this.reconnect(5);
      }
    }
  }
}

// instance singleton here
export const haService = new HomeAssistantService();