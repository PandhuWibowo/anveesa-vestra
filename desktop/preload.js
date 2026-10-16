const { contextBridge, ipcRenderer } = require('electron')

// The only bridge the page gets: a flag and a native download hook.
contextBridge.exposeInMainWorld('vestra', {
  isDesktop: true,
  platform: process.platform,
  download: (url, filename) => ipcRenderer.invoke('vestra:download', { url, filename }),
})

// Lets the stylesheet adapt to the native window (drag regions, traffic lights).
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('is-desktop', `platform-${process.platform}`)
})
ipcRenderer.on('vestra:fullscreen', (_event, on) => {
  document.documentElement.classList.toggle('is-fullscreen', Boolean(on))
})
