package controllers

import (
	"net/http"
	"os"
	"strconv"
	"time"

	"tourism_recommendor/config"
	"tourism_recommendor/models"
	"tourism_recommendor/utils"

	"github.com/gin-gonic/gin"
)

// RecommendorController handles recommender-related requests
type RecommendorController struct{}

// CreateRecommendorRequest holds the request data for creating a recommender
type CreateRecommendorRequest struct {
	Name          string    `json:"name" binding:"required"`
	Gender        string    `json:"gender" binding:"required,oneof=male female other"`
	Age           int       `json:"age" binding:"required,min=18,max=100"`
	IDNumber      string    `json:"id_number" binding:"required"`
	Avatar        string    `json:"avatar"`
	Bio           string    `json:"bio"`
	ValidFrom     time.Time `json:"valid_from" binding:"required"`
	ValidUntil    time.Time `json:"valid_until" binding:"required"`
	Phone         string    `json:"phone"`
	Email         string    `json:"email"`
	ProvinceCode  string    `json:"province_code" binding:"required"`
	CityCode      string    `json:"city_code" binding:"required"`
	DistrictCode  string    `json:"district_code" binding:"required"`
	RegionAddress string    `json:"region_address"`
	Status        string    `json:"status"`
}

// UpdateRecommendorRequest holds the request data for updating a recommender
type UpdateRecommendorRequest struct {
	Name          *string    `json:"name"`
	Gender        *string    `json:"gender" binding:"omitempty,oneof=male female other"`
	Age           *int       `json:"age" binding:"omitempty,min=18,max=100"`
	IDNumber      *string    `json:"id_number"`
	Avatar        *string    `json:"avatar"`
	Bio           *string    `json:"bio"`
	ValidFrom     *time.Time `json:"valid_from"`
	ValidUntil    *time.Time `json:"valid_until"`
	Phone         *string    `json:"phone"`
	Email         *string    `json:"email"`
	ProvinceCode  *string    `json:"province_code"`
	CityCode      *string    `json:"city_code"`
	DistrictCode  *string    `json:"district_code"`
	RegionAddress *string    `json:"region_address"`
	Status        *string    `json:"status"`
	Rating        *float64   `json:"rating" binding:"omitempty,min=0,max=5"`
}

// CreateRecommendor creates a new recommender
// @Summary Create a new recommender
// @Description Create a new recommender with the provided data and generate QR codes
// @Tags admin
// @Accept json
// @Produce json
// @Param recommendor body CreateRecommendorRequest true "Recommendor data"
// @Success 201 {object} models.Recommendor
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/admin/recommendors [post]
func (rc *RecommendorController) CreateRecommendor(c *gin.Context) {
	var req CreateRecommendorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data: " + err.Error()})
		return
	}

	// Check if ID number already exists
	var existingRecommendor models.Recommendor
	if err := config.DB.Where("id_number = ?", req.IDNumber).First(&existingRecommendor).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID number already exists"})
		return
	}

	// Set default status if not provided
	status := req.Status
	if status == "" {
		status = "active"
	}

	// Build region address if not provided
	regionAddress := req.RegionAddress
	if regionAddress == "" {
		// In production, you could query region data from a table or API
		// For now, just concatenate the codes or use provided value
		regionAddress = req.ProvinceCode + "/" + req.CityCode + "/" + req.DistrictCode
	}

	recommendor := models.Recommendor{
		Name:          req.Name,
		Gender:        models.Gender(req.Gender),
		Age:           req.Age,
		IDNumber:      req.IDNumber,
		Avatar:        req.Avatar,
		Bio:           req.Bio,
		ValidFrom:     req.ValidFrom,
		ValidUntil:    req.ValidUntil,
		Phone:         req.Phone,
		Email:         req.Email,
		ProvinceCode:  req.ProvinceCode,
		CityCode:      req.CityCode,
		DistrictCode:  req.DistrictCode,
		RegionAddress: regionAddress,
		Status:        status,
	}

	// Create recommendor
	if err := config.DB.Create(&recommendor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create recommendor: " + err.Error()})
		return
	}

	// Generate QR codes
	if err := rc.generateQRCodes(&recommendor); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate QR codes: " + err.Error()})
		return
	}

	// Update with QR codes
	if err := config.DB.Save(&recommendor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save QR codes: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, recommendor)
}

