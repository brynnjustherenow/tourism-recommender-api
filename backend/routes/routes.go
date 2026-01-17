package routes

import (
	"os"

	"tourism_recommendor/controllers"
	"tourism_recommendor/middleware"
	"tourism_recommendor/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SetupRoutes initializes all the routes for the application
func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	// Initialize controllers
	authController := controllers.NewAuthController(db)
	uploadController := &controllers.UploadController{}
	regionController := &controllers.RegionController{}
	recommendorController := &controllers.RecommendorController{}
	destinationController := &controllers.DestinationController{}

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Health check endpoint
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status":  "ok",
				"message": "Tourism Recommender API is running",
			})
		})

		// Public auth routes (no authentication required)
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authController.Login)
			auth.POST("/refresh-token", authController.RefreshToken)
		}

		// Upload routes (no authentication required for now, can add auth if needed)
		upload := v1.Group("/upload")
		{
			upload.POST("/avatar", uploadController.UploadAvatar)
			upload.POST("/image", uploadController.UploadImage)
			upload.POST("/document", uploadController.UploadDocument)
		}

		// Protected auth routes (authentication required)
		protectedAuth := v1.Group("/auth")
		protectedAuth.Use(middleware.AuthRequired())
		{
			protectedAuth.POST("/logout", authController.Logout)
			protectedAuth.GET("/me", authController.GetCurrentUser)
			protectedAuth.PUT("/change-password", authController.ChangePassword)
		}

		// Admin routes (require admin role)
		admin := v1.Group("/admin")
		admin.Use(middleware.AuthRequired(), middleware.AdminRequired())
		{
			// Region management
			regions := admin.Group("/regions")
			{
				regions.POST("", regionController.CreateRegion)
				regions.GET("", regionController.GetRegions)
				regions.GET("/:id", regionController.GetRegionByID)
				regions.PUT("/:id", regionController.UpdateRegion)
				regions.DELETE("/:id", regionController.DeleteRegion)
			}

			// Recommendor management
			recommendors := admin.Group("/recommendors")
			{
				recommendors.POST("", recommendorController.CreateRecommendor)
				recommendors.GET("", recommendorController.GetAdminRecommendors)
				recommendors.GET("/:id", recommendorController.GetRecommendorByID)
				recommendors.PUT("/:id", recommendorController.UpdateRecommendor)
				recommendors.DELETE("/:id", recommendorController.DeleteRecommendor)
				recommendors.POST("/:id/qrcodes", recommendorController.RegenerateQRCodes)
			}

			// Destination management
			destinations := admin.Group("/destinations")
			{
				destinations.POST("", destinationController.CreateDestination)
				destinations.GET("", destinationController.GetAdminDestinations)
				destinations.GET("/:id", destinationController.GetDestinationByID)
				destinations.PUT("/:id", destinationController.UpdateDestination)
				destinations.DELETE("/:id", destinationController.DeleteDestination)
			}
		}

		// Public routes
		public := v1.Group("")
		{
			// Public recommendor endpoints
			recommendors := public.Group("/recommendors")
			{
				recommendors.GET("", recommendorController.GetRecommendors)
				recommendors.GET("/:id", recommendorController.GetRecommendorByID)
				recommendors.GET("/:id/destinations", destinationController.GetDestinationsByRecommendor)
			}

			// Public destination endpoints
			destinations := public.Group("/destinations")
			{
				destinations.GET("", destinationController.GetDestinations)
				destinations.GET("/:id", destinationController.GetDestinationByID)
			}
		}
	}

	// Legacy API routes (without /v1 prefix) for backward compatibility
	// Public auth routes
	auth := r.Group("/api/auth")
	{
		auth.POST("/login", authController.Login)
		auth.POST("/refresh-token", authController.RefreshToken)
	}

	// Protected auth routes
	protectedAuth := r.Group("/api/auth")
	protectedAuth.Use(middleware.AuthRequired())
	{
		protectedAuth.POST("/logout", authController.Logout)
		protectedAuth.GET("/me", authController.GetCurrentUser)
		protectedAuth.PUT("/change-password", authController.ChangePassword)
	}

	// Admin routes (require admin role)
	admin := r.Group("/api/admin")
	admin.Use(middleware.AuthRequired(), middleware.AdminRequired())
	{
		// Region management
		regions := admin.Group("/regions")
		{
			regions.POST("", regionController.CreateRegion)
			regions.GET("", regionController.GetRegions)
			regions.GET("/:id", regionController.GetRegionByID)
			regions.PUT("/:id", regionController.UpdateRegion)
			regions.DELETE("/:id", regionController.DeleteRegion)
		}

		// Recommendor management
		recommendors := admin.Group("/recommendors")
		{
			recommendors.GET("/:id/destinations", destinationController.GetDestinationsByRecommendor)

			recommendors.POST("", recommendorController.CreateRecommendor)
			recommendors.GET("", recommendorController.GetAdminRecommendors)
			recommendors.GET("/:id", recommendorController.GetRecommendorByID)
			recommendors.PUT("/:id", recommendorController.UpdateRecommendor)
			recommendors.DELETE("/:id", recommendorController.DeleteRecommendor)
			recommendors.POST("/:id/qrcodes", recommendorController.RegenerateQRCodes)
		}

		// Destination management
		destinations := admin.Group("/destinations")
		{
			destinations.POST("", destinationController.CreateDestination)
			destinations.GET("", destinationController.GetAdminDestinations)
			destinations.GET("/:id", destinationController.GetDestinationByID)
			destinations.PUT("/:id", destinationController.UpdateDestination)
			destinations.DELETE("/:id", destinationController.DeleteDestination)
		}
	}

	// Legacy public routes
	public := r.Group("/api")
	{
		// Public recommendor endpoints
		recommendors := public.Group("/recommendors")
		{
			recommendors.GET("", recommendorController.GetRecommendors)
			recommendors.GET("/:id", recommendorController.GetRecommendorByID)
			recommendors.GET("/:id/destinations", destinationController.GetDestinationsByRecommendor)
		}

		// Public destination endpoints
		destinations := public.Group("/destinations")
		{
			destinations.GET("", destinationController.GetDestinations)
			destinations.GET("/:id", destinationController.GetDestinationByID)
		}
	}

	// Serve static files for embedded frontend (if any)
	// Serve the static directory at /static
	r.Static("/static", "./static")

	// Serve individual CSS and JS directories at root level for easier access
	r.Static("/css", "./static/css")
	r.Static("/js", "./static/js")
	r.Static("/images", "./static/images")

	// Serve uploads directory
	r.Static("/uploads", "./uploads")

	// Catch-all route: serve index.html for all unmatched routes
	// This is essential for SPA (Single Page Application) routing to work on page refresh
	// When user refreshes /recommendors/123, this route returns index.html,
	// and React Router takes over to handle the route
	r.NoRoute(func(c *gin.Context) {
		c.File("./static/index.html")
	})
}

// SetupMiddleware configures middleware for the router
func SetupMiddleware(r *gin.Engine) {
	// Recovery middleware recovers from any panics and writes a 500 if there was one
	r.Use(gin.Recovery())

	// Logger middleware writes the logs to gin.DefaultWriter
	r.Use(gin.Logger())

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})
}

// AutoMigrate runs database migrations
func AutoMigrate(db *gorm.DB) error {
	// Auto migrate all models
	err := db.AutoMigrate(
		&models.Admin{},
		&models.Region{},
		&models.Recommendor{},
		&models.Destination{},
	)
	return err
}

// SeedDatabase creates default data (admin user) if they don't exist
func SeedDatabase(db *gorm.DB) error {
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
	result := db.Where("username = ?", defaultUsername).First(&existingAdmin)

	if result.Error == nil {
		// Admin already exists, update email if needed
		if existingAdmin.Email != defaultEmail {
			existingAdmin.Email = defaultEmail
			db.Save(&existingAdmin)
		}
		return nil
	}

	if result.Error != nil && result.Error.Error() != "record not found" {
		return result.Error
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
		return err
	}

	// Save to database
	if err := db.Create(admin).Error; err != nil {
		return err
	}

	return nil
}
