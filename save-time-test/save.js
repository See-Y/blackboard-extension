<<<<<<< Updated upstream
let db = null;
create_database(); // 데이터 베이스 열기

function create_database() { 
    console.log("open the database");
    const request = indexedDB.open('TimeTableDB');
    request.onerror = function (event) {
        console.log("Problem opening DB.");
    }
    request.onupgradeneeded = function (event) {
        let db = event.target.result;
        let store = db.createObjectStore('courses', { keyPath: "id", autoIncrement:true });

        let index = store.createIndex('name', 'name', {
            unique: true
        });
    }
    request.onsuccess = function (event) {
        db = event.target.result;
        console.log("DB OPENED.");
        db.onerror = function (event) {
            console.log("FAILED TO OPEN DB.")
        }
        loadall();
    }
}

function insertContact(db, course) { // 삽입
    console.log("insert");
    const trans = db.transaction('courses', 'readwrite');

    const store = trans.objectStore('courses');
    let query = store.put(course);

    query.onsuccess = function (event) {
        console.log(event);
    };

    query.onerror = function (event) {
        console.log(event.target.errorCode);
        alert("Error!");
    }
    loadall();
}

function loadall() { // 표 그리기
    let table = document.getElementById('courseTable');
    table.innerHTML = "";
    let thead = document.createElement('thead');
    let tbody = document.createElement('tbody');

    table.appendChild(thead);
    table.appendChild(tbody);
    let row_head = document.createElement('tr');
    let heading_1 = document.createElement('th');
    heading_1.innerHTML = "Name";
    let heading_2 = document.createElement('th');
    heading_2.innerHTML = "First lecture date";
    let heading_3 = document.createElement('th');
    heading_3.innerHTML = "First lecture time";
    let heading_4 = document.createElement('th');
    heading_4.innerHTML = "Second lecture date";
    let heading_5 = document.createElement('th');
    heading_5.innerHTML = "Second lecture time";
    let heading_6 = document.createElement('th');
    heading_6.innerHTML = "Third lecture date";
    let heading_7 = document.createElement('th');
    heading_7.innerHTML = "Third lecture time";
    row_head.appendChild(heading_1);
    row_head.appendChild(heading_2);
    row_head.appendChild(heading_3);
    row_head.appendChild(heading_4);
    row_head.appendChild(heading_5);
    row_head.appendChild(heading_6);
    row_head.appendChild(heading_7);
    thead.appendChild(row_head);

    const trans = db.transaction('courses', "readonly");
    const store = trans.objectStore('courses');

    store.openCursor().onsuccess = (event) => {
        let cursor = event.target.result;
        var i = 0;
        if (cursor) {
            console.log(i);
            let course_data = cursor.value;
            let new_row = document.createElement('tr');
            let data_1 = document.createElement('th');
            let data_2 = document.createElement('th');
            let data_3 = document.createElement('th');
            let data_4 = document.createElement('th');
            let data_5 = document.createElement('th');
            let data_6 = document.createElement('th');
            let data_7 = document.createElement('th');
            data_1.innerHTML = course_data.name;
            data_2.innerHTML = course_data.first_date;
            data_3.innerHTML = course_data.first_time;
            if(course_data.second_date == 'None') {
                data_4.innerHTML = '-';
                data_5.innerHTML = '-';
            }
            else {
                data_4.innerHTML = course_data.second_date;
                data_5.innerHTML = course_data.second_time;
            }
            if(course_data.third_date == 'None') {
                data_6.innerHTML = '-';
                data_7.innerHTML = '-';
            }
            else {
                data_6.innerHTML = course_data.third_date;
                data_7.innerHTML = course_data.third_time;
            }
            new_row.appendChild(data_1);
            new_row.appendChild(data_2);
            new_row.appendChild(data_3);
            new_row.appendChild(data_4);
            new_row.appendChild(data_5);
            new_row.appendChild(data_6);
            new_row.appendChild(data_7);
            tbody.appendChild(new_row);
            i = i + 1;
            cursor.continue();
        }
    };
}

function deleteCourse(db, target) { // 제거
    console.log("delete");
    const trans = db.transaction('courses', 'readwrite');
    const store = trans.objectStore('courses');
    
    var key;
    store.openCursor().onsuccess = (event) => {
        let cursor = event.target.result;
        console.log("cursor");
        if (cursor) {
            if(cursor.value.name == target) {
                key = cursor.value.id;
                console.log(key);
                let query = store.delete(key);

                query.onsuccess = function (event) {
                    console.log(event);
                };

                query.onerror = function (event) {
                    console.log(event.target.errorCode);
                }
            }
            cursor.continue();
        }
    };
    loadall();
}

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
    insertContact(db, 
        {
            name : form_data.get('cname'),
            first_date : f_date.options[f_date.selectedIndex].value,
            first_time : f_raw_time,
            second_date : s_date.options[s_date.selectedIndex].value,
            second_time : s_raw_time,
            third_date : t_date.options[t_date.selectedIndex].value,
            third_time : t_raw_time
        });
});

document.getElementById('rmbtn').addEventListener("click", event => { // 삭제버튼 클릭시 이벤트
    
    event.preventDefault();
    const form_data = new FormData(document.getElementById('form'));
    deleteCourse(db, form_data.get('cname'));
    
});
=======
let db = null;
create_database(); // 데이터 베이스 열기

