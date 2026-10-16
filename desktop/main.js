// Anveesa Vestra desktop shell.
//
// Runs the Go backend as a child process bound to 127.0.0.1 on a random port,
// with auth disabled (single personal user) and a per-launch secret that only
// this window's session carries. The backend also serves the built frontend,
// so the window simply loads http://127.0.0.1:<port>.

const { app, BrowserWindow, shell, session, ipcMain, dialog, nativeTheme } = require('electron')
const { spawn } = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const http = require('node:http')
const net = require('node:net')
const path = require('node:path')

const SERVER_BIN = 'vestra-server' + (process.platform === 'win32' ? '.exe' : '')
const DESKTOP_COOKIE = 'vestra_desktop'
const DESKTOP_HEADER = 'X-Vestra-Desktop'

let mainWindow = null
let server = null
let origin = ''
let quitting = false
const pendingNames = new Map() // download URL → suggested filename

function resourcePath(...parts) {
  return app.isPackaged
    ? path.join(process.resourcesPath, ...parts)
    : path.join(__dirname, 'resources', ...parts)
}

// Credentials in the database are encrypted with a key that lives next to it.
function loadEncryptionKey(dir) {
  const file = path.join(dir, 'secret.key')
  try {
    const key = fs.readFileSync(file, 'utf8').trim()
    if (key.length >= 32) return key
  } catch { /* first launch */ }
  const key = crypto.randomBytes(24).toString('base64url') // 32 chars
  fs.writeFileSync(file, key, { mode: 0o600 })
  return key
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.unref()
    srv.on('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

function waitForHealth(port, token, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(
        { host: '127.0.0.1', port, path: '/api/health', headers: { [DESKTOP_HEADER]: token } },
        res => {
          res.resume()
          if (res.statusCode === 200) return resolve()
          retry()
        },
      )
      req.on('error', retry)
      req.setTimeout(1000, () => req.destroy())
    }
    const retry = () => {
      if (Date.now() > deadline) return reject(new Error('backend did not start in time'))
      setTimeout(attempt, 150)
    }
    attempt()
  })
}

async function startServer() {
  const dataDir = app.getPath('userData')
  const logDir = path.join(dataDir, 'logs')
  fs.mkdirSync(logDir, { recursive: true })

  const port = await freePort()
  const token = crypto.randomBytes(32).toString('hex')
  origin = `http://127.0.0.1:${port}`

  const log = fs.createWriteStream(path.join(logDir, 'server.log'), { flags: 'a' })
  server = spawn(resourcePath('bin', SERVER_BIN), [], {
    cwd: dataDir,
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(port),
      DB_PATH: path.join(dataDir, 'data.db'),
      STATIC_DIR: resourcePath('web'),
      AUTH_ENABLED: 'false',
      CORS_ORIGIN: origin,
      DESKTOP_TOKEN: token,
      ENCRYPTION_KEY: loadEncryptionKey(dataDir),
      JWT_SECRET: crypto.randomBytes(32).toString('hex'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  server.stdout.pipe(log)
  server.stderr.pipe(log)
  server.on('exit', code => {
    server = null
    if (quitting) return
    dialog.showErrorBox(
      'Anveesa Vestra',
      `The storage backend stopped unexpectedly (exit code ${code}).\n\nLogs: ${path.join(logDir, 'server.log')}`,
    )
    app.quit()
  })

  await waitForHealth(port, token)

  await session.defaultSession.cookies.set({
    url: origin,
    name: DESKTOP_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'strict',
  })
}

function isAppURL(url) {
  return url === origin || url.startsWith(origin + '/')
}

function openExternal(url) {
  if (/^https?:\/\//i.test(url) || /^mailto:/i.test(url)) shell.openExternal(url)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 940,
    minHeight: 600,
    show: false,
    title: 'Anveesa Vestra',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#070d18' : '#eef4fa',
    // macOS: content runs under the title bar; the sidebar hosts the traffic lights.
    ...(process.platform === 'darwin' && {
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 18, y: 33 },
    }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  // Links to the outside world go to the system browser, never this window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppURL(url)) return { action: 'allow' }
    openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isAppURL(url)) return
    event.preventDefault()
    openExternal(url)
  })

  // Full screen hides the macOS traffic lights; let the page reclaim their space.
  const sendFullScreen = () => mainWindow?.webContents.send('vestra:fullscreen', mainWindow.isFullScreen())
  mainWindow.on('enter-full-screen', sendFullScreen)
  mainWindow.on('leave-full-screen', sendFullScreen)
  mainWindow.webContents.on('did-finish-load', sendFullScreen)

  mainWindow.on('closed', () => { mainWindow = null })
  mainWindow.loadURL(origin)
}

ipcMain.handle('vestra:download', (event, { url, filename } = {}) => {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return false
  if (filename) pendingNames.set(url, String(filename))
  event.sender.downloadURL(url)
  return true
})

function setupDownloads() {
  session.defaultSession.on('will-download', (_event, item) => {
    const url = item.getURL()
    const name = pendingNames.get(url) || item.getFilename()
    pendingNames.delete(url)
    item.setSaveDialogOptions({ defaultPath: path.join(app.getPath('downloads'), name) })
  })
}

function stopServer() {
  quitting = true
  if (server) server.kill()
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app.whenReady().then(async () => {
    try {
      await startServer()
    } catch (err) {
      dialog.showErrorBox('Anveesa Vestra', `Could not start the storage backend.\n\n${err.message}`)
      stopServer()
      app.quit()
      return
    }
    setupDownloads()
    createWindow()

    app.on('activate', () => {
      if (!mainWindow) createWindow()
    })
  })

  app.on('window-all-closed', () => app.quit())
  app.on('before-quit', stopServer)
}
