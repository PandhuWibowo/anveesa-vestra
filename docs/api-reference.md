# API Reference

The Anveesa Vestra backend exposes a REST API on port **8080**. All endpoints accept and return `application/json` unless noted otherwise. CORS is enabled for all origins in the default configuration.

---

## Base URL

```
http://localhost:8080
```

---

## Authentication

The API has no authentication layer of its own — it is designed to run on localhost or a private network. Protect the server with a firewall, reverse proxy authentication, or VPN if you expose it beyond localhost.

---

## Common Request Fields

Most `POST` endpoints that operate on bucket objects share these fields:

| Field | Type | Description |
|---|---|---|
| `bucket` | string | Bucket (or container) name |
| `credentials` | string | JSON-encoded credentials (see [Connections](./connections.md)) |

---

## GCS Endpoints

### Connections

#### List GCS Connections
```
GET /api/gcp/connections
```
Returns all saved GCS connections.

**Response**
```json
[
  {
    "id": 1,
    "name": "my-prod-bucket",
    "bucket": "my-bucket",
    "provider": "gcp",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

#### Create GCS Connection
```
POST /api/gcp/connection
```

**Request Body**
```json
{
  "name": "my-prod-bucket",
  "bucket": "my-bucket",
  "credentials": "{\"type\":\"service_account\",...}"
}
```

**Response** `200 OK`
```json
{ "id": 1 }
```

---

#### Update GCS Connection
```
PUT /api/gcp/connection/{id}
```

**Response** `200 OK`
```json
{ "ok": true }
```

---

#### Delete GCS Connection
```
DELETE /api/gcp/connection/{id}
```

**Response** `200 OK`
```json
{ "ok": true }
```

---

#### Test GCS Credentials
```
POST /api/gcp/test
```

**Request Body**
```json
{
  "bucket": "my-bucket",
  "credentials": "{\"type\":\"service_account\",...}"
}
```

**Response** `200 OK`
```json
{ "ok": true }
```

---

### Bucket Operations (GCS)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/gcp/bucket/browse` | Browse objects (paginated) |
| `POST` | `/api/gcp/bucket/upload` | Upload file (multipart form) |
| `POST` | `/api/gcp/bucket/download` | Get signed download URL |
| `POST` | `/api/gcp/bucket/delete` | Delete object |
| `POST` | `/api/gcp/bucket/copy` | Copy or rename object |
| `POST` | `/api/gcp/bucket/stats` | Bucket statistics |
| `POST` | `/api/gcp/bucket/metadata` | Get object metadata |
| `POST` | `/api/gcp/bucket/metadata/update` | Update object metadata |
| `POST` | `/api/gcp/bucket/delete-prefix` | Recursively delete all objects under a prefix |

**Browse request body**
```json
{
  "bucket": "my-bucket",
  "credentials": "...",
  "prefix": "images/2024/",
  "page_token": ""
}
```

Pass `next_page_token` back in subsequent requests to page through results. An empty token means the listing is complete.

**Download request body**
```json
{
  "bucket": "my-bucket",
  "credentials": "...",
  "object": "path/to/file.txt",
  "expires_in": 3600
}
```

`expires_in` is in seconds. Defaults to `900` (15 minutes) if omitted or `0`. Maximum is provider-dependent (GCS caps at 7 days for V4 signed URLs).

**Delete-prefix request body**
```json
{
  "bucket": "my-bucket",
  "credentials": "...",
  "prefix": "old-folder/"
}
```

**Delete-prefix response**
```json
{ "deleted": 42 }
```

---

## AWS / S3-Compatible Endpoints

