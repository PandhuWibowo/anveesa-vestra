package handlers

import (
	"archive/zip"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"path"
	"strings"
	"time"

	awslib "github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"cloud.google.com/go/storage"
	azcontainer "github.com/Azure/azure-sdk-for-go/sdk/storage/azblob/container"
	"google.golang.org/api/iterator"
)

type zipRequest struct {
	Provider    string   `json:"provider"`
	Bucket      string   `json:"bucket"`
	Credentials string   `json:"credentials"`
	Prefix      string   `json:"prefix"`  // zip everything under this prefix
	Objects     []string `json:"objects"` // explicit list; takes priority over prefix
}

// ZipObjects streams a zip archive of the requested objects to the client.
func ZipObjects(w http.ResponseWriter, r *http.Request) {
	var req zipRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	keys, err := collectZipKeys(ctx, req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if len(keys) == 0 {
		http.Error(w, "no objects found", http.StatusNotFound)
		return
	}

	// Derive a sensible archive filename from the prefix or bucket
	archiveName := strings.Trim(req.Prefix, "/")
	if idx := strings.LastIndex(archiveName, "/"); idx >= 0 {
		archiveName = archiveName[idx+1:]
	}
	if archiveName == "" {
		archiveName = req.Bucket
	}

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s.zip"`, archiveName))

	zw := zip.NewWriter(w)
	defer zw.Close()

	for _, key := range keys {
		data, _, dlErr := downloadObjectData(ctx, req.Provider, req.Bucket, req.Credentials, key)
		if dlErr != nil {
			continue // skip files that fail to download
		}

		// Strip the leading prefix so the zip has relative paths
		entryName := strings.TrimPrefix(key, req.Prefix)
		entryName = strings.TrimPrefix(entryName, "/")
		if entryName == "" {
			entryName = path.Base(key)
		}

		fw, createErr := zw.Create(entryName)
		if createErr != nil {
			continue
		}
		fw.Write(data) //nolint:errcheck
	}
}

// collectZipKeys returns the object keys to include in the archive.
func collectZipKeys(ctx context.Context, req zipRequest) ([]string, error) {
	if len(req.Objects) > 0 {
		return req.Objects, nil
	}
	switch req.Provider {
	case "aws", "alibaba", "huawei":
		return listS3ZipKeys(ctx, req)
	case "gcp":
		return listGCSZipKeys(ctx, req)
	case "azure":
		return listAzureZipKeys(ctx, req)
	}
	return nil, fmt.Errorf("unknown provider: %s", req.Provider)
}

func listS3ZipKeys(ctx context.Context, req zipRequest) ([]string, error) {
	creds, err := awsCredsFromJSON(req.Credentials)
	if err != nil {
		return nil, err
	}
	var clientFn func(context.Context, map[string]string) (*s3.Client, error)
	switch req.Provider {
	case "aws":
		clientFn = awsS3Client
	case "alibaba":
		clientFn = ossS3Client
	case "huawei":
		clientFn = obsS3Client
	}
	client, err := clientFn(ctx, creds)
	if err != nil {
		return nil, err
	}
	var keys []string
	var token *string
	for {
		out, err := client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
			Bucket:            awslib.String(req.Bucket),
			Prefix:            awslib.String(req.Prefix),
			ContinuationToken: token,
		})
		if err != nil {
			return nil, err
		}
		for _, o := range out.Contents {
			keys = append(keys, *o.Key)
		}
		if out.IsTruncated == nil || !*out.IsTruncated {
			break
		}
		token = out.NextContinuationToken
	}
	return keys, nil
}

func listGCSZipKeys(ctx context.Context, req zipRequest) ([]string, error) {
	client, err := gcpClient(ctx, req.Credentials)
	if err != nil {
		return nil, err
	}
	defer client.Close()
	it := client.Bucket(req.Bucket).Objects(ctx, &storage.Query{Prefix: req.Prefix})
	var keys []string
	for {
		attrs, iterErr := it.Next()
		if iterErr == iterator.Done {
			break
		}
		if iterErr != nil {
			return nil, iterErr
		}
		keys = append(keys, attrs.Name)
	}
	return keys, nil
}

func listAzureZipKeys(ctx context.Context, req zipRequest) ([]string, error) {
	accountName, accountKey, err := azureCredsFromJSON(req.Credentials)
	if err != nil {
		return nil, err
	}
	containerClient, _, err := azureContainerClient(accountName, accountKey, req.Bucket)
	if err != nil {
		return nil, err
	}
	pager := containerClient.NewListBlobsFlatPager(&azcontainer.ListBlobsFlatOptions{
		Prefix: strPtr(req.Prefix),
	})
	var keys []string
	for pager.More() {
		page, pageErr := pager.NextPage(ctx)
		if pageErr != nil {
			return nil, pageErr
		}
		for _, blob := range page.Segment.BlobItems {
			keys = append(keys, *blob.Name)
		}
	}
	return keys, nil
}
