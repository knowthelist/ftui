import { Subject, debounce, log, error } from './ftui.helper.js';
import { fhemService } from './fhem.service.js';
import { haService } from './ha.service.js';

class BackendService {
    constructor() {
        this.config = {
            debuglevel: 0,
            refreshInterval: 0,
            refreshFilter: '',
            updateFilter: '',
            refresh: {
                filter: '',
            },
            update: {
                filter: '',
            },
        };

        this.states = {
            lastRefresh: 0,
            isOffline: false,
            refresh: {
                lastTimestamp: new Date(),
                timer: null,
                request: null,
                result: null,
            },
        };

        // Initialize event subjects for all services to use
        this.debugEvents = new Subject();
        this.errorEvents = new Subject();
    }
    
    setConfig(config) {
        // Ensure filter properties exist
        this.config = {
            ...this.config,
            ...config,
            refresh: {
                ...this.config.refresh,
                ...(config.refresh || {}),
                filter: config.refreshFilter || '',
            },
            update: {
                ...this.config.update,
                ...(config.update || {}),
                filter: config.updateFilter || '',
            },
        };

        // Propagate relevant config to specific services
        const fhemConfig = {
            ...config,
            refresh: { ...this.config.refresh },
            update: { ...this.config.update },
        };

        const haConfig = {
            ...config,
            refresh: { ...this.config.refresh },
            update: { ...this.config.update },
        };

        fhemService.setConfig(fhemConfig);
        haService.setConfig(haConfig);
    }

    getBackendEvents(reading) {
        // Route to HA service if reading starts with 'ha-'
        if (reading.startsWith('ha-')) {
            return haService.getReadingEvents(reading.substring(3));
        }
        // Default to FHEM service
        return fhemService.getReadingEvents(reading);
    }

    sendUpdate(command) {
        if (command.startsWith('set ha ')) {
            // Route HA commands to HA service
            const cleanCommand = command.substring(7).trim();
            return haService.parseAndSendCommand(cleanCommand);
        }
        return fhemService.updateFhem(command);
    }

    sendCommand(command) {
        if (command.startsWith('set ha ')) {
            // Route HA commands to HA service
            const cleanCommand = command.substring(7).trim();
            return haService.parseAndSendCommand(cleanCommand);
        }
        return fhemService.sendCommand(command);
    }

    checkText(response) {
      if (response.status >= 200 && response.status <= 299) {
        return response.text();
      } else {
        throw Error(response.statusText);
      }
    }

    debouncedUpdateFhem(debounceTime, command) {
        const debouncedFn = debounce((cmd) => this.sendUpdate(cmd), this);
        return debouncedFn(debounceTime, command);
    }

    updateReadingItem(parameterId, newData) {
        if (parameterId.startsWith('ha-')) {
            return haService.updateStateItem(parameterId.substring(3), newData);
        }
        return fhemService.updateReadingItem(parameterId, newData);
    }

    forceRefresh() {
        // Refresh both backends
        fhemService.forceRefresh();
        haService.forceRefresh();
    }

    createFilterParameter() {
        // Ensure our own filters are initialized
        if (!this.config.refresh) {
            this.config.refresh = { filter: '' };
        }
        if (!this.config.update) {
            this.config.update = { filter: '' };
        }

        try {
            // Update service filters
            const fhemFilters = fhemService.createFilterParameter();
            const haFilters = haService.createFilterParameter();

            // Combine filters if needed
            this.config.refresh.filter = [
                this.config.refresh.filter,
                // Check if fhemFilters exists before accessing .reads
                (fhemFilters && fhemFilters.reads) || '',
                // Check if haFilters exists before accessing .entities
                (haFilters && haFilters.entities) || ''
            ].filter(Boolean).join(',');

            this.config.update.filter = [
                this.config.update.filter,
                (fhemFilters && fhemFilters.devs) || '',
                (haFilters && haFilters.entities) || ''
            ].filter(Boolean).join(',');

            // Force refresh on next interval
            this.states.lastRefresh = 0;
            log(2, '[BackendService] Created filter parameters');
        } catch (err) {
            error(1, '[BackendService] Error creating filters:', err);
        }
    }

    startRefreshInterval(delay = 0) {
        if (this.states.refresh.timer) {
            clearTimeout(this.states.refresh.timer);
        }

        this.states.refresh.timer = setTimeout(() => {
            this.forceRefresh();
            this.startRefreshInterval();
        }, (delay || this.config.refreshInterval * 1000));

        log(2, '[BackendService] Started refresh interval: ' + this.config.refreshInterval + 's');
    }

    getReadingItem(readingId) {
        if (readingId.startsWith('ha-')) {
            return haService.getStateItem(readingId.substring(3));
        }
        return fhemService.getReadingItem(readingId);
    }

    stopRefreshInterval() {
        if (this.states.refresh.timer) {
            clearTimeout(this.states.refresh.timer);
            this.states.refresh.timer = null;
            log(2, '[BackendService] Stopped refresh interval');
        }
    }

    setOffline() {
        this.states.isOffline = true;
        // Notify both services
        fhemService.disconnect();
        haService.disconnect();
    }

    checkConnection() {
        // Check both services
        fhemService.scheduleHealthCheck();
        haService.scheduleHealthCheck();
    }

    disconnect() {
        fhemService.disconnect();
        haService.disconnect();
    }
}

export const backendService = new BackendService();