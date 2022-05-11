

document.getElementById('inputbtn').addEventListener("click", event => { // 삽입 버튼 클릭시 이벤트
    event.preventDefault();
    var lec = [];
    var j_data = [];
    var list_data = new Object();
    chrome.storage.sync.get('lectureInfo', function(result) {
        for(var d in result) {
            const lec_data = JSON.parse(result[d]);
            for(var p in lec_data) {
                lec[p] = lec_data[p];
            }
        }
        for(var current in lec) {
            var time_data = [];
            var date_data = [];
            var time_name = "time_" + current.toString() + "_";
            var date_name = "date_" + current.toString() + "_";
            var time_index = [0, 1, 2];
            for(var i in time_index) {
                var time_input_name = time_name + i.toString();
                var time_raw_data = document.getElementById(time_input_name).value;
                time_data[i] = time_raw_data;
            }
            var date_index = [0, 1, 2];
            for(var i in date_index) {
                var date_input_name = date_name + i.toString();
                var date_raw_data = document.getElementById(date_input_name).value;
                date_data[i] = date_raw_data;
            }
            var add_data;
            add_data = {
                'id' : lec[current].id,
                'link' : lec[current].link,
                'name' : lec[current].name,
                'first_date' : date_data[0],
                'first_time' : time_data[0],
                'second_date' : date_data[1],
                'second_time' : time_data[1],
                'third_date' : date_data[2],
                'third_time' : time_data[2],
            };
            list_data[current] = add_data; 
        }
        j_data = JSON.stringify(list_data);
        chrome.storage.sync.set({['lectureInfo'] : j_data }, function() {
            console.log("saved!");
            alert("저장 완료!");
            if (chrome.runtime.error) {
                console.log("Runtime error.");
            }
        });
    });
    
});

document.getElementById('rmbtn').addEventListener("click", event => { // 삭제버튼 클릭시 이벤트
    
    event.preventDefault();
    alert("데이터 삭제 완료! (블랙보드에서 과목 등록부터 다시해주세요)");
    chrome.storage.sync.clear();
    
});


document.getElementById('testbtn').addEventListener("click", event => {
    event.preventDefault();
    var allKeys = [];
    chrome.storage.sync.get(null, function(items) {
        allKeys = Object.keys(items);
        for(var k in allKeys) {
            chrome.storage.sync.get(allKeys[k], function(result) {
                for(var d in result) {
                    const lec = JSON.parse(result[d]);
                    console.log(lec);
                }
              });
        }
    });
    
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
        for(var d in result) {
            const lec = JSON.parse(result[d]);
            console.log(lec);
            for(var current in lec) {
                var form = document.getElementById('course_form')
                var index = [0, 1, 2];
                var new_line = document.createElement("br");
                var course_label = document.createElement("label");
                var time_data = [];
                var date_data = [];
                time_data[0] = lec[current].first_time;
                time_data[1] = lec[current].second_time;
                time_data[2] = lec[current].third_time;
                date_data[0] = lec[current].first_date;
                date_data[1] = lec[current].second_date;
                date_data[2] = lec[current].third_date;
                course_label.innerHTML = lec[current].name.toString();
                form.appendChild(course_label);
                form.appendChild(new_line.cloneNode());
                const date_name = ["None", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
                for(var cur_idx in index) {
                    var temp = cur_idx;
                    var time_name_str = "time_" + current.toString() + "_" + temp.toString();
                    var date_name_str = "date_" + current.toString() + "_" + temp.toString();
                    var time_in = document.createElement("input");
                    var date_in = document.createElement("select");
                    for(var cur_date in date_name) {
                        var opt = document.createElement("option");
                        opt.text = date_name[cur_date];
                        opt.value = date_name[cur_date];
                        date_in.options.add(opt);
                    }
                    date_in.setAttribute("value", date_data[cur_idx]);
                    if(date_data[cur_idx] == undefined || date_data[cur_idx] == "None") 
                        date_data[cur_idx] = 0;
                    else if(date_data[cur_idx] == "Monday")
                        date_data[cur_idx] = 1;
                    else if(date_data[cur_idx] == "Tuesday")
                        date_data[cur_idx] = 2;
                    else if(date_data[cur_idx] == "Wednesday")
                        date_data[cur_idx] = 3; 
                    else if(date_data[cur_idx] == "Thursday")
                        date_data[cur_idx] = 4;
                    else if(date_data[cur_idx] == "Friday")
                        date_data[cur_idx] = 5;  
                    if(time_data[cur_idx] == undefined)
                        time_data[cur_idx] = "09:00"
                    date_in.setAttribute("id", date_name_str);
                    date_in.selectedIndex = date_data[cur_idx];
                    time_in.setAttribute("id", time_name_str);
                    time_in.setAttribute("type", "time");
                    time_in.setAttribute("value", time_data[cur_idx]);
                    form.appendChild(date_in);
                    form.appendChild(time_in);
                }
                form.appendChild(new_line.cloneNode());
                form.appendChild(new_line.cloneNode());
            }
        }
    });
  }