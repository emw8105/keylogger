package main

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"log"
	"os"
	"strings"
)

var privateKey *rsa.PrivateKey
var publicKey *rsa.PublicKey

// loadKeysFromEnv loads RSA keys from environment variables.
// Set RSA_PRIVATE_KEY_PEM and RSA_PUBLIC_KEY_PEM with the full PEM-encoded key strings.
func loadKeysFromEnv() error {
	privatePEM := os.Getenv("RSA_PRIVATE_KEY_PEM")
	publicPEM := os.Getenv("RSA_PUBLIC_KEY_PEM")

	if privatePEM == "" || publicPEM == "" {
		return fmt.Errorf("RSA_PRIVATE_KEY_PEM and RSA_PUBLIC_KEY_PEM environment variables must be set")
	}

	privatePEM = normalizePEM(privatePEM, "RSA PRIVATE KEY")
	publicPEM = normalizePEM(publicPEM, "PUBLIC KEY")

	// Parse private key
	privBlock, _ := pem.Decode([]byte(privatePEM))
	if privBlock == nil || privBlock.Type != "RSA PRIVATE KEY" {
		return fmt.Errorf("failed to decode PEM block containing private key")
	}
	var err error
	privateKey, err = x509.ParsePKCS1PrivateKey(privBlock.Bytes)
	if err != nil {
		return fmt.Errorf("failed to parse RSA private key: %w", err)
	}

	// Parse public key
	pubBlock, _ := pem.Decode([]byte(publicPEM))
	if pubBlock == nil || pubBlock.Type != "PUBLIC KEY" {
		return fmt.Errorf("failed to decode PEM block containing public key")
	}
	pub, err := x509.ParsePKIXPublicKey(pubBlock.Bytes)
	if err != nil {
		return fmt.Errorf("failed to parse public key: %w", err)
	}
	var ok bool
	publicKey, ok = pub.(*rsa.PublicKey)
	if !ok {
		return fmt.Errorf("public key is not of type RSA public key")
	}

	log.Println("RSA key pair loaded from environment variables.")
	return nil
}

// normalizePEM accepts either full PEM content or just the base64 body.
// It also supports values pasted with literal "\\n" sequences.
func normalizePEM(value, blockType string) string {
	trimmed := strings.TrimSpace(value)
	if strings.Contains(trimmed, "\\n") {
		trimmed = strings.ReplaceAll(trimmed, "\\n", "\n")
	}

	begin := "-----BEGIN " + blockType + "-----"
	end := "-----END " + blockType + "-----"
	if strings.Contains(trimmed, begin) {
		return trimmed
	}

	body := strings.ReplaceAll(trimmed, "\n", "")
	body = strings.ReplaceAll(body, "\r", "")
	body = strings.TrimSpace(body)

	var b strings.Builder
	b.WriteString(begin)
	b.WriteString("\n")
	for len(body) > 64 {
		b.WriteString(body[:64])
		b.WriteString("\n")
		body = body[64:]
	}
	if len(body) > 0 {
		b.WriteString(body)
		b.WriteString("\n")
	}
	b.WriteString(end)
	b.WriteString("\n")

	return b.String()
}
