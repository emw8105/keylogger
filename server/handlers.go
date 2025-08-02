package main

import (
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"log"
	"net/http"

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

	if len(decryptedLogContent) > MAX_LOG_CHARACTERS {
		errMsg := fmt.Sprintf("Decrypted log content from system %s exceeds maximum allowed length (%d > %d). Rejecting.",
			payload.SystemInfo.SystemID, len(decryptedLogContent), MAX_LOG_CHARACTERS)
		log.Printf("ERROR: %s", errMsg)
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": errMsg})
		return
	}

	if err := logSaver.Save(payload, decryptedLogContent); err != nil {
		log.Printf("ERROR: Failed to save log: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save log", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Log batch received successfully"})
}
