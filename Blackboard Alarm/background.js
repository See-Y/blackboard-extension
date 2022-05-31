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
    window.location.replace(course_id);//`https://blackboard.unist.ac.kr/webapps/collab-ultra/tool/collabultra/lti/launch?course_id=${course_id}`);
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

// Execute gotoCollaborate when alarm works
chrome.alarms.onAlarm.addListener(function(alarm) {
    console.log(alarm.name.split(":")[0]+" alarm works");
    gotoCollaborate(alarm.name.split(":")[0]);
});