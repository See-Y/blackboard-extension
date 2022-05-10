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

function waitForElm(selector, index) {
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
waitForElm('portletList-img courseListing coursefakeclass ', 0).then((elm) => {
    var AllaTag = document.getElementsByTagName('a');
    var lecturelist = new Array();
    for (var i = 0; i < AllaTag.length; i += 1) {
        if (AllaTag[i].parentElement.parentElement.className == 'portletList-img courseListing coursefakeclass ') {
            var temp = new Object();
            temp["name"] = AllaTag[i].text;
            temp["link"] = AllaTag[i].href;
            var params = AllaTag[i].href.extract();
            temp["id"] = params.id;
            lecturelist.push(temp);
        }
    }
    console.log(lecturelist);
    chrome.storage.sync.set({ 'lectureInfo': JSON.stringify(lecturelist) }, function() {
        // alert(JSON.stringify(lecturelist));
    });
});