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
#   ./deploy.sh                    # Uses default AWS profile
#   ./deploy.sh personal           # Uses "personal" AWS profile
#   ./deploy.sh --profile personal # Uses "personal" AWS profile
#

set -euo pipefail

# Parse profile argument
AWS_PROFILE=""

# Handle both "./deploy.sh personal" and "./deploy.sh --profile personal" styles
if [ $# -gt 0 ]; then
  if [ "$1" = "--profile" ] && [ $# -gt 1 ]; then
    AWS_PROFILE="$2"
  elif [ "$1" != "--profile" ]; then
    AWS_PROFILE="$1"
  fi
fi

FUNCTION_NAME="go-keylogger"
LAMBDA_ARCH="${LAMBDA_ARCH:-arm64}"
FIREBASE_KEY_FILE="${FIREBASE_KEY_FILE:-../server/keylogger-poc-firebase-adminsdk-fbsvc-f8da15b4be.json}"

# Build AWS CLI arguments
AWS_CLI_ARGS=()
if [ -n "$AWS_PROFILE" ]; then
  AWS_CLI_ARGS+=("--profile" "$AWS_PROFILE")
fi

if [ ! -f "$FIREBASE_KEY_FILE" ]; then
  echo "ERROR: Firebase service account file not found: $FIREBASE_KEY_FILE"
  echo "Set FIREBASE_KEY_FILE to the correct path and try again."
  exit 1
fi

# Display profile information
if [ -n "$AWS_PROFILE" ]; then
  echo "Using AWS profile: $AWS_PROFILE"
else
  echo "Using default AWS profile"
fi

echo "Building Lambda binary for linux/${LAMBDA_ARCH}..."
GOOS=linux GOARCH="$LAMBDA_ARCH" CGO_ENABLED=0 go build -tags lambda.norpc -o bootstrap .

echo "Packaging into deployment zip..."
zip -j lambda-deploy.zip bootstrap "$FIREBASE_KEY_FILE"

echo "Deploying to Lambda function: $FUNCTION_NAME..."
aws "${AWS_CLI_ARGS[@]}" lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --zip-file fileb://lambda-deploy.zip

echo "Cleaning up build artifacts..."
rm -f bootstrap lambda-deploy.zip

echo "Deployment complete."
