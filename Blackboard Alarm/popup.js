/**
 * Get course id and time informations and set alarms.
 * @param {object} timeplace time info
 * @param {string} course_id course id
 * @returns {object} date info
 */
function setAlarm(timeplace, course_id) {
    var H = parseInt(timeplace["start"] / 12);
    var M = (timeplace["start"] % 12) * 5;
    var course_day = timeplace["day"];
    var course_time = H + ":" + M;

    let now_date = new Date();
    let date = new Date(now_date.getFullYear(), now_date.getMonth(), now_date.getDate() + (course_day - now_date.getDay() + 8) % 7, course_time.split(":")[0], course_time.split(":")[1]);
    if (now_date > date) date.setDate(date.getDate() + 7);
    chrome.alarms.create(course_id + ":" + course_day, { periodInMinutes: 10080, when: date.getTime() });
    chrome.alarms.getAll(function(alarms) { console.log(alarms); });
    return date;
}

/**
 * Delete alarm corresponding to the course id.
 * @param {string} course_id course id
 */
function deleteAlarm(course_id) {
    chrome.alarms.clear(course_id);
    chrome.alarms.getAll(function(alarms) { console.log(alarms); });
}

document.addEventListener("DOMContentLoaded", function() {
    chrome.storage.sync.get(['lectureInfo'], function(res) {
        if (res.lectureInfo == undefined && res.lectureInfo == null) {
            alert("블랙보드에 접속하여 강좌정보를 가져오세요!(현재 접속중일경우 새로고침(F5))");
        } else {
            var lecturelist = JSON.parse(res.lectureInfo);
            if (!lecturelist || (Object.keys(lecturelist).length === 0 && Object.getPrototypeOf(lecturelist) === Object.prototype)) {
                alert("블랙보드에 접속하여 강좌정보를 가져오세요!(현재 접속중일경우 새로고침(F5))");
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
                    //lecutureI.className = "lecture";
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
                    lecturename.style.background = colorlist[i];
                    lecturetime.style.background = colorlist[i];
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
                    Collab_btn.checked = a["timeplace" + c].collab == undefined || a["timeplace" + c].collab == false ? false : true;


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
        var resetBtn = document.querySelector("#myModal > div > label:nth-child(9)");
        resetBtn.onclick = function() {
            chrome.storage.sync.set({ 'lectureInfo': JSON.stringify(new Object()) }, function() {
                alert("데이터 삭제 완료! (블랙보드에서 과목 등록부터 다시해주세요)");
            });
        }
        var checkboxls = document.getElementsByClassName("collab_btn");
        for (var i = 0; i < checkboxls.length; i += 1) {
            (function() {
                var timeplace = lecturelist[checkboxls[i].value.split("_")[0]][checkboxls[i].value.split("_")[1]];
                var course_id = lecturelist[checkboxls[i].value.split("_")[0]].id;
                var course_name = lecturelist[checkboxls[i].value.split("_")[0]].name;
                var redCircle = '<i class="fas fa-circle" style="color:red"></i>';
                var greenCircle = '<i class="fas fa-circle" style="color:lightgreen"></i>';
                var course_day = timeplace.day;
                if (checkboxls[i].checked) {
                    var lectureinfo = checkboxls[i].parentElement.parentElement.parentElement.firstChild;
                    var dt = setAlarm(timeplace, course_id);
                    var dformat = `${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getDate().toString().padStart(2, '0')}/${dt.getFullYear().toString().padStart(4, '0')} ${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}:${dt.getSeconds().toString().padStart(2, '0')}`

                    //console.log(ind)
                    lectureinfo.parentElement.onmouseover = () => { lectureinfo.textContent = dformat; }
                    lectureinfo.parentElement.onmouseout = function() {
                        lectureinfo.textContent = course_name;
                        lectureinfo.parentElement.children[0].insertAdjacentHTML('beforeend', greenCircle);
                        lectureinfo.parentElement.children[0].children[0].style.position = "fixed";
                        lectureinfo.parentElement.children[0].children[0].style.top = parseInt(lectureinfo.parentElement.getBoundingClientRect().bottom, 10) - 16 + "px";
                        lectureinfo.parentElement.children[0].children[0].style.left = parseInt(lectureinfo.parentElement.getBoundingClientRect().right, 10) - 16 + "px";
                    }
                    lectureinfo.parentElement.children[0].insertAdjacentHTML('beforeend', greenCircle);
                    lectureinfo.parentElement.children[0].children[0].style.position = "fixed";
                    lectureinfo.parentElement.children[0].children[0].style.top = parseInt(lectureinfo.parentElement.getBoundingClientRect().bottom, 10) - 16 + "px";
                    lectureinfo.parentElement.children[0].children[0].style.left = ((parseInt(course_day) + 1) * 62) + "px";

                } else if (checkboxls[i].checked == false) {
                    var lectureinfo = checkboxls[i].parentElement.parentElement.parentElement.firstChild;
                    lectureinfo.parentElement.children[0].insertAdjacentHTML('beforeend', redCircle);
                    lectureinfo.parentElement.children[0].children[0].style.position = "fixed";
                    lectureinfo.parentElement.children[0].children[0].style.top = parseInt(lectureinfo.parentElement.getBoundingClientRect().bottom, 10) - 16 + "px";
                    //console.log(((parseInt(ind) + 1) * 62));
                    lectureinfo.parentElement.children[0].children[0].style.left = ((parseInt(course_day) + 1) * 62) + "px";;
                }
                checkboxls[i].addEventListener('change', (event) => {
                    var lectureinfo = event.currentTarget.parentElement.parentElement.parentElement.firstChild;
                    if (event.currentTarget.checked) {

                        timeplace["collab"] = true
                        chrome.storage.sync.set({ 'lectureInfo': JSON.stringify(lecturelist) }, function() {

                        });
                        var dt = setAlarm(timeplace, course_id);
                        var dformat = `${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getDate().toString().padStart(2, '0')}/${dt.getFullYear().toString().padStart(4, '0')} ${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}:${dt.getSeconds().toString().padStart(2, '0')}`
                        alert(`알림이 (${dformat})에 설정됨`)
                        lectureinfo.parentElement.onmouseover = () => { lectureinfo.textContent = dformat; }
                        lectureinfo.parentElement.onmouseout = () => {
                            lectureinfo.textContent = course_name;
                            lectureinfo.parentElement.children[0].insertAdjacentHTML('beforeend', greenCircle);
                            lectureinfo.parentElement.children[0].children[0].style.position = "fixed";
                            lectureinfo.parentElement.children[0].children[0].style.top = parseInt(lectureinfo.parentElement.getBoundingClientRect().bottom, 10) - 16 + "px";
                            lectureinfo.parentElement.children[0].children[0].style.left = parseInt(lectureinfo.parentElement.getBoundingClientRect().right, 10) - 16 + "px";
                        }
                    } else {
                        timeplace["collab"] = false;
                        chrome.storage.sync.set({ 'lectureInfo': JSON.stringify(lecturelist) }, function() {

                        });
                        deleteAlarm(course_id + ":" + course_day);

                        lectureinfo.parentElement.onmouseover = () => { lectureinfo.textContent = course_name; }
                        lectureinfo.parentElement.onmouseout = () => {
                            lectureinfo.parentElement.children[0].insertAdjacentHTML('beforeend', redCircle);
                            lectureinfo.parentElement.children[0].children[0].style.position = "fixed";
                            lectureinfo.parentElement.children[0].children[0].style.top = parseInt(lectureinfo.parentElement.getBoundingClientRect().bottom, 10) - 16 + "px";
                            lectureinfo.parentElement.children[0].children[0].style.left = parseInt(lectureinfo.parentElement.getBoundingClientRect().right, 10) - 16 + "px";
                        }
                    }
                })
            }());
        }
        chrome.alarms.getAll(function(alarms) { console.log(alarms); });
    })
});