package bitrise

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/bitrise-io/go-utils/log"
	"github.com/pkg/errors"
)

const (
	baseURLenvKey  = "BITRISE_API_URL"
	defaultBaseURL = "https://api.bitrise.io"
	version        = "v0.1"
)

// Client manages communication with the Bitrise API.
type Client struct {
	client   *http.Client
	BaseURL  string
	apiToken string
}

// NewClient returns a new instance of *Client.
func NewClient(apiToken string) *Client {
	return &Client{
		client:   &http.Client{Timeout: 10 * time.Second},
		apiToken: apiToken,
		BaseURL:  fmt.Sprintf("%s/%s", getEnv(baseURLenvKey, defaultBaseURL), version),
	}
}

func getEnv(key, fallback string) string {
	value, ok := os.LookupEnv(key)
	if !ok {
		return fallback
	}

	return value
}

// newRequest creates an authenticated API request that is ready to send.
func (c *Client) newRequest(method string, action string) (*http.Request, error) {
	method = strings.ToUpper(method)
	endpoint := fmt.Sprintf("%s/%s", c.BaseURL, action)

	req, err := http.NewRequest(method, endpoint, nil)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	req.Header.Set("Bitrise-Addon-Auth-Token", c.apiToken)
	req.Header.Set("Content-Type", "application/json")

	return req, nil
}

func (c *Client) do(req *http.Request, bp *Build) (*http.Response, error) {
	req.Close = true
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	defer func() {
		if err = resp.Body.Close(); err != nil {
			log.Errorf("Failed to close response body, error: %+v", errors.WithStack(err))
		}
	}()

	if resp.StatusCode != http.StatusOK {
		return resp, nil
	}

	var successResp struct {
		Data Build
	}

	if err = json.NewDecoder(resp.Body).Decode(&successResp); err != nil {
		return resp, errors.WithStack(err)
	}

	*bp = successResp.Data
	return resp, nil
}

// Build represents a build
type Build struct {
	Status int `json:"status"`
}

// GetBuildOfApp returns information about a single build.
func (c *Client) GetBuildOfApp(buildSlug string, appSlug string) (*http.Response, *Build, error) {
	action := fmt.Sprintf("apps/%s/builds/%s", appSlug, buildSlug)
	req, err := c.newRequest("GET", action)
	if err != nil {
		return nil, nil, errors.WithStack(err)
	}

	var build Build
	resp, err := c.do(req, &build)
	if err != nil || resp.StatusCode >= http.StatusBadRequest {
		return resp, nil, errors.WithStack(err)
	}

	return resp, &build, nil
}