// GetRecommendors retrieves a paginated list of recommendors with filtering and sorting
// @Summary Get all recommendors
// @Description Retrieve a paginated list of recommendors with optional filtering and sorting
// @Tags recommendors
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort_by query string false "Sort by field" default(id)
// @Param sort_order query string false "Sort order (asc/desc)" default(asc)
// @Param name query string false "Filter by name"
// @Param gender query string false "Filter by gender"
// @Param province_code query string false "Filter by province code"
// @Param city_code query string false "Filter by city code"
// @Param district_code query string false "Filter by district code"
// @Param status query string false "Filter by status"
// @Param min_age query int false "Minimum age"
// @Param max_age query int false "Maximum age"
// @Success 200 {object} utils.PaginationResponse
// @Failure 500 {object} map[string]string
// @Router /api/recommendors [get]
func (rc *RecommendorController) GetRecommendors(c *gin.Context) {
	// Parse pagination parameters
	pr := utils.ParsePaginationRequest(
		c.DefaultQuery("page", "1"),
		c.DefaultQuery("page_size", "10"),
		c.DefaultQuery("sort_by", "id"),
		c.DefaultQuery("sort_order", "asc"),
	)

	// Build query
	query := config.DB.Model(&models.Recommendor{})

	// Apply filters
	if name := c.Query("name"); name != "" {
		query = utils.ApplyFilter(query, "name", name)
	}

	if gender := c.Query("gender"); gender != "" {
		query = utils.ApplyEqualFilter(query, "gender", gender)
	}

	// Region filters - use province/city/district codes
	if provinceCode := c.Query("province_code"); provinceCode != "" {
		query = utils.ApplyEqualFilter(query, "province_code", provinceCode)
	}

	if cityCode := c.Query("city_code"); cityCode != "" {
		query = utils.ApplyEqualFilter(query, "city_code", cityCode)
	}

	if districtCode := c.Query("district_code"); districtCode != "" {
		query = utils.ApplyEqualFilter(query, "district_code", districtCode)
	}

	// Region filters by name (for WeChat Mini Program picker)
	// Use fuzzy matching on region_address field
	if province := c.Query("province"); province != "" {
		query = query.Where("region_address LIKE ?", "%"+province+"%")
	}

	if city := c.Query("city"); city != "" {
		query = query.Where("region_address LIKE ?", "%"+city+"%")
	}

	if district := c.Query("district"); district != "" {
		query = query.Where("region_address LIKE ?", "%"+district+"%")
	}

	if status := c.Query("status"); status != "" {
		query = utils.ApplyEqualFilter(query, "status", status)
	}

	if minAge := c.Query("min_age"); minAge != "" {
		if age, err := strconv.Atoi(minAge); err == nil {
			query = query.Where("age >= ?", age)
		}
	}

	if maxAge := c.Query("max_age"); maxAge != "" {
		if age, err := strconv.Atoi(maxAge); err == nil {
			query = query.Where("age <= ?", age)
		}
	}

	// Filter only active recommendors by default, unless status is explicitly set
	if c.Query("status") == "" {
		query = query.Where("status = ?", "active")
	}

	var recommendors []models.Recommendor

	// Get paginated results
	response, err := utils.Paginate(query, pr, &recommendors, &models.Recommendor{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve recommendors: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetRecommendorByID retrieves a single recommender by ID with destinations
// @Summary Get recommender by ID
// @Description Retrieve a single recommender by its ID including their recommended destinations
// @Tags recommendors
// @Produce json
// @Param id path int true "Recommendor ID"
// @Success 200 {object} models.Recommendor
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/recommendors/{id} [get]
func (rc *RecommendorController) GetRecommendorByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recommendor ID"})
		return
	}

	var recommendor models.Recommendor
	if err := config.DB.
		Preload("Destinations").
		First(&recommendor, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Recommendor not found"})
		return
	}

	c.JSON(http.StatusOK, recommendor)
}

// UpdateRecommendor updates an existing recommender
// @Summary Update a recommender
// @Description Update an existing recommender with the provided data and regenerate QR codes if needed
// @Tags admin
// @Accept json
// @Produce json
// @Param id path int true "Recommendor ID"
// @Param recommendor body UpdateRecommendorRequest true "Recommendor data"
// @Success 200 {object} models.Recommendor
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/admin/recommendors/{id} [put]
func (rc *RecommendorController) UpdateRecommendor(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recommendor ID"})
		return
	}

	var req UpdateRecommendorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data: " + err.Error()})
		return
	}

	var recommendor models.Recommendor
	if err := config.DB.First(&recommendor, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Recommendor not found"})
		return
	}

	// Update fields if provided
	if req.Name != nil {
		recommendor.Name = *req.Name
	}
	if req.Gender != nil {
		recommendor.Gender = models.Gender(*req.Gender)
	}
	if req.Age != nil {
		recommendor.Age = *req.Age
	}
	if req.IDNumber != nil {
		// Check if ID number is already used by another recommendor
		var existingRecommendor models.Recommendor
		if err := config.DB.Where("id_number = ? AND id != ?", *req.IDNumber, id).First(&existingRecommendor).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID number already exists"})
			return
		}
		recommendor.IDNumber = *req.IDNumber
	}
	if req.Avatar != nil {
		recommendor.Avatar = *req.Avatar
	}
	if req.Bio != nil {
		recommendor.Bio = *req.Bio
	}
	if req.ValidFrom != nil {
		recommendor.ValidFrom = *req.ValidFrom
	}
	if req.ValidUntil != nil {
		recommendor.ValidUntil = *req.ValidUntil
	}
	if req.Phone != nil {
		recommendor.Phone = *req.Phone
	}
	if req.Email != nil {
		recommendor.Email = *req.Email
	}
	if req.ProvinceCode != nil {
		recommendor.ProvinceCode = *req.ProvinceCode
	}
	if req.CityCode != nil {
		recommendor.CityCode = *req.CityCode
	}
	if req.DistrictCode != nil {
		recommendor.DistrictCode = *req.DistrictCode
	}
	if req.RegionAddress != nil {
		recommendor.RegionAddress = *req.RegionAddress
	}
	if req.Status != nil {
		recommendor.Status = *req.Status
	}
	if req.Rating != nil {
		recommendor.Rating = *req.Rating
	}

	// Regenerate QR codes
	if err := rc.generateQRCodes(&recommendor); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to regenerate QR codes: " + err.Error()})
		return
	}

	// Save updates
	if err := config.DB.Save(&recommendor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update recommendor: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, recommendor)
}

