function getLectureInfo() {
    if (document.location.href.includes("blackboard.unist.ac.kr/") && document.location.href.includes("tab_tab_group_id")) {
        String.prototype.extract = function(opts) {
            var undefined;

            var DEFAULTS = {
                delimiter: '&',
                keyValueSeparator: '=',
                startAfter: '?',
            };

            function filterInt(value) {
                return (/^(\-|\+)?([0-9]+|Infinity)$/.test(value)) ? Number(value) : NaN;
            }

            if (this.length <= 1) return;

            var opts = opts || {},
                keyValuePairs = [],
                params = {};

            var delimiter = opts.delimiter || DEFAULTS.delimiter;
            var keyValueSeparator = opts.keyValueSeparator || DEFAULTS.keyValueSeparator;
            var startAfter = opts.startAfter || DEFAULTS.startAfter;
            var limit = filterInt(opts.limit) >= 1 ? opts.limit : undefined;

            var querystringStartIndex = this.lastIndexOf(startAfter) + 1;
            var keyValueSeparatorFirstIndex = this.indexOf(keyValueSeparator, querystringStartIndex);

            if (keyValueSeparatorFirstIndex < 0) return;

            // scope of finding params only applicable to str
            var str = querystringStartIndex < 0 ? new String(this) : this.substring(querystringStartIndex);

            keyValuePairs = str.split(delimiter, limit);
            var kvPair, i = 0;
            for (var s = keyValuePairs.length; i < s; i++) {
                kvPair = keyValuePairs[i].split(keyValueSeparator, 2);
                // ignore any items after first value found, where key = kvPair[0], value = kvPair[1]
                var value = kvPair[1];
                params[kvPair[0]] = filterInt(value) ? filterInt(value) : value; // return int if value is parsable
            };
            return params;
        };
        var lecturelist = []
        var AllaTag = document.getElementsByTagName('a')
        for (var i = 0; i < AllaTag.length; i += 1) {
            if (AllaTag[i].parentElement.parentElement.className == 'portletList-img courseListing coursefakeclass ') {
                var temp = {}
                temp["name"] = AllaTag[i].text;
                temp["link"] = AllaTag[i].href;
                var params = AllaTag[i].href.extract();
                temp["id"] = params.id;
                lecturelist.push(temp);
            }
        }
        console.log(lecturelist);
        return lecturelist;
    } else {
        window.location.replace("https://blackboard.unist.ac.kr/");
        return undefined;
    }
}



function goToLecture(course_id) {
    var gotoCollaborateURL;
    if (document.location.href.includes('portal/execute/tabs/tabAction')) {
        window.location.replace(`https://blackboard.unist.ac.kr/webapps/collab-ultra/tool/collabultra/lti/launch?course_id=${course_id}`);
        console.log(course_id);
        return;
    }
    (function() {
        var XHR = XMLHttpRequest.prototype;
        var open = XHR.open;
        var send = XHR.send;

        XHR.open = function(method, url) {
            this._method = method;
            this._url = url;
            return open.apply(this, arguments);
        };
        alert(send);
        XHR.send = function(postData) {
            this.addEventListener('load', function() {
                console.log(this.responseText);
            });
            return send.apply(this, arguments);
        };
    })();
}

function goToMainPage() {
    // var currentUrl;
    chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
        chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: getLectureInfo
            },
            injectionResults => {
                for (const frameResult of injectionResults) {
                    var lectureInfolist = frameResult.result; // line 11
                    alert(JSON.stringify(lectureInfolist));
                    chrome.storage.sync.set({ 'lectureInfo': JSON.stringify(lectureInfolist) }, function() {
                        //alert(JSON.stringify(lectureInfolist));
                    });
                }
            });
    });

}

function gotoCollaborate(course_id) {
    chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: goToLecture,
                args: [course_id]
            })
        })
        // go to Collaborate page
        // var detail = $('.sr-only')[0].id;
        // var detailedURL = Document.location + "/" + detail;
        // chrome.tabs.update({
        //     url: detailedURL
        // });
        // $('.button.preserve.focus-item.loading-button')[0].click()

}
document.addEventListener("DOMContentLoaded", function() {
    var btn0 = document.querySelector("#btn");
    btn0.addEventListener("click", goToMainPage)
});
document.addEventListener("DOMContentLoaded", function() {
    var btn0 = document.querySelector("#btn1");
    btn0.addEventListener("click", () => {
        chrome.storage.sync.get(['lectureInfo'], function(res) {
            lectureInfolist = JSON.parse(res.lectureInfo);
            //alert(lectureInfolist)
            if (lectureInfolist == undefined || lectureInfolist == null) {
                alert("메인페이지 접속버튼 클릭");
            } else {
                alert(lectureInfolist[2]["id"])
                gotoCollaborate(lectureInfolist[2]["id"]);
            }
        });
    })
});