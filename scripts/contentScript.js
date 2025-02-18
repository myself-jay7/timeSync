chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request);

  if (request.action === "showAlert") {
    console.log("Showing alert with message:", request.message);
    showAlert(request.message);
    sendResponse({ success: true });
  } else if (request.action === "showLimitAlert") {
    console.log("Showing limit alert with message:", request.message);
    console.log("Site URL:", request.siteUrl);
    showLimitAlert(request.message, request.siteUrl);
    sendResponse({ success: true });
  }
});

function showAlert(message) {
  console.log("Showing alert with message:", message);
  const alertBox = document.createElement('div');
  alertBox.style.position = 'fixed';
  alertBox.style.top = '50%';
  alertBox.style.left = '50%';
  alertBox.style.transform = 'translate(-50%, -50%)';
  alertBox.style.zIndex = '9999';
  alertBox.style.padding = '20px 70px';
  alertBox.style.backgroundColor = '#fff';
  alertBox.style.border = '2px solid #ccc';
  alertBox.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.3)';
  alertBox.style.fontSize = '18px';
  alertBox.style.textAlign = 'center'; 
  const messageElem = document.createElement('p');
  messageElem.innerHTML = `<strong>${message}</strong>`;
  alertBox.appendChild(messageElem);

  const closeButton = document.createElement('button');
  closeButton.innerText = 'Close';
  closeButton.style.display = 'block';
  closeButton.style.margin = '20px auto 0';
  closeButton.style.padding = '7px 12px';
  closeButton.style.backgroundColor = '#1E3A5F';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '5px';
  closeButton.onclick = function () {
    alertBox.remove();
  };
  alertBox.appendChild(closeButton);

  document.body.appendChild(alertBox);
}
function showLimitAlert(message, siteUrl) {
  const alertBox = document.createElement('div');
  alertBox.style.position = 'fixed';
  alertBox.style.top = '50%';
  alertBox.style.left = '50%';
  alertBox.style.transform = 'translate(-50%, -50%)';
  alertBox.style.zIndex = '9999';
  alertBox.style.padding = '30px';
  alertBox.style.backgroundColor = '#fff';
  alertBox.style.border = '2px solid #ccc';
  alertBox.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.3)';
  alertBox.style.fontSize = '18px';
  alertBox.style.textAlign = 'center';

  const messageElem = document.createElement('p');
  messageElem.innerHTML = `<strong>${message}</strong>`;
  alertBox.appendChild(messageElem);

  const closeButton = document.createElement('button');
  closeButton.innerText = 'Close';
  closeButton.style.display = 'block';
  closeButton.style.margin = '20px auto 0';
  closeButton.style.padding = '10px 15px';
  closeButton.style.backgroundColor = '#4CAF50';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '5px';
  closeButton.style.marginRight = '10px';
  closeButton.style.display = 'inline-block';
  closeButton.onclick = function () {
    chrome.runtime.sendMessage({ action: "closeTabs", url: siteUrl });
    alertBox.remove();
  };
  alertBox.appendChild(closeButton);

  const cancelButton = document.createElement('button');
  cancelButton.innerText = 'Cancel';
  cancelButton.style.display = 'block';
  cancelButton.style.margin = '10px auto 0';
  cancelButton.style.padding = '10px 15px';
  cancelButton.style.backgroundColor = '#f44336';
  cancelButton.style.color = 'white';
  cancelButton.style.border = 'none';
  cancelButton.style.borderRadius = '5px';
  cancelButton.style.display = 'inline-block';

  cancelButton.onclick = function () {
    alertBox.remove();
  };
  alertBox.appendChild(cancelButton);

  document.body.appendChild(alertBox);
}
