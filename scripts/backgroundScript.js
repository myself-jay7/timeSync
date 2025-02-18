chrome.alarms.create("checkDueItems", { periodInMinutes: 1 });
chrome.alarms.create("checkSiteUsage", { periodInMinutes: 1 });

// Listen for alarms
chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === "checkDueItems") {
    checkScheduledSites();
    checkDueTasks();
  } else if (alarm.name === "checkSiteUsage") {
    updateSiteUsage();
  }
});

// Check scheduled sites 
function checkScheduledSites() {
  chrome.storage.local.get("scheduledSites", function (result) {
    const scheduledSites = result.scheduledSites || [];
    const currentTime = new Date();

    scheduledSites.forEach((site) => {
      const siteTime = new Date(`${site.date}T${site.time}`);
      if (siteTime <= currentTime && shouldNotify(site)) {
        notifyUser(site);
        // Open the site in the background
        chrome.tabs.create({ url: site.url, active: false });
      }
    });
  });
}

// Check due tasks
function checkDueTasks() {
  chrome.storage.local.get("tasks", function (result) {
    const tasks = result.tasks || [];
    const currentTime = new Date();

    tasks.forEach((task) => {
      const taskTime = new Date(`${task.date}T${task.time}`);
      if (taskTime <= currentTime) {
        notifyTask(task);
        removeTask(task); 
      }
    });
  });
}

// Notify the user about the scheduled task
function notifyTask(task) {
  const notificationOptions = {
    type: "basic",
    iconUrl: "icon.png",
    title: "Task Reminder",
    message: `It's time to: ${task.description}`,
    priority: 1,
  };

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length > 0) {
      const activeTabId = tabs[0].id;
      
      // Inject the content script into the active tab if not already injected
      chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        files: ['scripts/contentScript.js']
      }, () => {
        // Send a message to the content script to trigger the showAlert function
        chrome.tabs.sendMessage(activeTabId, {
          action: "showAlert",
          message: `Task Reminder: ${task.description}`
        }, function (response) {
          if (chrome.runtime.lastError) {
            console.error('Error sending message to content script:', chrome.runtime.lastError.message);
          } else {
            console.log('Message sent to content script successfully');
          }
        });
      });
    }
  });

  chrome.notifications.create(task.description, notificationOptions);
}



function removeTask(task) {
  chrome.storage.local.get("tasks", function (result) {
    const tasks = result.tasks || [];
    const updatedTasks = tasks.filter(t => t.description !== task.description);
    chrome.storage.local.set({ tasks: updatedTasks });
  });
}


// Handle closeTabs action from content script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "closeTabs") {
    chrome.tabs.query({ url: `*://${request.url}/*` }, function (tabs) {
      tabs.forEach(tab => {
        chrome.tabs.remove(tab.id);
      });
    });
  }
});

function notifyUser(site) {
  const notificationOptions = {
    type: "basic",
    iconUrl: "icon.png",
    title: "Time to visit " + site.name,
    message: "It's time to visit " + site.url,
    priority: 1,
  };

  chrome.notifications.create(site.url, notificationOptions);
}
// Handle click event for site notifications
chrome.notifications.onClicked.addListener(function (notificationId) {
  chrome.storage.local.get("scheduledSites", function (result) {
    const site = result.scheduledSites.find(site => site.url === notificationId);

    if (site) {
      chrome.tabs.query({}, function (tabs) {
        const existingTab = tabs.find(tab => tab.url === site.url);
        
        if (existingTab) {
          chrome.tabs.update(existingTab.id, { active: true });
        } else {
          chrome.tabs.create({ url: site.url });
        }
      });
    }
  });
});

// Function to determine if a notification should be sent
function shouldNotify(site) {
  const now = new Date();
  const siteTime = new Date(`${site.date}T${site.time}`);
  const timeDiff = Math.abs(now - siteTime);
  return timeDiff < 60000;
}

// Logic to update site usage and remove site if limit is reached
function updateSiteUsage() {
  chrome.storage.local.get("siteLimits", function (result) {
    const siteLimits = result.siteLimits || {};
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTabUrl = tabs[0]?.url;
      const activeTabHostname = activeTabUrl ? new URL(activeTabUrl).hostname : null;

      for (const site in siteLimits) {
        const limitInfo = siteLimits[site];
        if (limitInfo && site === activeTabHostname) { // Only update if the site matches the active tab
          limitInfo.usedTime = (limitInfo.usedTime || 0) + 1;
          chrome.storage.local.set({ siteLimits: siteLimits });

          // Check if usage has reached the limit
          if (limitInfo.usedTime >= limitInfo.maxTime) {
            console.log(`Limit reached for ${site}`);
            notifyUserLimitReached(site);
            delete siteLimits[site];
            chrome.storage.local.set({ siteLimits: siteLimits });
          }
        }
      }
    });
  });
}



// Function to notify user with a dialog box if usage limit is exceeded
function notifyUserLimitReached(siteUrl) {
  const dialogMessage = `You've reached the time limit for ${siteUrl}. Choose an action:`;
  console.log(`Limit reached for: ${siteUrl}`);

  chrome.tabs.query({ url: `*://${siteUrl}/*` }, function (tabs) {
    if (tabs.length > 0) {
      tabs.forEach(tab => {
        console.log(`Sending message to tab ID: ${tab.id}`);
        chrome.tabs.sendMessage(tab.id, { 
          action: "showLimitAlert", 
          message: dialogMessage, 
          siteUrl: siteUrl 
        }, function(response) {
          if (chrome.runtime.lastError) {
            console.error("Error sending message to content script:", chrome.runtime.lastError.message);
          } else {
            console.log("Message sent successfully:", response);
          }
        });
      });
    } else {
      console.log('No active tabs for the site found');
    }
  });
}