// DeleteRecommendor deletes a recommender (soft delete)
// @Summary Delete a recommender
// @Description Soft delete a recommendor by its ID
// @Tags admin
// @Produce json
// @Param id path int true "Recommendor ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/admin/recommendors/{id} [delete]
func (rc *RecommendorController) DeleteRecommendor(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recommendor ID"})
		return
	}

	var recommendor models.Recommendor
	if err := config.DB.First(&recommendor, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Recommendor not found"})
		return
	}

	// Soft delete (GORM will set deleted_at)
	if err := config.DB.Delete(&recommendor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete recommendor: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Recommendor deleted successfully"})
}

// RegenerateQRCodes regenerates QR codes for a recommender
// @Summary Regenerate QR codes
// @Description Regenerate QR codes for a specific recommender
// @Tags admin
// @Produce json
// @Param id path int true "Recommendor ID"
// @Success 200 {object} models.Recommendor
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/admin/recommendors/{id}/qrcodes [post]
func (rc *RecommendorController) RegenerateQRCodes(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recommendor ID"})
		return
	}

	var recommendor models.Recommendor
	if err := config.DB.First(&recommendor, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Recommendor not found"})
		return
	}

	// Regenerate QR codes
	if err := rc.generateQRCodes(&recommendor); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to regenerate QR codes: " + err.Error()})
		return
	}

	// Save updates
	if err := config.DB.Save(&recommendor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save QR codes: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, recommendor)
}

