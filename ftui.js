
let ftui;

// TODO: needs to be refactored
/* const menu = document.querySelector('#menu');
menu && menu.addEventListener('click', event => {
  event.target.classList.toggle('show');
}); */

async function main() { 
  const module = await import("./modules/ftui/ftui.module.js");
  ftui = module.ftui;
}

window.addEventListener('load', function(){
  main();
});

// initially loading the page
// or navigating to the page from another page in the same window or tab
window.addEventListener('pageshow', () => {
  //if (!window.ftui) {
    // load FTUI
  //  window.ftui = new Ftui();
 // } else { 
    // navigating from another page
    if (ftui) {
      ftui.setOnline();
    }
// }
});

window.addEventListener('beforeunload', () => {
  ftui.log(5, 'beforeunload');
  ftui.setOffline();
});

window.addEventListener('online', () => ftui.updateOnlineStatus());
window.addEventListener('offline', () => ftui.updateOnlineStatus());

// after the page became visible, check server connection
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // page is hidden
  } else {
    // page is visible
    ftui.log(1, 'Page became visible again -> start healthCheck in 3 secondes ');
    ftui.scheduleHealthCheck();
  }
});

window.onerror = function (msg, url, lineNo, columnNo, error) {
  const file = url.split('/').pop();
  ftui.toast([file + ':' + lineNo, error].join('<br/>'), 'error');
  return false;
};
