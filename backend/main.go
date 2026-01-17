package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"tourism_recommendor/config"
	"tourism_recommendor/routes"
	"tourism_recommendor/utils"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Set Gin mode based on environment
	mode := os.Getenv("GIN_MODE")
	if mode == "" {
		mode = gin.DebugMode
	}
	gin.SetMode(mode)

	// Initialize database
	log.Println("Initializing database connection...")
	if err := config.InitDatabaseFromEnv(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer config.CloseDatabase()

	// Auto-migrate database tables
	log.Println("Running database migrations...")
	if err := routes.AutoMigrate(config.DB); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	log.Println("Database migrations completed successfully")

	// Seed initial data
	log.Println("Seeding initial data...")
	if err := routes.SeedDatabase(config.DB); err != nil {
		log.Fatalf("Failed to seed initial data: %v", err)
	}
	log.Println("Initial data seeding completed successfully")

	// Initialize upload directories
	log.Println("Initializing upload directories...")
	if err := utils.InitUploadDirectories(); err != nil {
		log.Fatalf("Failed to initialize upload directories: %v", err)
	}
	log.Println("Upload directories initialized successfully")

	// Create Gin router
	router := gin.Default()

	// Setup middleware
	routes.SetupMiddleware(router)

	// Setup routes
	routes.SetupRoutes(router, config.DB)

	// Get server port from environment
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	// Create HTTP server
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting server on port %s...", port)
		log.Printf("Server URL: http://localhost:%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal for graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited successfully")
}
