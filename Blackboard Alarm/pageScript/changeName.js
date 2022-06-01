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
chrome.storage.sync.get(['uname'], function(res) {
    if (res.uname == undefined && res.uname == null) {

    } else {
        var s = document.createElement('script');
        s.src = chrome.runtime.getURL('pageScript/changeN.js');
        s.setAttribute("id", res.uname);
        (document.head || document.documentElement).appendChild(s);

        // use `url` here inside the callback because it's asynchronous!
    }
})