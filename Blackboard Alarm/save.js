document.getElementById('inputbtn').addEventListener("click", event => { // 삽입 버튼 클릭시 이벤트
    event.preventDefault();
    var lec = [];
    var j_data = [];
    var list_data = new Object();
    chrome.storage.sync.get('lectureInfo', function(result) {
        for (var d in result) {
            const lec_data = JSON.parse(result[d]);
            for (var p in lec_data) {
                lec[p] = lec_data[p];
            }
        }
        var duplicated_courses = [];
        for (var current in lec) {
            var time_data = [];
            var date_data = [];
            var time_name = "time_" + current.toString() + "_";
            var date_name = "date_" + current.toString() + "_";
            var check_name = "check_" + current.toString();
            for (let i = 0; i < 3; i++) {
                var time_input_name = time_name + i.toString();
                var time_raw_data = document.getElementById(time_input_name).value;
                time_data[i] = time_raw_data;
            }
            for (let i = 0; i < 3; i++) {
                var date_input_name = date_name + i.toString();
                var date_raw_data = document.getElementById(date_input_name).selectedIndex;
                date_data[i] = date_raw_data;
            }
            var add_data;
            add_data = {
                'id': lec[current].id,
                'link': lec[current].link,
                'name': lec[current].name,
                'first_date': date_data[0],
                'first_time': time_data[0],
                'second_date': date_data[1],
                'second_time': time_data[1],
                'third_date': date_data[2],
                'third_time': time_data[2],
                'use_collaborate': document.getElementById(check_name).checked
            };
            if(duplicated_courses.length == 0) {
                for(let i = 0; i < 3; i++) {
                    if(date_data[i] == 7)
                        continue;
                    for(let j = i + 1; j < 3; j++) {
                        if(duplicate_check(date_data[i], date_data[j], time_data[i], time_data[j]))
                            duplicated_courses.push(add_data.name);
                    }
                }
            }
            if(duplicated_courses.length == 0) {
                var is_duplicated = false;
                for(var check in list_data) {
                    for(let i = 0; i < 3; i++) {
                        if(date_data[i] == 7)
                            continue;
                        if(duplicate_check(date_data[i], list_data[check].first_date, time_data[i], list_data[check].first_time)) {
                            duplicated_courses.push(list_data[check].name);
                            is_duplicated = true;
                        }
                        else if(duplicate_check(date_data[i], list_data[check].second_date, time_data[i], list_data[check].second_time)) {
                            duplicated_courses.push(list_data[check].name);
                            is_duplicated = true;
                        }
                        else if(duplicate_check(date_data[i], list_data[check].third_date, time_data[i], list_data[check].third_time)) {
                            duplicated_courses.push(list_data[check].name);
                            is_duplicated = true;
                        }
                    }
                }
                if(is_duplicated == true)
                    duplicated_courses.push(add_data.name);
            }
            list_data[current] = add_data;
        }
        if(duplicated_courses.length != 0) {
            var alert_string = "";
            for(let i = 0; i < duplicated_courses.length; i++) {
                alert_string += duplicated_courses[i];
                if(i < duplicated_courses.length - 1)
                    alert_string += ", ";
            }
            alert_string += "이(가) 시간이 중복됩니다. 다시 한번 확인해주세요.";
            alert(alert_string);
        }
        else {
            j_data = JSON.stringify(list_data);
            chrome.storage.sync.set({
                ['lectureInfo']: j_data
            }, function() {
                console.log("saved!");
                alert("저장 완료!");
                if (chrome.runtime.error) {
                    console.log("Runtime error.");
                }
                // Delete all alarms before setting new alarm
                chrome.alarms.clearAll();
                // Setting all alarms saved in chrome sync
                setAlarm();
            });
        }
    });
    

});

// Get all courses's time in chrome sync and set alarms
function setAlarm() {
    chrome.storage.sync.get('lectureInfo', function(result) {
        for (var d in result) {
            const lec = JSON.parse(result[d]);
            for (var current in lec) {
                if(!lec[current].use_collaborate)
                    continue;
                if(lec[current].first_date != 7) // 7 indicates undefined or None
                    createAlarm(lec[current].id+":1", lec[current].first_date, lec[current].first_time);
                if(lec[current].second_date != 7)
                    createAlarm(lec[current].id+":2", lec[current].second_date, lec[current].second_time);
                if(lec[current].third_date != 7)
                    createAlarm(lec[current].id+":3", lec[current].third_date, lec[current].third_time);
            }
        }
    });
}

