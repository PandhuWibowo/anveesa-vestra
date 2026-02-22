# Anveesa Vestra

**Anveesa Vestra** is an open-source, self-hosted cloud storage manager. It gives you a clean, unified web interface to browse, upload, download, rename, preview, and manage files across five cloud storage providers — without leaving your browser.

---

## Why Anveesa Vestra?

Most cloud consoles are built for administrators, not daily users. They are slow, bloated, and require full cloud-provider accounts to access. Anveesa Vestra is different:

- **Self-hosted** — runs entirely on your machine or server. No data leaves your infrastructure.
- **Multi-provider** — connect GCS, S3, Huawei OBS, Alibaba OSS, Azure Blob Storage, Cloudflare R2, and MinIO from one interface.
- **Credential-safe** — credentials are stored locally in SQLite and never sent to a third-party service.
- **Lightweight** — a single Go binary + static Vue files. Run natively or via Docker.

---

## Features

### File Management

| Feature | Description |
|---|---|
| Connection management | Save, test, edit, and delete named bucket connections |
| Pinned connections | Star any connection to pin it to the top of the sidebar |
| File browser | Navigate folders with breadcrumb paths and infinite scroll pagination |
| Folder upload | Upload an entire local folder preserving its subfolder structure |
| Drag-and-drop upload | Drop files anywhere on the file list to upload |
| Upload progress | Per-file progress bars with live percentage for every upload |
| Download | One-click signed/presigned/SAS URLs |
| Shareable link | Generate time-limited public links with custom expiry (15 min – 7 days) |
| Zip download | Download a folder or a multi-file selection as a `.zip` archive |
| Delete (file) | Single-file delete with confirmation dialog |
| Delete (folder) | Recursive folder delete — removes all objects under a prefix |
| Rename / Move | Copy-then-delete rename within the same bucket |
| Cross-connection transfer | Copy a file from one connection/bucket to any other connection |
| CLI command copy | Generate and copy `aws s3` / `gsutil` / `azcopy` / `ossutil` / `obsutil` commands |

### Viewing & Previewing

| Feature | Description |
|---|---|
| File preview | Preview images, PDFs, Markdown, plain text, video, and audio in a slide-in panel |
| Grid / thumbnail view | Switch from table to card grid with image thumbnails |
| Table view | Sortable table with name, size, and last-modified columns |

### Metadata & Stats

| Feature | Description |
|---|---|
| Metadata editor | View and edit `Content-Type`, `Cache-Control`, and custom key-value metadata |
| Bucket stats | Object count and total storage size (shown in the header bar) |
| Copy storage path | Copy `gs://`, `s3://`, or `az://` path to clipboard |
| Copy public URL | Copy a presigned HTTP download link to clipboard |

### Navigation & Search

| Feature | Description |
|---|---|
| Search / filter | Filter the current folder listing by filename (client-side, instant) |
| Infinite scroll | Loads 200 objects per page, fetches more automatically on scroll |
| Sorting | Click any column header to sort by name, size, or last modified |
| Provider filter | Filter the sidebar connection list by cloud provider |

### Bulk Operations

| Feature | Description |
|---|---|
| Multi-select | Checkbox column; header checkbox selects all loaded files |
| Bulk download | Download all selected files sequentially |
| Bulk delete | Delete all selected files with a single confirmation |
| Bulk zip | Download all selected files as a single `.zip` archive |

### Keyboard Shortcuts

| Key | Action |
|---|---|
| `j` / `↓` | Move focus to next row |
| `k` / `↑` | Move focus to previous row |
| `Enter` | Open folder or preview file |
| `d` | Download focused file |
| `Delete` | Delete focused file or folder |
| `/` | Focus the search box |
| `r` | Refresh current folder |
| `Backspace` | Navigate up one folder level |
| `Escape` | Close panel / clear search / deselect |
| `n` | New connection (global) |

### UI / UX

| Feature | Description |
|---|---|
| Dark mode | System-aware toggle, persisted to local storage |
| View toggle | Switch between table and grid/thumbnail view (persisted) |
| Toast notifications | Non-blocking success / error messages |
| Confirm dialogs | Destructive actions always require explicit confirmation |

---

## Supported Providers

| Provider | Short Label | Type | Notes |
|---|---|---|---|
| Google Cloud Storage | GCS | Native GCS | Service account JSON key; optional for public buckets |
| Amazon S3 | S3 | Native S3 | Access key + secret + optional endpoint |
| Huawei OBS | OBS | S3-compatible | Access key + secret + required endpoint |
| Alibaba Cloud OSS | OSS | S3-compatible | Access key + secret + required endpoint |
| Azure Blob Storage | Azure | Native Azure | Account name + account key |
| Cloudflare R2 | S3 | S3-compatible | Use AWS provider with a custom endpoint |
| MinIO | S3 | S3-compatible | Use AWS provider with a custom endpoint |

---

## Documentation

- [Getting Started](./getting-started.md) — install, run, and add your first connection
- [Managing Connections](./connections.md) — credential setup for all 5 providers
- [File Browser](./browser.md) — all browser features in detail
- [API Reference](./api-reference.md) — complete REST API for the backend
- [Deployment](./deployment.md) — build a production binary and serve it
- [Contributing](./contributing.md) — local development and project structure

---

## Quick Start

**Option A — Docker (recommended)**

```bash
docker run -d -p 80:80 -v anveesa-data:/data pandhuwibowo/anveesa-vestra:latest
```

Open [http://localhost](http://localhost) in your browser.

**Option B — From source**

```bash
git clone https://github.com/PandhuWibowo/anveesa-vestra.git
cd anveesa-vestra
make dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Go 1.23, `net/http` |
| Storage SDKs | `cloud.google.com/go/storage`, `aws-sdk-go-v2`, Huawei OBS SDK, Alibaba OSS SDK, Azure Blob SDK |
| Database | SQLite (`modernc.org/sqlite`) |
| Frontend | Vue 3, Vite 5, Composition API |
| Styling | Plain CSS with custom properties |
| Package manager | Bun (or npm) |
| Container | Docker + nginx + supervisord |
| CI/CD | GitHub Actions → DockerHub |
