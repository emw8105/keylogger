package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

const LOGS_DIR = "./logs"
const SERVER_PORT = ":8080"

// const TEMPLATE_DIR = "templates/*"

type SystemInfo struct {
	SystemID  string `json:"system_id"`
	Hostname  string `json:"hostname"`
	OS        string `json:"os"`
	OSRelease string `json:"os_release"`
	Username  string `json:"username"`
}

type LogPayload struct {
	SystemInfo         SystemInfo `json:"system_info"`
	LogStartTimeUTC    string     `json:"log_start_time_utc"`
	LogDurationSeconds float64    `json:"log_duration_seconds"`
	LogContent         string     `json:"log_content"`
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

func logHandler(c *gin.Context) {
	var payload LogPayload

	// bind the JSON payload to the LogPayload struct to handle json parsing and validation
	if err := c.ShouldBindJSON(&payload); err != nil {
		log.Printf("Failed to bind JSON: %v", err)
		c.JSON(400, gin.H{"error": "Invalid JSON payload", "details": err.Error()})
		return
	}

	// use systemid to create a unique directory for each logger
	logDir := fmt.Sprintf("%s/%s", LOGS_DIR, payload.SystemInfo.SystemID)
	if err := os.MkdirAll(logDir, 0755); err != nil {
		log.Printf("Failed to create log directory: %v", err)
		c.JSON(500, gin.H{"error": "Failed to create log directory", "details": err.Error()})
		return
	}

	logFileName := fmt.Sprintf("%s_%s_%s.log", payload.SystemInfo.Hostname, time.Now().Format("20060102_150405"), payload.SystemInfo.SystemID[:8])

	logFilePath := fmt.Sprintf("%s/%s", logDir, logFileName)
	logEntry := fmt.Sprintf(
		"----- Log Batch Start (UTC: %s, Duration: %.2fs) -----\n"+
			"System ID: %s\nHostname: %s\nOS: %s (%s)\nUsername: %s\n"+
			"Logged Content:\n%s\n"+
			"----- Log Batch End (Server UTC: %s) -----\n\n",
		payload.LogStartTimeUTC,
		payload.LogDurationSeconds,
		payload.SystemInfo.SystemID,
		payload.SystemInfo.Hostname,
		payload.SystemInfo.OS,
		payload.SystemInfo.OSRelease,
		payload.SystemInfo.Username,
		payload.LogContent,
		time.Now().Format("2006-01-02 15:04:05"),
	)

}

func main() {
	// initialize the server and logs directory stuff

	if err := os.MkdirAll(LOGS_DIR, 0755); err != nil {
		log.Fatalf("Failed to create logs directory: %v", err)
	}

	router := gin.Default() // oh yea we rockin gin

	// router.POST("/temp", temp)

	// router.LoadHTMLGlob(TEMPLATE_DIR)

	router.POST("/log", logHandler)

	// router.GET("/logs", viewLogsHandler) // might modify this for auth

	fmt.Printf("Go server is running on http://localhost%s\n", SERVER_PORT)

	if err := router.Run(SERVER_PORT); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}

}
