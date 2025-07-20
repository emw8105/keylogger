package main

import (
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

// handshakeHandler provides the server's public key to the client.
func handshakeHandler(c *gin.Context) {
	if publicKey == nil {
		log.Println("ERROR: Server public key not available for handshake.")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server public key not available"})
		return
	}

	publicKeyBytes, err := x509.MarshalPKIXPublicKey(publicKey)
	if err != nil {
		log.Printf("ERROR: Failed to marshal public key: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal public key"})
		return
	}
	publicKeyPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: publicKeyBytes,
	})

	c.JSON(http.StatusOK, gin.H{"public_key_pem": string(publicKeyPEM)})
	log.Println("Handshake successful: Public key sent to client.")
}

func logHandler(c *gin.Context) {
	var payload LogPayload

	log.Println("Received log batch from client...")

	if err := c.ShouldBindJSON(&payload); err != nil {
		log.Printf("ERROR: Failed to bind JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON payload", "details": err.Error()})
		return
	}

	log.Printf("Received log batch from system %s", payload.SystemInfo.SystemID)

	decryptedLogContent, err := decryptLogs(payload, c)
	if err != nil {
		log.Printf("ERROR: Failed to decrypt logs: %v", err)
		return
	}

	logDir := filepath.Join(LOGS_DIR, payload.SystemInfo.SystemID)
	if err := os.MkdirAll(logDir, 0755); err != nil {
		log.Printf("ERROR: Failed to create log directory '%s': %v", logDir, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create log directory", "details": err.Error()})
		return
	}

	logFileName := fmt.Sprintf("%s_%s_%s.log",
		payload.SystemInfo.Hostname,
		time.Now().Format("2006-01-02"),
		payload.SystemInfo.SystemID[:8])

	logFilePath := filepath.Join(logDir, logFileName)
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
		decryptedLogContent,
		time.Now().Format("2006-01-02 15:04:05"),
	)

	f, err := os.OpenFile(logFilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("ERROR: Failed to open log file '%s': %v", logFilePath, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open log file", "details": err.Error()})
		return
	}
	defer f.Close()

	if _, err := f.WriteString(logEntry); err != nil {
		log.Printf("ERROR: Failed to write to log file '%s': %v", logFilePath, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write to log file", "details": err.Error()})
		return
	}

	log.Printf("Received and decrypted log batch from system %s. Stored to %s", payload.SystemInfo.SystemID, logFilePath)
	c.JSON(http.StatusOK, gin.H{"message": "Log batch received successfully", "log_file": logFileName})
}
