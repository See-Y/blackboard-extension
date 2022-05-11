loadall();

function loadall() { // 현재 저장된 과목 이름 로드(디버깅용)
        chrome.storage.sync.get('lectureInfo', function(result) {
            for(var d in result) {
                const lec_data = JSON.parse(result[d]);
                console.log(lec_data);
            }
        });
}