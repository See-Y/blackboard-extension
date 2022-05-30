var s = document.createElement('script');
s.src = s.src = chrome.runtime.getURL('pageScript/cancelLogout.js');
(document.head || document.documentElement).appendChild(s);