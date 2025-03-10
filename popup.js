// Local storage keys
const STORAGE_KEYS = {
  HISTORY: 'copyHistory',
  SETTINGS: 'formatSettings'
};

// Default settings
const DEFAULT_SETTINGS = {
  autoFormat: true,
  separator: '\n\n',
  trim: true
};

document.addEventListener('DOMContentLoaded', async () => {
  // DOM elements
  const copyButton = document.getElementById('copyButton');
  const previewButton = document.getElementById('previewButton');
  const statusMessage = document.getElementById('statusMessage');
  const previewArea = document.getElementById('previewArea');
  const autoFormatSwitch = document.getElementById('autoFormatSwitch');
  const separatorSelect = document.getElementById('separatorSelect');
  const trimCheck = document.getElementById('trimCheck');

  // Load settings
  let settings = await loadSettings();
  
  // Update UI with settings
  autoFormatSwitch.checked = settings.autoFormat;
  separatorSelect.value = settings.separator;
  trimCheck.checked = settings.trim;

  // Show status message
  function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
    statusMessage.className = isError ? 'error' : 'success';
    
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }

  // Format text
  function formatText(text, settings) {
    if (!settings.autoFormat) return text;
    
    let formattedText = text;
    if (settings.trim) {
      formattedText = formattedText.split(settings.separator)
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .join(settings.separator);
    }
    return formattedText;
  }

  // Copy text to clipboard
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Clipboard copy error:', err);
      return false;
    }
  }

  // Get and process texts
  async function getTexts() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes('learn.deeplearning.ai')) {
      throw new Error('This extension works only on the learn.deeplearning.ai website!');
    }

    const response = await chrome.tabs.sendMessage(tab.id, { action: "copyTexts" });
    
    if (!response.success) {
      throw new Error(response.message);
    }

    return response;
  }

  // Show preview
  async function showPreview() {
    try {
      const response = await getTexts();
      const formattedText = formatText(response.text, settings);
      previewArea.textContent = formattedText;
      previewArea.style.display = 'block';
    } catch (error) {
      showStatus(error.message, true);
    }
  }

  // Copy operation
  async function copyTexts() {
    try {
      const response = await getTexts();
      const formattedText = formatText(response.text, settings);
      
      const copied = await copyToClipboard(formattedText);
      
      if (copied) {
        showStatus(response.message);
        saveToHistory(formattedText);
      } else {
        showStatus('Failed to copy to clipboard!', true);
      }
    } catch (error) {
      showStatus(error.message, true);
    }
  }

  // Save to history
  async function saveToHistory(text) {
    const history = await chrome.storage.local.get(STORAGE_KEYS.HISTORY) || [];
    history.unshift({
      text,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
    
    // Keep last 10 entries
    if (history.length > 10) {
      history.pop();
    }
    
    await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: history });
  }

  // Load settings
  async function loadSettings() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] };
  }

  // Save settings
  async function saveSettings() {
    const newSettings = {
      autoFormat: autoFormatSwitch.checked,
      separator: separatorSelect.value,
      trim: trimCheck.checked
    };
    
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: newSettings });
    settings = newSettings;
  }

  // Event Listeners
  copyButton.addEventListener('click', copyTexts);
  previewButton.addEventListener('click', showPreview);
  
  // Save setting changes
  autoFormatSwitch.addEventListener('change', saveSettings);
  separatorSelect.addEventListener('change', saveSettings);
  trimCheck.addEventListener('change', saveSettings);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.altKey) {
      switch(e.key.toLowerCase()) {
        case 'c':
          copyTexts();
          break;
        case 'p':
          showPreview();
          break;
      }
    }
  });
});
