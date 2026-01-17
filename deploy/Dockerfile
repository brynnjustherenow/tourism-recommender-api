# Multi-stage build for Go application
# This Dockerfile is optimized for cloud deployment (Render.com, Railway.app, etc.)

# Stage 1: Build
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates

# Set working directory
WORKDIR /app

# Copy go mod files first for better caching
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
# CGO_ENABLED=0: Disable CGO for a statically linked binary
# GOOS=linux: Target Linux (standard for containers)
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main main.go

# Stage 2: Run
FROM alpine:latest

# Install ca-certificates for HTTPS requests and tzdata for timezone support
RUN apk --no-cache add ca-certificates tzdata

# Create a non-root user for security
RUN addgroup -g 1000 -S appuser && \
    adduser -u 1000 -S appuser -G appuser

# Set working directory
WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/main .

# Copy static files if they exist
COPY --from=builder /app/static ./static

# Create necessary directories with proper permissions
RUN mkdir -p uploads static/uploads && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port (will be overridden by platform)
EXPOSE 8080

# Health check endpoint (adjust path if needed)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

# Labels for metadata
LABEL maintainer="your-email@example.com"
LABEL description="Tourism Recommender API Backend"
LABEL version="1.0.0"

# Run the application
# The application will read environment variables at runtime
CMD ["./main"]

# -------------------------------------------------------------------------
# REQUIRED ENVIRONMENT VARIABLES
# -------------------------------------------------------------------------
# DB_PASSWORD - Database password (REQUIRED, app will fail to start if empty)
#
# OPTIONAL ENVIRONMENT VARIABLES (with defaults)
# -------------------------------------------------------------------------
# Application Configuration:
#   GIN_MODE          - Application mode: debug or release (default: debug)
#   SERVER_PORT       - Server port (default: 8080)
#
# Database Configuration:
#   DB_HOST           - Database host (default: localhost)
#   DB_PORT           - Database port (default: 5432)
#   DB_USER           - Database user (default: postgres)
#   DB_NAME           - Database name (default: tourism_recommender)
#   DB_SSLMODE        - SSL mode: disable or require (default: disable)
#
# Admin Default Configuration:
#   DEFAULT_ADMIN_USERNAME - Default admin username (default: admin)
#   DEFAULT_ADMIN_PASSWORD - Default admin password (default: admin123456)
#   DEFAULT_ADMIN_EMAIL    - Default admin email (default: admin@tourism.com)
#
# QR Code Configuration:
#   BASE_URL          - Application base URL for QR codes (default: http://localhost:8082)
#   WX_APP_ID         - WeChat Mini Program App ID
#   WX_APP_PATH       - WeChat Mini Program path (default: pages/recommendor/detail)
# -------------------------------------------------------------------------
