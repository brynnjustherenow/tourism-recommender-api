package controllers

import (
	"fmt"
	"net/http"
	"strings"

	"tourism_recommendor/utils"

	"github.com/gin-gonic/gin"
)

// UploadController handles file upload operations
type UploadController struct{}

// UploadAvatar handles avatar file upload
// @Summary Upload avatar image
// @Description Upload an avatar image file (max 2MB, jpg/png/gif/webp)
// @Tags upload
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "Avatar image file"
// @Success 200 {object} utils.UploadResult
// @Failure 400 {object} map[string]string
// @Failure 413 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/upload/avatar [post]
func (uc *UploadController) UploadAvatar(c *gin.Context) {
	// Get file from form
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No file uploaded or invalid file",
		})
		return
	}

	// Open file
	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to open file",
		})
		return
	}
	defer file.Close()

	// Validate and save avatar
	result, err := utils.ValidateAvatar(fileHeader, file)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Construct full URL
	fullURL := getFullURL(c, result.URL)

	c.JSON(http.StatusOK, gin.H{
		"message": "File uploaded successfully",
		"data": gin.H{
			"file_name":    result.FileName,
			"file_path":    result.FilePath,
			"file_size":    result.FileSize,
			"content_type": result.ContentType,
			"url":          fullURL,
		},
	})
}

// UploadImage handles generic image file upload
// @Summary Upload image
// @Description Upload an image file (max 10MB, jpg/png/gif/webp)
// @Tags upload
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "Image file"
// @Success 200 {object} utils.UploadResult
// @Failure 400 {object} map[string]string
// @Failure 413 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/upload/image [post]
func (uc *UploadController) UploadImage(c *gin.Context) {
	// Get file from form
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No file uploaded or invalid file",
		})
		return
	}

	// Open file
	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to open file",
		})
		return
	}
	defer file.Close()

	// Configure upload for images
	config := utils.UploadConfig{
		AllowedTypes: utils.AllowedImageTypes,
		MaxSize:      int64(utils.MaxFileSize),
		Directory:    "./uploads/images",
		GenerateName: true,
	}

	// Validate and save image
	result, err := utils.ValidateAndSaveFile(fileHeader, file, config)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Construct full URL
	fullURL := getFullURL(c, result.URL)

	c.JSON(http.StatusOK, gin.H{
		"message": "File uploaded successfully",
		"data": gin.H{
			"file_name":    result.FileName,
			"file_path":    result.FilePath,
			"file_size":    result.FileSize,
			"content_type": result.ContentType,
			"url":          fullURL,
		},
	})
}

// UploadDocument handles document file upload
// @Summary Upload document
// @Description Upload a document file (max 10MB)
// @Tags upload
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "Document file"
// @Success 200 {object} utils.UploadResult
// @Failure 400 {object} map[string]string
// @Failure 413 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/upload/document [post]
func (uc *UploadController) UploadDocument(c *gin.Context) {
	// Get file from form
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No file uploaded or invalid file",
		})
		return
	}

	// Open file
	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to open file",
		})
		return
	}
	defer file.Close()

	// Validate and save document
	result, err := utils.ValidateDocument(fileHeader, file)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Construct full URL
	fullURL := getFullURL(c, result.URL)

	c.JSON(http.StatusOK, gin.H{
		"message": "File uploaded successfully",
		"data": gin.H{
			"file_name":    result.FileName,
			"file_path":    result.FilePath,
			"file_size":    result.FileSize,
			"content_type": result.ContentType,
			"url":          fullURL,
		},
	})
}

// getFullURL constructs the complete URL from request and relative path
func getFullURL(c *gin.Context, relativePath string) string {
	// Get scheme (http or https)
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}

	// Get host
	host := c.Request.Host

	// Remove leading "./" from relative path
	path := strings.TrimPrefix(relativePath, "./")

	// Construct full URL
	fullURL := fmt.Sprintf("%s://%s/%s", scheme, host, path)

	return fullURL
}
