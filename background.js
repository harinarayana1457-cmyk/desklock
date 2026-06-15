let port = null;
let hostConnected = false;
let clickHistory = {};

// Function to connect to the native messaging host
function connectToNativeHost() {
  if (port) {
    try {
      port.disconnect();
    } catch (e) {}
  }
  
  console.log("Connecting to native host com.desklock.host...");
  try {
    port = chrome.runtime.connectNative("com.desklock.host");
    
    port.onMessage.addListener((msg) => {
      console.log("Received message from native host:", msg);
    });
    
    port.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        console.warn("Native host connection error:", chrome.runtime.lastError.message);
      } else {
        console.log("Disconnected from native host.");
      }
      port = null;
      hostConnected = false;
    });
    
    hostConnected = true;
  } catch (e) {
    console.error("Failed to connect to native host:", e);
    port = null;
    hostConnected = false;
  }
}

// Attempt initial connection on worker startup
connectToNativeHost();

// Helper function to send lock command to the host
function sendLockCommand() {
  if (!port) {
    connectToNativeHost();
  }
  
  if (port) {
    try {
      port.postMessage({ action: "lock" });
      
      // Increment total locks stats
      chrome.storage.local.get(["totalLocks"], (result) => {
        let count = (result.totalLocks || 0) + 1;
        chrome.storage.local.set({ totalLocks: count });
        // Broadcast lock update to popup if open
        chrome.runtime.sendMessage({ action: "lock-triggered", totalLocks: count }).catch(() => {
          // Ignore error when popup is closed
        });
      });
      return true;
    } catch (e) {
      console.error("Error sending message to native host:", e);
      hostConnected = false;
      port = null;
      return false;
    }
  } else {
    console.warn("Cannot send lock command; native host is not connected.");
    return false;
  }
}

// Handle messages from the extension popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "check-status") {
    // If not connected, try to reconnect to see if it's registered now
    if (!port) {
      connectToNativeHost();
    }
    // Return connection status. We do a small timeout or respond immediately
    sendResponse({ connected: !!port && hostConnected });
  } else if (request.action === "lock-pc") {
    const success = sendLockCommand();
    sendResponse({ success: success });
  } else if (request.action === "get-stats") {
    chrome.storage.local.get(["totalLocks"], (result) => {
      sendResponse({ totalLocks: result.totalLocks || 0 });
    });
    return true; // Keep message channel open for async response
  } else if (request.action === "reset-stats") {
    chrome.storage.local.set({ totalLocks: 0 }, () => {
      sendResponse({ success: true, totalLocks: 0 });
    });
    return true;
  }
});

// Listener for global keyboard commands
chrome.commands.onCommand.addListener((command) => {
  console.log("Global command triggered:", command);
  
  chrome.storage.local.get(["triggerType"], (settings) => {
    const triggerType = settings.triggerType || "ctrl-shift";
    
    // Map command identifier to trigger type
    let commandTriggerType = "";
    if (command === "lock-trigger-keyboard-ctrl-shift") commandTriggerType = "ctrl-shift";
    else if (command === "lock-trigger-keyboard-ctrl-space") commandTriggerType = "ctrl-space";
    else if (command === "lock-trigger-keyboard-custom") commandTriggerType = "custom";
    
    if (commandTriggerType === triggerType) {
      console.log(`Keyboard shortcut [${command}] triggered. Locking PC...`);
      sendLockCommand();
    }
  });
});
