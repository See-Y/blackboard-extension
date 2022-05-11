(function() {
    var proxied = window.bbSessionActivityTimer.showDialog;
    window.bbSessionActivityTimer.showDialog = function() {
        this.checkTimeRemainingBeforeTimeout();
        console.log("Canceled Logout");
        return proxied.apply(this, [].slice.call(arguments));
    }
    window.bbSessionActivityTimer.keepBbSessionActiveIfNotTimedOut = function() {
        this.keepBbSessionActive();
        console.log("Canceled Logout");
    }
})();