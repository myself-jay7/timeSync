document.addEventListener("DOMContentLoaded", function () {
    const scheduledSitesTableBody = document.getElementById("scheduled-sites-tbody");
    const tasksTableBody = document.getElementById("tasks-tbody");
    const usageTableBody = document.getElementById("usage-tbody");
    const addScheduledSiteBtn = document.getElementById("add-scheduled-site-btn");
    const addTaskBtn = document.getElementById("add-task-btn");
    const checkUsageBtn = document.getElementById("check-usage-btn");
    const setLimitBtn = document.getElementById("set-limit-btn");
    const usageSection = document.querySelector(".usage-section");
  
    loadData();
    usageSection.style.display = "none"; 
    setLimitBtn.style.display = "none"; 
  
    addScheduledSiteBtn.addEventListener("click", openAddScheduledSiteModal);
    addTaskBtn.addEventListener("click", openAddTaskModal);
    checkUsageBtn.addEventListener("click", checkUsage);
    setLimitBtn.addEventListener("click", setLimit);
  
    function openAddScheduledSiteModal() {
      const modal = document.getElementById("add-scheduled-site-modal");
      modal.style.display = "block";
    }
  
    function openAddTaskModal() {
      const modal = document.getElementById("add-task-modal");
      modal.style.display = "block";
    }
  
    window.addEventListener("click", function (event) {
      const modal = document.getElementById("add-scheduled-site-modal");
      const taskModal = document.getElementById("add-task-modal");
      if (event.target === modal) {
        closeAddScheduledSiteModal();
      }
      if (event.target === taskModal) {
        closeAddTaskModal();
      }
    });
  
    function loadData() {
      chrome.storage.local.get(["scheduledSites", "tasks", "siteLimits"], function (result) {
        const scheduledSites = result.scheduledSites || [];
        const tasks = result.tasks || [];
        const siteLimits = result.siteLimits || {};
  
        scheduledSitesTableBody.innerHTML = '';
        tasksTableBody.innerHTML = '';
        usageTableBody.innerHTML = '';
  
        scheduledSites.forEach((site) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${site.name}</td>
            <td>${site.url}</td>
            <td>${site.time}</td>
            <td>${site.date}</td>
            <td>${site.repetition}</td>
            <td><button class="remove-scheduled-site-btn" data-url="${site.url}">X</button></td> <!-- New Remove Button -->
          `;
          scheduledSitesTableBody.appendChild(row);
        });
  
        // Populate tasks table
        tasks.forEach((task) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${task.description}</td>
            <td>${task.time}</td>
            <td>${task.date}</td>
            <td><button class="remove-task-btn" data-description="${task.description}">X</button></td> <!-- New Remove Button -->
          `;
          tasksTableBody.appendChild(row);
        });
  
        // Populate usage table
        for (const [site, limit] of Object.entries(siteLimits)) {
          const row = document.createElement("tr");
          const timeLeft = limit.maxTime - (limit.usedTime || 0);
          row.innerHTML = `
            <td>${site}</td>
            <td>${limit.maxTime}</td>
            <td>${timeLeft > 0 ? timeLeft : 0}</td>
            <td><button class="remove-limit-btn" data-site="${site}">X</button></td> <!-- New Remove Button -->
          `;
          usageTableBody.appendChild(row);
        }
  
        document.querySelectorAll(".remove-scheduled-site-btn").forEach(button => {
          button.addEventListener("click", function() {
            const siteUrl = button.getAttribute("data-url");
            removeScheduledSite(siteUrl);
          });
        });
  
        document.querySelectorAll(".remove-task-btn").forEach(button => {
          button.addEventListener("click", function() {
            const taskDescription = button.getAttribute("data-description");
            removeTask(taskDescription);
          });
        });
  
        document.querySelectorAll(".remove-limit-btn").forEach(button => {
          button.addEventListener("click", function() {
            const site = button.getAttribute("data-site");
            removeLimit(site);
          });
        });
      });
    }
  
    function removeScheduledSite(siteUrl) {
      chrome.storage.local.get("scheduledSites", function (result) {
        let scheduledSites = result.scheduledSites || [];
        scheduledSites = scheduledSites.filter(site => site.url !== siteUrl);
        chrome.storage.local.set({ scheduledSites }, function () {
          loadData();
        });
      });
    }
  
    function removeTask(taskDescription) {
      chrome.storage.local.get("tasks", function (result) {
        let tasks = result.tasks || [];
        tasks = tasks.filter(task => task.description !== taskDescription);
        chrome.storage.local.set({ tasks }, function () {
          loadData();
        });
      });
    }
  
    function removeLimit(site) {
      chrome.storage.local.get("siteLimits", function (result) {
        const siteLimits = result.siteLimits || {};
        delete siteLimits[site]; 
        chrome.storage.local.set({ siteLimits }, function () {
          loadData(); 
        });
      });
    }
  
    function checkUsage() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const activeTab = tabs[0];
        const currentSite = new URL(activeTab.url).hostname;
        const usageSection = document.querySelector(".usage-section");
        const usageTableBody = document.getElementById("usage-tbody");
        usageTableBody.innerHTML = "";
  
        chrome.storage.local.get("siteLimits", function (result) {
          const siteLimits = result.siteLimits || {};
  
          for (const [site, limit] of Object.entries(siteLimits)) {
            const row = document.createElement("tr");
            const timeLeft = limit.maxTime - (limit.usedTime || 0);
            row.innerHTML = `
              <td>${site}</td>
              <td>${limit.maxTime || 0}</td>
              <td>${timeLeft > 0 ? timeLeft : 0}</td>
              <td><button class="remove-limit-btn" data-site="${site}">X</button></td> <!-- New Remove Button -->
            `;
            usageTableBody.appendChild(row);
          }
  
          document.querySelectorAll(".remove-limit-btn").forEach(button => {
            button.addEventListener("click", function() {
              const site = button.getAttribute("data-site");
              removeLimit(site);
            });
          });
  
          usageSection.style.display = "block";
          setLimitBtn.style.display = "block";
  
          checkUsageBtn.style.display = "none";
        });
      });
    }
  
    function setLimit() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const activeTab = tabs[0];
        const currentSite = new URL(activeTab.url).hostname;
  
        const limitTime = prompt(`Set time limit for ${currentSite} in minutes:`);
        if (limitTime && !isNaN(limitTime)) {
          chrome.storage.local.get("siteLimits", function (result) {
            const siteLimits = result.siteLimits || {};
            
            if (!siteLimits[currentSite]) {
              siteLimits[currentSite] = { maxTime: parseInt(limitTime), usedTime: 0 };
            } else {
              siteLimits[currentSite].maxTime += parseInt(limitTime);
            }
            
            chrome.storage.local.set({ siteLimits }, function () {
              alert(`Time limit set for ${currentSite}: ${limitTime} minutes.`);
              loadData();
            });
          });
        }
      });
    }
  
    document.getElementById("add-scheduled-site-form").addEventListener("submit", addScheduledSite);
    document.getElementById("add-task-form").addEventListener("submit", addTask);
  
    function addScheduledSite(event) {
      event.preventDefault();
      const siteName = document.getElementById("site-name").value;
      const siteUrl = document.getElementById("site-url").value;
      const siteTime = document.getElementById("site-time").value;
      const siteDate = document.getElementById("site-date").value;
      const siteRepetition = document.getElementById("site-repetition").value;
  
      const scheduledSite = { name: siteName, url: siteUrl, time: siteTime, date: siteDate, repetition: siteRepetition };
  
      chrome.storage.local.get("scheduledSites", function (result) {
        const scheduledSites = result.scheduledSites || [];
        scheduledSites.push(scheduledSite);
        chrome.storage.local.set({ scheduledSites }, function () {
          loadData();
          closeAddScheduledSiteModal();
        });
      });
    }
  
    function addTask(event) {
      event.preventDefault();
      const taskDescription = document.getElementById("task-description").value;
      const taskTime = document.getElementById("task-time").value;
      const taskDate = document.getElementById("task-date").value;
  
      const task = { description: taskDescription, time: taskTime, date: taskDate };
  
      chrome.storage.local.get("tasks", function (result) {
        const tasks = result.tasks || [];
        tasks.push(task);
        chrome.storage.local.set({ tasks }, function () {
          loadData();
          closeAddTaskModal();
        });
      });
    }
  
    function closeAddScheduledSiteModal() {
      const modal = document.getElementById("add-scheduled-site-modal");
      modal.style.display = "none";
      document.getElementById("add-scheduled-site-form").reset();
    }
  
    function closeAddTaskModal() {
      const modal = document.getElementById("add-task-modal");
      modal.style.display = "none";
      document.getElementById("add-task-form").reset();
    }
  });