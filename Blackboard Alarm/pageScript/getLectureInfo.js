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
        if (document.querySelector('div[id*="22_1termCourses"]')) {
            return resolve(document.querySelector('div[id*="22_1termCourses"]'));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector('div[id*="22_1termCourses"]')) {
                resolve(document.querySelector('div[id*="22_1termCourses"]'));
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
            lecturelist[AllaTag[i].text.split(":")[0].split("_")[1]] = temp;
        }
    }
    fetch(chrome.runtime.getURL('lectureInfo.json'))
        .then((resp) => resp.json())
        .then(function(jsonData) {
            for (var key in lecturelist) {
                if (jsonData[key] == undefined) {
                    delete lecturelist[key];
                } else {
                    lecturelist[key]["name"] = jsonData[key]["name"]
                    lecturelist[key]["time"] = jsonData[key]["time"]
                    lecturelist[key]["professor"] = jsonData[key]["professor"]
                    if (jsonData[key]["timeplace0"]) {
                        lecturelist[key]["timeplace0"] = jsonData[key]["timeplace0"]
                    }
                    if (jsonData[key]["timeplace1"]) {
                        lecturelist[key]["timeplace1"] = jsonData[key]["timeplace1"]
                    }
                    if (jsonData[key]["timeplace2"]) {
                        lecturelist[key]["timeplace2"] = jsonData[key]["timeplace2"]
                    }
                }
            }
            console.log(lecturelist);
            chrome.storage.sync.set({ 'lectureInfo': JSON.stringify(lecturelist) }, function() {
                // alert(JSON.stringify(lecturelist));
            });
        });
}
waitForElm().then((elm) => {
    chrome.storage.sync.get(['lectureInfo'], function(res) {
        console.log(res.lectureInfo);
        if (res.lectureInfo == undefined && res.lectureInfo == null) {
            getLectureElement();
        } else {
            var lecturelist = JSON.parse(res.lectureInfo);
            //console.log(lecturelist);
            if (!lecturelist || (Object.keys(lecturelist).length === 0 && Object.getPrototypeOf(lecturelist) === Object.prototype)) {
                //console.log(JSON.parse(res.lectureInfo));
                getLectureElement();
            }
        }
    });
    setAlarm();
});


// Get all courses's time in chrome sync and set alarms
function setAlarm() {
    chrome.storage.sync.get(['lectureInfo'], function(res) {
        console.log(res.lectureInfo);
        var lecturelist = JSON.parse(res.lectureInfo);
        for (var key in lecturelist) {
            if (lecturelist[key]["timeplace0"]) {
                var H = parseInt(lecturelist[key]["timeplace0"]["start"]/12);
                var M = (lecturelist[key]["timeplace0"]["start"]%12)*5;
                createAlarm(lecturelist[key]["link"]+":1", lecturelist[key]["timeplace0"]["day"], H.toString()+":"+M.toString());
            }
        }
        /*
        for (var d in result) {
            const lec = JSON.parse(result[d]);
            for (var current in lec) {
                if(!lec[current].use_collaborate)
                    continue;
                if(lec[current].first_date != 7) // 7 indicates undefined or None
                    createAlarm(lec[current].id+":1", lec[current].first_date, lec[current].first_time);
                if(lec[current].second_date != 7)
                    createAlarm(lec[current].id+":2", lec[current].second_date, lec[current].second_time);
                if(lec[current].third_date != 7)
                    createAlarm(lec[current].id+":3", lec[current].third_date, lec[current].third_time);
            }
        }
        */
    });
}

// Get course_id, course_day(days of the week), and time to set alarm
function createAlarm(course_id, course_day, course_time) {
    let now_date = new Date();
    let date = new Date(now_date.getFullYear(), now_date.getMonth(), now_date.getDate()+(course_day-now_date.getDay()+7)%7, course_time.split(":")[0], course_time.split(":")[1]);
    // Check whether the time is smaller or bigger than current time
    // If small, add 7 days
    if (now_date > date) date.setDate(date.getDate()+7);
    console.log(course_id+" alarm set at "+date); 
    chrome.alarms.create(course_id, {periodInMinutes : 10080, when : date.getTime()});
}