loadall();

function loadall() { // 현재 저장된 과목 이름 로드(디버깅용)
    chrome.storage.sync.get('lectureInfo', function(result) {
        for (var d in result) {
            const lec_data = JSON.parse(result[d]);
            console.log(lec_data);
        }
    });
}
// Go to Lecture collaborate page
function goToLecture(course_id) {
    window.location.replace(`https://blackboard.unist.ac.kr/webapps/collab-ultra/tool/collabultra/lti/launch?course_id=${course_id}`);
}

function gotoCollaborate(course_id) {
    chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: goToLecture,
            args: [course_id]
        })
    })
}

// Get all courses's time in chrome sync and set alarms
function setAlarm() {
    chrome.storage.sync.get(['lectureInfo'], function(res) {
        console.log(res.lectureInfo);
        var lecturelist = JSON.parse(res.lectureInfo);
        for (var key in lecturelist) {
            if (lecturelist[key]["timeplace0"]) {
                if (lecturelist[key]["timeplace0"]["collab"]!=false) {
                    var H = parseInt(lecturelist[key]["timeplace0"]["start"]/12);
                    var M = (lecturelist[key]["timeplace0"]["start"]%12)*5;
                    createAlarm(lecturelist[key]["id"]+":1", lecturelist[key]["timeplace0"]["day"], H+":"+M);
                }
            }
            if (lecturelist[key]["timeplace1"]) {
                if (lecturelist[key]["timeplace1"]["collab"]!=false) {
                    var H = parseInt(lecturelist[key]["timeplace1"]["start"]/12);
                    var M = (lecturelist[key]["timeplace1"]["start"]%12)*5;
                    createAlarm(lecturelist[key]["id"]+":1", lecturelist[key]["timeplace1"]["day"], H+":"+M);
                }
            }
            if (lecturelist[key]["timeplace2"]) {
                if (lecturelist[key]["timeplace1"]["collab"]!=false) {
                    var H = parseInt(lecturelist[key]["timeplace2"]["start"]/12);
                    var M = (lecturelist[key]["timeplace2"]["start"]%12)*5;
                    createAlarm(lecturelist[key]["id"]+":1", lecturelist[key]["timeplace2"]["day"], H+":"+M);
                }
            }
        }
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

// Execute gotoCollaborate when alarm works
chrome.alarms.onAlarm.addListener(function(alarm) {
    console.log(alarm.name.split(":")[0]+" alarm works");
    gotoCollaborate(alarm.name.split(":")[0]);
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.message == "setAlarm") {
            // Delete all alarms before setting new alarm
            chrome.alarms.clearAll();
            // Setting all alarms saved in chrome sync
            setAlarm();
            sendResponse({state : "Alarm set"});
        }
    }
  );