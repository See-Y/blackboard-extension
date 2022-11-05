/**
 * Go to course's collaborate page.
 * @param {string} course_id course id
 */
 function gotoCollaborate(course_id) {
    var optionsUrl = `https://blackboard.unist.ac.kr/webapps/collab-ultra/tool/collabultra/lti/launch?course_id=${course_id}`
    chrome.tabs.query({ url: optionsUrl }, function(tabs) {
        if (tabs.length) {
            chrome.tabs.create(tabs[0].id, { active: true });
        } else {
            chrome.tabs.create({ url: optionsUrl });
        }
    });
}

// Execute gotoCollaborate when alarm works.
chrome.alarms.onAlarm.addListener(function(alarm) {
    console.log(alarm.name.split(":")[0] + " alarm works");
    gotoCollaborate(alarm.name.split(":")[0]);
});
chrome.alarms.getAll(function(alarms) { console.log(alarms); })
