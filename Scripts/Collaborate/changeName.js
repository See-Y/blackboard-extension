chrome.storage.sync.get(['uname'], function(res) {
    if (res.uname == undefined && res.uname == null) {

    } else {
        var s = document.createElement('script');
        s.src = chrome.runtime.getURL('Scripts/Collaborate/changeN.js');
        s.setAttribute("id", res.uname);
        (document.head || document.documentElement).appendChild(s);
        // use `url` here inside the callback because it's asynchronous!
    }
})