

document.getElementById('testbtn').addEventListener("click", event => { // 삽입 버튼 클릭시 이벤트
    event.preventDefault();
    const form_data = new FormData(document.getElementById('form'));
    var f_date = document.getElementById('fdate');
    var s_date = document.getElementById('sdate');
    var t_date = document.getElementById('tdate');
    var f_raw_time = document.getElementById('ftime').value;
    var s_raw_time = document.getElementById('stime').value;
    var t_raw_time = document.getElementById('ttime').value;
    if(f_raw_time == '')
        f_raw_time = '00:00';
    if(s_raw_time == '')
        s_raw_time = '00:00';
    if(t_raw_time == '')
        t_raw_time = '00:00';
    var st = form_data.get('cname');
    chrome.storage.sync.set({[st] : [st, f_raw_time, s_raw_time, t_raw_time, f_date.value, s_date.value, t_date.value] }, function() {
        console.log("saved!");
        if (chrome.runtime.error) {
            console.log("Runtime error.");
        }
    });
});

document.getElementById('rmbtn').addEventListener("click", event => { // 삭제버튼 클릭시 이벤트
    
    event.preventDefault();
    const form_data = new FormData(document.getElementById('form'));
    var st = form_data.get('cname');
    chrome.storage.sync.remove([st], function(Items) {
        alert("removed");
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
    var allKeys = [];
    chrome.storage.sync.get(null, function(items) {
        allKeys = Object.keys(items);
        console.log(allKeys);
        for(var k in allKeys) {
            chrome.storage.sync.get(allKeys[k], function(result) {
                for(var d in result) {
                    console.log(result[d]);
                }
              });
        }
    });
    
  }