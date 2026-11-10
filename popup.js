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
  document.getElementById('aiProvider').addEventListener('change', (e) => {
    updateProviderUI(e.target.value);
  });
});

async function loadSettings() {
  const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
  
  if (response.success && response.data) {
    const settings = response.data;
    
    document.getElementById('enabledToggle').checked = settings.enabled !== false;
    document.getElementById('apiKey').value = settings.apiKey || '';
    
    const provider = settings.aiProvider || 'openai';
    document.getElementById('aiProvider').value = provider;
    
    // 1. FIRST update provider UI so the model options exist in the select!
    updateProviderUI(provider);
    
    // 2. NOW set the saved model value on the populated select!
    if (settings.model) {
      document.getElementById('modelSelect').value = settings.model;
    }
    
    document.getElementById('verificationMode').value = settings.verificationMode || 'balanced';
    document.getElementById('showConfidence').checked = settings.showConfidence !== false;
    document.getElementById('showExplanation').checked = settings.showExplanation !== false;
    document.getElementById('useVerification').checked = settings.useVerification !== false;
    document.getElementById('autoClick').checked = settings.autoClick === true;
  }
}

/**
 * Update UI elements based on selected AI provider
 */
function updateProviderUI(provider) {
  const modelSelect = document.getElementById('modelSelect');
  const modelHelper = document.getElementById('modelHelper');
  const apiKeyHelper = document.getElementById('apiKeyHelper');
  const apiKeyLink = document.getElementById('apiKeyLink');
  
  // Clear existing options
  modelSelect.innerHTML = '';
  
  if (provider === 'gemini') {
    // Gemini models
    modelSelect.innerHTML = `
      <option value="gemini-pro">Gemini Pro (FREE - Recommended)</option>
      <option value="gemini-1.5-flash">Gemini 1.5 Flash (FREE - Faster)</option>
      <option value="gemini-1.5-pro">Gemini 1.5 Pro (FREE - Most Capable)</option>
    `;
    modelHelper.textContent = 'Gemini Pro is FREE with generous quota (60 requests/min)';
    apiKeyHelper.innerHTML = 'Get your FREE API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" id="apiKeyLink">Google AI Studio</a>';
  } else {
    // OpenAI models
    modelSelect.innerHTML = `
      <option value="gpt-4o">GPT-4o (Best Balance)</option>
      <option value="gpt-4o-mini">GPT-4o Mini (Faster, Lower Cost)</option>
      <option value="gpt-4-turbo">GPT-4 Turbo (Highest Accuracy)</option>
    `;
    modelHelper.textContent = '⚠️ Accuracy is critical - GPT-4o or better recommended';
    apiKeyHelper.innerHTML = 'Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" id="apiKeyLink">OpenAI</a> (requires payment)';
  }
}

async function saveSettings() {
  const aiProvider = document.getElementById('aiProvider').value;
  const apiKey = document.getElementById('apiKey').value.trim();
  
  const settings = {
    enabled: document.getElementById('enabledToggle').checked,
    aiProvider: aiProvider,
    apiKey: apiKey,
    model: document.getElementById('modelSelect').value,
    verificationMode: document.getElementById('verificationMode').value,
    useVerification: document.getElementById('useVerification').checked,
    showConfidence: document.getElementById('showConfidence').checked,
    showExplanation: document.getElementById('showExplanation').checked,
    autoClick: document.getElementById('autoClick').checked,
    panelPosition: 'top-right',
    timeout: 8000
  };
  
  // Validate API key
  if (!apiKey) {
    showSaveStatus('Please enter an API key', 'error');
    return;
  }
  
  // Validate based on provider (more flexible)
  if (aiProvider === 'openai') {
    if (!apiKey.startsWith('sk-')) {
      showSaveStatus('⚠️ OpenAI API keys typically start with sk-. Double-check your key.', 'error');
      return;
    }
  }
  
  if (aiProvider === 'gemini') {
    if (apiKey.length < 20) {
      showSaveStatus('⚠️ API key seems too short. Please check your key.', 'error');
      return;
    }
  }
  
  if (settings.verificationMode === 'strict') {
    const providerName = aiProvider === 'gemini' ? 'Gemini (FREE!)' : 'OpenAI';
    showSaveStatus(`Strict mode enabled with ${providerName} - expect 3-4s response time`, 'success');
  } else if (settings.verificationMode === 'fast') {
    showSaveStatus('⚠️ Fast mode: Lower accuracy. Consider Strict or Balanced for critical games.', 'success');
  }
  
  const response = await chrome.runtime.sendMessage({ 
    action: 'saveSettings', 
    data: settings 
  });
  
  if (response.success) {
    // Notify active tabs about settings change
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdated', settings });
    }

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
