# Remote Keylogger System
This project implements a secure remote logging system designed for educational purposes and to create a fun virtual graffiti board of sorts. It consists of a Go-based server for receiving and organizing encrypted logs, a Python-based client (keylogger) for capturing system inputs, and a Next.js web client for distribution and viewing of the collected logs.

## Purpose

This project showcases how to:

- Securely collect system-wide key inputs from remote clients.
- Utilize public key cryptography (RSA) and symmetric encryption (AES-GCM) to protect sensitive data in transit.
- Implement reliable and secure client-server communication protocols.
- Distribute system-specific executables via AWS S3.
- Provide a user-friendly web interface to demonstrate the project's functionality and view collected data.

Note: This is a proof-of-concept and educational tool, not a full-fledged malicious keylogger. Its distribution mechanism is transparent, and all collected logs are made publicly viewable on the website. It is intended solely for educational and personal exploration in the context of systems programming, web development, and security, not for malicious purposes.

## System Architecture
The system is composed of three main parts:

### 1. Python Client (Keylogger Executable)

A lightweight keylogger written in Python, compiled into a Windows executable. This is the component users download and run.

#### Features
- **Key Logging**: Captures system-wide keypresses continuously.

- **Batch Sending**: Batches logs and sends after configurable inactivity (default: 10s).

- **Handshake**: On startup, fetches server’s RSA public key.

- **Encryption**
  - AES-256 symmetric key generated per session.
  - AES key is encrypted with RSA-OAEP.
  - Log data is encrypted with AES-GCM.

- **Data Transmission**
  - Sends a JSON payload to the server’s `/log` endpoint:
    ```json
    {
      "system_info": {...},
      "encrypted_key": "...",
      "encrypted_log": "..."
    }
    ```
---

### 2. Go Server

The Go server acts as a central receiver for encrypted logs from multiple clients and serves data to the Next.js client.

#### Features

- **RSA Key Management**
  - Generates 2048-bit RSA key pairs on first run.
  - Saves keys in `./keys/`.

- **Endpoints**
  - `GET /handshake`: Provides the RSA public key for clients.
  - `POST /log`: Accepts encrypted log payloads from clients, decrypts them, and saves them to Firebase.
  - `GET /getSystems`: Retrieves basic system information for display on the web client.
  - `GET /getLogs`: Retrieves specific logs for a given system ID and date for display on the web client.

- **Secure Decryption**
  - Decrypts AES key using RSA-OAEP (SHA256).
  - Decrypts log data using AES-256 GCM.

- **Firebase Integration**
  - Stores and retrieves logs from Google Firebase.
  - Lazy loads log retrieval for cost efficiency.
  - Server can also optionally store logs locally, organized into `./logs/<SystemID>/<hostname>_<date>.log`.

---

### 3. Next.js Web Client

A React-based web application serving as the project's public interface.

#### Features
- **Executable Distribution**: Provides a direct download link for the Windows keylogger executable, hosted securely on AWS S3.
- **Project Showcase**: Explains the purpose and security aspects of the project, as well as the utilization of the application.
- **Log Viewing**: Allows users to browse and view all collected logs, demonstrating the system's functionality transparently.


## Security Overview

| Component        | Technique                    |
|------------------|------------------------------|
| Key Exchange     | RSA 2048-bit OAEP (SHA256)   |
| Data Encryption  | AES-256 in GCM mode          |
| Integrity Check  | AES-GCM authentication tag   |
| Data at Rest     | Encrypted in Firebase        |

---

## Log File Structure (Local Logs)
```
./logs/
├── SystemID1/
│ ├── hostname_2025-06-01.log
│ └── hostname_2025-06-02.log
├── SystemID2/
│ └── anotherhost_2025-06-01.log
...
```

## Getting Started

### Prerequisites

- **Go**: 1.20+
- **Python**: 3.9+
- **Node.js**: 18+
- **Next.js**: 15+
- **AWS CLI**: Configured with a profile that has `s3:PutObject` permissions for the executable S3 bucket (optional - used for automated deployments). 
- **Firebase Project**: A configured Firebase project with Firestore enabled and a service account key JSON file for the Go server to authenticate.
- **AWS S3 Bucket**: A bucket configured for public read access (via bucket policy, not ACLs) to host keylogger executables.
- **AWS EC2**: A compute instance used to host the server, configured with nginx to route requests from the clients to the running server process.

### Setup and Running
1. **Go Server Setup**
   - **Firebase Service Account Key**: Place your Firebase service account JSON file (e.g., `keylogger-poc-firebase-adminsdk-xxxxx.json`) in the server/ directory.
   - **Environment Variables**: Create a .env file in the server/ directory:
     ```
     FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./keylogger-poc-firebase-adminsdk-xxxxx.json
     ```
   - **Run Locally**:
     ```bash
      cd server/
      go build .
      go run .
     ```
   - **Deploy to EC2 (Example)**:
     - The server/deploy.sh script can be used to build and deploy your Go server to a configured EC2 instance.
     - Ensure your EC2 instance has the necessary IAM role for Firebase access, if applicable.
      ```bash
      cd server/
      ./deploy.sh
     ```
2. Python Client (Keylogger) Build & Deployment
   The keylogger client is distributed as a pre-built Windows executable.
   - **Install Python Dependencies**:
     ```bash
      cd logger/
      pip install -r requirements.txt pyinstaller
     ```
   - **Build Executable**:
     - The web client is configured with the Windows executable already, but all users can use this script to build a system-integrated version of the keylogger script
     ```bash
      cd logger/
      ./build_local.sh
     ```
     - This creates a Keylogger executable application in the `logger/dist` directory.
     - Test this executable locally to ensure it functions as expected.
     - With a running server, the logs recorded by the script should appear in Firebase.
   - **Deploy Executable to S3**:
     ```bash
      cd logger/
      ./deploy_logger.sh
     ```
     - This script uploads the Keylogger executable (Keylogger_windows.exe for windows) to the S3 bucket at the path `executables/windows/Keylogger_windows.exe`.
     - Requires an AWS CLI profile configured with the necessary `s3:PutObject` permissions for authentication.
4. Next.js Web Client Setup
  - **Environment Variables**: Create a `.env.local` file in the `client/` directory.
    ```
    NEXT_PUBLIC_SERVER_BASE_URL=http://localhost:8080 # or your deployed Go server URL (e.g. EC2)
    NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL=https://keylogger-project.s3.us-east-1.amazonaws.com/executables/windows/Keylogger_windows.exe # S3 download URL for the bucket of executables
    ```
  - **Install Dependencies**:
    ```bash
      cd client/
      npm install
     ```
  - **Run Locally**:
    ```bash
      npm run dev
     ```
  - **Deploy to Vercel (Example)**:
This project can be easily deployed to Vercel by linking the GitHub repository; additional Cloudflare configuration can be applied to host it through Vercel at a desired domain.

## Contributing
Feel free to fork this repository, explore the code, and contribute to its development.
Please adhere to the educational and non-malicious intent of this project.
---
**Disclaimer**: This software is provided for educational and demonstrative purposes only. The authors are not responsible for any misuse or damage caused by this software. Use it responsibly and ethically.





