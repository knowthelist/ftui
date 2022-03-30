
async function main() {
  const ftuiModule = await import('./modules/ftui/ftui.app.js');
  window.ftuiApp = ftuiModule.ftuiApp;
  // start FTUI
  ftuiModule.ftuiApp.init();

  window.addEventListener('beforeunload', () => window.ftuiApp.setOffline());
  window.addEventListener('online', () => window.ftuiApp.checkOnlineStatus());
  window.addEventListener('offline', () => window.ftuiApp.checkOnlineStatus());

  // after the page became visible, check server connection
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // page is hidden
    } else {
      // page is visible
      window.ftuiApp.log(1, 'Page became visible again -> start healthCheck in 3 secondes ');
      window.ftuiApp.checkConnection();
    }
  });

  window.onerror = function (msg, url, lineNo, columnNo, error) {
    const file = url.split('/').pop();
    window.ftuiApp.toast([file + ':' + lineNo, error].join('<br/>'), 'error');
    return false;
  };

  // set theme on change
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    window.ftuiApp.setTheme(e.matches);
  });
}

document.addEventListener('readystatechange', event => {
  if (event.target.readyState == 'interactive') {
    document.body.classList.add('loading');
    main();
  }
});
