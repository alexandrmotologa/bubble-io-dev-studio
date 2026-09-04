// Bubble Dev Studio Companion - Popup script
document.addEventListener('DOMContentLoaded', async () => {
  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const syncBtn = document.getElementById('syncBtn');

  // Check if Bubble Dev Studio bridge server is running on localhost:41890
  try {
    const res = await fetch('http://127.0.0.1:41890/status');
    const data = await res.json();
    if (data.status === 'ready') {
      statusBadge.classList.remove('disconnected');
      statusText.textContent = 'Dev Studio Connected (Port 41890)';
    } else {
      throw new Error('Unexpected status');
    }
  } catch {
    statusBadge.classList.add('disconnected');
    statusText.textContent = 'Dev Studio Not Open (Port 41890)';
  }

  // Trigger sync on active tab
  syncBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    if (!tab.url || !tab.url.includes('bubble.io')) {
      alert('Please navigate to your Bubble.io application editor first!');
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: 'trigger_sync' }, (response) => {
      if (chrome.runtime.lastError) {
        alert('Please refresh the Bubble Editor tab to activate the Companion Extension.');
      } else {
        window.close();
      }
    });
  });
});
