// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://everytime.kr/timetable
// @icon         https://www.google.com/s2/favicons?sz=64&domain=everytime.kr
// @grant        none
// ==/UserScript==

(function (XHR) {
    "use strict";

    var open = XHR.prototype.open;
    var send = XHR.prototype.send;
    window.jsonData = {};
    XHR.prototype.open = function (method, url, async, user, pass) {
        this._url = url;
        //console.log(this);


        if (url.includes("subject/list")) {
            let interval = setInterval(() => {
                let res = this.responseText;

                if (res) {
                    addJSON(res);
                    clearInterval(interval);
                }
            }, 100);
        }
        open.call(this, method, url, async, user, pass);
    };

    XHR.prototype.send = function (data) {
        var self = this;
        var oldOnReadyStateChange;
        var url = this._url;

        function onReadyStateChange() {
            if (self.readyState == 4 /* complete */) {
                /* This is where you can put code that you want to execute post-complete*/
                /* URL is kept in this._url */
            }

            if (oldOnReadyStateChange) {
                oldOnReadyStateChange();
            }
        }

        /* Set xhr.noIntercept to true to disable the interceptor for a particular call */
        if (!this.noIntercept) {
            if (this.addEventListener) {
                this.addEventListener("readystatechange", onReadyStateChange, false);
            } else {
                oldOnReadyStateChange = this.onreadystatechange;
                this.onreadystatechange = onReadyStateChange;
            }
        }

        send.call(this, data);
    }
    function addJSON(xmlData) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlData, "text/xml");
        const subjects = xmlDoc.getElementsByTagName("subject");
        console.log(subjects);
        for (let i = 0; i < subjects.length; i++) {


            const subject = subjects[i];

            // Create a new object to store the subject's data
            const subjectData = {
                "id": subject.getAttribute("id"),
                "name": subject.getAttribute("name"),
                "professor": subject.getAttribute("professor"),
                "time": subject.getAttribute("time")
            };

            // Loop through each timeplace element in the subject element
            const timeplaces = subject.getElementsByTagName("timeplace");
            for (let j = 0; j < timeplaces.length; j++) {
                const timeplace = timeplaces[j];

                // Add the timeplace data to the subject's data object
                subjectData[`timeplace${j}`] = {
                    "day": timeplace.getAttribute("day"),
                    "start": timeplace.getAttribute("start"),
                    "end": timeplace.getAttribute("end"),
                    "place": timeplace.getAttribute("place")
                };
            }

            // Add the subject's data object to the JSON data object
            jsonData[subject.getAttribute("code")] = subjectData;
        }

    }
})(XMLHttpRequest);