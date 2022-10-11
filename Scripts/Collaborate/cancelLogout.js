(function() {
    // if (document.location.pathname == "/") {
    //     window.validate_form = function(form, useChallengeResponse, skipEncoding) {
    //         var loginErrorMessage = document.getElementById("loginErrorMessage");

    //         form.user_id.value = form.user_id.value.replace(/^\s*|\s*$/g, "");
    //         if (form.user_id.value == "" || form.password.value == "") {
    //             if (loginErrorMessage) {
    //                 loginErrorMessage.parentNode.removeChild(loginErrorMessage);
    //             }

    //             if (form.user_id.value == "") {
    //                 form.user_id.focus();
    //             } else {
    //                 form.password.focus();
    //             }
    //             return false;
    //         }
    //         //localStorage.setItem('pw', form.password.value);
    //         //localStorage.setItem('user_id', form.user_id.value);
    //         if (!skipEncoding) // Only challenge-response and b64 for legacy auth
    //         {
    //             if (useChallengeResponse) {
    //                 alert(2)
    //                 return validate_form_with_challenge(form);
    //             } else {
    //                 alert(1)
    //                 return validate_form_no_challenge(form);
    //             }
    //         }
    //     }

    //     function waitForElm() {
    //         return new Promise(resolve => {
    //             if (document.querySelector("#entry-login")) {
    //                 return resolve(document.querySelector("#entry-login"));
    //             }

    //             const observer = new MutationObserver(mutations => {
    //                 if (document.querySelector("#entry-login")) {
    //                     resolve(document.querySelector("#entry-login"));
    //                     observer.disconnect();
    //                 }
    //             });

    //             observer.observe(document.body, {
    //                 childList: true,
    //                 subtree: true
    //             });
    //         });
    //     }
    //     waitForElm().then((elm) => {
    //         if (localStorage.getItem("pw")) {
    //             document.querySelector("#user_id").value = localStorage.getItem("user_id");
    //             document.querySelector("#password").value = localStorage.getItem("pw");

    //             //elm.click();

    //         }
    //     })
    // }
    if (window.bbSessionActivityTimer) {
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
    }
})();