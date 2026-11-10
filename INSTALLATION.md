# Installation Guide

## Prerequisites

Before installing the 2CanPlay AI Assistant, ensure you have:

1. **Google Chrome Browser** (latest version recommended)
2. **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/api-keys)
   - You'll need an OpenAI account with available credits
   - The extension uses GPT-4o-mini by default (very cost-effective)

## Step-by-Step Installation

### 1. Download the Extension

Clone or download this repository to your local machine:

**Option A: Using Git**
```bash
git clone https://github.com/Thobatech31/2canplayscript.git
cd 2canplayscript
```

**Option B: Download ZIP**
1. Visit https://github.com/Thobatech31/2canplayscript
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. Extract the ZIP file to a folder on your computer

### 2. Load Extension in Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/` in your address bar
3. Enable **Developer mode** by toggling the switch in the top-right corner
4. Click the **"Load unpacked"** button
5. Navigate to and select the `2canplayscript` folder
6. The extension should now appear in your extensions list

### 3. Pin the Extension (Optional but Recommended)

1. Click the puzzle piece icon in Chrome's toolbar
2. Find "2CanPlay AI Assistant" in the list
3. Click the pin icon to pin it to your toolbar for easy access

### 4. Configure the Extension

1. Click the extension icon in your toolbar
2. Enter your **OpenAI API Key** in the settings
3. Select your preferred AI model:
   - **GPT-4o Mini** - Fastest and cheapest (recommended)
   - **GPT-4o** - Balanced performance
   - **GPT-4 Turbo** - Most accurate but slower
4. Configure display options:
   - ✓ Show confidence level
   - ✓ Show explanation
5. Click **"Save Settings"**
6. Ensure the **"Enable Assistant"** toggle is ON

### 5. Test the Extension

1. Visit [2canplay.ng](https://2canplay.ng)
2. Start a trivia game
3. When a question appears, the AI assistant panel should automatically show up
4. The panel will display the AI's suggested answer with confidence level

## Troubleshooting Installation

### Extension Not Loading

**Problem**: Error when loading unpacked extension

**Solutions**:
- Ensure you selected the correct folder (should contain manifest.json)
- Check that all files are present (manifest.json, background.js, content.js, etc.)
- Look for error messages in chrome://extensions/ and address them

### Extension Loaded But Not Working

**Problem**: Extension appears in Chrome but doesn't work on 2CanPlay

**Solutions**:
- Refresh the 2canplay.ng page after loading the extension
- Check that the extension is enabled in the popup
- Verify your API key is correct and has credits
- Open Developer Tools (F12) and check the Console for errors

### API Key Issues

**Problem**: "API key not configured" or authentication errors

**Solutions**:
- Verify your API key starts with `sk-`
- Ensure the key is active on your OpenAI account
- Check your OpenAI account has available credits
- Try generating a new API key from OpenAI dashboard

### Floating Panel Not Appearing

**Problem**: No assistant panel shows up during gameplay

**Solutions**:
- Check extension is enabled in popup
- Reload the 2canplay.ng page
- Check browser console (F12) for JavaScript errors
- Ensure content script has permission to run (check chrome://extensions/)

### Questions Not Being Detected

**Problem**: Panel appears but doesn't detect questions

**Solutions**:
- The website structure may have changed
- Check browser console for detection errors
- Wait a moment after question appears (detection runs every 1 second)
- Ensure the question has multiple-choice options visible

## Updating the Extension

When updates are available:

1. Download/pull the latest version
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Your settings will be preserved

## Uninstalling

To remove the extension:

1. Go to `chrome://extensions/`
2. Find "2CanPlay AI Assistant"
3. Click **"Remove"**
4. Confirm removal

Your settings and question history are stored in Chrome's local storage and will be deleted.

## Next Steps

After installation, check out:
- [README.md](README.md) - Full feature documentation
- [USAGE.md](USAGE.md) - Detailed usage guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions

## Security Notes

- Your API key is stored locally in Chrome's secure storage
- The extension only reads publicly visible content from 2canplay.ng
- No data is sent to servers other than OpenAI's API
- The extension does not interact with private game APIs

## Support

If you encounter issues not covered here:
1. Check the [TROUBLESHOOTING.md](TROUBLESHOOTING.md) guide
2. Look for existing issues in the repository
3. Create a new issue with:
   - Chrome version
   - Extension version
   - Console error messages (if any)
   - Steps to reproduce the problem
