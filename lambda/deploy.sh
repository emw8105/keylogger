#!/bin/bash
# deploy_lambda.sh
# Builds and packages the Lambda function for deployment.
#
# Prerequisites:
#   - Go 1.23+ installed
#   - AWS CLI configured with appropriate permissions
#   - Lambda function already created in AWS Console (or via IaC)
#
# Usage:
#   ./deploy_lambda.sh
#

set -euo pipefail

FUNCTION_NAME="Keylogger"
LAMBDA_ARCH="${LAMBDA_ARCH:-arm64}"
FIREBASE_KEY_FILE="${FIREBASE_KEY_FILE:-../server/keylogger-poc-firebase-adminsdk-fbsvc-f8da15b4be.json}"

if [ ! -f "$FIREBASE_KEY_FILE" ]; then
  echo "ERROR: Firebase service account file not found: $FIREBASE_KEY_FILE"
  echo "Set FIREBASE_KEY_FILE to the correct path and try again."
  exit 1
fi

echo "Building Lambda binary for linux/${LAMBDA_ARCH}..."
GOOS=linux GOARCH="$LAMBDA_ARCH" CGO_ENABLED=0 go build -tags lambda.norpc -o bootstrap .

echo "Packaging into deployment zip..."
zip -j lambda-deploy.zip bootstrap "$FIREBASE_KEY_FILE"

echo "Deploying to Lambda function: $FUNCTION_NAME..."
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --zip-file fileb://lambda-deploy.zip

echo "Cleaning up build artifacts..."
rm -f bootstrap lambda-deploy.zip

echo "Deployment complete."
