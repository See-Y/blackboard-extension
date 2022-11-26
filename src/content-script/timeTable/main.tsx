import React from 'react';
import { createRoot } from 'react-dom/client';
import './main.css'
import App from './App'

// const body = document.querySelector('body')

// const app = document.createElement('div')

// app.id = 'root'

// // Make sure the element that you want to mount the app to has loaded. You can
// // also use `append` or insert the app using another method:
// // https://developer.mozilla.org/en-US/docs/Web/API/Element#methods
// //
// // Also control when the content script is injected from the manifest.json:
// // https://developer.chrome.com/docs/extensions/mv3/content_scripts/#run_time
// if (body) {
//   body.prepend(app)
// }
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
waitForElm().then(() => {
  const container:any = document.getElementById('column2');
  const root:any = createRoot(container!);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})

