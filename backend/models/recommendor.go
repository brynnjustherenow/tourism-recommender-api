package models

import (
	"time"

	"gorm.io/gorm"
)

// Gender represents the gender of a recommender
type Gender string

const (
	GenderMale   Gender = "male"
	GenderFemale Gender = "female"
	GenderOther  Gender = "other"
)

// Recommendor represents a tourism recommender in the system
type Recommendor struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Name     string `gorm:"type:varchar(100);not null" json:"name"`
	Gender   Gender `gorm:"type:varchar(20);not null" json:"gender"`
	Age      int    `gorm:"not null" json:"age"`
	IDNumber string `gorm:"type:varchar(50);not null;uniqueIndex" json:"id_number"`

	// Avatar stores the file path of the uploaded avatar image
	Avatar string `gorm:"type:varchar(500)" json:"avatar"`

	Bio        string    `gorm:"type:text" json:"bio"`
	ValidFrom  time.Time `gorm:"not null" json:"valid_from"`
	ValidUntil time.Time `gorm:"not null" json:"valid_until"`
	Phone      string    `gorm:"type:varchar(20)" json:"phone"`
	Email      string    `gorm:"type:varchar(100)" json:"email"`

	// Province/City/District codes (replaces Region table)
	ProvinceCode string `gorm:"type:varchar(20);not null;index" json:"province_code"`
	CityCode     string `gorm:"type:varchar(20);not null;index" json:"city_code"`
	DistrictCode string `gorm:"type:varchar(20);not null;index" json:"district_code"`

	// RegionAddress stores the full formatted address (e.g., "北京市/东城区")
	RegionAddress string `gorm:"type:varchar(500);not null" json:"region_address"`

	// Relationships
	Destinations []Destination `gorm:"foreignKey:RecommendorID" json:"destinations,omitempty"`

	Status      string         `gorm:"type:varchar(20);default:'active'" json:"status"`
	Rating      float64        `gorm:"default:0" json:"rating"`
	QRCodeWeb   string         `gorm:"type:text" json:"qr_code_web,omitempty"`
	QRCodeWxapp string         `gorm:"type:text" json:"qr_code_wxapp,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for Recommendor model
func (Recommendor) TableName() string {
	return "recommendors"
}

// IsActive checks if the recommender's credentials are valid
func (r *Recommendor) IsActive() bool {
	now := time.Now()
	return r.Status == "active" && r.ValidFrom.Before(now) && r.ValidUntil.After(now)
}

// GetAvatarURL returns the full URL for the avatar image
func (r *Recommendor) GetAvatarURL(baseURL string) string {
	if r.Avatar == "" {
		// Return default avatar URL if no avatar is set
		return baseURL + "/images/default-avatar.png"
	}
	// Return the uploaded avatar file path
	return baseURL + "/uploads/avatars/" + r.Avatar
}

// GetRegionInfo returns region information as a map
func (r *Recommendor) GetRegionInfo() map[string]interface{} {
	return map[string]interface{}{
		"province_code": r.ProvinceCode,
		"city_code":     r.CityCode,
		"district_code": r.DistrictCode,
		"full_address":  r.RegionAddress,
	}
}

// GetFullAddress returns the formatted full address
func (r *Recommendor) GetFullAddress() string {
	return r.RegionAddress
}
