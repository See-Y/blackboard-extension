(function() {
    function waitForElm(selector) {
        return new Promise(resolve => {
            if (document.getElementsByClassName(selector)[0]) {
                return resolve(document.getElementsByClassName(selector)[0]);
            }

            const observer = new MutationObserver(mutations => {
                if (document.getElementsByClassName(selector)[0]) {
                    resolve(document.getElementsByClassName(selector)[0]);
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }
    waitForElm('item-list__item-icon').then((elm) => {
        console.log(elm.parentElement);
        if (document.title = 'Bb Collaborate Sessions') {
            elm.parentElement.click();
        }
    }); //Using mutationobserver to element to apear and click element.
    var s = document.createElement('script');
    s.src = s.src = chrome.runtime.getURL('intercept.js');
    //Since content-script cannot access global variable inside page,
    //We should append JS file to intercept XHR request.
    (document.head || document.documentElement).appendChild(s);
})();