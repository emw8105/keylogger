package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

const LOGS_DIR = "./logs"
const SERVER_PORT = ":8080"
const KEYS_DIR = "./keys"
const PRIVATE_KEY_FILE = "server_private.pem"
const PUBLIC_KEY_FILE = "server_public.pem"

// const TEMPLATE_DIR = "templates/*"

type SystemInfo struct {
	SystemID  string `json:"system_id"`
	Hostname  string `json:"hostname"`
	OS        string `json:"os"`
	OSRelease string `json:"os_release"`
	Username  string `json:"username"`
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

// func temp(c *gin.Context) {
// 	fmt.Println("temp handler called")
// }

func main() {
	if err := os.MkdirAll(LOGS_DIR, 0755); err != nil {
		log.Fatalf("ERROR: Failed to create base logs directory '%s': %v", LOGS_DIR, err)
	}

	// set up RSA keys
	if err := ensureKeys(); err != nil {
		log.Fatalf("ERROR: Failed to ensure RSA keys: %v", err)
	}

	router := gin.Default()

	router.GET("/handshake", handshakeHandler)
	router.POST("/log", logHandler)

	fmt.Printf("Go server listening on http://localhost%s\n", SERVER_PORT)
	log.Printf("Keys will be stored in: %s", KEYS_DIR)
	log.Printf("Logs will be stored in: %s", LOGS_DIR)

	if err := router.Run(SERVER_PORT); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
