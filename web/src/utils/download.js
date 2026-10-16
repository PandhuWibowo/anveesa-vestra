// Starts a download of `url`. Inside the desktop app the native download
// manager takes it (with a save dialog); in a browser a temporary link does.
export function downloadURL(url, filename) {
  if (window.vestra?.download) {
    window.vestra.download(url, filename)
    return
  }
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.target = '_blank'; a.rel = 'noopener'
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}
