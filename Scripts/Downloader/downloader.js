var lastRowDiv = document.getElementsByClassName("lastRowDiv")[0];
const BB_PREFIX_URL = "https://blackboard.unist.ac.kr";
const MAX_NEST_THRESHOLD = 5;

const decodeReaderStream = (rb) => {
    const reader = rb.getReader();
    return new ReadableStream({
      start(controller) {
        function push() {
          reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            push();
          });
        }
        push();
      },
    });
}

const getRedirectedResult = (originUrl, callback) => fetch(originUrl, {
    headers: {"Host": BB_PREFIX_URL}
    })
    .then((res)=>(res.body)).then((rb)=>decodeReaderStream(rb))
    .then((stream) =>
    new Response(stream, { headers: { 'Content-Type': 'text/html' } }).text() 
    )
    .then((result) => {
    callback(result);
});

function download(doc, count){
    console.log(doc);
    if (count == MAX_NEST_THRESHOLD) return;
    var content = doc.getElementById("content_listContainer");
    if (!isNaN(content)) return;

    var aTags = content.getElementsByTagName("a");
    for (var a of aTags) {
        var link = a.getAttribute("href");
        const buttonRe = "^#.*"
        if(link.match(buttonRe)) continue; // not a link
        
        const contentRe = new RegExp("^\/webapps\/blackboard.*"); // not file, loadable webapp
        const result = link.match(contentRe);
        
        if(result){ // webapp (recursive)
            getRedirectedResult(link, (res)=>{ // Redirect to webapp
                var folder_doc = document.implementation.createHTMLDocument('');
                folder_doc.write(res);
                download(folder_doc, count+1);
                folder_doc.close();
                }
            );
        }
        else{ // url (download)
            chrome.runtime.sendMessage({sender: "downloader", url: link});
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
            download(document, 0);
        }
    }
});
