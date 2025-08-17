package main

import (
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"log"
	"net/http"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/iterator"
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

// getSystemsHandler retrieves a summary of all systems from Firestore
func getSystemsHandler(c *gin.Context) {
	if firestoreClient == nil {
		logErrorf("getSystemsHandler: Firestore client not initialized.")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Firestore not available"})
		return
	}

	systemsCollection := firestoreClient.Collection("systems")
	iter := systemsCollection.Documents(ctx)
	defer iter.Stop()

	var systems []SystemInfo
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			logErrorf("getSystemsHandler: error iterating systems documents: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve systems"})
			return
		}

		var sysInfo SystemInfo
		if err := doc.DataTo(&sysInfo); err != nil {
			logErrorf("getSystemsHandler: error mapping document to SystemInfo: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process system data"})
			return
		}

		systems = append(systems, sysInfo)
	}

	c.JSON(http.StatusOK, gin.H{"systems": systems})
	log.Println("getSystemsHandler: Successfully retrieved system summaries.")
}

// getSystemsLogsHandler retrieves logs for a specific system from Firestore
func getSystemLogsHandler(c *gin.Context) {
	if firestoreClient == nil {
		logErrorf("getSystemLogsHandler: Firestore client not initialized.")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Firestore not available"})
		return
	}

	systemID := c.Param("systemId")
	if systemID == "" {
		logErrorf("getSystemLogsHandler: Missing systemId parameter.")
		c.JSON(http.StatusBadRequest, gin.H{"error": "System ID is required"})
		return
	}

	batchesCollection := firestoreClient.Collection("systems").Doc(systemID).Collection("batches")
	// order logs by server timestamp in descending order i.e. most recent first
	query := batchesCollection.OrderBy("serverTimestamp", firestore.Desc).Documents(ctx)
	defer query.Stop()

	var logs []LogEntry
	for {
		doc, err := query.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			logErrorf("getSystemLogsHandler: error iterating log batches for system %s: %v", systemID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve logs"})
			return
		}

		var logEntry LogEntry
		if err := doc.DataTo(&logEntry); err != nil {
			logErrorf("getSystemLogsHandler: error mapping log document to LogEntry for system %s: %v", systemID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process log data"})
			return
		}
		logs = append(logs, logEntry)
	}

	c.JSON(http.StatusOK, gin.H{"logs": logs})
	log.Printf("getSystemLogsHandler: Successfully retrieved %d logs for system %s.", len(logs), systemID)
}
