// chrome.storage.sync.get(['lectureInfo'], function(res) {
//     var lecturelist = JSON.parse(res.lectureInfo);
//     document.querySelector("table").bootstrapTable({
//         data: lecturelist
//     });
// })


document.addEventListener("DOMContentLoaded", function() {
    chrome.storage.sync.get(['lectureInfo'], function(res) {
        //console.log(res.lectureInfo);
        function openOption(evt) {
            console.log(evt);
        }
        if (res.lectureInfo == undefined && res.lectureInfo == null) {
            alert("블랙보드에 접속하여 강좌정보를 가져오세요");
        } else {
            var lecturelist = JSON.parse(res.lectureInfo);
            if (!lecturelist || (Object.keys(lecturelist).length === 0 && Object.getPrototypeOf(lecturelist) === Object.prototype)) {
                alert("블랙보드에 접속하여 강좌정보를 가져오세요");
            }
        }
        var tablebody = document.getElementsByClassName("tablebody")[1].children[0].children[0];
        var colorlist = ["#eff9cc", "#dee8f6", "#ffe9e9", "#ffedda", "#dcf2e9", "#dceef2", "#fff8cc", "#ffe9e9"]
        var i = 0
        for (key in lecturelist) {
            var a = lecturelist[key]
            i += 1;
            for (var c = 0; c < 3; c++) {
                if (a["timeplace" + c]) {
                    var lecutureI = document.createElement("div");
                    lecutureI.setAttribute("id", "lecture");
                    lecutureI.className = "lecture";
                    var d = parseInt(a["timeplace" + c].day) + 1;
                    var lecturename = document.createElement("div");
                    lecturename.textContent = lecturelist[key]["name"]
                    lecturename.setAttribute("id", "lecturename");
                    lecutureI.appendChild(lecturename);

                    var lecturetime = document.createElement("div");
                    //lecturetime.textContent = lecturelist[key]["professor"]
                    lecturetime.setAttribute("id", "lecturetime");
                    lecutureI.appendChild(lecturetime);


                    var new_line = document.createElement("br");
                    lecutureI.appendChild(new_line.cloneNode());

                    lecutureI.style.position = "absolute"
                    lecutureI.style.top = ((parseInt(a["timeplace" + c].start) / 288 * 840) - 275) + "px";
                    lecutureI.style.height = ((parseInt(a["timeplace" + c].end) - parseInt(a["timeplace" + c].start)) * 2.8) + "px";
                    lecturename.style.background = colorlist[i]
                    lecturetime.style.background = colorlist[i]
                        // lecturetime.style.display = "none"

                    var lectureinfomation = document.createElement('div');
                    lectureinfomation.textContent = a["professor"]
                    lectureinfomation.className = "lectureinformation";
                    var btn_div = document.createElement("div");
                    var Collab_btn = document.createElement("input");
                    btn_div.className = "btn_div";
                    Collab_btn.type = "checkbox";
                    Collab_btn.value = key+"_timeplace" + c
                    // Collab_btn.style.display = "none";
                    Collab_btn.id = a["name"] + "_collab";
                    Collab_btn.className = "collab_btn";
                    tablebody.children[d].appendChild(lecutureI);
                    var left = lecutureI.getBoundingClientRect().left;
                    var top = lecutureI.getBoundingClientRect().top;
                    lectureinfomation.style.top = ((parseInt(a["timeplace" + c].start) / 288 * 840) - 275) + "px";
                    lectureinfomation.style.left = ((parseInt(d)-0.68) * 68) + "px";
                    lectureinfomation.style.top = top + "px";
                    lectureinfomation.style.position = "fixed";
                    Collab_btn.style.top = ((parseInt(a["timeplace" + c].start) / 288 * 840) - 285) + "px";
                    Collab_btn.style.left = ((parseInt(d)-0.68) * 68) + "px";
                    Collab_btn.style.position = "fixed";
                    Collab_btn.checked = a["timeplace" + c].collab == undefined || a["timeplace" + c].collab == true ? true: false;
                    btn_div.style.left = ((parseInt(d)-0.68) * 68) + "px";
                    btn_div.style.top = (parseInt(top)-10.5)+ "px";
                    btn_div.textContent = "자동접속"
                    btn_div.style.position = "fixed";
        
                    //lectureinfomation.style.width = "120px";
                    btn_div.appendChild(Collab_btn);
                    lecutureI.appendChild(lectureinfomation);
                    lectureinfomation.appendChild(btn_div);
                    lectureinfomation.style.display = "none";
                }
            }
        }
        var Collab_btn = document.getElementsByClassName("lecture");
        for (var i = 0; i < Collab_btn.length; i += 1) {
            (function() {
                var thisbtn = Collab_btn[i]
                var c = 0;
                Collab_btn[i].addEventListener("click", () => {
                    if (c % 2 == 1) {
                        //console.log(thisbtn);
                        thisbtn.children[3].style.display = "none";
                        thisbtn.children[0].style.display = ""
                    } else {
                        thisbtn.children[3].style.display = "";
                        thisbtn.children[0].style.display = "none"
                    }
                    c += 1;
                    //Collab_btn[i].style.display = "none"
                }, false);
            }());
        }
        var checkboxls = document.getElementsByClassName("collab_btn");
        for(var i=0; i< checkboxls.length; i+=1){
            (function() {
                checkboxls[i].addEventListener('change', (event) => {
            if (event.currentTarget.checked) {
                
                lecturelist[event.currentTarget.value.split("_")[0]][event.currentTarget.value.split("_")[1]]["collab"]=true
                chrome.storage.sync.set({ 'lectureInfo': JSON.stringify(lecturelist) }, function() {
                
                });
            } 
            else {
                lecturelist[event.currentTarget.value.split("_")[0]][event.currentTarget.value.split("_")[1]]["collab"]=false;
                chrome.storage.sync.set({ 'lectureInfo': JSON.stringify(lecturelist) }, function() {
                
                });
                alert("자동접속취소")
            }
        })
            }());
        }
        

        // function compare(a, b) {
        //     if (parseInt(a.style.top, 10) > parseInt(b.style.top, 10)) {
        //         return 1;
        //     }
        //     if (parseInt(a.style.top, 10) < parseInt(b.style.top, 10)) {
        //         return -1;
        //     }
        //     // a must be equal to b
        //     return 0;
        // }
        // for (var i = 1; i < 6; i++) {
        //     var el = document.querySelector("#container > div.tablebody > table > tbody > tr").children[i];
        //     var ls = [].slice.call(el.children).sort(compare);
        //     console.log(ls)
        //     for (var b = el.childNodes.length - 1; b >= 0; b--) {
        //         el.removeChild(el.childNodes[b]);
        //     }
        //     for (var a in ls) {
        //         el.appendChild(ls[a]);
        //     }
        // }
        // var children = new Array();
        // const date_name = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "None"];
        // for (i in lecturelist) {
        //     var temp = new Object();
        //     temp["lecture"] = i
        //     temp["first_time"] = lecturelist[i].first_date == 7 || lecturelist[i].first_date == undefined ? "-" : date_name[lecturelist[i].first_date] + "_" + lecturelist[i].first_time;
        //     temp["second_time"] = lecturelist[i].second_date == 7 || lecturelist[i].second_date == undefined ? "-" : date_name[lecturelist[i].second_date] + "_" + lecturelist[i].second_time;
        //     temp["third_time"] = lecturelist[i].third_date == 7 || lecturelist[i].third_date == undefined ? "-" : date_name[lecturelist[i].third_date] + "_" + lecturelist[i].third_time;
        //     temp["collab"] = lecturelist[i].id;
        //     temp["auto_join"] = lecturelist[i].use_collaborate == undefined ? '-'  : lecturelist[i].use_collaborate == true ? 'Yes' : 'No';
        //     //console.log(lecturelist[i].third_date);
        //     children.push(temp);
        // }

        // function addHeaders(table, keys) {
        //     var row = table.insertRow();
        //     for (var i = 0; i < keys.length; i++) {
        //         var cell = row.insertCell();
        //         cell.appendChild(document.createTextNode(keys[i]));
        //     }
        // }

        // var table = document.createElement('table');
        // for (var i = 0; i < children.length; i++) {

        //     var child = children[i];
        //     if (i === 0) {
        //         addHeaders(table, Object.keys(child));
        //     }
        //     var row = table.insertRow();
        //     Object.keys(child).forEach(function(k) {
        //         var cell = row.insertCell();
        //         if (k == "collab") {
        //             var btn = document.createElement("button");
        //             btn.className = "Collab_btn";
        //             btn.textContent = "Link";
        //             var icon = document.createElement("i");
        //             icon.className = 'fa fa-play'
        //             btn.append(icon);
        //             btn.setAttribute("id", child[k]);
        //             cell.appendChild(btn);
        //         } else {
        //             cell.appendChild(document.createTextNode(child[k]));
        //         }
        //     })
        // }

        // document.getElementById('container').appendChild(table);
        // var Collab_btn = document.getElementsByClassName("Collab_btn");
        // for (var i = 0; i < Collab_btn.length; i += 1) {
        //     (function() {
        //         var Collab_Url = `https://blackboard.unist.ac.kr/webapps/collab-ultra/tool/collabultra/lti/launch?course_id=${Collab_btn[i].getAttribute('id')}`;
        //         Collab_btn[i].addEventListener("click", () => {
        //             chrome.tabs.query({ url: Collab_Url }, function(tabs) {
        //                 if (tabs.length) {
        //                     chrome.tabs.create(tabs[0].id, { active: true });
        //                 } else {
        //                     chrome.tabs.create({ url: Collab_Url });
        //                 }
        //             });
        //         });
        //     }());
        // }
    })


    // var btn0 = document.querySelector("#btn_option_popup");
    // btn0.addEventListener("click", () => {
    //     if (document.location.href.includes("blackboard.unist.ac.kr/") && document.location.href.includes("tab_tab_group_id")) {} else {
    //         var optionsUrl = chrome.runtime.getURL('options.html');

    //         chrome.tabs.query({ url: optionsUrl }, function(tabs) {
    //             if (tabs.length) {
    //                 chrome.tabs.create(tabs[0].id, { active: true });
    //             } else {
    //                 chrome.tabs.create({ url: optionsUrl });
    //             }
    //         });
    //     }
    // });
});