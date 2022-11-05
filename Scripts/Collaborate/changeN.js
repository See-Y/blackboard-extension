var rpl = (new URL(document.location.href)).searchParams.get('uname').split("#")[0];
var uname = document.currentScript.id;
var newUrl = document.location.href.replace(rpl, uname);
if (!document.location.href.includes(uname.split("_")[0])) {
    window.location.replace(newUrl);
}