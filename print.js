let db = null;
create_database(); // open the database

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

function loadall() { // draw a table on the popup
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
    const objectStore = trans.objectStore('courses');

    objectStore.openCursor().onsuccess = (event) => {
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