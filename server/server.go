package main

import (
	"fmt"
	"log"
	"os"

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

type LogData struct {
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

func temp(c *gin.Context) {
	fmt.Println("temp handler called")
}

func main() {
	// initialize the server and logs directory stuff

	if err := os.MkdirAll(LOGS_DIR, 0755); err != nil {
		log.Fatalf("Failed to create logs directory: %v", err)
	}

	router := gin.Default() // oh yea we rockin gin

	// router.LoadHTMLGlob(TEMPLATE_DIR)

	router.POST("/log", temp)

	// router.POST("/log", logHandler)

	// router.GET("/logs", viewLogsHandler) // might modify this for auth

	fmt.Printf("Go server is running on http://localhost%s\n", SERVER_PORT)

	if err := router.Run(SERVER_PORT); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}

}
