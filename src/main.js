import './style.css'
import { FaceFilterApp } from './components/FaceFilterApp.js'

document.querySelector('#app').innerHTML = `
  <div class="app-container">
    <header class="header">
    </header>
    <div id="face-filter-app"></div>
  </div>
`

// Initialize the face filter app
const app = new FaceFilterApp()
app.init()