// Get course_id, course_day(days of the week), and time to set alarm
function createAlarm(course_id, course_day, course_time) {
    let now_date = new Date();
    let date = new Date(now_date.getFullYear(), now_date.getMonth(), now_date.getDate()+(course_day-now_date.getDay()+7)%7, course_time.split(":")[0], course_time.split(":")[1]);
    // Check whether the time is smaller or bigger than current time
    // If small, add 7 days
    if (now_date > date) date.setDate(date.getDate()+7);
    console.log(course_id+" alarm set at "+date); 
    chrome.alarms.create(course_id, {periodInMinutes : 10080, when : date.getTime()});
}

document.getElementById('rmbtn').addEventListener("click", event => { // 삭제버튼 클릭시 이벤트

    event.preventDefault();
    alert("데이터 삭제 완료! (블랙보드에서 과목 등록부터 다시해주세요)");
    chrome.storage.sync.set({ 'lectureInfo': JSON.stringify(new Object()) }, function() {
        // alert(JSON.stringify(lecturelist));
    });
    location.reload();
});




chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (var key in changes) {
        var storageChange = changes[key];
        console.log('Storage key "%s" in namespace "%s" changed. ' +
            'Old value was "%s", new value is "%s".',
            key,
            namespace,
            storageChange.oldValue,
            storageChange.newValue);
    }
});

window.onload = function() {
    chrome.storage.sync.get('lectureInfo', function(result) {
        for (var d in result) {
            const lec = JSON.parse(result[d]);
            console.log(lec);
            for (var current in lec) {
                var form = document.getElementById('course_form')
                var container = document.createElement("div");
                container.className = lec[current].name.toString();
                form.appendChild(container)
                var new_line = document.createElement("br");
                var course_label = document.createElement("label");
                var time_data = [];
                var date_data = [];
                var check_name_str = "check_" + current.toString();
                var check_label = document.createElement("label");
                check_label.innerHTML = "콜라보레이트 자동접속 :  ";
                var check_in = document.createElement("input");
                check_in.type = "checkbox";
                check_in.setAttribute("id", check_name_str);
                check_in.checked = lec[current].use_collaborate == undefined ? true : lec[current].use_collaborate;
                time_data[0] = lec[current].first_time;
                time_data[1] = lec[current].second_time;
                time_data[2] = lec[current].third_time;
                date_data[0] = lec[current].first_date;
                date_data[1] = lec[current].second_date;
                date_data[2] = lec[current].third_date;
                course_label.innerHTML = lec[current].name.toString();
                container.appendChild(course_label);
                container.appendChild(new_line.cloneNode());
                const date_name = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "None"];
                for (let cur_idx = 0; cur_idx < 3; cur_idx++) {
                    var timeContainer = document.createElement('div');
                    timeContainer.className = "time_container";
                    container.appendChild(timeContainer);
                    var time_name_str = "time_" + current.toString() + "_" + cur_idx.toString();
                    var date_name_str = "date_" + current.toString() + "_" + cur_idx.toString();
                    var time_in = document.createElement("input");
                    var date_in = document.createElement("select");
                    for (var cur_date in date_name) {
                        var opt = document.createElement("option");
                        opt.text = date_name[cur_date];
                        opt.value = date_name[cur_date];
                        date_in.options.add(opt);
                    }
                    if(date_data[cur_idx] == undefined)
                        date_data[cur_idx] = 7;
                    if (time_data[cur_idx] == undefined)
                        time_data[cur_idx] = "09:00"
                    date_in.setAttribute("value", date_name[date_data[cur_idx]]);
                    date_in.setAttribute("id", date_name_str);
                    date_in.selectedIndex = date_data[cur_idx];
                    time_in.setAttribute("id", time_name_str);
                    time_in.setAttribute("type", "time");
                    time_in.setAttribute("value", time_data[cur_idx]);
                    timeContainer.appendChild(date_in);
                    timeContainer.appendChild(time_in);
                }
                var checkContainer = document.createElement('div');
                checkContainer.className = "check_container";
                container.appendChild(checkContainer);
                checkContainer.appendChild(check_label);
                checkContainer.appendChild(check_in);
                //container.appendChild(new_line.cloneNode());
                //container.appendChild(new_line.cloneNode());
            }
        }
    });
}

function duplicate_check(x_date, y_date, x_time, y_time) {
    if(x_date == y_date && x_time == y_time)
        return true;
    return false;
}