(function() {
    if (window.bbSessionActivityTimer) {
        var proxied = window.bbSessionActivityTimer.showDialog;

        window.bbSessionActivityTimer.showDialog = function() {
            //this.checkTimeRemainingBeforeTimeout();
            this.keepBbSessionActive();
            return proxied.apply(this, [].slice.call(arguments));
        }
        window.bb_dialogs.bb_confirm = function() { return; } // cancel LogOut Popup
        window.bbSessionActivityTimer.keepBbSessionActiveIfNotTimedOut = function() {
            this.keepBbSessionActive();
        }
    }
})();
