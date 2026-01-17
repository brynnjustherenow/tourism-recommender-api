package utils

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var (
	// Allowed image file types
	AllowedImageTypes = []string{
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
	}

	// Maximum file size in bytes (10MB)
	MaxFileSize = 10 * 1024 * 1024

	// Maximum avatar size in bytes (2MB)
	MaxAvatarSize = 2 * 1024 * 1024

	// Upload directories
	UploadDir   = "./uploads"
	AvatarDir   = "./uploads/avatars"
	DocumentDir = "./uploads/documents"
)

// UploadConfig holds configuration for file uploads
type UploadConfig struct {
	AllowedTypes []string
	MaxSize      int64
	Directory    string
	GenerateName bool
}

// UploadResult represents the result of a file upload
type UploadResult struct {
	FileName    string `json:"file_name"`
	FilePath    string `json:"file_path"`
	FileSize    int64  `json:"file_size"`
	ContentType string `json:"content_type"`
	URL         string `json:"url"`
}

// FileValidationError represents a file validation error
type FileValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidateFileType checks if the file type is allowed
func ValidateFileType(fileHeader *multipart.FileHeader, allowedTypes []string) error {
	contentType := fileHeader.Header.Get("Content-Type")

	for _, allowedType := range allowedTypes {
		if strings.HasPrefix(contentType, allowedType) {
			return nil
		}
	}

	return fmt.Errorf("file type %s is not allowed", contentType)
}

// ValidateFileSize checks if the file size is within limits
func ValidateFileSize(fileSize int64, maxSize int64) error {
	if fileSize > maxSize {
		return fmt.Errorf("file size %d exceeds maximum allowed size %d", fileSize, maxSize)
	}
	return nil
}

// EnsureDirectory creates a directory if it doesn't exist
func EnsureDirectory(dir string) error {
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}
	return nil
}

// GenerateUniqueFileName generates a unique filename to avoid conflicts
func GenerateUniqueFileName(originalFilename string, generateName bool) string {
	if !generateName {
		return originalFilename
	}

	ext := filepath.Ext(originalFilename)
	name := strings.TrimSuffix(originalFilename, ext)

	timestamp := time.Now().Format("20060102_150405")
	return fmt.Sprintf("%s_%s%s", name, timestamp, ext)
}

// SaveFile saves an uploaded file to the specified directory
func SaveFile(fileHeader *multipart.FileHeader, file multipart.File, directory string, generateUniqueName bool) (*UploadResult, error) {
	// Ensure directory exists
	if err := EnsureDirectory(directory); err != nil {
		return nil, err
	}

	// Generate filename
	filename := GenerateUniqueFileName(fileHeader.Filename, generateUniqueName)
	filePath := filepath.Join(directory, filename)

	// Create destination file
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	// Copy file content
	if _, err := io.Copy(dst, file); err != nil {
		// Clean up the created file on error
		os.Remove(filePath)
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	// Get file info
	fileInfo, err := dst.Stat()
	if err != nil {
		return nil, fmt.Errorf("failed to get file info: %w", err)
	}

	// Get relative path for URL
	// Convert all path separators to forward slashes for URL compatibility
	relativePath := strings.ReplaceAll(strings.TrimPrefix(filePath, "."), "\\", "/")

	return &UploadResult{
		FileName:    filename,
		FilePath:    filePath,
		FileSize:    fileInfo.Size(),
		ContentType: fileHeader.Header.Get("Content-Type"),
		URL:         relativePath,
	}, nil
}

// ValidateAndSaveFile validates and saves an uploaded file
func ValidateAndSaveFile(fileHeader *multipart.FileHeader, file multipart.File, config UploadConfig) (*UploadResult, error) {
	// Validate file type
	if len(config.AllowedTypes) > 0 {
		if err := ValidateFileType(fileHeader, config.AllowedTypes); err != nil {
			return nil, err
		}
	}

	// Validate file size
	if err := ValidateFileSize(fileHeader.Size, config.MaxSize); err != nil {
		return nil, err
	}

	// Save file
	return SaveFile(fileHeader, file, config.Directory, config.GenerateName)
}

// ValidateAvatar validates an avatar upload
func ValidateAvatar(fileHeader *multipart.FileHeader, file multipart.File) (*UploadResult, error) {
	config := UploadConfig{
		AllowedTypes: AllowedImageTypes,
		MaxSize:      int64(MaxAvatarSize),
		Directory:    AvatarDir,
		GenerateName: true,
	}

	return ValidateAndSaveFile(fileHeader, file, config)
}

// ValidateDocument validates a document upload
func ValidateDocument(fileHeader *multipart.FileHeader, file multipart.File) (*UploadResult, error) {
	// Common document types
	allowedTypes := []string{
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/vnd.ms-excel",
		"application/vnd.ms-powerpoint",
		"text/plain",
	}

	config := UploadConfig{
		AllowedTypes: allowedTypes,
		MaxSize:      int64(MaxFileSize),
		Directory:    DocumentDir,
		GenerateName: true,
	}

	return ValidateAndSaveFile(fileHeader, file, config)
}

// GetFileURL returns a public URL for a file
func GetFileURL(filePath string, baseURL string) string {
	// Convert all path separators to forward slashes for URL compatibility
	relativePath := strings.ReplaceAll(strings.TrimPrefix(filePath, "."), "\\", "/")
	return fmt.Sprintf("%s%s", strings.TrimSuffix(baseURL, "/"), relativePath)
}

// DeleteFile deletes a file if it exists
func DeleteFile(filePath string) error {
	if filePath == "" {
		return errors.New("file path is empty")
	}

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil // File doesn't exist, nothing to delete
	}

	// Delete file
	if err := os.Remove(filePath); err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

// DeleteOldFile deletes an old file before saving a new one
func DeleteOldFile(oldFilePath string) error {
	if oldFilePath == "" {
		return nil
	}

	if err := DeleteFile(oldFilePath); err != nil {
		// Log but don't fail if old file doesn't exist
		fmt.Printf("Warning: failed to delete old file: %v\n", err)
	}

	return nil
}

// GetFileSizeString returns a human-readable file size
func GetFileSizeString(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), uint64(0)
	for n := bytes / unit; n >= unit; n /= unit {
		div = n
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div/int64(exp)), "KMGTPE"[exp])
}

// InitUploadDirectories initializes all upload directories
func InitUploadDirectories() error {
	directories := []string{
		UploadDir,
		AvatarDir,
		DocumentDir,
	}

	for _, dir := range directories {
		if err := EnsureDirectory(dir); err != nil {
			return fmt.Errorf("failed to initialize directory %s: %w", dir, err)
		}
	}

	return nil
}
