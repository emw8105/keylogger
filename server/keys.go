package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
)

var privateKey *rsa.PrivateKey
var publicKey *rsa.PublicKey

// check if the RSA keys exist, if not generate them
func ensureKeys() error {
	if _, err := os.Stat(filepath.Join(KEYS_DIR, PRIVATE_KEY_FILE)); os.IsNotExist(err) {
		return generateKeys()
	} else if err != nil {
		return fmt.Errorf("error checking private key file: %w", err)
	}
	return loadKeys()
}

func generateKeys() error {
	log.Println("Generating new RSA key pair...")
	var err error
	privateKey, err = rsa.GenerateKey(rand.Reader, 2048) // 2048-bit RSA key
	if err != nil {
		return fmt.Errorf("failed to generate RSA private key: %w", err)
	}
	publicKey = &privateKey.PublicKey

	if err := os.MkdirAll(KEYS_DIR, 0700); err != nil {
		return fmt.Errorf("failed to create keys directory: %w", err)
	}

	privateKeyPEM := &pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(privateKey),
	}
	if err := ioutil.WriteFile(filepath.Join(KEYS_DIR, PRIVATE_KEY_FILE), pem.EncodeToMemory(privateKeyPEM), 0600); err != nil {
		return fmt.Errorf("failed to write private key to file: %w", err)
	}

	publicKeyBytes, err := x509.MarshalPKIXPublicKey(publicKey)
	if err != nil {
		return fmt.Errorf("failed to marshal public key: %w", err)
	}
	publicKeyPEM := &pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: publicKeyBytes,
	}
	if err := ioutil.WriteFile(filepath.Join(KEYS_DIR, PUBLIC_KEY_FILE), pem.EncodeToMemory(publicKeyPEM), 0644); err != nil {
		return fmt.Errorf("failed to write public key to file: %w", err)
	}

	log.Println("RSA key pair generated and saved.")
	return nil
}

func loadKeys() error {
	log.Println("Attempting to load RSA key pair...")
	privateKeyPath := filepath.Join(KEYS_DIR, PRIVATE_KEY_FILE)
	publicKeyPath := filepath.Join(KEYS_DIR, PUBLIC_KEY_FILE)

	privateKeyPEMBytes, err := ioutil.ReadFile(privateKeyPath)
	if err != nil {
		return fmt.Errorf("failed to read private key file: %w", err)
	}
	privateKeyPEMBlock, _ := pem.Decode(privateKeyPEMBytes)
	if privateKeyPEMBlock == nil || privateKeyPEMBlock.Type != "RSA PRIVATE KEY" {
		return fmt.Errorf("failed to decode PEM block containing private key")
	}
	privateKey, err = x509.ParsePKCS1PrivateKey(privateKeyPEMBlock.Bytes)
	if err != nil {
		return fmt.Errorf("failed to parse RSA private key: %w", err)
	}

	publicKeyPEMBytes, err := ioutil.ReadFile(publicKeyPath)
	if err != nil {
		return fmt.Errorf("failed to read public key file: %w", err)
	}
	publicKeyPEMBlock, _ := pem.Decode(publicKeyPEMBytes)
	if publicKeyPEMBlock == nil || publicKeyPEMBlock.Type != "PUBLIC KEY" {
		return fmt.Errorf("failed to decode PEM block containing public key")
	}
	pub, err := x509.ParsePKIXPublicKey(publicKeyPEMBlock.Bytes)
	if err != nil {
		return fmt.Errorf("failed to parse public key: %w", err)
	}
	var ok bool
	publicKey, ok = pub.(*rsa.PublicKey)
	if !ok {
		return fmt.Errorf("public key is not of type RSA public key")
	}

	log.Println("RSA key pair loaded successfully.")
	return nil
}
