chrome.tabs.onActivated.addListener(async () => {
  console.log("onActivated");
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ["style.css"],
  });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: setFloatBtn,
  });
});

const setFloatBtn = () => {
  var searchFloatDiv = document.querySelector(".floatDiv");
  var searchPopupDiv = document.querySelector(".popupDiv");

  const createFloatBtn = () => {
    var floatingDiv = document.createElement("div");
    floatingDiv.className = "floatDiv";
    var floatBtn = document.createElement("button");
    var btnInnerText = document.createElement("span");
    document.body.appendChild(floatingDiv);
    floatingDiv.appendChild(floatBtn);
    floatBtn.className = "float";
    floatBtn.appendChild(btnInnerText);
    btnInnerText.innerText = "HeXA";
  };
  const createPopup = () => {
    console.log("creating Popup...");
    var popupDiv = document.createElement("div");
    popupDiv.className = "popupDiv";
    popupDiv.style.display = "none";
    document.body.appendChild(popupDiv);
  };

  if (searchFloatDiv === null) createFloatBtn();
  if (searchPopupDiv === null) createPopup();
  floatBtn.addEventListener("click", () => {
    console.log("clicked");
    if (popupDiv.style.display === "none") popupDiv.style.display = "block";
    else popupDiv.style.display = "none";
  });
};
