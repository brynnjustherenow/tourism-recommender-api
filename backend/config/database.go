package config

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// DatabaseConfig holds database connection parameters
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// InitDatabase initializes database connection
func InitDatabase(config DatabaseConfig) error {
	log.Printf("Connecting to database...")
	log.Printf("  Host: %s", config.Host)
	log.Printf("  Port: %s", config.Port)
	log.Printf("  User: %s", config.User)
	log.Printf("  Database: %s", config.DBName)
	log.Printf("  SSL Mode: %s", config.SSLMode)

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		config.Host,
		config.Port,
		config.User,
		config.Password,
		config.DBName,
		config.SSLMode,
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}

	log.Println("Database connection established successfully")
	return nil
}

// InitDatabaseFromEnv initializes database connection from environment variables
func InitDatabaseFromEnv() error {
	// First, try to use DATABASE_URL (provided by Render and other platforms)
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL != "" {
		log.Println("Connecting to database using DATABASE_URL...")
		log.Println("  URL: *** (hidden)")

		var err error
		DB, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})

		if err != nil {
			return fmt.Errorf("failed to connect to database using DATABASE_URL: %v", err)
		}

		log.Println("Database connection established successfully")
		return nil
	}

	// Fallback: load database configuration from individual environment variables
	log.Println("DATABASE_URL not found, loading database configuration from individual environment variables...")

	// Get environment variables with defaults for non-critical fields
	host := getEnvWithDefault("DB_HOST", "localhost", true)
	port := getEnvWithDefault("DB_PORT", "5432", true)
	user := getEnvWithDefault("DB_USER", "postgres", true)
	password := getEnvWithDefault("DB_PASSWORD", "", false)
	dbName := getEnvWithDefault("DB_NAME", "tourism_recommender", true)
	sslMode := getEnvWithDefault("DB_SSLMODE", "disable", true)

	// Validate required fields
	if password == "" {
		return fmt.Errorf("DB_PASSWORD environment variable is required but not set")
	}

	config := DatabaseConfig{
		Host:     host,
		Port:     port,
		User:     user,
		Password: password,
		DBName:   dbName,
		SSLMode:  sslMode,
	}

	return InitDatabase(config)
}

// getEnvWithDefault retrieves environment variable or returns default value
// If logDefault is true, it logs when using the default value
func getEnvWithDefault(key, defaultValue string, logDefault bool) string {
	value := os.Getenv(key)

	if value == "" {
		if logDefault {
			log.Printf("  %s not set, using default: %s", key, defaultValue)
		} else {
			log.Printf("  %s not set", key)
		}
		return defaultValue
	}

	if key == "DB_PASSWORD" {
		log.Printf("  %s: *** (hidden)", key)
	} else {
		log.Printf("  %s: %s", key, value)
	}

	return value
}

// CloseDatabase closes the database connection
func CloseDatabase() error {
	if DB == nil {
		return nil
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %v", err)
	}

	if err := sqlDB.Close(); err != nil {
		return fmt.Errorf("failed to close database connection: %v", err)
	}

	log.Println("Database connection closed successfully")
	return nil
}
