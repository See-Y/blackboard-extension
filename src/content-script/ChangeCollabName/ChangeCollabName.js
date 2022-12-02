/// <reference types="chrome" />
/// <reference types="vite-plugin-svgr/client" />

/*
Collaborate 접속 시 이름을 자동으로 학번_이름으로 변경해서 접속한다(?)(방재현)
*/

chrome.storage.sync.get(['uname'], function(res) {
    if (res.uname == undefined && res.uname == null) {

    } else {
        var s = document.createElement('script');
        s.src = chrome.runtime.getURL('src/content-script/ChangeCollabName/ChangeCollabName-append.js');
        s.setAttribute("id", res.uname);
        (document.head || document.documentElement).appendChild(s);
        // use `url` here inside the callback because it's asynchronous!
    }
})