// GetAdminRecommendors retrieves recommendors for admin (includes all statuses)
// @Summary Get all recommendors (admin)
// @Description Retrieve all recommendors including inactive ones for admin management
// @Tags admin
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort_by query string false "Sort by field" default(id)
// @Param sort_order query string false "Sort order (asc/desc)" default(asc)
// @Param name query string false "Filter by name"
// @Param gender query string false "Filter by gender"
// @Param province_code query string false "Filter by province code"
// @Param city_code query string false "Filter by city code"
// @Param district_code query string false "Filter by district code"
// @Param status query string false "Filter by status"
// @Param min_age query int false "Minimum age"
// @Param max_age query int false "Maximum age"
// @Success 200 {object} utils.PaginationResponse
// @Failure 500 {object} map[string]string
// @Router /api/admin/recommendors [get]
func (rc *RecommendorController) GetAdminRecommendors(c *gin.Context) {
	// Parse pagination parameters
	pr := utils.ParsePaginationRequest(
		c.DefaultQuery("page", "1"),
		c.DefaultQuery("page_size", "10"),
		c.DefaultQuery("sort_by", "id"),
		c.DefaultQuery("sort_order", "asc"),
	)

	// Build query with preloads
	query := config.DB.Model(&models.Recommendor{})

	// Apply filters (same as public but without default status filter)
	if name := c.Query("name"); name != "" {
		query = utils.ApplyFilter(query, "name", name)
	}

	if gender := c.Query("gender"); gender != "" {
		query = utils.ApplyEqualFilter(query, "gender", gender)
	}

	// Region filters - use province/city/district codes
	if provinceCode := c.Query("province_code"); provinceCode != "" {
		query = utils.ApplyEqualFilter(query, "province_code", provinceCode)
	}

	if cityCode := c.Query("city_code"); cityCode != "" {
		query = utils.ApplyEqualFilter(query, "city_code", cityCode)
	}

	if districtCode := c.Query("district_code"); districtCode != "" {
		query = utils.ApplyEqualFilter(query, "district_code", districtCode)
	}

	if status := c.Query("status"); status != "" {
		query = utils.ApplyEqualFilter(query, "status", status)
	}

	if minAge := c.Query("min_age"); minAge != "" {
		if age, err := strconv.Atoi(minAge); err == nil {
			query = query.Where("age >= ?", age)
		}
	}

	if maxAge := c.Query("max_age"); maxAge != "" {
		if age, err := strconv.Atoi(maxAge); err == nil {
			query = query.Where("age <= ?", age)
		}
	}

	var recommendors []models.Recommendor

	// Get paginated results
	response, err := utils.Paginate(query, pr, &recommendors, &models.Recommendor{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve recommendors: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// generateQRCodes generates both web and mini program QR codes for a recommender
func (rc *RecommendorController) generateQRCodes(recommendor *models.Recommendor) error {
	qrConfig := utils.QRCodeConfig{
		BaseURL:      os.Getenv("BASE_URL"),
		MinAppID:     os.Getenv("WX_APP_ID"),
		MinAppPath:   os.Getenv("WX_APP_PATH"),
		MinAppSecret: os.Getenv("WX_APP_SECRET"),
	}

	// Set defaults if not provided
	if qrConfig.BaseURL == "" {
		qrConfig.BaseURL = "http://localhost:8080"
	}
	if qrConfig.MinAppID == "" {
		qrConfig.MinAppID = "your_miniprogram_appid"
	}
	if qrConfig.MinAppPath == "" {
		qrConfig.MinAppPath = "/"
	}

	webQR, wxappQR, err := utils.GenerateRecommendorQRs(qrConfig, recommendor.ID)
	if err != nil {
		return err
	}

	recommendor.QRCodeWeb = webQR
	recommendor.QRCodeWxapp = wxappQR

	return nil
}
