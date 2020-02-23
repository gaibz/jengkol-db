// Custom Title Bar 
// Only good on windows system 
const customTitlebar = require('custom-electron-titlebar');
if(process.platform !== "darwin"){
  new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#444')
  });
}


// app.js

// Import F7 Bundle
// import Framework7 from 'framework7/framework7-lite.esm.bundle.js';
import 'framework7/css/framework7.bundle.css';
const Framework7 = require('framework7/js/framework7-lite.bundle.js'); 
// need to use require rather than import because import will throw error requestAnimationFrame


// Import F7-Svelte Plugin
import Framework7Svelte from 'framework7-svelte';

// Init F7-Svelte Plugin
Framework7.use(Framework7Svelte);

// Import Main App component
import App from './App.svelte';

// Mount Svelte App
const app = new App({
  target: document.getElementById('app')
});