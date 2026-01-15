package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	// JWTSecret is the secret key for signing JWT tokens
	JWTSecret = []byte("your-secret-key-change-this-in-production")

	// TokenExpiration is the default token expiration time
	TokenExpiration = 24 * time.Hour

	// ErrInvalidToken is returned when token is invalid
	ErrInvalidToken = errors.New("invalid token")

	// ErrExpiredToken is returned when token is expired
	ErrExpiredToken = errors.New("token has expired")
)

// Claims represents the JWT claims
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateToken generates a new JWT token for a user
func GenerateToken(userID uint, username, role string) (string, error) {
	// Create claims with expiration time
	claims := Claims{
		UserID:   userID,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(TokenExpiration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "tourism-recommender",
		},
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token
	tokenString, err := token.SignedString(JWTSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateToken validates a JWT token and returns the claims
func ValidateToken(tokenString string) (*Claims, error) {
	// Parse token
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		// Return secret key
		return JWTSecret, nil
	})

	if err != nil {
		return nil, err
	}

	// Extract claims
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, ErrInvalidToken
}

// RefreshToken generates a new token from an existing valid token
func RefreshToken(tokenString string) (string, error) {
	// Validate existing token
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return "", err
	}

	// Generate new token with same claims but new expiration
	return GenerateToken(claims.UserID, claims.Username, claims.Role)
}

// GetUserIDFromToken extracts user ID from token
func GetUserIDFromToken(tokenString string) (uint, error) {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return 0, err
	}

	return claims.UserID, nil
}

// GetUsernameFromToken extracts username from token
func GetUsernameFromToken(tokenString string) (string, error) {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return "", err
	}

	return claims.Username, nil
}

// GetRoleFromToken extracts role from token
func GetRoleFromToken(tokenString string) (string, error) {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return "", err
	}

	return claims.Role, nil
}

// IsTokenExpired checks if a token is expired without validating it
func IsTokenExpired(tokenString string) bool {
	// Parse without signature verification for expiration check only
	parser := jwt.NewParser(jwt.WithoutClaimsValidation())

	token, _, err := parser.ParseUnverified(tokenString, &Claims{})
	if err != nil {
		return true
	}

	if claims, ok := token.Claims.(*Claims); ok {
		return time.Now().Unix() > claims.ExpiresAt.Unix()
	}

	return true
}

// SetJWTSecret sets the JWT secret key (should be called at startup from environment)
func SetJWTSecret(secret string) {
	if secret != "" {
		JWTSecret = []byte(secret)
	}
}

// SetTokenExpiration sets the token expiration time (can be configured from environment)
func SetTokenExpiration(expiration time.Duration) {
	if expiration > 0 {
		TokenExpiration = expiration
	}
}
