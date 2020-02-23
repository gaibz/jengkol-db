const {
  app,
  BrowserWindow
} = require('electron');
const path = require('path')
const isDev = process.env.NODE_ENV !== "production"
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  const mode = process.env.NODE_ENV;
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    frame: (process.platform === "darwin"),
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadURL(`file://${path.join(__dirname, '../../public/index.html')}`);
  // mainWindow.loadURL(`http://localhost:9999`);
  let watcher;

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (watcher) {
      watcher.close();
    }
  });

  if (process.env.NODE_ENV === 'development') {
    watcher = require('chokidar').watch(path.join(__dirname, '../../public'), {
      ignoreInitial: true
    });
    watcher.on('change', () => {
      mainWindow.reload();
    });
    mainWindow.webContents.openDevTools();
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});