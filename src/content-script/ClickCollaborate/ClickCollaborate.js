/// <reference types="chrome" />
/// <reference types="vite-plugin-svgr/client" />
(function() {
    const waitForElm = (selector, index) => {
        return new Promise(resolve => {
            if (document.getElementsByClassName(selector)[index]) {
                return resolve(document.getElementsByClassName(selector)[index]);
            }

            const observer = new MutationObserver(mutations => {
                if (document.getElementsByClassName(selector)[index]) {
                    resolve(document.getElementsByClassName(selector)[index]);
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }
    waitForElm('item-list__item session-list-item-content', 1).then((elm) => {
        //console.log(elm.parentElement);
        if (document.title = 'Bb Collaborate Sessions') {
            elm.click();
        }
    });
    waitForElm("item-list__item-details", 2).then((elm) => {
        //console.log(elm.parentElement);
        if (document.title = 'Bb Collaborate Sessions') {
            elm.click();
        }
    });
    //Using mutationobserver to element to apear and click element.
    var s = document.createElement('script');
    s.src = s.src = chrome.runtime.getURL('src/content-script/ClickCollaborate/ClickCollaborate-append.js');
    //Since content-script cannot access global variable inside page,
    //We should append JS file to intercept XHR request.
    //https://stackoverflow.com/questions/9515704/use-a-content-script-to-access-the-page-context-variables-and-functions/9517879#9517879
    (document.head || document.documentElement).appendChild(s);
})();