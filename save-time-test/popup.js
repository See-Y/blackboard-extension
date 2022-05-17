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


// chrome.storage.sync.get(['lectureInfo'], function(res) {
//     var lecturelist = JSON.parse(res.lectureInfo);
//     document.querySelector("table").bootstrapTable({
//         data: lecturelist
//     });
// })


document.addEventListener("DOMContentLoaded", function() {
    chrome.storage.sync.get(['lectureInfo'], function(res) {
        var lecturelist = JSON.parse(res.lectureInfo);
        if (!lecturelist || (Object.keys(lecturelist).length === 0 && Object.getPrototypeOf(lecturelist) === Object.prototype)) {
            alert("블랙보드에 접속하여 강좌정보를 가져오세요");
        }
        var children = new Array();
        for (i in lecturelist) {
            var temp = new Object();
            temp["lecture"] = i
            temp["first_time"] = lecturelist[i].first_date == "None" || lecturelist[i].first_date == undefined ? "-" : lecturelist[i].first_date + "_" + lecturelist[i].first_time;
            temp["second_time"] = lecturelist[i].second_date == "None" || lecturelist[i].second_date == undefined ? "-" : lecturelist[i].second_date + "_" + lecturelist[i].second_time;
            temp["third_time"] = lecturelist[i].third_date == "None" || lecturelist[i].third_date == undefined ? "-" : lecturelist[i].third_date + "_" + lecturelist[i].third_time;
            temp["collab"] = lecturelist[i].id;
            //console.log(lecturelist[i].third_date);
            children.push(temp);
        }
        console.log(children);

        function addHeaders(table, keys) {
            var row = table.insertRow();
            for (var i = 0; i < keys.length; i++) {
                var cell = row.insertCell();
                cell.appendChild(document.createTextNode(keys[i]));
            }
        }

        var table = document.createElement('table');
        for (var i = 0; i < children.length; i++) {

            var child = children[i];
            if (i === 0) {
                addHeaders(table, Object.keys(child));
            }
            var row = table.insertRow();
            Object.keys(child).forEach(function(k) {
                var cell = row.insertCell();
                if (k == "collab") {
                    var btn = document.createElement("button");
                    btn.className = "Collab_btn";
                    btn.textContent = "Link";
                    var icon = document.createElement("i");
                    icon.className = 'fa fa-play'
                    btn.append(icon);
                    btn.setAttribute("id", child[k]);
                    cell.appendChild(btn);
                } else {
                    cell.appendChild(document.createTextNode(child[k]));
                }
            })
        }

        document.getElementById('container').appendChild(table);
        var Collab_btn = document.getElementsByClassName("Collab_btn");
        for (var i = 0; i < Collab_btn.length; i += 1) {
            (function() {
                var Collab_Url = `https://blackboard.unist.ac.kr/webapps/collab-ultra/tool/collabultra/lti/launch?course_id=${Collab_btn[i].getAttribute('id')}`;
                Collab_btn[i].addEventListener("click", () => {
                    chrome.tabs.query({ url: Collab_Url }, function(tabs) {
                        if (tabs.length) {
                            chrome.tabs.create(tabs[0].id, { active: true });
                        } else {
                            chrome.tabs.create({ url: Collab_Url });
                        }
                    });
                });
            }());
        }
    })


    var btn0 = document.querySelector("#btn_option_popup");
    btn0.addEventListener("click", () => {
        if (document.location.href.includes("blackboard.unist.ac.kr/") && document.location.href.includes("tab_tab_group_id")) {} else {
            var optionsUrl = chrome.runtime.getURL('options.html');

            chrome.tabs.query({ url: optionsUrl }, function(tabs) {
                if (tabs.length) {
                    chrome.tabs.create(tabs[0].id, { active: true });
                } else {
                    chrome.tabs.create({ url: optionsUrl });
                }
            });
        }
    });
});