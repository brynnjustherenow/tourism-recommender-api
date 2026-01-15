package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"tourism_recommendor/models"
	"tourism_recommendor/utils"

	"github.com/gin-gonic/gin"
)

const (
	// AuthorizationHeader is the HTTP header name for authorization
	AuthorizationHeader = "Authorization"

	// BearerScheme is the authorization scheme
	BearerScheme = "Bearer"
)

// AuthRequired is a middleware that requires authentication
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get Authorization header
		authHeader := c.GetHeader(AuthorizationHeader)

		// Check if header exists
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header is required",
			})
			c.Abort()
			return
		}

		// Extract token from header
		// Expected format: "Bearer <token>"
		tokenString := strings.TrimPrefix(authHeader, BearerScheme+" ")
		if tokenString == authHeader {
			// Token doesn't start with "Bearer "
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		// Validate token
		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Store user information in context
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)

		// Continue to next handler
		c.Next()
	}
}

// AdminRequired is a middleware that requires admin role
func AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user role from context (should be set by AuthRequired)
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
			})
			c.Abort()
			return
		}

		roleStr, ok := role.(string)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Invalid role type",
			})
			c.Abort()
			return
		}

		// Check if user is admin
		if roleStr != string(models.AdminRoleAdmin) && roleStr != string(models.AdminRoleSuperAdmin) {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Admin role required",
			})
			c.Abort()
			return
		}

		// Continue to next handler
		c.Next()
	}
}

// SuperAdminRequired is a middleware that requires super admin role
func SuperAdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user role from context
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
			})
			c.Abort()
			return
		}

		roleStr, ok := role.(string)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Invalid role type",
			})
			c.Abort()
			return
		}

		// Check if user is super admin
		if roleStr != string(models.AdminRoleSuperAdmin) {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Super admin role required",
			})
			c.Abort()
			return
		}

		// Continue to next handler
		c.Next()
	}
}

// GetUserID retrieves user ID from context
func GetUserID(c *gin.Context) (uint, error) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, gin.Error{
			Err:  fmt.Errorf("user_id not found in context"),
			Type: gin.ErrorTypePublic,
		}
	}

	id, ok := userID.(uint)
	if !ok {
		return 0, gin.Error{
			Err:  fmt.Errorf("invalid user_id type in context"),
			Type: gin.ErrorTypePrivate,
		}
	}

	return id, nil
}

// GetUsername retrieves username from context
func GetUsername(c *gin.Context) (string, error) {
	username, exists := c.Get("username")
	if !exists {
		return "", gin.Error{
			Err:  fmt.Errorf("username not found in context"),
			Type: gin.ErrorTypePublic,
		}
	}

	usernameStr, ok := username.(string)
	if !ok {
		return "", gin.Error{
			Err:  fmt.Errorf("invalid username type in context"),
			Type: gin.ErrorTypePrivate,
		}
	}

	return usernameStr, nil
}

// GetRole retrieves user role from context
func GetRole(c *gin.Context) (string, error) {
	role, exists := c.Get("role")
	if !exists {
		return "", gin.Error{
			Err:  fmt.Errorf("role not found in context"),
			Type: gin.ErrorTypePublic,
		}
	}

	roleStr, ok := role.(string)
	if !ok {
		return "", gin.Error{
			Err:  fmt.Errorf("invalid role type in context"),
			Type: gin.ErrorTypePrivate,
		}
	}

	return roleStr, nil
}

// IsAuthenticated checks if user is authenticated
func IsAuthenticated(c *gin.Context) bool {
	_, exists := c.Get("user_id")
	return exists
}

// IsAdmin checks if user has admin role
func IsAdmin(c *gin.Context) bool {
	role, exists := c.Get("role")
	if !exists {
		return false
	}

	roleStr, ok := role.(string)
	if !ok {
		return false
	}

	return roleStr == string(models.AdminRoleAdmin) || roleStr == string(models.AdminRoleSuperAdmin)
}

// IsSuperAdmin checks if user has super admin role
func IsSuperAdmin(c *gin.Context) bool {
	role, exists := c.Get("role")
	if !exists {
		return false
	}

	roleStr, ok := role.(string)
	if !ok {
		return false
	}

	return roleStr == string(models.AdminRoleSuperAdmin)
}

// OptionalAuth is a middleware that authenticates if token is provided but doesn't require it
func OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get Authorization header
		authHeader := c.GetHeader(AuthorizationHeader)

		// If no header, continue without auth
		if authHeader == "" {
			c.Next()
			return
		}

		// Extract token from header
		tokenString := strings.TrimPrefix(authHeader, BearerScheme+" ")
		if tokenString == authHeader {
			// Invalid format, continue without auth
			c.Next()
			return
		}

		// Validate token
		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			// Invalid token, continue without auth
			c.Next()
			return
		}

		// Store user information in context
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)

		// Continue to next handler
		c.Next()
	}
}

// CORSMiddleware handles CORS
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get origin from request
		origin := c.Request.Header.Get("Origin")

		// Allow all origins in development, configure properly in production
		c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
		c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Content-Type")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		// Handle preflight requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// SecurityMiddleware adds security headers
func SecurityMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Security headers
		c.Writer.Header().Set("X-Content-Type-Options", "nosniff")
		c.Writer.Header().Set("X-Frame-Options", "DENY")
		c.Writer.Header().Set("X-XSS-Protection", "1; mode=block")
		c.Writer.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		c.Writer.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		c.Next()
	}
}

// RateLimitMiddleware is a simple rate limiter (in production, use Redis)
func RateLimitMiddleware() gin.HandlerFunc {
	// Simple in-memory rate limiter
	// In production, use Redis or similar
	return func(c *gin.Context) {
		// TODO: Implement rate limiting
		// This is a placeholder for now
		c.Next()
	}
}
