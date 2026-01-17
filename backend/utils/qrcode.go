package utils

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/skip2/go-qrcode"
)

// QRCodeConfig holds configuration for QR code generation
type QRCodeConfig struct {
	BaseURL      string // Base URL for web pages
	MinAppID     string // WeChat Mini Program AppID
	MinAppPath   string // Base path for Mini Program pages
	MinAppSecret string // WeChat Mini Program AppSecret (required for generating real mini program codes)
}

// WeChatTokenResponse represents the response from WeChat token API
type WeChatTokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
	ErrCode     int    `json:"errcode"`
	ErrMsg      string `json:"errmsg"`
}

// WeChatErrorResponse represents error response from WeChat API
type WeChatErrorResponse struct {
	ErrCode int    `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
}

// cachedToken stores the access token with expiration time
type cachedToken struct {
	token     string
	expiresAt time.Time
}

// Global cache for access token
var (
	tokenCache   cachedToken
	tokenMutex   sync.RWMutex
	tokenRefresh bool // flag to prevent multiple concurrent refresh attempts
)

// GenerateWebQRCode generates a QR code for web page and returns base64 string
func GenerateWebQRCode(url string) (string, error) {
	// Generate QR code
	qrCode, err := qrcode.Encode(url, qrcode.Medium, 256)
	if err != nil {
		return "", fmt.Errorf("failed to generate QR code: %v", err)
	}

	// Convert to base64
	base64Str := base64.StdEncoding.EncodeToString(qrCode)

	// Add data URL prefix for HTML embedding
	return fmt.Sprintf("data:image/png;base64,%s", base64Str), nil
}

// GenerateWxappQRCode generates a QR code for WeChat Mini Program
// If AppSecret is provided, it will call WeChat API to generate real mini program code
// Otherwise, it will generate a web page QR code as fallback
func GenerateWxappQRCode(appID, appSecret, path string) (string, error) {
	// If AppSecret is provided, try to use WeChat API
	if appSecret != "" {
		return generateWxappCodeFromAPI(appID, appSecret, path)
	}

	// Fallback: Generate a web page QR code
	// Users can scan this QR code to open a web page, then click to open mini program
	qrData := fmt.Sprintf("https://open.weixin.qq.com/connect/qrconnect?appid=%s&path=%s", appID, path)

	qrCode, err := qrcode.Encode(qrData, qrcode.Medium, 256)
	if err != nil {
		return "", fmt.Errorf("failed to generate fallback QR code: %v", err)
	}

	base64Str := base64.StdEncoding.EncodeToString(qrCode)
	return fmt.Sprintf("data:image/png;base64,%s", base64Str), nil
}

// GenerateRecommendorQRs generates both web and Mini Program QR codes for a recommendor
func GenerateRecommendorQRs(config QRCodeConfig, recommendorID uint) (webQR, wxappQR string, err error) {
	// Generate web QR code
	webURL := fmt.Sprintf("%s/recommendors/%d", config.BaseURL, recommendorID)
	webQR, err = GenerateWebQRCode(webURL)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate web QR code: %v", err)
	}

	// Generate Mini Program QR code
	wxPath := fmt.Sprintf("%s/pages/recommendor/detail?id=%d",
		config.MinAppPath, recommendorID)
	wxappQR, err = GenerateWxappQRCode(config.MinAppID, config.MinAppSecret, wxPath)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate Mini Program QR code: %v", err)
	}

	return webQR, wxappQR, nil
}

// generateWxappCodeFromAPI calls WeChat API to generate mini program code
// WeChat API endpoint: https://api.weixin.qq.com/wxa/getwxacodeunlimit
func generateWxappCodeFromAPI(appID, appSecret, path string) (string, error) {
	// Step 1: Get access_token
	accessToken, err := getAccessToken(appID, appSecret)
	if err != nil {
		return "", fmt.Errorf("failed to get access token: %v", err)
	}

	// Step 2: Extract page path and scene from the full path
	// Format: pages/recommendor/detail?id=123
	var pagePath, scene string
	if idx := index(path, "?"); idx != -1 {
		pagePath = path[:idx]
		scene = path[idx+1:] // Everything after ?
	} else {
		pagePath = path
		scene = ""
	}

	// Step 3: Prepare request body for WeChat API
	requestBody := map[string]interface{}{
		"page":       pagePath,
		"scene":      scene,
		"width":      256,
		"check_path": false, // Don't check if page exists (faster)
		"auto_color": false,
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request body: %v", err)
	}

	// Step 4: Call WeChat API
	apiURL := fmt.Sprintf("https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=%s", accessToken)

	log.Printf("Calling WeChat API: %s", apiURL)
	log.Printf("Request body: page=%s, scene=%s", pagePath, scene)

	resp, err := http.Post(apiURL, "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("failed to call WeChat API: %v", err)
	}
	defer resp.Body.Close()

	// Step 5: Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %v", err)
	}

	// Step 6: Check if response is an error (JSON) or image (binary)
	// WeChat returns JSON error on failure, binary image on success
	var errResp WeChatErrorResponse
	if err := json.Unmarshal(body, &errResp); err == nil && errResp.ErrCode != 0 {
		// This is an error response
		return "", fmt.Errorf("WeChat API error [%d]: %s", errResp.ErrCode, errResp.ErrMsg)
	}

	// If we can't parse as JSON error, it should be image data
	// Verify content type
	contentType := resp.Header.Get("Content-Type")
	if contentType != "image/jpeg" && contentType != "image/png" {
		return "", fmt.Errorf("unexpected content type: %s, expected image", contentType)
	}

	// Step 7: Convert image to base64
	base64Str := base64.StdEncoding.EncodeToString(body)

	log.Printf("✅ Successfully generated mini program QR code (size: %d bytes)", len(body))

	return fmt.Sprintf("data:image/png;base64,%s", base64Str), nil
}

// getAccessToken retrieves WeChat access token using AppID and AppSecret
// WeChat API endpoint: https://api.weixin.qq.com/cgi-bin/token
// Implements caching to avoid unnecessary API calls
func getAccessToken(appID, appSecret string) (string, error) {
	tokenMutex.RLock()

	// Check if we have a valid cached token
	if tokenCache.token != "" && time.Now().Before(tokenCache.expiresAt) {
		// Token is still valid
		token := tokenCache.token
		tokenMutex.RUnlock()
		log.Printf("✅ Using cached access token (expires in: %v)", time.Until(tokenCache.expiresAt))
		return token, nil
	}

	tokenMutex.RUnlock()

	// Token expired or doesn't exist, need to refresh
	tokenMutex.Lock()
	defer tokenMutex.Unlock()

	// Double-check after acquiring write lock
	if tokenCache.token != "" && time.Now().Before(tokenCache.expiresAt) {
		log.Printf("✅ Using cached access token (expires in: %v)", time.Until(tokenCache.expiresAt))
		return tokenCache.token
	}

	// Prevent multiple concurrent refresh attempts
	if tokenRefresh {
		// Wait for the current refresh to complete
		for tokenRefresh {
			tokenMutex.Unlock()
			time.Sleep(100 * time.Millisecond)
			tokenMutex.Lock()
		}
		if tokenCache.token != "" && time.Now().Before(tokenCache.expiresAt) {
			return tokenCache.token, nil
		}
	}

	tokenRefresh = true
	defer func() { tokenRefresh = false }()

	// Call WeChat API to get new token
	tokenURL := fmt.Sprintf("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s", appID, appSecret)

	log.Printf("🔄 Fetching new access token from WeChat API...")

	resp, err := http.Get(tokenURL)
	if err != nil {
		return "", fmt.Errorf("failed to call WeChat token API: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read token response: %v", err)
	}

	var tokenResp WeChatTokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return "", fmt.Errorf("failed to parse token response: %v", err)
	}

	// Check for API errors
	if tokenResp.ErrCode != 0 {
		return "", fmt.Errorf("WeChat token API error [%d]: %s", tokenResp.ErrCode, tokenResp.ErrMsg)
	}

	// Cache the token with a 5-minute buffer before expiration
	expiresIn := time.Duration(tokenResp.ExpiresIn-300) * time.Second
	if expiresIn < 0 {
		expiresIn = 5 * time.Minute
	}

	tokenCache = cachedToken{
		token:     tokenResp.AccessToken,
		expiresAt: time.Now().Add(expiresIn),
	}

	log.Printf("✅ Successfully fetched new access token (expires in: %v)", expiresIn)

	return tokenCache.token, nil
}

// index is a helper function to find the first occurrence of a substring
// (similar to strings.Index)
func index(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}
