/**
 * Popup script for 2CanPlay AI Assistant
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  await loadSettings();
  
  // Update status
  updateStatus();
  
  // Load stats
  loadStats();
  
  // Event listeners
  document.getElementById('enabledToggle').addEventListener('change', handleToggle);
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('viewHistory').addEventListener('click', viewHistory);
});

async function loadSettings() {
  const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
  
  if (response.success && response.data) {
    const settings = response.data;
    
    document.getElementById('enabledToggle').checked = settings.enabled !== false;
    document.getElementById('apiKey').value = settings.apiKey || '';
    document.getElementById('modelSelect').value = settings.model || 'gpt-4o';
    document.getElementById('verificationMode').value = settings.verificationMode || 'strict';
    document.getElementById('showConfidence').checked = settings.showConfidence !== false;
    document.getElementById('showExplanation').checked = settings.showExplanation !== false;
    document.getElementById('useVerification').checked = settings.useVerification !== false;
  }
}

async function saveSettings() {
  const settings = {
    enabled: document.getElementById('enabledToggle').checked,
    apiKey: document.getElementById('apiKey').value.trim(),
    model: document.getElementById('modelSelect').value,
    verificationMode: document.getElementById('verificationMode').value,
    useVerification: document.getElementById('useVerification').checked,
    showConfidence: document.getElementById('showConfidence').checked,
    showExplanation: document.getElementById('showExplanation').checked,
    panelPosition: 'top-right',
    timeout: 8000
  };
  
  // Validate API key
  if (!settings.apiKey) {
    showSaveStatus('Please enter an API key', 'error');
    return;
  }
  
  if (!settings.apiKey.startsWith('sk-')) {
    showSaveStatus('Invalid API key format', 'error');
    return;
  }
  
  // Warn about verification mode
  if (settings.verificationMode === 'strict') {
    showSaveStatus('Strict mode enabled - expect 4-6s response time but highest accuracy', 'success');
  } else if (settings.verificationMode === 'fast') {
    showSaveStatus('⚠️ Fast mode: Lower accuracy. Consider Strict or Balanced for critical games.', 'success');
  }
  
  const response = await chrome.runtime.sendMessage({ 
    action: 'saveSettings', 
    data: settings 
  });
  
  if (response.success) {
    setTimeout(() => {
      showSaveStatus('Settings saved successfully!', 'success');
      updateStatus();
    }, 100);
  } else {
    showSaveStatus('Failed to save settings', 'error');
  }
}

function showSaveStatus(message, type) {
  const statusEl = document.getElementById('saveStatus');
  statusEl.textContent = message;
  statusEl.className = `save-status ${type}`;
  
  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'save-status';
  }, 3000);
}

async function handleToggle(e) {
  const enabled = e.target.checked;
  
  // Save the toggle state
  const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
  if (response.success && response.data) {
    const settings = { ...response.data, enabled };
    await chrome.runtime.sendMessage({ action: 'saveSettings', data: settings });
  }
  
  // Notify content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleAssistant', enabled });
  }
  
  updateStatus();
}

async function updateStatus() {
  const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  
  if (response.success && response.data) {
    const settings = response.data;
    const isEnabled = settings.enabled !== false;
    const hasApiKey = settings.apiKey && settings.apiKey.length > 0;
    
    if (isEnabled && hasApiKey) {
      statusDot.className = 'status-dot active';
      statusText.textContent = 'Active';
    } else if (isEnabled && !hasApiKey) {
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'API key required';
    } else {
      statusDot.className = 'status-dot inactive';
      statusText.textContent = 'Disabled';
    }
  } else {
    statusDot.className = 'status-dot inactive';
    statusText.textContent = 'Error loading settings';
  }
}

async function loadStats() {
  chrome.storage.local.get(['questionHistory'], (result) => {
    const history = result.questionHistory || [];
    
    // Calculate stats
    const questionsProcessed = history.length;
    let totalTime = 0;
    
    history.forEach(q => {
      if (q.processingTime) {
        totalTime += q.processingTime;
      }
    });
    
    const avgTime = questionsProcessed > 0 ? Math.round(totalTime / questionsProcessed) : 0;
    
    // Update UI
    document.getElementById('questionsProcessed').textContent = questionsProcessed;
    document.getElementById('avgResponseTime').textContent = avgTime > 0 ? `${avgTime}ms` : '-';
  });
}

function viewHistory() {
  chrome.storage.local.get(['questionHistory'], (result) => {
    const history = result.questionHistory || [];
    
    if (history.length === 0) {
      alert('No question history available yet.');
      return;
    }
    
    // Create a simple history view
    let historyText = '=== QUESTION HISTORY ===\n\n';
    
    history.slice(-10).reverse().forEach((q, index) => {
      historyText += `Question ${q.questionNumber || index + 1}:\n`;
      historyText += `${q.question}\n\n`;
      historyText += `AI Suggestion: ${q.suggestedOption} - ${q.suggestedAnswer}\n`;
      historyText += `Confidence: ${q.confidence}\n`;
      historyText += `Time: ${q.processingTime}ms\n`;
      historyText += `---\n\n`;
    });
    
    // For now, show in alert (can be improved with a modal)
    alert(historyText);
  });
}
