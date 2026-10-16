.PHONY: dev build desktop-prepare desktop-dev desktop

DESKTOP_RES := desktop/resources
# Target platform for the bundled backend (defaults to this machine).
GOOS   ?= $(shell go env GOOS)
GOARCH ?= $(shell go env GOARCH)
EXE    := $(if $(filter windows,$(GOOS)),.exe,)

dev:
	@trap 'kill 0' INT; \
	  (cd server && go run main.go) & \
	  (until nc -z localhost 8080 2>/dev/null; do sleep 0.3; done && cd web && bun run dev) & \
	  wait

build:
	@cd server && go build -o ../bin/server .
	@cd web && bun run build

# Build the frontend and a static backend binary into desktop/resources.
desktop-prepare:
	@cd web && bun run build
	@rm -rf $(DESKTOP_RES) && mkdir -p $(DESKTOP_RES)/bin
	@cp -R web/dist $(DESKTOP_RES)/web
	@cd server && CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) \
	  go build -trimpath -ldflags="-s -w" -o ../$(DESKTOP_RES)/bin/vestra-server$(EXE) .

# Run the desktop app locally.
desktop-dev: desktop-prepare
	@cd desktop && bun install && bun run start

# Package installers for this platform into desktop/dist (.dmg / .exe / .AppImage).
desktop: desktop-prepare
	@cd desktop && bun install && bun run dist
