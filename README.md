# Remote Keylogger System
This project implements a secure remote logging system consisting of a Go-based server receiving encrypted logs to be organized and stored from a Python-based client about system information and activity.

## Purpose

This project showcases how to:

- Securely collect system-wide key inputs from remote clients.
- Use public key cryptography (RSA) and symmetric encryption (AES-GCM) to protect sensitive data.
- Implement reliable and secure client-server communication protocols.

Note: This is not the full implementation of a realistic keylogger. A realistic keylogger would have a distribution method and requests sent back to the server using disguised webhooks, whereas this implementation uses just encrypted API calls. It is intended **solely for educational and personal exploration** in the context of systems programming and security, not for malicious purposes.

## System Architecture

### 1. Go Server

The Go server acts as a central receiver for encrypted logs from multiple clients.

#### Features

- **RSA Key Management**
  - Generates 2048-bit RSA key pairs on first run.
  - Saves keys in `./keys/`.

- **Endpoints**
  - `GET /handshake`: Provides the RSA public key for clients.
  - `POST /log`: Accepts encrypted log payloads.

- **Secure Decryption**
  - Decrypts AES key using RSA-OAEP (SHA256).
  - Decrypts log data using AES-256 GCM.
  - Organizes logs into `./logs/<SystemID>/<hostname>_<date>.log`.

---

### 2. Python Client (Keylogger)

The client is a lightweight keylogger that securely sends logs to the server.

#### Features

- **Key Logging**
  - Captures system-wide keypresses continuously.

- **Batch Sending**
  - Batches logs and sends after configurable inactivity (default: 10s).

- **Handshake**
  - On startup, fetches server’s RSA public key.

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

## Security Overview

| Component        | Technique                      |
|------------------|-------------------------------|
| Key Exchange     | RSA 2048-bit OAEP (SHA256)     |
| Data Encryption  | AES-256 in GCM mode            |
| Integrity Check  | AES-GCM authentication tag     |
| Data at Rest     | Decrypted and saved locally    |

---

## Log File Structure
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

- Go 1.20+
- Python 3.9+
- Required Python packages: `pynput`, `requests`, `cryptography`

### Run the Server

```bash
cd server/
go build
go run .
```
- Creates the RSA key pair on the first run
- Sets the server to listen for ```/handshake``` and ```/log```


