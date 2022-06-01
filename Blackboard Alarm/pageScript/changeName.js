var s = document.createElement('script');
s.src = s.src = chrome.runtime.getURL('pageScript/changeN.js');
(document.head || document.documentElement).appendChild(s);