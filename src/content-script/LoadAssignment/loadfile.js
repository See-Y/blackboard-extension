/// <reference types="chrome" />
/// <reference types="vite-plugin-svgr/client" />
var s = document.createElement('script');
s.src = s.src = window.chrome.runtime.getURL('src/content-script/LoadAssignment/loadfile-append.js');
(document.head || document.documentElement).appendChild(s);