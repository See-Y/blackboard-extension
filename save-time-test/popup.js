function goToLecture(course_id) {
    if (document.location.href.includes('portal/execute/tabs/tabAction')) {
        window.location.replace(`https://blackboard.unist.ac.kr/webapps/collab-ultra/tool/collabultra/lti/launch?course_id=${course_id}`);
        console.log(course_id);
        return;
    }
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
document.addEventListener("DOMContentLoaded", function() {
    var btn0 = document.querySelector("#btn");
    btn0.addEventListener("click", () => {
        if (document.location.href.includes("blackboard.unist.ac.kr/") && document.location.href.includes("tab_tab_group_id")) {} else {
            chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
                chrome.tabs.update(tabs[0].id, { url: "https://blackboard.unist.ac.kr/" });
            })
        }
    });
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
                //alert(lectureInfolist[2]);
                gotoCollaborate(lectureInfolist[2]["id"]);
            }
        });
    })
});