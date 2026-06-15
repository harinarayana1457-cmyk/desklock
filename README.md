# DeskLock 🔒

DeskLock is a Chrome Extension paired with a lightweight Windows Native Messaging Host (written in Python) that allows you to instantly lock your Windows computer using customizable keyboard shortcuts or a visual Sleep Timer countdown.

---

## 🌟 Features
- **Instant Locking**: Lock your workstation using the central dashboard button or globally registered keyboard shortcuts.
- **Global Key Bindings**: Includes three pre-configured shortcut listeners:
  - `Ctrl + Shift + L`
  - `Ctrl + Space`
  - **Custom Shortcut** (bind any key combination you want!).
- **Sleep Timer**: Set a countdown timer (e.g., 30 seconds or 5 minutes) from the extension popup to lock your PC after a delay.
- **Host Status Indicator**: Live indicator showing whether the Windows helper script is connected.

---

## ⚙️ Prerequisites
- **Operating System**: Windows
- **Python**: Python 3.x installed and added to your system `PATH` (needed to run the background lock client).

---

## 🚀 Installation & Setup

### Step 1: Load the Chrome Extension
1. Open Google Chrome and go to the Extensions page: `chrome://extensions/`.
2. Toggle the **Developer mode** switch in the top-right corner to **ON**.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the project folder (the folder containing `manifest.json`).
5. Once loaded, locate the **DeskLock** extension card and **copy the Extension ID** (a 32-letter code, e.g. `bblbcmboflcdhdmadkoabhfeenpopbjn`).

### Step 2: Register the Windows Native Host
1. Open the project folder in Windows File Explorer.
2. Double-click the **`install.bat`** file. 
   *(This helper automatically bypasses Windows execution policies safely for the installation script without needing admin rights).*
3. A console window will open prompting you for your **Extension ID**.
4. Paste the Extension ID you copied in Step 1 and press **Enter**.
5. The installer will create a local configuration file and register the host in your user registry.

### Step 3: Verify Connection
1. Click the **DeskLock** extension icon in your Chrome toolbar.
2. The status badge in the top-right corner of the dashboard should show a green pulsing **Host Connected**.
3. Click the central Lock icon to verify your PC locks instantly!

---

## ⌨️ How to Set Up a Custom Shortcut

Chrome extensions require you to explicitly give shortcuts **Global** permission so they can trigger even when Chrome is minimized or you are playing a game/working in another app.

1. Open Chrome and navigate to:
   ```
   chrome://extensions/shortcuts
   ```
2. Scroll down to find the **DeskLock** section. You will see three command rows:
   - *Lock PC Shortcut (Ctrl+Shift+L)*
   - *Lock PC Shortcut (Ctrl+Space)*
   - *Lock PC Shortcut (Custom)*
3. **Change Scope to Global**:
   For the shortcut you want to use, change the dropdown menu on the right from **"In Chrome"** to **"Global"**.
4. **Assign a Custom Key Binding**:
   - To change the shortcut (for example, setting the *Custom* shortcut to `Ctrl+Space` or `Alt+Shift+K`), click inside the input box for that row.
   - Press your desired key combination on your keyboard.
   - Ensure the scope dropdown next to it is set to **Global**.
5. **Activate the Shortcut**:
   - Open the DeskLock popup dashboard.
   - Change the **Action Trigger** dropdown selection to match your chosen shortcut (e.g., set to *Custom Shortcut* if you configured the third row).

---

## ⏱️ Using the Sleep Timer
1. Open the DeskLock popup dashboard.
2. Scroll to the **Sleep Timer** card.
3. Select your desired delay (e.g., 30 Seconds, 1 Minute, 5 Minutes).
4. Click **Start Countdown**.
5. The UI will show a live countdown. Your computer will lock automatically when the timer reaches zero. You can click **Cancel** at any time to stop the timer.

---

## 🗑️ Uninstallation
If you wish to remove the registry edits and clean up local configurations:
1. Double-click the **`uninstall.bat`** file in the project folder.
2. Remove the extension from `chrome://extensions/`.
