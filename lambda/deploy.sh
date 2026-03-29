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

echo "Building Lambda binary for linux/amd64..."
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -tags lambda.norpc -o bootstrap .

echo "Packaging into deployment zip..."
zip -j lambda-deploy.zip bootstrap

echo "Deploying to Lambda function: $FUNCTION_NAME..."
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --zip-file fileb://lambda-deploy.zip

echo "Cleaning up build artifacts..."
rm -f bootstrap lambda-deploy.zip

echo "Deployment complete."
