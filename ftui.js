


// TODO: needs to be refactored
/* const menu = document.querySelector('#menu');
menu && menu.addEventListener('click', event => {
  event.target.classList.toggle('show');
}); */

async function main() {
  const ftuiModule = await import('./modules/ftui/ftui.app.js');
  window.ftuiApp = ftuiModule.ftuiApp;

  // start FTUI
  ftuiModule.ftuiApp.init();
}

document.addEventListener('readystatechange', () => {
  document.body.classList.add('loading');
});

// initially loading the page
// or navigating to the page from another page in the same window or tab
window.addEventListener('pageshow', () => {
  if (typeof ftuiApp === 'undefined') {
    // load FTUI
    main();
  } else {
    ftuiApp.setOnline();
  }
});

window.addEventListener('beforeunload', () => {
  ftuiApp.log(5, 'beforeunload');
  ftuiApp.setOffline();
});

window.addEventListener('online', () => ftuiApp.checkOnlineStatus());
window.addEventListener('offline', () => ftuiApp.checkOnlineStatus());

// after the page became visible, check server connection
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // page is hidden
  } else {
    // page is visible
    ftuiApp.log(1, 'Page became visible again -> start healthCheck in 3 secondes ');
    ftuiApp.checkConnection();
  }
});

window.onerror = function (msg, url, lineNo, columnNo, error) {
  const file = url.split('/').pop();
  ftuiApp.toast([file + ':' + lineNo, error].join('<br/>'), 'error');
  return false;
};
