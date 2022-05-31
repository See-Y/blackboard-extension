// document.addEventListener("DOMContentLoaded", async () => {
//   let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//   chrome.scripting.insertCSS({
//     target: { tabId: tab.id },
//     files: ["style.css"],
//   });
//   chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     function: setFloatBtn,
//   });
// });

// chrome.tabs.onActivated.addListener(async () => {
//   let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//   chrome.scripting.insertCSS({
//     target: { tabId: tab.id },
//     files: ["style.css"],
//   });
//   chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     function: setFloatBtn,
//   });
// });

// const setFloatBtn = () => {
//   var floatingDiv = document.createElement("div");
//   var btn = document.createElement("button");
//   var btnInnerText = document.createElement("span");
//   document.body.appendChild(floatingDiv);
//   floatingDiv.appendChild(btn);
//   btn.className = "float";
//   btn.appendChild(btnInnerText);
//   btnInnerText.innerText = "HeXA";
// };
