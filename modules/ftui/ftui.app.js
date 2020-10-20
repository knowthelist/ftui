import { fhemService } from './fhem.service.js';
import { FtuiBinding } from './ftui.binding.js';
import { vNotify } from '../vanilla-notify/vanilla-notify.min.js';
import * as ftui from './ftui.helper.js';

class FtuiApp {
  constructor() {
    this.version = '3.3.0';
    this.config = {
      enableDebug: false,
      fhemDir: '',
      debuglevel: 0,
      lang: 'de',
      toastPosition: 'bottomLeft',
      styleList: [
        'modules/vanilla-notify/vanilla-notify.css'
      ]
    };
    this.states = {
      lastSetOnline: 0,
      isOffline: false,
    };

    this.loadStyles();

    // start FTUI
    this.init();

    this.log = ftui.log;
    fhemService.setConfig(this.config);
    fhemService.debugEvents.subscribe(text => this.toast(text));
    fhemService.errorEvents.subscribe(text => this.toast(text, 'error'));

  }

  init() {
    this.config.meta = document.getElementsByTagName('META');
    this.config.refreshFilter = this.getMetaString('refresh_filter');
    this.config.updateFilter = this.getMetaString('update_filter');

    this.config.debuglevel = this.getMetaNumber('debug');
    this.config.updateCheckInterval = this.getMetaNumber('update_check_interval', 5);
    this.config.enableDebug = (this.config.debuglevel > 0);
    this.config.enableToast = this.getMetaNumber('toast', 5); // 1,2,3...= n Toast-Messages, 0: No Toast-Messages
    this.config.toastPosition = this.getMetaString('toast_position', 'bottomLeft');
    this.config.refreshInterval = this.getMetaNumber('refresh_interval', 15 * 60); // 15 minutes
    this.config.refreshDelay = this.getMetaString('refresh_restart_delay', 3);
    // self path
    const fhemUrl = this.getMetaString('fhemweb_url');
    this.config.fhemDir = fhemUrl || window.location.origin + '/fhem/';
    if (fhemUrl && new RegExp('^((?!http://|https://).)*$').test(fhemUrl)) {
      this.config.fhemDir = window.location.origin + '/' + fhemUrl + '/';
    }
    this.config.fhemDir = this.config.fhemDir.replace('///', '//');
    ftui.log(1, 'FHEM dir: ' + this.config.fhemDir);
    // lang
    const userLang = navigator.language || navigator.userLanguage;
    this.config.lang = this.getMetaString('lang', ((ftui.isDefined(userLang)) ? userLang.split('-')[0] : 'de'));
    // credentials
    this.config.username = this.getMetaString('username');
    this.config.password = this.getMetaString('password');


    // init Page after CSFS Token has been retrieved
    Promise.all([fhemService.fetchCSrf()]).then(() => {
      this.initPage('html');
    }).catch(error => {
      ftui.error('initDeferreds -' + error, 'error');
    });

    document.addEventListener('initComponentsDone', () => {
      // restart  connection
      fhemService.reconnect();

      // start Refresh delayed
      fhemService.startRefreshInterval(500);

      // trigger refreshes
      ftui.triggerEvent('changedSelection');
    });

    // call health check periodically
    setInterval(() => {
      this.checkConnection();
    }, this.config.updateCheckInterval * 60 * 1000);
  }


  initPage(area = 'html') {
    window.performance.mark('start initPage-' + area);

    this.states.startTime = new Date();
    ftui.log(2, 'initPage - area=' + area);

    ftui.log(1, 'init templates - Done');
    this.initComponents(area).then(() => {
      window.performance.mark('end initPage-' + area);
      window.performance.measure('initPage-' + area, 'start initPage-' + area, 'end initPage-' + area);
      const dur = 'initPage (' + area + '): in ' + (new Date() - this.states.startTime) + 'ms';
      if (this.config.debuglevel > 1) this.toast(dur);
      ftui.log(1, dur);
    }).catch(error => {
      ftui.error('Error: initComponents - ' + error);
    });
  }

  initComponents(area) {
    const initDefer = ftui.deferred();
    const componentTypes = [];
    const undefinedComponents = ftui.selectElements(':not(:defined)', area);

    // Fetch all the children of <ftui-*> that are not defined yet.
    undefinedComponents.forEach(elem => {
      if (elem.localName.startsWith('ftui-') && !componentTypes.includes(elem.localName)) {
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

        // init ftui binding of 3rd party components
        const selectors = ['[ftuiBinding]'];
        const bindElements = ftui.selectElements(selectors.join(', '), area);
        bindElements.forEach((element) => {
          element.binding = new FtuiBinding(element);
        });

        fhemService.createFilterParameter();

        ftui.log(1, 'initComponents - Done');
        const event = new CustomEvent('initComponentsDone', { area: area });
        document.dispatchEvent(event);
        initDefer.resolve();
      })
      .catch(error => {
        ftui.error('Error: initComponents - ' + error);
      });
    return initDefer.promise();
  }

  async loadModule(path) {
    try {
      await import(path);
    } catch (error) {
      ftui.error('Failed to load ' + path + ' ' + error);
    }

  }

  attachBinding(element) {
    element.binding = new FtuiBinding(element);
  }

  loadStyles() {
    this.config.styleList.forEach(link => ftui.appendStyleLink(link));
  }

  checkOnlineStatus() {
    ftui.log(2, 'online offline');
    if (navigator.onLine) { this.setOnline(); } else { this.setOffline(); }
  }

  setOnline() {
    const now = Date.now() / 1000;
    ftui.log(2, 'setOnline', now, this.states.lastSetOnline);
    if ((now - this.states.lastSetOnline) > 3) {
      //if (this.config.enableDebug) ftui.selectElements('FHEM connected');
      this.states.lastSetOnline = now;
      this.states.isOffline = false;
      fhemService.forceRefresh();
      ftui.log(1, 'FTUI is online');
    }
  }

  setOffline() {
    this.states.isOffline = true;
    fhemService.disconnect();
    ftui.log(1, 'FTUI is offline');
  }

  checkConnection() {
    fhemService.scheduleHealthCheck();
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

  toast(text, level = 'debug') {
    // https://github.com/MLaritz/Vanilla-Notify

    if (this.config.enableToast !== 0 && window.vNotify) {
      if (level === 'error') {
        return vNotify.error({
          text: text,
          visibleDuration: 20000, // in milliseconds
          position: this.config.toastPosition
        });
      } else if (level === 'info') {
        return vNotify.info({
          text: text,
          visibleDuration: 5000, // in milliseconds
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

}

// instance singleton here
export const ftuiApp = new FtuiApp();
