let db = null;
create_database();

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

function loadall() { // 현재 저장된 과목 이름 로드(디버깅용)
    //$("#table_of_items tr").remove();

    const trans = db.transaction('courses', "readonly");
    const objectStore = trans.objectStore('courses');
    console.log("loadall");
    objectStore.openCursor().onsuccess = (event) => {
        let cursor = event.target.result;
        if (cursor) {
            let course_data = cursor.value;
            console.log(course_data.name);
            cursor.continue();
        }
    };
}