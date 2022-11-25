/// <reference types="chrome" />
/// <reference types="vite-plugin-svgr/client" />
import logo from './logo.svg'
import { URL } from 'url';
const waitForElm = () => {
    return new Promise(resolve => {
        if (document.querySelector('div[id*="22_1termCourses"]')) {
            return resolve(document.querySelector('div[id*="22_1termCourses"]'));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector('div[id*="22_1termCourses"]')) {
                resolve(document.querySelector('div[id*="22_1termCourses"]'));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

const getLectureElement = () =>{
    var AllaTag = document.getElementsByTagName('a');
    var lectureDiv = document.querySelector('ul[class*="portletList-img courseListing coursefakeclass"]')
    var lecturelist:any = {};
    for (var i = 0; i < AllaTag.length; i += 1) {
        const item = AllaTag[i] as HTMLElement;
        const itemparent = item.parentElement as HTMLElement;
        const itemparentparent = itemparent.parentElement as HTMLElement;
        if (AllaTag[i].href.includes('/webapps/blackboard/execute/launcher') && !AllaTag[i].className.includes('button') &&  itemparentparent == lectureDiv) {
            interface temp {
                name: string;
                link: string;
                id: string;
              };
              const urlObj: any= new URL(AllaTag[i].href);
            //var temp = new Object();
            var temp: temp = {
                name: AllaTag[i].text, 
                link: AllaTag[i].href, 
                id: urlObj.searchParams.get('id')
            };
            // temp["name"] = AllaTag[i].text;
            // temp["link"] = AllaTag[i].href;
            // temp["id"] = (new URL(temp["link"])).searchParams.get('id')
            lecturelist[AllaTag[i].text.split(":")[0].split("_")[1]] = temp;
        }
    }
    fetch(window.chrome.runtime.getURL('content-script/src/assets/lectureInfo.json'))
        .then((resp) => resp.json())
        .then(function(jsonData) {
            for (var key in lecturelist) {
                if (jsonData[key] == undefined) {
                    delete lecturelist[key];
                } else {
                    lecturelist[key]["name"] = jsonData[key]["name"]
                    lecturelist[key]["time"] = jsonData[key]["time"]
                    lecturelist[key]["professor"] = jsonData[key]["professor"]
                    if (jsonData[key]["timeplace0"]) {
                        lecturelist[key]["timeplace0"] = jsonData[key]["timeplace0"]
                    }
                    if (jsonData[key]["timeplace1"]) {
                        lecturelist[key]["timeplace1"] = jsonData[key]["timeplace1"]
                    }
                    if (jsonData[key]["timeplace2"]) {
                        lecturelist[key]["timeplace2"] = jsonData[key]["timeplace2"]
                    }
                }
            }
            console.log(lecturelist);
            window.chrome.storage.sync.set({ 'lectureInfo': JSON.stringify(lecturelist) }, function() {

            });

        });
}
waitForElm().then((elm) => {
    window.chrome.storage.sync.get(['lectureInfo'], function(res) {
        console.log(res.lectureInfo);
        if (res.lectureInfo == undefined && res.lectureInfo == null) {
            getLectureElement();
        } else {
            var lecturelist = JSON.parse(res.lectureInfo);

            if (!lecturelist || (Object.keys(lecturelist).length === 0 && Object.getPrototypeOf(lecturelist) === Object.prototype)) {
                getLectureElement();
            }
        }
    });
});
export {}