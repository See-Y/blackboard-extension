(function() {
    if (window.gradeAssignment) {
        var proxied = window.gradeAssignment.init;
        window.gradeAssignment.init = function() {
            // var fileUrl = "https://blackboard.unist.ac.kr"+JSON.parse(arguments[1]).downloadUrl
            var arr =  document.querySelectorAll('a[href*="webapps/assignment/download?"]')
            var fileUrl = [];
            arr.forEach(item => fileUrl.push(item.href));
            var a = {};
            a = JSON.parse(localStorage.getItem('fileInfo')) || {};

            var temp = {};
            temp.content_id = new URL(document.URL).searchParams.get('content_id');
            temp.course_id = new URL(document.URL).searchParams.get('course_id');
            var content_info = `content_id=${temp.content_id}&course_id=${temp.arrcourse_id}`;
            temp.Url = `https://blackboard.unist.ac.kr/webapps/assignment/uploadAssignment?${content_info}`;
            temp.fileUrl = [...new Set(fileUrl)]; // replace duplicate keys : https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
            if(jQuery('#aggregateGrade')[0].value != '-'){
                temp.score = jQuery('#aggregateGrade')[0].value;
                temp.totalscore = jQuery('#aggregateGrade')[0].next().textContent.replace('/',"");
            }
            var h3, p;
            Array.from(jQuery("#assignmentInfo")[0].children).forEach(item => {
                if(item.tagName == 'H3') {
                    h3 = item.textContent.replace(" ", "_");
                }
                if(item.tagName == 'P') {
                    p = item.textContent
                    temp[h3] = p
                }
                if(item.tagName == 'UL'){
                    var filelist = []
                    Array.from(item.childNodes).forEach(child =>{
                        if(child.nodeType == 1) {
                            filelist.push(child.children[0].href);
                        }
                    })
                    temp[h3] = filelist;
                }
            })
            a[temp.Name.replace(" ", "_")] = temp;
            localStorage.setItem('fileInfo', JSON.stringify(a));
            proxied.apply(this, [].slice.call(arguments));
        }

    }
})();