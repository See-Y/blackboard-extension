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
                    lecutureI.style.top = ((parseInt(a["timeplace" + c].start) / 288 * 840) - 291) + "px";
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
                    Collab_btn.value = key + "_timeplace" + c
                        // Collab_btn.style.display = "none";
                    Collab_btn.id = a["name"] + "_collab";
                    Collab_btn.className = "collab_btn";
                    tablebody.children[d].appendChild(lecutureI);
                    var left = lecutureI.getBoundingClientRect().left;
                    var top = lecutureI.getBoundingClientRect().top;
                    lectureinfomation.style.top = ((parseInt(a["timeplace" + c].start) / 288 * 840) - 250) + "px";
                    lectureinfomation.style.left = ((parseInt(d) - 0.62) * 62) + "px";
                    lectureinfomation.style.top = top + "px";
                    lectureinfomation.style.position = "fixed";
                    Collab_btn.style.top = ((parseInt(a["timeplace" + c].start) / 288 * 840) - 300) + "px";
                    Collab_btn.style.left = ((parseInt(d) - 0.65) * 62) + "px";
                    Collab_btn.style.position = "fixed";
                    Collab_btn.checked = a["timeplace" + c].collab == undefined || a["timeplace" + c].collab == true ? true : false;
                    btn_div.style.left = ((parseInt(d) - 0.7) * 62) + "px";
                    btn_div.style.top = (parseInt(top) - 10.5) + "px";
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
                        thisbtn.children[0].style.display = "";
                        thisbtn.id = "lecture";
                    } else {
                        thisbtn.children[3].style.display = "";
                        thisbtn.children[0].style.display = "none"
                        thisbtn.id = "lecture_inactive";
                    }
                    c += 1;
                    //Collab_btn[i].style.display = "none"
                }, false);
            }());
        }
        var checkboxls = document.getElementsByClassName("collab_btn");
        for (var i = 0; i < checkboxls.length; i += 1) {
            (function() {
                checkboxls[i].addEventListener('change', (event) => {
                    if (event.currentTarget.checked) {

                        lecturelist[event.currentTarget.value.split("_")[0]][event.currentTarget.value.split("_")[1]]["collab"] = true
                        chrome.storage.sync.set({ 'lectureInfo': JSON.stringify(lecturelist) }, function() {

                        });
                    } else {
                        lecturelist[event.currentTarget.value.split("_")[0]][event.currentTarget.value.split("_")[1]]["collab"] = false;
                        chrome.storage.sync.set({ 'lectureInfo': JSON.stringify(lecturelist) }, function() {

                        });
                        alert("자동접속취소")
                    }
                })
            }());
        }
        chrome.storage.sync.get(['uname'], function(res) {
            if (res.uname == undefined && res.uname == null) {

            } else {
                document.getElementById("lname").value = res.uname.split("_")[0];
                document.getElementById("fname").value = res.uname.split("_")[1];
            }
        })
        var modal = document.getElementById("myModal");
        var span = document.getElementsByClassName("close")[0];
        var optionBtn = document.getElementsByClassName("setting")[0];
        optionBtn.onclick = function() {
            modal.style.display = "block";
        }
        span.onclick = function() {
            modal.style.display = "none";
        }
        var submitBtn = document.getElementById("submitBtn")
        submitBtn.onclick = function() {
            modal.style.display = "none";
            if (document.getElementById("fname").value != "" && document.getElementById("lname").value != "") {
                var uname = document.getElementById("fname").value + "_" + document.getElementById("lname").value;
                chrome.storage.sync.set({ 'uname': uname }, function() {

                });
            }
        }
    })

});