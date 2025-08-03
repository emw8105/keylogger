#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# config
EC2_USER="ec2-user"
EC2_HOST="ec2-18-215-27-1.compute-1.amazonaws.com"
SSH_KEY_PATH="./wallify-dev.pem"                    # local path to ssh private key, reusing from another project with an existing ec2 instance
LOCAL_BINARY_NAME="keylogger_server"                # name of the binary to build
REMOTE_BINARY_PATH="/home/${EC2_USER}/${LOCAL_BINARY_NAME}" # ec2 destination path

LOCAL_FIREBASE_KEY_PATH="./keylogger-poc-firebase-adminsdk-fbsvc-f8da15b4be.json" # local path to Firebase key
REMOTE_FIREBASE_KEY_PATH="/home/${EC2_USER}/keylogger-poc-firebase-adminsdk-fbsvc-f8da15b4be.json" # ec2 destination path

SYSTEMD_SERVICE_NAME="keylogger-server.service" # systemd service name

# local build steps
echo "--- Building the Go binary locally for Linux ---"
go env -w GOOS=linux GOARCH=amd64
CGO_ENABLED=0 go build -ldflags="-s -w" -o "${LOCAL_BINARY_NAME}" .
go env -u GOOS GOARCH

echo "Build complete. Binary: ${LOCAL_BINARY_NAME}"
echo "Binary size: $(du -h "${LOCAL_BINARY_NAME}" | awk '{print $1}')"

# stop the existing service on EC2 before copying the new binary
echo "--- Stopping ${SYSTEMD_SERVICE_NAME} on EC2 before copying new binary ---"
ssh -i "${SSH_KEY_PATH}" "${EC2_USER}@${EC2_HOST}" "sudo systemctl stop ${SYSTEMD_SERVICE_NAME} || true"

# copy new binary and Firebase key to EC2
echo "--- Copying the new binary to EC2 ---"
scp -i "${SSH_KEY_PATH}" "./${LOCAL_BINARY_NAME}" "${EC2_USER}@${EC2_HOST}:${REMOTE_BINARY_PATH}"

echo "--- Copying the Firebase service account key to EC2 ---"
scp -i "${SSH_KEY_PATH}" "${LOCAL_FIREBASE_KEY_PATH}" "${EC2_USER}@${EC2_HOST}:${REMOTE_FIREBASE_KEY_PATH}"

# ssh into ec2 and restart service
echo "--- Connecting to EC2 for deployment and restarting service ---"
ssh -i "${SSH_KEY_PATH}" "${EC2_USER}@${EC2_HOST}" << EOF_SSH_CMDS
    set -e # Exit immediately if any command in this block fails

    echo "On EC2: Ensuring binary has execute permissions..."
    chmod +x "${REMOTE_BINARY_PATH}" # This will now be expanded by the local shell

    echo "On EC2: Reloading Systemd daemon (important after service file changes)..."
    sudo systemctl daemon-reload

    echo "On EC2: Starting ${SYSTEMD_SERVICE_NAME}..."
    sudo systemctl start "${SYSTEMD_SERVICE_NAME}" # This will now be expanded by the local shell

    echo "On EC2: Checking status of ${SYSTEMD_SERVICE_NAME}..."
    sudo systemctl status "${SYSTEMD_SERVICE_NAME}" --no-pager

    echo "On EC2: Deployment steps complete."
EOF_SSH_CMDS

# cleanup
echo "--- Cleaning up local binary ---"
rm "./${LOCAL_BINARY_NAME}"

echo "Deployment script finished successfully!"