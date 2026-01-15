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

	// Get admin username from command line arguments or use default
	username := "admin"
	if len(os.Args) > 1 {
		username = os.Args[1]
	}

	// Get password from command line arguments or use default
	password := "admin123456"
	if len(os.Args) > 2 {
		password = os.Args[2]
	}

	log.Printf("Looking for admin user: %s", username)

	// Find admin by username
	var admin models.Admin
	result := config.DB.Where("username = ?", username).First(&admin)

	if result.Error != nil {
		if result.Error.Error() == "record not found" {
			// Admin doesn't exist, create a new one
			log.Printf("Admin user '%s' not found, creating new admin...", username)

			newAdmin := &models.Admin{
				Username: username,
				Email:    fmt.Sprintf("%s@tourism.com", username),
				Name:     "超级管理员",
				Role:     models.AdminRoleSuperAdmin,
				Status:   "active",
				Phone:    "13800138000",
			}

			if err := newAdmin.SetPassword(password); err != nil {
				log.Fatalf("Failed to set password: %v", err)
			}

			if err := config.DB.Create(newAdmin).Error; err != nil {
				log.Fatalf("Failed to create admin: %v", err)
			}

			log.Printf("✓ Admin user created successfully!")
			log.Printf("  Username: %s", newAdmin.Username)
			log.Printf("  Password: %s", password)
			log.Printf("  Email: %s", newAdmin.Email)
			log.Printf("  Role: %s", newAdmin.Role)
			log.Println("\n⚠️  IMPORTANT: Please change the default password after first login!")
			return
		}

		log.Fatalf("Failed to find admin: %v", result.Error)
	}

	// Admin exists, update password
	log.Printf("Admin user '%s' found, updating password...", username)

	if err := admin.SetPassword(password); err != nil {
		log.Fatalf("Failed to set password: %v", err)
	}

	if err := config.DB.Save(&admin).Error; err != nil {
		log.Fatalf("Failed to update password: %v", err)
	}

	log.Printf("✓ Password updated successfully!")
	log.Printf("  Username: %s", admin.Username)
	log.Printf("  New Password: %s", password)
	log.Printf("  Email: %s", admin.Email)
	log.Printf("  Role: %s", admin.Role)
	log.Println("\n⚠️  IMPORTANT: Please change the default password after first login!")
}
