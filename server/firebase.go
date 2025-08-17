package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"
)

// this file defines some Firebase-related functions and types as well as the Firestore client setup

var firebaseApp *firebase.App
var firestoreClient *firestore.Client
var ctx context.Context

// initializes the Firebase Admin SDK and Firestore client
// serviceAccountKeyPath is the path to downloaded Firebase service account JSON file
func InitializeFirebase(serviceAccountKeyPath string) error {
	ctx = context.Background() // use global context

	opt := option.WithCredentialsFile(serviceAccountKeyPath)

	var err error
	firebaseApp, err = firebase.NewApp(ctx, nil, opt)
	if err != nil {
		return logErrorf("error initializing Firebase app: %v", err)
	}

	firestoreClient, err = firebaseApp.Firestore(ctx)
	if err != nil {
		return logErrorf("error initializing Firestore client: %v", err)
	}

	log.Println("Firebase and Firestore initialized successfully.")
	return nil
}

func CloseFirebase() {
	if firestoreClient != nil {
		firestoreClient.Close()
		log.Println("Firestore client closed.")
	}
}

// represents a single log entry in Firestore
type LogEntry struct {
	LogStartTimeUTC    string    `firestore:"logStartTimeUTC"`
	LogDurationSeconds float64   `firestore:"logDurationSeconds"`
	LoggedContent      string    `firestore:"loggedContent"`
	ActiveWindow       string    `firestore:"activeWindow"`
	ServerTimestamp    time.Time `firestore:"serverTimestamp"`
}

func logErrorf(format string, args ...interface{}) error {
	log.Printf(format, args...)
	return fmt.Errorf(format, args...)
}
