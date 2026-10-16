package middleware

import (
	"crypto/subtle"
	"encoding/json"
	"net/http"
)

// DesktopCookie is the cookie the desktop shell sets on its webview session.
const DesktopCookie = "vestra_desktop"

// DesktopHeader lets the desktop shell itself (e.g. health checks) authenticate.
const DesktopHeader = "X-Vestra-Desktop"

// RequireDesktopToken guards every request when the server runs inside the
// desktop app. Auth is disabled there, so this per-launch secret is what keeps
// other local processes and web pages from talking to the loopback server.
func RequireDesktopToken(token string, next http.Handler) http.Handler {
	expected := []byte(token)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got := r.Header.Get(DesktopHeader)
		if got == "" {
			if c, err := r.Cookie(DesktopCookie); err == nil {
				got = c.Value
			}
		}
		if subtle.ConstantTimeCompare([]byte(got), expected) != 1 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "forbidden"})
			return
		}
		next.ServeHTTP(w, r)
	})
}
