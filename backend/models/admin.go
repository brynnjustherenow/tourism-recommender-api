package models

import (
	"log"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AdminRole represents the role of an admin user
type AdminRole string

const (
	AdminRoleSuperAdmin AdminRole = "super_admin" // 超级管理员
	AdminRoleAdmin      AdminRole = "admin"       // 普通管理员
)

// Admin represents an admin user in the system
type Admin struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Username  string         `gorm:"type:varchar(50);not null;uniqueIndex" json:"username"`
	Password  string         `gorm:"type:varchar(255);not null" json:"-"` // Password is never sent in JSON responses
	Role      AdminRole      `gorm:"type:varchar(20);not null;default:'admin'" json:"role"`
	Name      string         `gorm:"type:varchar(100)" json:"name"` // 管理员的真实姓名
	Email     string         `gorm:"type:varchar(100);uniqueIndex" json:"email"`
	Phone     string         `gorm:"type:varchar(20)" json:"phone"`
	Avatar    string         `gorm:"type:varchar(500)" json:"avatar"`
	Status    string         `gorm:"type:varchar(20);not null;default:'active'" json:"status"` // active, inactive, locked
	LastLogin *int64         `json:"last_login,omitempty"`                                     // Last login timestamp
	CreatedAt int64          `json:"created_at"`
	UpdatedAt int64          `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for Admin model
func (Admin) TableName() string {
	return "admins"
}

// IsActive checks if the admin account is active
func (a *Admin) IsActive() bool {
	return a.Status == "active"
}

// IsSuperAdmin checks if the admin is a super admin
func (a *Admin) IsSuperAdmin() bool {
	return a.Role == AdminRoleSuperAdmin
}

// SetPassword hashes the password using bcrypt
func (a *Admin) SetPassword(password string) error {
	log.Printf("🔒 Hashing password for user '%s' (password length: %d)", a.Username, len(password))
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("❌ Failed to hash password for user '%s': %v", a.Username, err)
		return err
	}
	a.Password = string(hashedPassword)
	log.Printf("✅ Password hashed successfully for user '%s' (hash length: %d)", a.Username, len(a.Password))
	return nil
}

// CheckPassword checks if the provided password matches the stored hash
func (a *Admin) CheckPassword(password string) error {
	log.Printf("🔑 Checking password for user '%s' (input length: %d, stored hash length: %d)", a.Username, len(password), len(a.Password))
	err := bcrypt.CompareHashAndPassword([]byte(a.Password), []byte(password))
	if err != nil {
		log.Printf("❌ Password check failed for user '%s': %v", a.Username, err)
	} else {
		log.Printf("✅ Password check successful for user '%s'", a.Username)
	}
	return err
}

// BeforeCreate hook to hash password before creating admin
func (a *Admin) BeforeCreate(tx *gorm.DB) error {
	// Password hashing should be done explicitly, but this hook ensures it's always hashed
	if a.Password != "" {
		return a.SetPassword(a.Password)
	}
	return nil
}
