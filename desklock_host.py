import sys
import json
import struct
import ctypes
import os
import datetime

# Determine current directory to store logs
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(CURRENT_DIR, "host_debug.log")

def log_message(message):
    """Logs message to a local file for debugging purposes."""
    try:
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"[{timestamp}] {message}\n")
    except Exception:
        pass

# Force binary stdin/stdout on Windows to prevent automatic carriage return translations (\r\n)
if sys.platform == "win32":
    try:
        import msvcrt
        msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
        msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    except Exception as e:
        log_message(f"Failed to set binary mode: {str(e)}")

def read_message():
    """Reads a message from standard input (Chrome Native Messaging protocol)."""
    try:
        # Read the 32-bit length prefix
        raw_length = sys.stdin.buffer.read(4)
        if not raw_length:
            return None
        
        # Unpack 32-bit unsigned integer in native byte order
        message_length = struct.unpack("I", raw_length)[0]
        
        # Read the JSON payload
        raw_message = sys.stdin.buffer.read(message_length)
        if len(raw_message) < message_length:
            log_message(f"Warning: Expected {message_length} bytes, read {len(raw_message)}")
            return None
            
        message = raw_message.decode("utf-8")
        return json.loads(message)
    except Exception as e:
        log_message(f"Error reading message: {str(e)}")
        return None

def send_message(message_dict):
    """Sends a message to Chrome via standard output (Chrome Native Messaging protocol)."""
    try:
        # Serialize to JSON and encode as UTF-8
        message_json = json.dumps(message_dict).encode("utf-8")
        
        # Write the 32-bit length header
        sys.stdout.buffer.write(struct.pack("I", len(message_json)))
        
        # Write payload and flush
        sys.stdout.buffer.write(message_json)
        sys.stdout.buffer.flush()
    except Exception as e:
        log_message(f"Error sending response: {str(e)}")

def lock_workstation():
    """Calls Windows Win32 API to lock the workstation immediately."""
    try:
        log_message("LockWorkStation API called.")
        # Call the user32 LockWorkStation function
        result = ctypes.windll.user32.LockWorkStation()
        if result == 0:
            raise ctypes.WinError()
        log_message("PC locked successfully.")
        return True
    except Exception as e:
        log_message(f"API Error locking PC: {str(e)}")
        return False

def main():
    log_message("DeskLock native host initialized.")
    while True:
        message = read_message()
        if message is None:
            log_message("Stdin closed or error. Exiting host.")
            break
            
        log_message(f"Received action command: {message.get('action')}")
        
        if message.get("action") == "lock":
            success = lock_workstation()
            if success:
                send_message({"status": "success", "message": "Workstation locked."})
            else:
                send_message({"status": "error", "message": "Failed to lock workstation."})
        elif message.get("action") == "ping":
            send_message({"status": "pong"})
        else:
            send_message({"status": "ignored", "message": "Unknown action."})

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log_message(f"Unhandled main exception: {str(e)}")
