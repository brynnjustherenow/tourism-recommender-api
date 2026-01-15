package main

import (
	"fmt"
	"log"
	"os"

	"tourism_recommendor/config"
	"tourism_recommendor/models"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Initialize database
	log.Println("Initializing database connection...")
	if err := config.InitDatabaseFromEnv(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer config.CloseDatabase()

	// Auto-migrate database tables
	log.Println("Running database migrations...")
	if err := config.DB.AutoMigrate(
		&models.Admin{},
		&models.Region{},
		&models.Recommendor{},
		&models.Destination{},
	); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	log.Println("Database migrations completed successfully")

	// Create default admin user
	if err := createDefaultAdmin(); err != nil {
		log.Fatalf("Failed to create default admin: %v", err)
	}

	log.Println("Seed data completed successfully")
}

// createDefaultAdmin creates a default super admin user if it doesn't exist
func createDefaultAdmin() error {
	// Get default admin credentials from environment or use defaults
	defaultUsername := os.Getenv("DEFAULT_ADMIN_USERNAME")
	if defaultUsername == "" {
		defaultUsername = "admin"
	}

	defaultPassword := os.Getenv("DEFAULT_ADMIN_PASSWORD")
	if defaultPassword == "" {
		defaultPassword = "admin123456"
	}

	defaultEmail := os.Getenv("DEFAULT_ADMIN_EMAIL")
	if defaultEmail == "" {
		defaultEmail = "admin@tourism.com"
	}

	// Check if admin already exists
	var existingAdmin models.Admin
	result := config.DB.Where("username = ?", defaultUsername).First(&existingAdmin)

	if result.Error == nil {
		log.Printf("Admin user '%s' already exists, skipping creation", defaultUsername)
		return nil
	}

	if result.Error != nil && result.Error.Error() != "record not found" {
		return fmt.Errorf("failed to check for existing admin: %w", result.Error)
	}

	// Create new admin
	admin := &models.Admin{
		Username: defaultUsername,
		Email:    defaultEmail,
		Name:     "超级管理员",
		Role:     models.AdminRoleSuperAdmin,
		Status:   "active",
		Phone:    "13800138000",
	}

	// Set password (this will hash it automatically)
	if err := admin.SetPassword(defaultPassword); err != nil {
		return fmt.Errorf("failed to set password: %w", err)
	}

	// Save to database
	if err := config.DB.Create(admin).Error; err != nil {
		return fmt.Errorf("failed to create admin: %w", err)
	}

	log.Printf("✓ Default admin user created successfully")
	log.Printf("  Username: %s", defaultUsername)
	log.Printf("  Password: %s", defaultPassword)
	log.Printf("  Email: %s", defaultEmail)
	log.Printf("  Role: %s", admin.Role)
	log.Println("\n⚠️  IMPORTANT: Please change the default password after first login!")

	return nil
}
