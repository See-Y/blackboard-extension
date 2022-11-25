/// <reference types="chrome" />
/// <reference types="vite-plugin-svgr/client" />

import logo from './logo.svg'

import './App.css'

function getLogo() {
  if (window.chrome) {
    return window.chrome.runtime.getURL(logo.toString())
  }

  return logo
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={`${logo}`} className="App-logo" alt="logo" />
        <p>Hello, World!</p>
        <p>I'm a Chrome Extension Content Script!</p>
      </header>
    </div>
  )
}

export default App


