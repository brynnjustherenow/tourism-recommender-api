package controllers

import (
	"net/http"
	"strconv"

	"tourism_recommendor/config"
	"tourism_recommendor/models"
	"tourism_recommendor/utils"

	"github.com/gin-gonic/gin"
)

// DestinationController handles destination-related requests
type DestinationController struct{}

// CreateDestinationRequest holds the request data for creating a destination
type CreateDestinationRequest struct {
	RecommendorID uint    `json:"recommendor_id" binding:"required"`
	Name          string  `json:"name" binding:"required"`
	Description   string  `json:"description"`
	Image         string  `json:"image"`
	Address       string  `json:"address"`
	Category      string  `json:"category"`
	Rating        float64 `json:"rating" binding:"omitempty,min=0,max=5"`
	Status        string  `json:"status"`
}

// UpdateDestinationRequest holds the request data for updating a destination
type UpdateDestinationRequest struct {
	Name        *string  `json:"name"`
	Description *string  `json:"description"`
	Image       *string  `json:"image"`
	Address     *string  `json:"address"`
	Category    *string  `json:"category"`
	Rating      *float64 `json:"rating" binding:"omitempty,min=0,max=5"`
	Status      *string  `json:"status"`
}

// CreateDestination creates a new destination
// @Summary Create a new destination
// @Description Create a new destination associated with a recommendor
// @Tags admin
// @Accept json
// @Produce json
// @Param destination body CreateDestinationRequest true "Destination data"
// @Success 201 {object} models.Destination
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/admin/destinations [post]
func (dc *DestinationController) CreateDestination(c *gin.Context) {
	var req CreateDestinationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data: " + err.Error()})
		return
	}

	// Validate that recommendor exists
	var recommendor models.Recommendor
	if err := config.DB.First(&recommendor, req.RecommendorID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Recommendor not found"})
		return
	}

	// Set default status if not provided
	status := req.Status
	if status == "" {
		status = "active"
	}

	destination := models.Destination{
		RecommendorID: req.RecommendorID,
		Name:          req.Name,
		Description:   req.Description,
		Image:         req.Image,
		Address:       req.Address,
		Category:      req.Category,
		Rating:        req.Rating,
		Status:        status,
	}

	if err := config.DB.Create(&destination).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create destination: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, destination)
}

// GetDestinations retrieves a paginated list of destinations with filtering
// @Summary Get all destinations
// @Description Retrieve a paginated list of destinations with optional filtering
// @Tags destinations
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort_by query string false "Sort by field" default(id)
// @Param sort_order query string false "Sort order (asc/desc)" default(asc)
// @Param name query string false "Filter by name"
// @Param category query string false "Filter by category"
// @Param recommendor_id query int false "Filter by recommendor ID"
// @Param region_id query int false "Filter by region ID"
// @Param status query string false "Filter by status"
// @Success 200 {object} utils.PaginationResponse
// @Failure 500 {object} map[string]string
// @Router /api/destinations [get]
func (dc *DestinationController) GetDestinations(c *gin.Context) {
	// Parse pagination parameters
	pr := utils.ParsePaginationRequest(
		c.DefaultQuery("page", "1"),
		c.DefaultQuery("page_size", "10"),
		c.DefaultQuery("sort_by", "id"),
		c.DefaultQuery("sort_order", "asc"),
	)

	// Build query with preloads
	query := config.DB.Model(&models.Destination{}).
		Preload("Recommendor")

	// Apply filters
	if name := c.Query("name"); name != "" {
		query = utils.ApplyFilter(query, "name", name)
	}

	if category := c.Query("category"); category != "" {
		query = utils.ApplyEqualFilter(query, "category", category)
	}

	if recommendorID := c.Query("recommendor_id"); recommendorID != "" {
		if id, err := strconv.Atoi(recommendorID); err == nil {
			query = utils.ApplyEqualFilter(query, "recommendor_id", id)
		}
	}

	if status := c.Query("status"); status != "" {
		query = utils.ApplyEqualFilter(query, "status", status)
	}

	// Filter only active destinations by default, unless status is explicitly set
	if c.Query("status") == "" {
		query = query.Where("status = ?", "active")
	}

	var destinations []models.Destination

	// Get paginated results
	response, err := utils.Paginate(query, pr, &destinations, &models.Destination{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve destinations: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetDestinationByID retrieves a single destination by ID
// @Summary Get destination by ID
// @Description Retrieve a single destination by its ID with full details
// @Tags destinations
// @Produce json
// @Param id path int true "Destination ID"
// @Success 200 {object} models.Destination
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/destinations/{id} [get]
func (dc *DestinationController) GetDestinationByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid destination ID"})
		return
	}

	var destination models.Destination
	if err := config.DB.
		Preload("Recommendor").
		First(&destination, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Destination not found"})
		return
	}

	c.JSON(http.StatusOK, destination)
}

// UpdateDestination updates an existing destination
// @Summary Update a destination
// @Description Update an existing destination with the provided data
// @Tags admin
// @Accept json
// @Produce json
// @Param id path int true "Destination ID"
// @Param destination body UpdateDestinationRequest true "Destination data"
// @Success 200 {object} models.Destination
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/admin/destinations/{id} [put]
func (dc *DestinationController) UpdateDestination(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid destination ID"})
		return
	}

	var req UpdateDestinationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data: " + err.Error()})
		return
	}

	var destination models.Destination
	if err := config.DB.First(&destination, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Destination not found"})
		return
	}

	// Update fields if provided
	if req.Name != nil {
		destination.Name = *req.Name
	}
	if req.Description != nil {
		destination.Description = *req.Description
	}
	if req.Image != nil {
		destination.Image = *req.Image
	}
	if req.Address != nil {
		destination.Address = *req.Address
	}
	if req.Category != nil {
		destination.Category = *req.Category
	}
	if req.Rating != nil {
		destination.Rating = *req.Rating
	}
	if req.Status != nil {
		destination.Status = *req.Status
	}

	if err := config.DB.Save(&destination).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update destination: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, destination)
}

