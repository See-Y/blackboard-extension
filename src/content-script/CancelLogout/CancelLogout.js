/// <reference types="chrome" />
/// <reference types="vite-plugin-svgr/client" />

var s = document.createElement('script');
s.src = chrome.runtime.getURL('src/content-script/CancelLogout/CancelLogout-append.js');
(document.head || document.documentElement).appendChild(s);
