document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  
  const statusBadge = document.getElementById("host-status");
  const statusLabel = statusBadge.querySelector(".status-label");
  
  const btnLockTest = document.getElementById("btn-lock-test");
  const selectTrigger = document.getElementById("select-trigger");
  const rangeThreshold = document.getElementById("range-threshold");
  const thresholdVal = document.getElementById("threshold-val");
  const speedControlGroup = document.getElementById("speed-control-group");
  
  const statCount = document.getElementById("stat-count");
  const btnResetStats = document.getElementById("btn-reset-stats");
  
  const extensionIdVal = document.getElementById("extension-id-val");
  const btnCopyId = document.getElementById("btn-copy-id");

  // Sleep Timer Elements
  const selectTimer = document.getElementById("select-timer");
  const btnStartTimer = document.getElementById("btn-start-timer");
  const countdownArea = document.getElementById("countdown-area");
  const countdownTime = document.getElementById("countdown-time");
  const btnCancelTimer = document.getElementById("btn-cancel-timer");
  const timerSelectWrapper = document.getElementById("timer-select-wrapper");
  let sleepTimerInterval = null;

  // Display the Extension ID
  const extId = chrome.runtime.id;
  if (extensionIdVal) {
    extensionIdVal.textContent = extId;
  }

  // 1. Tab Switching Logic
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      
      // Toggle active buttons
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Toggle active content
      tabContents.forEach(content => {
        if (content.id === `tab-${targetTab}`) {
          content.classList.add("active");
        } else {
          content.classList.remove("active");
        }
      });
    });
  });

  // 2. Load Configuration from Local Storage
  chrome.storage.local.get(["triggerType", "clickCount", "timeThreshold"], (settings) => {
    const triggerType = settings.triggerType || "ctrl-shift";
    const clickCount = settings.clickCount !== undefined ? settings.clickCount : 3;
    const timeThreshold = settings.timeThreshold || 1500;

    // Set select value (e.g. play-pause-3)
    selectTrigger.value = `${triggerType}-${clickCount}`;
    
    // Set range slider value
    rangeThreshold.value = timeThreshold;
    thresholdVal.textContent = `${(timeThreshold / 1000).toFixed(1)}s`;

    // Manage slider visibility (hide for single key/action triggers)
    toggleThresholdSlider(triggerType, clickCount);
  });

  // 3. Load Lock Statistics
  updateStats();

  // 4. Periodically Check Connection Status (every 1.5 seconds)
  checkHostStatus();
  const statusTimer = setInterval(checkHostStatus, 1500);

  // Clean up timer when window is closed
  window.addEventListener("unload", () => {
    clearInterval(statusTimer);
    if (sleepTimerInterval) {
      clearInterval(sleepTimerInterval);
    }
  });

  // 5. Select Trigger Changed
  selectTrigger.addEventListener("change", () => {
    const value = selectTrigger.value;
    const parts = value.split("-");
    
    // Extrapolate values (e.g., play-pause-3 -> triggerType: play-pause, clickCount: 3)
    const clickCount = parseInt(parts.pop(), 10);
    const triggerType = parts.join("-");

    chrome.storage.local.set({ triggerType, clickCount }, () => {
      console.log(`Saved settings: trigger=${triggerType}, count=${clickCount}`);
      toggleThresholdSlider(triggerType, clickCount);
    });
  });

  // 6. Range Slider Changed (updates real-time values)
  rangeThreshold.addEventListener("input", () => {
    const value = parseInt(rangeThreshold.value, 10);
    thresholdVal.textContent = `${(value / 1000).toFixed(1)}s`;
  });

  rangeThreshold.addEventListener("change", () => {
    const value = parseInt(rangeThreshold.value, 10);
    chrome.storage.local.set({ timeThreshold: value }, () => {
      console.log(`Saved timing threshold: ${value}ms`);
    });
  });

  // 7. Manual Lock Test Button
  btnLockTest.addEventListener("click", () => {
    // Visual feedback ripple animation
    btnLockTest.classList.add("clicking");
    setTimeout(() => btnLockTest.classList.remove("clicking"), 200);

    // Call background service worker to lock
    chrome.runtime.sendMessage({ action: "lock-pc" }, (response) => {
      if (response && response.success) {
        console.log("Lock command sent successfully.");
        // Instantly increment local counter
        setTimeout(updateStats, 500);
      } else {
        console.error("Failed to send lock command. Host may be offline.");
        showTemporaryError();
      }
    });
  });

  // 8. Reset Stats Button
  btnResetStats.addEventListener("click", () => {
    if (confirm("Reset total lock counter?")) {
      chrome.runtime.sendMessage({ action: "reset-stats" }, (response) => {
        if (response && response.success) {
          statCount.textContent = "0";
        }
      });
    }
  });

  // 9. Copy Extension ID
  btnCopyId.addEventListener("click", () => {
    navigator.clipboard.writeText(extId).then(() => {
      // Temporary tooltip checkmark
      const originalSvg = btnCopyId.innerHTML;
      btnCopyId.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      btnCopyId.style.pointerEvents = "none";
      setTimeout(() => {
        btnCopyId.innerHTML = originalSvg;
        btnCopyId.style.pointerEvents = "auto";
      }, 1500);
    }).catch(err => {
      console.error("Could not copy ID:", err);
    });
  });

  // Listen for lock updates from background worker in real time
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "lock-triggered") {
      statCount.textContent = message.totalLocks;
    }
  });

  // 10. Sleep Timer Interactivity
  selectTimer.addEventListener("change", () => {
    const value = parseInt(selectTimer.value, 10);
    if (value > 0) {
      btnStartTimer.style.display = "block";
    } else {
      btnStartTimer.style.display = "none";
    }
  });

  btnStartTimer.addEventListener("click", () => {
    let secondsLeft = parseInt(selectTimer.value, 10);
    if (secondsLeft <= 0) return;

    // Transition UI
    timerSelectWrapper.style.display = "none";
    btnStartTimer.style.display = "none";
    countdownArea.style.display = "flex";

    updateCountdownDisplay(secondsLeft);

    sleepTimerInterval = setInterval(() => {
      secondsLeft--;
      updateCountdownDisplay(secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(sleepTimerInterval);
        sleepTimerInterval = null;
        
        // Trigger lock PC
        chrome.runtime.sendMessage({ action: "lock-pc" }, (response) => {
          resetTimerUI();
          setTimeout(updateStats, 500);
        });
      }
    }, 1000);
  });

  btnCancelTimer.addEventListener("click", () => {
    resetTimerUI();
  });

  function updateCountdownDisplay(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    countdownTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function resetTimerUI() {
    if (sleepTimerInterval) {
      clearInterval(sleepTimerInterval);
      sleepTimerInterval = null;
    }
    countdownArea.style.display = "none";
    timerSelectWrapper.style.display = "block";
    
    // Check if the current value is still greater than 0 to show button
    const value = parseInt(selectTimer.value, 10);
    if (value > 0) {
      btnStartTimer.style.display = "block";
    } else {
      btnStartTimer.style.display = "none";
    }
  }

  // --- Helper Functions ---

  // Request status from background worker
  function checkHostStatus() {
    chrome.runtime.sendMessage({ action: "check-status" }, (response) => {
      // Handle chrome extensions errors (e.g. background worker sleeping)
      if (chrome.runtime.lastError) {
        setOfflineUI();
        return;
      }
      
      if (response && response.connected) {
        statusBadge.className = "status-badge connected";
        statusLabel.textContent = "Host Connected";
      } else {
        setOfflineUI();
      }
    });
  }

  function setOfflineUI() {
    statusBadge.className = "status-badge disconnected";
    statusLabel.textContent = "Setup Required";
  }

  // Update statistics values
  function updateStats() {
    chrome.runtime.sendMessage({ action: "get-stats" }, (response) => {
      if (!chrome.runtime.lastError && response) {
        statCount.textContent = response.totalLocks || 0;
      }
    });
  }

  // Hide click speed slider if the action doesn't require consecutive clicks (e.g., keyboard shortcuts, single clicks)
  function toggleThresholdSlider(triggerType, clickCount) {
    if (triggerType === "ctrl-shift" || triggerType === "ctrl-space" || triggerType === "custom" || clickCount === 1) {
      speedControlGroup.style.display = "none";
    } else {
      speedControlGroup.style.display = "block";
    }
  }

  // Show a temporary red glow if host is disconnected on test click
  function showTemporaryError() {
    const statusBox = document.getElementById("host-status");
    statusBox.classList.add("error-highlight");
    setTimeout(() => {
      statusBox.classList.remove("error-highlight");
    }, 1000);
  }
});