// DeleteDestination deletes a destination (soft delete)
// @Summary Delete a destination
// @Description Soft delete a destination by its ID
// @Tags admin
// @Produce json
// @Param id path int true "Destination ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/admin/destinations/{id} [delete]
func (dc *DestinationController) DeleteDestination(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid destination ID"})
		return
	}

	var destination models.Destination
	if err := config.DB.First(&destination, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Destination not found"})
		return
	}

	// Soft delete (GORM will set deleted_at)
	if err := config.DB.Delete(&destination).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete destination: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Destination deleted successfully"})
}

// GetDestinationsByRecommendor retrieves all destinations for a specific recommendor
// @Summary Get destinations by recommender
// @Description Retrieve all destinations recommended by a specific recommender
// @Tags recommendors
// @Produce json
// @Param recommendor_id path int true "Recommender ID"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Success 200 {object} utils.PaginationResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/recommendors/{recommendor_id}/destinations [get]
func (dc *DestinationController) GetDestinationsByRecommendor(c *gin.Context) {
	recommendorID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recommender ID"})
		return
	}

	// Check if recommendor exists
	var recommendor models.Recommendor
	if err := config.DB.First(&recommendor, recommendorID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Recommender not found"})
		return
	}

	// Parse pagination parameters
	pr := utils.ParsePaginationRequest(
		c.DefaultQuery("page", "1"),
		c.DefaultQuery("page_size", "10"),
		c.DefaultQuery("sort_by", "id"),
		c.DefaultQuery("sort_order", "asc"),
	)

	// Build query
	query := config.DB.Model(&models.Destination{}).
		Where("recommendor_id = ?", recommendorID).
		Where("status = ?", "active")

	var destinations []models.Destination

	// Get paginated results
	response, err := utils.Paginate(query, pr, &destinations, &models.Destination{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve destinations: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetAdminDestinations retrieves destinations for admin (includes deleted ones and all statuses)
// @Summary Get all destinations (admin)
// @Description Retrieve all destinations including inactive ones for admin management
// @Tags admin
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort_by query string false "Sort by field" default(id)
// @Param sort_order query string false "Sort order (asc/desc)" default(asc)
// @Param name query string false "Filter by name"
// @Param category query string false "Filter by category"
// @Param recommendor_id query int false "Filter by recommendor ID"
// @Param region_id query int false "Filter by region ID"
// @Param status query string false "Filter by status"
// @Success 200 {object} utils.PaginationResponse
// @Failure 500 {object} map[string]string
// @Router /api/admin/destinations [get]
func (dc *DestinationController) GetAdminDestinations(c *gin.Context) {
	// Parse pagination parameters
	pr := utils.ParsePaginationRequest(
		c.DefaultQuery("page", "1"),
		c.DefaultQuery("page_size", "10"),
		c.DefaultQuery("sort_by", "id"),
		c.DefaultQuery("sort_order", "asc"),
	)

	// Build query with preloads
	query := config.DB.Model(&models.Destination{}).
		Preload("Recommendor")

	// Apply filters
	if name := c.Query("name"); name != "" {
		query = utils.ApplyFilter(query, "name", name)
	}

	if category := c.Query("category"); category != "" {
		query = utils.ApplyEqualFilter(query, "category", category)
	}

	if recommendorID := c.Query("recommendor_id"); recommendorID != "" {
		if id, err := strconv.Atoi(recommendorID); err == nil {
			query = utils.ApplyEqualFilter(query, "recommendor_id", id)
		}
	}

	if status := c.Query("status"); status != "" {
		query = utils.ApplyEqualFilter(query, "status", status)
	}

	var destinations []models.Destination

	// Get paginated results
	response, err := utils.Paginate(query, pr, &destinations, &models.Destination{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve destinations: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}
