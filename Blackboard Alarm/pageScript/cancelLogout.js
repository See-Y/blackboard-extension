(function() {
    var proxied = window.bbSessionActivityTimer.showDialog;

    window.bbSessionActivityTimer.showDialog = function() {
        //this.checkTimeRemainingBeforeTimeout();
        this.keepBbSessionActive();
        console.log("Canceled Logout");
        return proxied.apply(this, [].slice.call(arguments));
    }
    window.bb_dialogs.bb_confirm = function() { return; } // cancel LogOut Popup
    window.bbSessionActivityTimer.keepBbSessionActiveIfNotTimedOut = function() {
        this.keepBbSessionActive();
        console.log("Canceled Logout");
    }
})();
