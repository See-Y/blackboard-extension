const bbPrefixUrl = "https://blackboard.unist.ac.kr/"
var lastRowDiv = document.getElementsByClassName("lastRowDiv")[0];

var downloadBtn = HTMLAppender({
    parent: lastRowDiv,
    tagName: "button",
    className: "downloadBtn",
    type: "button",
    innerText: "Download All",
    eventListener:  {
        click: (evt) => {
            var content = document.getElementById("content_listContainer");
            if (!isNaN(content)) return;
            var aTags = content.getElementsByTagName("a");
            for (var a of aTags) {
                var fileUrl = bbPrefixUrl+a.getAttribute("href");
                chrome.runtime.sendMessage({sender: "downloader", url: fileUrl});            }
        }
    }
});
