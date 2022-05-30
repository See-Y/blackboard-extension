(function() {
    if (window.XMLHttpRequest.prototype.send) {
        var proxied = window.XMLHttpRequest.prototype.send;
        window.XMLHttpRequest.prototype.send = function() {
            var pointer = this
            var intervalId = window.setInterval(function() {
                if (pointer.readyState != 4) {
                    return;
                }
                if (pointer.responseText.includes("https://au.bbcollab.com/launch")) {
                    var url = JSON.parse(pointer.responseText).url;
                    window.location.replace(url);
                }
                clearInterval(intervalId);
            }, 1);
            return proxied.apply(this, [].slice.call(arguments));
        };
    }
})();