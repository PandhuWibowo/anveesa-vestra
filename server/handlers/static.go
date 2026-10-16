package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// SPAHandler serves the built frontend from dir. Unknown paths fall back to
// index.html so client-side navigation keeps working. Used by the desktop app,
// where there is no Nginx in front of the backend.
func SPAHandler(dir string) http.HandlerFunc {
	files := http.FileServer(http.Dir(dir))
	index := filepath.Join(dir, "index.html")
	return func(w http.ResponseWriter, r *http.Request) {
		clean := filepath.Clean("/" + r.URL.Path)
		if strings.HasPrefix(clean, "/api/") {
			jsonError(w, "not found", http.StatusNotFound)
			return
		}
		if clean != "/" {
			if info, err := os.Stat(filepath.Join(dir, clean)); err == nil && !info.IsDir() {
				files.ServeHTTP(w, r)
				return
			}
		}
		w.Header().Set("Cache-Control", "no-cache")
		http.ServeFile(w, r, index)
	}
}
