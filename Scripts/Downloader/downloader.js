var lastRowDiv = document.getElementsByClassName("lastRowDiv")[0];

function downloads(doc){
    const bbPrefixUrl = "https://blackboard.unist.ac.kr/";
    var content = doc.getElementById("content_listContainer");
    if (!isNaN(content)) return;

    var aTags = content.getElementsByTagName("a");
    for (var a of aTags) {
        var link = a.getAttribute("href");
        if(link == "#contextMenu") continue;
        var tag = a.getAttribute("onclick");
        var target = a.getAttribute("target");
        if(isNaN(tag) || isNaN(target)){
            var fileUrl = bbPrefixUrl+link;
            chrome.runtime.sendMessage({sender: "downloader", url: fileUrl});
            console.log(fileUrl);
        }
        else{
            folder = window.open(bbPrefixUrl+link);
            downloads(folder.document);
            folder.close();
        }
    }
}


var downloadBtn = HTMLAppender({
    parent: lastRowDiv,
    tagName: "button",
    className: "downloadBtn",
    type: "button",
    innerText: "Download All",
    eventListener:  {
        click: (evt) => {
            downloads(document);
        }
    }
});
