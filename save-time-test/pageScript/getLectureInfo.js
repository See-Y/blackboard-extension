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

function waitForElm() {
    return new Promise(resolve => {
        if (document.getElementById('_22_1termCourses_noterm')) {
            return resolve(document.getElementById('_22_1termCourses_noterm'));
        }

        const observer = new MutationObserver(mutations => {
            if (document.getElementById('_22_1termCourses_noterm')) {
                resolve(document.getElementById('_22_1termCourses_noterm'));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function getLectureElement() {
    var AllaTag = document.getElementsByTagName('a');
    var lecturelist = new Object();
    for (var i = 0; i < AllaTag.length; i += 1) {
        if (AllaTag[i].href.includes('/webapps/blackboard/execute/launcher') && !AllaTag[i].className.includes('button')) {
            var temp = new Object();
            temp["name"] = AllaTag[i].text;
            temp["link"] = AllaTag[i].href;
            var params = AllaTag[i].href.extract();
            temp["id"] = params.id;
            lecturelist[AllaTag[i].text.split(":")[0]] = temp;
        }
    }
    console.log(lecturelist);
    chrome.storage.sync.set({ 'lectureInfo': JSON.stringify(lecturelist) }, function() {
        // alert(JSON.stringify(lecturelist));
    });
}
waitForElm().then((elm) => {
    chrome.storage.sync.get(['lectureInfo'], function(res) {
        if (res.lectureInfo == undefined && res.lectureInfo == null) {
            getLectureElement();
        } else {
            var lecturelist = JSON.parse(res.lectureInfo);
            console.log(lecturelist);
            if (!lecturelist || (Object.keys(lecturelist).length === 0 && Object.getPrototypeOf(lecturelist) === Object.prototype)) {
                //console.log(JSON.parse(res.lectureInfo));
                getLectureElement();
            }
        }
    });
});