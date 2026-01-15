package controllers

import (
	"net/http"
	"time"

	"tourism_recommendor/middleware"
	"tourism_recommendor/models"
	"tourism_recommendor/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AuthController handles authentication operations
type AuthController struct {
	DB *gorm.DB
}

// NewAuthController creates a new AuthController instance
func NewAuthController(db *gorm.DB) *AuthController {
	return &AuthController{DB: db}
}

// LoginRequest represents the login request body
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	Token     string    `json:"token"`
	ExpiresAt int64     `json:"expires_at"`
	User      AdminInfo `json:"user"`
}

// AdminInfo represents the admin user information
type AdminInfo struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Avatar   string `json:"avatar"`
	Role     string `json:"role"`
	Status   string `json:"status"`
}

// ChangePasswordRequest represents the change password request body
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

// Login handles admin login
func (ac *AuthController) Login(c *gin.Context) {
	var req LoginRequest

	// Bind request body
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Find admin by username
	var admin models.Admin
	if err := ac.DB.Where("username = ?", req.Username).First(&admin).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid username or password",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database error",
			"details": err.Error(),
		})
		return
	}

	// Check if admin account is active
	if !admin.IsActive() {
		c.JSON(http.StatusForbidden, gin.H{
			"error":  "Account is not active",
			"status": admin.Status,
		})
		return
	}

	// Verify password
	if err := admin.CheckPassword(req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid username or password",
		})
		return
	}

	// Generate JWT token
	token, err := utils.GenerateToken(admin.ID, admin.Username, string(admin.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to generate token",
			"details": err.Error(),
		})
		return
	}

	// Update last login time
	now := time.Now().Unix()
	admin.LastLogin = &now
	if err := ac.DB.Save(&admin).Error; err != nil {
		// Log error but don't fail the login
		// In production, you might want to log this properly
	}

	// Prepare response
	response := LoginResponse{
		Token:     token,
		ExpiresAt: time.Now().Add(utils.TokenExpiration).Unix(),
		User: AdminInfo{
			ID:       admin.ID,
			Username: admin.Username,
			Name:     admin.Name,
			Email:    admin.Email,
			Phone:    admin.Phone,
			Avatar:   admin.Avatar,
			Role:     string(admin.Role),
			Status:   admin.Status,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"data":    response,
	})
}

// Logout handles admin logout (client-side token deletion recommended)
func (ac *AuthController) Logout(c *gin.Context) {
	// Since JWT tokens are stateless, we don't need to do anything server-side
	// The client should delete the token
	// In a more advanced implementation, you might:
	// 1. Add the token to a blacklist (using Redis)
	// 2. Implement token rotation with refresh tokens

	c.JSON(http.StatusOK, gin.H{
		"message": "Logout successful",
	})
}

// GetCurrentUser returns the current logged-in user information
func (ac *AuthController) GetCurrentUser(c *gin.Context) {
	// Get user ID from context
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized",
		})
		return
	}

	// Find admin by ID
	var admin models.Admin
	if err := ac.DB.First(&admin, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database error",
			"details": err.Error(),
		})
		return
	}

	// Prepare response
	response := AdminInfo{
		ID:       admin.ID,
		Username: admin.Username,
		Name:     admin.Name,
		Email:    admin.Email,
		Phone:    admin.Phone,
		Avatar:   admin.Avatar,
		Role:     string(admin.Role),
		Status:   admin.Status,
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Success",
		"data":    response,
	})
}

// ChangePassword handles password change for the current user
func (ac *AuthController) ChangePassword(c *gin.Context) {
	var req ChangePasswordRequest

	// Bind request body
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Get user ID from context
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized",
		})
		return
	}

	// Find admin by ID
	var admin models.Admin
	if err := ac.DB.First(&admin, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database error",
			"details": err.Error(),
		})
		return
	}

	// Verify old password
	if err := admin.CheckPassword(req.OldPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Old password is incorrect",
		})
		return
	}

	// Check if new password is same as old password
	if req.OldPassword == req.NewPassword {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "New password must be different from old password",
		})
		return
	}

	// Set new password
	if err := admin.SetPassword(req.NewPassword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update password",
			"details": err.Error(),
		})
		return
	}

	// Save to database
	if err := ac.DB.Save(&admin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update password",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password changed successfully",
	})
}

// RefreshToken generates a new token from an existing valid token
func (ac *AuthController) RefreshToken(c *gin.Context) {
	// Get token from Authorization header
	authHeader := c.GetHeader(middleware.AuthorizationHeader)
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authorization header is required",
		})
		return
	}

	// Extract token from header
	tokenString := authHeader[len(middleware.BearerScheme)+1:]
	if tokenString == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid authorization header format",
		})
		return
	}

	// Refresh token
	newToken, err := utils.RefreshToken(tokenString)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Invalid or expired token",
			"details": err.Error(),
		})
		return
	}

	// Get user info from new token for response
	claims, err := utils.ValidateToken(newToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to validate new token",
			"details": err.Error(),
		})
		return
	}

	// Find admin by ID
	var admin models.Admin
	if err := ac.DB.First(&admin, claims.UserID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Database error",
			"details": err.Error(),
		})
		return
	}

	// Check if admin account is still active
	if !admin.IsActive() {
		c.JSON(http.StatusForbidden, gin.H{
			"error":  "Account is not active",
			"status": admin.Status,
		})
		return
	}

	// Prepare response
	response := LoginResponse{
		Token:     newToken,
		ExpiresAt: time.Now().Add(utils.TokenExpiration).Unix(),
		User: AdminInfo{
			ID:       admin.ID,
			Username: admin.Username,
			Name:     admin.Name,
			Email:    admin.Email,
			Phone:    admin.Phone,
			Avatar:   admin.Avatar,
			Role:     string(admin.Role),
			Status:   admin.Status,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Token refreshed successfully",
		"data":    response,
	})
}
