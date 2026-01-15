package utils

import (
	"encoding/base64"
	"fmt"
	"strings"

	"github.com/skip2/go-qrcode"
)

// QRCodeConfig holds configuration for QR code generation
type QRCodeConfig struct {
	BaseURL    string // Base URL for web pages
	MinAppID   string // WeChat Mini Program AppID
	MinAppPath string // Base path for Mini Program pages
}

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

// GenerateWxappQRCode generates a QR code for WeChat Mini Program and returns base64 string
// This generates a standard QR code that contains the Mini Program path
func GenerateWxappQRCode(appID, path string) (string, error) {
	// Build the WeChat Mini Program URL scheme
	// Format: weixin://dl/business/?t=... or use a web-based QR code provider
	// For simplicity, we'll generate a QR code with the path info
	qrData := fmt.Sprintf("weixin://miniprogram/%s?path=%s", appID, path)

	qrCode, err := qrcode.Encode(qrData, qrcode.Medium, 256)
	if err != nil {
		return "", fmt.Errorf("failed to generate Mini Program QR code: %v", err)
	}

	// Convert to base64
	base64Str := base64.StdEncoding.EncodeToString(qrCode)

	// Add data URL prefix for HTML embedding
	return fmt.Sprintf("data:image/png;base64,%s", base64Str), nil
}

// GenerateRecommendorQRs generates both web and Mini Program QR codes for a recommendor
func GenerateRecommendorQRs(config QRCodeConfig, recommendorID uint) (webQR, wxappQR string, err error) {
	// Generate web QR code
	webURL := fmt.Sprintf("%s/recommendor/%d", strings.TrimSuffix(config.BaseURL, "/"), recommendorID)
	webQR, err = GenerateWebQRCode(webURL)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate web QR code: %v", err)
	}

	// Generate Mini Program QR code
	wxPath := fmt.Sprintf("%s/pages/recommendor/detail?id=%d",
		strings.TrimPrefix(config.MinAppPath, "/"), recommendorID)
	wxappQR, err = GenerateWxappQRCode(config.MinAppID, wxPath)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate Mini Program QR code: %v", err)
	}

	return webQR, wxappQR, nil
}
