function gotoCollaborate(course_id) {
    var Collaborateurl = `https://blackboard.unist.ac.kr/webapps/collab-ultra/tool/collabultra/lti/launch?course_id=${course_id}`
    chrome.tabs.update({
        url: Collaborateurl
    });
    // go to Collaborate page
    var detail = $('.sr-only')[0].id;
    var detailedURL = Document.location + "/" + detail;
    chrome.tabs.update({
        url: detailedURL
    });
    $('.button.preserve.focus-item.loading-button')[0].click()

} 


String.prototype.extract = function (opts) {
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
AllaTag = document.getElementsByTagName('a')
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

