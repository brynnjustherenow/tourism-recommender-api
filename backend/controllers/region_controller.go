package controllers

import (
	"net/http"
	"strconv"

	"tourism_recommendor/config"
	"tourism_recommendor/models"
	"tourism_recommendor/utils"

	"github.com/gin-gonic/gin"
)

// RegionController handles region-related requests
type RegionController struct{}

// CreateRegionRequest holds the request data for creating a region
type CreateRegionRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

// UpdateRegionRequest holds the request data for updating a region
type UpdateRegionRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// CreateRegion creates a new region
// @Summary Create a new region
// @Description Create a new region with the provided data
// @Tags admin
// @Accept json
// @Produce json
// @Param region body CreateRegionRequest true "Region data"
// @Success 201 {object} models.Region
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/admin/regions [post]
func (rc *RegionController) CreateRegion(c *gin.Context) {
	var req CreateRegionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data: " + err.Error()})
		return
	}

	region := models.Region{
		Name:        req.Name,
		Description: req.Description,
	}

	if err := config.DB.Create(&region).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create region: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, region)
}

// GetRegions retrieves a paginated list of regions
// @Summary Get all regions
// @Description Retrieve a paginated list of regions with optional filtering
// @Tags admin
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param sort_by query string false "Sort by field" default(id)
// @Param sort_order query string false "Sort order (asc/desc)" default(asc)
// @Param name query string false "Filter by name"
// @Success 200 {object} utils.PaginationResponse
// @Failure 500 {object} map[string]string
// @Router /api/admin/regions [get]
func (rc *RegionController) GetRegions(c *gin.Context) {
	// Parse pagination parameters
	pr := utils.ParsePaginationRequest(
		c.DefaultQuery("page", "1"),
		c.DefaultQuery("page_size", "10"),
		c.DefaultQuery("sort_by", "id"),
		c.DefaultQuery("sort_order", "asc"),
	)

	// Build query
	query := config.DB.Model(&models.Region{})

	// Apply filters
	if name := c.Query("name"); name != "" {
		query = utils.ApplyFilter(query, "name", name)
	}

	var regions []models.Region

	// Get paginated results
	response, err := utils.Paginate(query, pr, &regions, &models.Region{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve regions: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetRegionByID retrieves a single region by ID
// @Summary Get region by ID
// @Description Retrieve a single region by its ID
// @Tags admin
// @Produce json
// @Param id path int true "Region ID"
// @Success 200 {object} models.Region
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/admin/regions/{id} [get]
func (rc *RegionController) GetRegionByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid region ID"})
		return
	}

	var region models.Region
	if err := config.DB.First(&region, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Region not found"})
		return
	}

	c.JSON(http.StatusOK, region)
}

// UpdateRegion updates an existing region
// @Summary Update a region
// @Description Update an existing region with the provided data
// @Tags admin
// @Accept json
// @Produce json
// @Param id path int true "Region ID"
// @Param region body UpdateRegionRequest true "Region data"
// @Success 200 {object} models.Region
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/admin/regions/{id} [put]
func (rc *RegionController) UpdateRegion(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid region ID"})
		return
	}

	var req UpdateRegionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data: " + err.Error()})
		return
	}

	var region models.Region
	if err := config.DB.First(&region, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Region not found"})
		return
	}

	// Update fields
	if req.Name != "" {
		region.Name = req.Name
	}
	if req.Description != "" {
		region.Description = req.Description
	}

	if err := config.DB.Save(&region).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update region: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, region)
}

// DeleteRegion deletes a region
// @Summary Delete a region
// @Description Delete a region by its ID
// @Tags admin
// @Produce json
// @Param id path int true "Region ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/admin/regions/{id} [delete]
func (rc *RegionController) DeleteRegion(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid region ID"})
		return
	}

	var region models.Region
	if err := config.DB.First(&region, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Region not found"})
		return
	}

	// Check if region is in use by recommendors
	var count int64
	if err := config.DB.Model(&models.Recommendor{}).Where("region_id = ?", id).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check region usage"})
		return
	}

	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot delete region because it is being used by recommendors",
		})
		return
	}

	if err := config.DB.Delete(&region).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete region: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Region deleted successfully"})
}
