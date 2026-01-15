package utils

import (
	"fmt"
	"reflect"
	"strconv"
	"strings"

	"gorm.io/gorm"
)

// PaginationRequest holds pagination parameters
type PaginationRequest struct {
	Page     int    `json:"page"`
	PageSize int    `json:"page_size"`
	SortBy   string `json:"sort_by"`
	SortDesc bool   `json:"sort_desc"`
}

// PaginationResponse holds paginated results
type PaginationResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int         `json:"total_pages"`
}

// NewPaginationRequest creates a default pagination request
func NewPaginationRequest() *PaginationRequest {
	return &PaginationRequest{
		Page:     1,
		PageSize: 10,
		SortBy:   "id",
		SortDesc: false,
	}
}

// ParsePaginationRequest parses query parameters into PaginationRequest
func ParsePaginationRequest(pageStr, pageSizeStr, sortBy, sortOrder string) *PaginationRequest {
	pr := NewPaginationRequest()

	// Parse page
	if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
		pr.Page = page
	}

	// Parse page size
	if pageSize, err := strconv.Atoi(pageSizeStr); err == nil && pageSize > 0 && pageSize <= 100 {
		pr.PageSize = pageSize
	}

	// Parse sort by
	if sortBy != "" {
		pr.SortBy = sortBy
	}

	// Parse sort order
	if strings.ToLower(sortOrder) == "desc" {
		pr.SortDesc = true
	}

	return pr
}

// ApplyPagination applies pagination to a GORM query
func ApplyPagination(db *gorm.DB, pr *PaginationRequest) *gorm.DB {
	offset := (pr.Page - 1) * pr.PageSize

	// Apply sorting
	if pr.SortBy != "" {
		orderDirection := "ASC"
		if pr.SortDesc {
			orderDirection = "DESC"
		}
		db = db.Order(fmt.Sprintf("%s %s", pr.SortBy, orderDirection))
	}

	// Apply pagination
	return db.Offset(offset).Limit(pr.PageSize)
}

// CountTotal counts total records
func CountTotal(db *gorm.DB) (int64, error) {
	var count int64
	err := db.Count(&count).Error
	return count, err
}

// CreatePaginationResponse creates a pagination response
func CreatePaginationResponse(data interface{}, total int64, page, pageSize int) *PaginationResponse {
	totalPages := int(total) / pageSize
	if int(total)%pageSize != 0 {
		totalPages++
	}

	return &PaginationResponse{
		Data:       data,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}
}

// ApplyFilter applies a filter condition to the query
func ApplyFilter(db *gorm.DB, field string, value interface{}) *gorm.DB {
	if value == nil || value == "" {
		return db
	}

	// Handle string filtering (case-insensitive LIKE)
	if str, ok := value.(string); ok {
		return db.Where(fmt.Sprintf("%s ILIKE ?", field), "%"+str+"%")
	}

	return db.Where(fmt.Sprintf("%s = ?", field), value)
}

// ApplyEqualFilter applies an exact match filter condition to the query
func ApplyEqualFilter(db *gorm.DB, field string, value interface{}) *gorm.DB {
	if value == nil || value == "" {
		return db
	}

	return db.Where(fmt.Sprintf("%s = ?", field), value)
}

// ApplyDateRangeFilter applies a date range filter
func ApplyDateRangeFilter(db *gorm.DB, field string, startDate, endDate interface{}) *gorm.DB {
	if startDate != nil && startDate != "" {
		db = db.Where(fmt.Sprintf("%s >= ?", field), startDate)
	}
	if endDate != nil && endDate != "" {
		db = db.Where(fmt.Sprintf("%s <= ?", field), endDate)
	}
	return db
}

// ApplyInFilter applies an IN clause filter
func ApplyInFilter(db *gorm.DB, field string, values interface{}) *gorm.DB {
	rv := reflect.ValueOf(values)
	if rv.Kind() != reflect.Slice || rv.Len() == 0 {
		return db
	}

	var valuesSlice []interface{}
	for i := 0; i < rv.Len(); i++ {
		valuesSlice = append(valuesSlice, rv.Index(i).Interface())
	}

	return db.Where(fmt.Sprintf("%s IN ?", field), valuesSlice)
}

// Paginate is a helper function that applies pagination and returns the result
func Paginate(db *gorm.DB, pr *PaginationRequest, dest interface{}, model interface{}) (*PaginationResponse, error) {
	// Count total records before pagination
	total, err := CountTotal(db.Model(model))
	if err != nil {
		return nil, fmt.Errorf("failed to count total records: %v", err)
	}

	// Apply pagination and fetch data
	if err := ApplyPagination(db, pr).Find(dest).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch paginated data: %v", err)
	}

	// Create response
	return CreatePaginationResponse(dest, total, pr.Page, pr.PageSize), nil
}
