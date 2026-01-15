package models

import (
	"gorm.io/gorm"
)

// Destination represents a tourism destination recommended by a recommendor
type Destination struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	RecommendorID uint           `gorm:"not null;index" json:"recommendor_id"`
	Recommendor   Recommendor    `gorm:"foreignKey:RecommendorID" json:"recommendor,omitempty"`
	Name          string         `gorm:"type:varchar(200);not null" json:"name"`
	Description   string         `gorm:"type:text" json:"description"`
	Image         string         `gorm:"type:text" json:"image"` // JSON array of image URLs
	Address       string         `gorm:"type:varchar(500)" json:"address"`
	Category      string         `gorm:"type:varchar(50)" json:"category"` // e.g., scenic_spot, food, accommodation
	Rating        float64        `gorm:"default:0" json:"rating"`
	Status        string         `gorm:"type:varchar(20);default:'active'" json:"status"`
	CreatedAt     int64          `json:"created_at"`
	UpdatedAt     int64          `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for Destination model
func (Destination) TableName() string {
	return "destinations"
}
