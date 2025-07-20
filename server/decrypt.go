package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// decryptAESGCM decrypts data using an AES key in GCM mode.
func decryptAESGCM(key, encryptedData []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("failed to create AES cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM cipher: %w", err)
	}

	nonceSize := gcm.NonceSize()
	tagSize := 16 // GCM tag is always 16 bytes in Python's cryptography

	if len(encryptedData) < nonceSize+tagSize {
		return nil, fmt.Errorf("ciphertext too short")
	}

	nonce := encryptedData[:nonceSize]
	ciphertext := encryptedData[nonceSize : len(encryptedData)-tagSize]
	tag := encryptedData[len(encryptedData)-tagSize:]

	// in python, tag is at the end, but Go expects ciphertext+tag together, need to split out the tag
	ciphertextAndTag := append(ciphertext, tag...)

	plaintext, err := gcm.Open(nil, nonce, ciphertextAndTag, nil)
	if err != nil {
		return nil, fmt.Errorf("ERROR: AES GCM decryption failed: %w", err)
	}
	return plaintext, nil
}

func decryptLogs(payload LogPayload, c *gin.Context) (string, error) {

	encryptedAESKeyBytes, err := base64.StdEncoding.DecodeString(payload.EncryptedAESKey)
	if err != nil {
		log.Printf("ERROR: Failed to base64 decode encrypted AES key: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid encrypted AES key format"})
		return "", fmt.Errorf("invalid encrypted AES key format: %w", err)
	}

	decryptedAESKey, err := rsa.DecryptOAEP(sha256.New(), rand.Reader, privateKey, encryptedAESKeyBytes, nil)
	if err != nil {
		log.Printf("ERROR: Failed to decrypt AES key with RSA OAEP: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decrypt AES key"})
		return "", fmt.Errorf("failed to decrypt AES key with RSA OAEP: %w", err)
	}

	// decrypted AES key should be 32 bytes for AES-256
	if len(decryptedAESKey) != 32 {
		log.Printf("ERROR: Decrypted AES key has incorrect length: %d bytes (expected 32)", len(decryptedAESKey))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid decrypted AES key length"})
		return "", fmt.Errorf("invalid decrypted AES key length: %d bytes (expected 32)", len(decryptedAESKey))
	}

	encryptedLogContentBytes, err := base64.StdEncoding.DecodeString(payload.EncryptedLogContent)
	if err != nil {
		log.Printf("ERROR: Failed to base64 decode encrypted log content: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid encrypted log content format"})
		return "", fmt.Errorf("invalid encrypted log content format: %w", err)
	}

	decryptedLogContentBytes, err := decryptAESGCM(decryptedAESKey, encryptedLogContentBytes)
	if err != nil {
		log.Printf("ERROR: Failed to decrypt log content with AES GCM: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decrypt log content"})
		return "", fmt.Errorf("failed to decrypt log content with AES GCM: %w", err)
	}

	decryptedLogContent := string(decryptedLogContentBytes)

	return decryptedLogContent, nil
}