function create_database() { 
    console.log("open the database");
    const request = indexedDB.open('TimeTableDB');
    request.onerror = function (event) {
        console.log("Problem opening DB.");
    }
    request.onupgradeneeded = function (event) {
        let db = event.target.result;
        let store = db.createObjectStore('courses', { keyPath: "id", autoIncrement:true });

        let index = store.createIndex('name', 'name', {
            unique: true
        });
    }
    request.onsuccess = function (event) {
        db = event.target.result;
        console.log("DB OPENED.");
        db.onerror = function (event) {
            console.log("FAILED TO OPEN DB.")
        }
        loadall();
    }
}

function insertContact(db, course) { // 삽입
    console.log("insert");
    const trans = db.transaction('courses', 'readwrite');

    const store = trans.objectStore('courses');
    let query = store.put(course);

    query.onsuccess = function (event) {
        console.log(event);
    };

    query.onerror = function (event) {
        console.log(event.target.errorCode);
        alert("Error!");
    }
    loadall();
}

function loadall() { // 표 그리기
    let table = document.getElementById('courseTable');
    table.innerHTML = "";
    let thead = document.createElement('thead');
    let tbody = document.createElement('tbody');

    table.appendChild(thead);
    table.appendChild(tbody);
    let row_head = document.createElement('tr');
    let heading_1 = document.createElement('th');
    heading_1.innerHTML = "Name";
    let heading_2 = document.createElement('th');
    heading_2.innerHTML = "First lecture date";
    let heading_3 = document.createElement('th');
    heading_3.innerHTML = "First lecture time";
    let heading_4 = document.createElement('th');
    heading_4.innerHTML = "Second lecture date";
    let heading_5 = document.createElement('th');
    heading_5.innerHTML = "Second lecture time";
    let heading_6 = document.createElement('th');
    heading_6.innerHTML = "Third lecture date";
    let heading_7 = document.createElement('th');
    heading_7.innerHTML = "Third lecture time";
    row_head.appendChild(heading_1);
    row_head.appendChild(heading_2);
    row_head.appendChild(heading_3);
    row_head.appendChild(heading_4);
    row_head.appendChild(heading_5);
    row_head.appendChild(heading_6);
    row_head.appendChild(heading_7);
    thead.appendChild(row_head);

    const trans = db.transaction('courses', "readonly");
    const store = trans.objectStore('courses');

    store.openCursor().onsuccess = (event) => {
        let cursor = event.target.result;
        var i = 0;
        if (cursor) {
            console.log(i);
            let course_data = cursor.value;
            let new_row = document.createElement('tr');
            let data_1 = document.createElement('th');
            let data_2 = document.createElement('th');
            let data_3 = document.createElement('th');
            let data_4 = document.createElement('th');
            let data_5 = document.createElement('th');
            let data_6 = document.createElement('th');
            let data_7 = document.createElement('th');
            data_1.innerHTML = course_data.name;
            data_2.innerHTML = course_data.first_date;
            data_3.innerHTML = course_data.first_time;
            if(course_data.second_date == 'None') {
                data_4.innerHTML = '-';
                data_5.innerHTML = '-';
            }
            else {
                data_4.innerHTML = course_data.second_date;
                data_5.innerHTML = course_data.second_time;
            }
            if(course_data.third_date == 'None') {
                data_6.innerHTML = '-';
                data_7.innerHTML = '-';
            }
            else {
                data_6.innerHTML = course_data.third_date;
                data_7.innerHTML = course_data.third_time;
            }
            new_row.appendChild(data_1);
            new_row.appendChild(data_2);
            new_row.appendChild(data_3);
            new_row.appendChild(data_4);
            new_row.appendChild(data_5);
            new_row.appendChild(data_6);
            new_row.appendChild(data_7);
            tbody.appendChild(new_row);
            i = i + 1;
            cursor.continue();
        }
    };
}

function deleteCourse(db, target) { // 제거
    console.log("delete");
    const trans = db.transaction('courses', 'readwrite');
    const store = trans.objectStore('courses');
    
    var key;
    store.openCursor().onsuccess = (event) => {
        let cursor = event.target.result;
        console.log("cursor");
        if (cursor) {
            if(cursor.value.name == target) {
                key = cursor.value.id;
                console.log(key);
                let query = store.delete(key);

                query.onsuccess = function (event) {
                    console.log(event);
                };

                query.onerror = function (event) {
                    console.log(event.target.errorCode);
                }
            }
            cursor.continue();
        }
    };
    loadall();
}

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
    insertContact(db, 
        {
            name : form_data.get('cname'),
            first_date : f_date.options[f_date.selectedIndex].value,
            first_time : f_raw_time,
            second_date : s_date.options[s_date.selectedIndex].value,
            second_time : s_raw_time,
            third_date : t_date.options[t_date.selectedIndex].value,
            third_time : t_raw_time
        });
});

document.getElementById('rmbtn').addEventListener("click", event => { // 삭제버튼 클릭시 이벤트
    
    event.preventDefault();
    const form_data = new FormData(document.getElementById('form'));
    deleteCourse(db, form_data.get('cname'));
    
});
>>>>>>> Stashed changes