All AWS endpoints mirror the GCS endpoints under the `/api/aws/` prefix. The credential format differs — see [Managing Connections](./connections.md#amazon-s3).

### Connections

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/aws/connections` | List saved AWS connections |
| `POST` | `/api/aws/connection` | Create AWS connection |
| `PUT` | `/api/aws/connection/{id}` | Update AWS connection |
| `DELETE` | `/api/aws/connection/{id}` | Delete AWS connection |
| `POST` | `/api/aws/test` | Test credentials |

### Bucket Operations

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/aws/bucket/browse` | Browse objects (paginated) |
| `POST` | `/api/aws/bucket/upload` | Upload file (multipart form) |
| `POST` | `/api/aws/bucket/download` | Get presigned download URL |
| `POST` | `/api/aws/bucket/delete` | Delete object |
| `POST` | `/api/aws/bucket/copy` | Copy or rename object |
| `POST` | `/api/aws/bucket/stats` | Bucket statistics |
| `POST` | `/api/aws/bucket/metadata` | Get object metadata |
| `POST` | `/api/aws/bucket/metadata/update` | Update object metadata |
| `POST` | `/api/aws/bucket/delete-prefix` | Recursively delete all objects under a prefix |

> AWS metadata updates are implemented as a copy-to-self with `MetadataDirective: REPLACE` because S3 does not allow in-place metadata edits.

The `/api/aws/bucket/download` endpoint accepts the optional `expires_in` field (seconds).

---

## Huawei OBS Endpoints

All Huawei endpoints follow the same pattern under `/api/huawei/`. See [Managing Connections](./connections.md#huawei-obs) for the credential format.

### Connections

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/huawei/connections` | List saved OBS connections |
| `POST` | `/api/huawei/connection` | Create OBS connection |
| `PUT` | `/api/huawei/connection/{id}` | Update OBS connection |
| `DELETE` | `/api/huawei/connection/{id}` | Delete OBS connection |
| `POST` | `/api/huawei/test` | Test credentials |

### Bucket Operations

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/huawei/bucket/browse` | Browse objects (paginated) |
| `POST` | `/api/huawei/bucket/upload` | Upload file (multipart form) |
| `POST` | `/api/huawei/bucket/download` | Get presigned download URL |
| `POST` | `/api/huawei/bucket/delete` | Delete object |
| `POST` | `/api/huawei/bucket/copy` | Copy or rename object |
| `POST` | `/api/huawei/bucket/stats` | Bucket statistics |
| `POST` | `/api/huawei/bucket/metadata` | Get object metadata |
| `POST` | `/api/huawei/bucket/metadata/update` | Update object metadata |
| `POST` | `/api/huawei/bucket/delete-prefix` | Recursively delete all objects under a prefix |

The `/api/huawei/bucket/download` endpoint accepts the optional `expires_in` field (seconds).

---

## Alibaba Cloud OSS Endpoints

All Alibaba endpoints follow the same pattern under `/api/alibaba/`. See [Managing Connections](./connections.md#alibaba-cloud-oss) for the credential format.

### Connections

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/alibaba/connections` | List saved OSS connections |
| `POST` | `/api/alibaba/connection` | Create OSS connection |
| `PUT` | `/api/alibaba/connection/{id}` | Update OSS connection |
| `DELETE` | `/api/alibaba/connection/{id}` | Delete OSS connection |
| `POST` | `/api/alibaba/test` | Test credentials |

### Bucket Operations

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/alibaba/bucket/browse` | Browse objects (paginated) |
| `POST` | `/api/alibaba/bucket/upload` | Upload file (multipart form) |
| `POST` | `/api/alibaba/bucket/download` | Get presigned download URL |
| `POST` | `/api/alibaba/bucket/delete` | Delete object |
| `POST` | `/api/alibaba/bucket/copy` | Copy or rename object |
| `POST` | `/api/alibaba/bucket/stats` | Bucket statistics |
| `POST` | `/api/alibaba/bucket/metadata` | Get object metadata |
| `POST` | `/api/alibaba/bucket/metadata/update` | Update object metadata |
| `POST` | `/api/alibaba/bucket/delete-prefix` | Recursively delete all objects under a prefix |

The `/api/alibaba/bucket/download` endpoint accepts the optional `expires_in` field (seconds).

---

## Azure Blob Storage Endpoints

All Azure endpoints follow the same pattern under `/api/azure/`. See [Managing Connections](./connections.md#azure-blob-storage) for the credential format.

### Connections

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/azure/connections` | List saved Azure connections |
| `POST` | `/api/azure/connection` | Create Azure connection |
| `PUT` | `/api/azure/connection/{id}` | Update Azure connection |
| `DELETE` | `/api/azure/connection/{id}` | Delete Azure connection |
| `POST` | `/api/azure/test` | Test credentials |

### Container Operations

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/azure/bucket/browse` | Browse blobs (paginated) |
| `POST` | `/api/azure/bucket/upload` | Upload blob (multipart form) |
| `POST` | `/api/azure/bucket/download` | Get SAS download URL |
| `POST` | `/api/azure/bucket/delete` | Delete blob |
| `POST` | `/api/azure/bucket/copy` | Copy or rename blob |
| `POST` | `/api/azure/bucket/stats` | Container statistics |
| `POST` | `/api/azure/bucket/metadata` | Get blob metadata |
| `POST` | `/api/azure/bucket/metadata/update` | Update blob metadata |
| `POST` | `/api/azure/bucket/delete-prefix` | Recursively delete all blobs under a prefix |

The `/api/azure/bucket/download` endpoint accepts the optional `expires_in` field (seconds).

---

## Cross-Provider Endpoints

These endpoints operate across providers and are not scoped to a single provider prefix.

### Transfer Object

```
POST /api/transfer
```

Downloads an object from a source connection and uploads it to a destination connection server-side. The source object is not deleted.

**Request Body**

```json
{
  "src_provider":    "aws",
  "src_bucket":      "my-source-bucket",
  "src_credentials": "...",
  "src_object":      "path/to/file.txt",
  "dst_provider":    "gcp",
  "dst_bucket":      "my-dest-bucket",
  "dst_credentials": "...",
  "dst_prefix":      "backups/"
}
```

| Field | Description |
|---|---|
| `src_provider` | Source provider: `gcp`, `aws`, `huawei`, `alibaba`, or `azure` |
| `src_bucket` | Source bucket or container name |
| `src_credentials` | JSON-encoded credentials for the source |
| `src_object` | Full object key in the source bucket |
| `dst_provider` | Destination provider |
| `dst_bucket` | Destination bucket or container |
| `dst_credentials` | JSON-encoded credentials for the destination |
| `dst_prefix` | Prefix to place the file under in the destination (trailing `/` optional) |

**Response** `200 OK`
```json
{ "destination": "backups/file.txt" }
```

The `destination` field is the full object key of the file in the destination bucket.

---

### Zip Download

```
POST /api/zip
```

Streams a `.zip` archive of objects to the client. The archive name is derived from the prefix (or the bucket name if the prefix is empty).

**Request Body — zip a folder prefix**

```json
{
  "provider":    "aws",
  "bucket":      "my-bucket",
  "credentials": "...",
  "prefix":      "reports/2024/"
}
```

**Request Body — zip an explicit list of objects**

```json
{
  "provider":    "gcp",
  "bucket":      "my-bucket",
  "credentials": "...",
  "prefix":      "",
  "objects":     ["data/a.csv", "data/b.csv", "README.md"]
}
```

| Field | Required | Description |
|---|---|---|
| `provider` | Yes | `gcp`, `aws`, `huawei`, `alibaba`, or `azure` |
| `bucket` | Yes | Bucket or container name |
| `credentials` | Yes | JSON-encoded credentials |
| `prefix` | No | If set and `objects` is empty, all objects under this prefix are included |
| `objects` | No | If set, only these object keys are zipped (takes priority over `prefix`) |

**Response**
- `Content-Type: application/zip`
- `Content-Disposition: attachment; filename="<prefix-or-bucket>.zip"`
- Body: binary zip stream

Files that fail to download during zipping are silently skipped; the remaining files are still included.

---

## Error Responses

All endpoints return errors as plain text (not JSON) for 4xx/5xx responses from bucket operation handlers. Connection management endpoints return JSON errors.

| HTTP Status | Meaning |
|---|---|
| `400` | Bad request — malformed body, missing fields, or credential parse error |
| `404` | Connection ID not found, or no objects matched for zip |
| `405` | Method not allowed |
| `500` | Server error — provider SDK call failed |

---

## Upload Endpoint Details

The upload endpoint uses `multipart/form-data` (not JSON):

```
POST /api/{provider}/bucket/upload
Content-Type: multipart/form-data
```

| Form field | Description |
|---|---|
| `bucket` | Bucket or container name |
| `credentials` | JSON-encoded credentials |
| `prefix` | Folder prefix to place the file in (e.g. `images/2024/`) |
| `file` | The file to upload (binary) |

The server derives the object key as `prefix + original_filename`.

---

## Browse Response Format

```json
{
  "prefix": "images/",
  "entries": [
    {
      "name":         "images/photos/",
      "display":      "photos",
      "type":         "dir",
      "size":         0,
      "updated":      "",
      "content_type": ""
    },
    {
      "name":         "images/logo.png",
      "display":      "logo.png",
      "type":         "file",
      "size":         48291,
      "updated":      "2024-06-01T12:00:00Z",
      "content_type": "image/png"
    }
  ],
  "next_page_token": "CiQvaW1hZ2VzL3Bob3Rvcy8..."
}
```

| Field | Description |
|---|---|
| `prefix` | The prefix that was listed |
| `entries` | Array of objects and virtual folders |
| `entries[].name` | Full object key (or prefix for dirs) |
| `entries[].display` | Short display name without leading prefix |
| `entries[].type` | `"file"` or `"dir"` |
| `entries[].size` | Size in bytes (0 for dirs) |
| `entries[].updated` | ISO 8601 last-modified timestamp |
| `entries[].content_type` | MIME type (empty for dirs) |
| `next_page_token` | Pass in next request to continue; empty string = done |
