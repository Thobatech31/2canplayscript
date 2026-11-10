# Troubleshooting Guide

This guide covers common issues and their solutions.

## Extension Installation Issues

### Error: "Manifest file is missing or unreadable"

**Cause**: Wrong folder selected or manifest.json is corrupted

**Solutions**:
1. Ensure you selected the correct folder (should contain manifest.json directly)
2. Check that manifest.json is valid JSON (use a JSON validator)
3. Re-download the extension files

### Error: "Manifest version 2 is deprecated"

**Cause**: Old Chrome version

**Solutions**:
1. Update Chrome to the latest version
2. This extension uses Manifest V3, which requires Chrome 88+

### Extension Loads But Icon Is Missing

**Cause**: Icon files not present

**Solutions**:
1. Check that the `icons` folder exists with icon files
2. Create placeholder icons (see icons/README.md)
3. Extension will work without icons (just won't look pretty)

## Configuration Issues

### "API key not configured" Error

**Solutions**:
1. Open extension popup
2. Enter your OpenAI API key
3. Ensure it starts with `sk-`
4. Click "Save Settings"
5. Toggle the assistant on

### "Invalid API key format" Error

**Cause**: API key doesn't match expected format

**Solutions**:
1. OpenAI API keys start with `sk-`
2. Copy the entire key (they're quite long)
3. Don't include extra spaces or characters
4. Generate a new key from [OpenAI Platform](https://platform.openai.com/api-keys)

### Settings Not Saving

**Cause**: Chrome storage permissions issue

**Solutions**:
1. Check chrome://extensions/ permissions
2. Ensure "storage" permission is granted
3. Try reloading the extension
4. Check browser console for errors

## Question Detection Issues

### Floating Panel Not Appearing

**Possible Causes & Solutions**:

1. **Extension Not Enabled**
   - Open popup and check toggle is ON
   - Status should show "Active"

2. **Wrong Website**
   - Extension only works on 2canplay.ng
   - Check you're on the correct domain

3. **Content Script Not Loaded**
   - Refresh the page after enabling extension
   - Check chrome://extensions/ for errors
   - Reload the extension

4. **Panel Off-Screen**
   - Panel might be dragged off-screen
   - Reload extension to reset position
   - Check bottom-right corner of screen

### Panel Shows "Waiting for question..." But Question Is Visible

**Cause**: DOM selectors not matching the current website structure

**Solutions**:
1. Refresh the page
2. Wait 1-2 seconds (detection runs periodically)
3. Check browser console (F12) for JavaScript errors
4. The website structure may have changed (requires code update)

**To Debug**:
1. Open browser console (F12)
2. Look for messages from "2CanPlay AI Assistant"
3. Check if question extraction is failing
4. Report the issue with console logs

### Questions Detected Multiple Times

**Cause**: Duplicate detection due to DOM mutations

**Solutions**:
1. Extension has duplicate prevention, but it may fail if question text changes
2. Reload the extension
3. Refresh the page
4. Report persistent issues

### No Answer Options Extracted

**Symptom**: Panel shows "❌ Could not extract answer options"

**Cause**: Options not found in DOM or selector mismatch

**Solutions**:
1. Ensure question has visible multiple-choice options
2. Website structure may have changed
3. Options might be in images (not supported currently)
4. Report with screenshot of the question

## AI Processing Issues

### Very Slow Responses (>5 seconds)

**Possible Causes & Solutions**:

1. **Slow Internet Connection**
   - Check your network speed
   - Try a different network
   - Use mobile hotspot as test

2. **Model Too Complex**
   - Switch to GPT-4o Mini in settings
   - GPT-4 Turbo is slower but more accurate
   - GPT-4o Mini is fastest

3. **OpenAI API Latency**
   - Sometimes OpenAI has higher latency
   - Wait a moment and try next question
   - Check [OpenAI Status](https://status.openai.com)

### AI Errors: "Insufficient Credits"

**Cause**: OpenAI account has no credits

**Solutions**:
1. Visit [OpenAI Billing](https://platform.openai.com/account/billing)
2. Add payment method
3. Purchase credits or set up auto-recharge
4. Wait for credits to become available

### AI Errors: "Rate limit exceeded"

**Cause**: Too many requests to OpenAI API

**Solutions**:
1. Wait 1 minute before trying again
2. You may have other applications using the same API key
3. Upgrade your OpenAI plan for higher limits
4. Use a different API key if available

### AI Errors: "API request failed"

**Possible Causes & Solutions**:

1. **Invalid API Key**
   - Regenerate key in OpenAI dashboard
   - Update in extension settings

2. **Network Issue**
   - Check internet connection
   - Try disabling VPN
   - Check firewall settings

3. **OpenAI Service Down**
   - Check [OpenAI Status](https://status.openai.com)
   - Wait for service to recover

### Inaccurate Answers

**Note**: AI is not 100% accurate

**When This Happens**:
1. Check confidence level
   - Low confidence = AI is uncertain
   - Medium confidence = AI has some doubt
   - High confidence = Still not guaranteed

2. Cross-check with your knowledge
3. Use explanation to verify reasoning
4. Consider upgrading to GPT-4o or GPT-4 Turbo

**Common Accuracy Issues**:
- Recent events (AI training data has cutoff)
- Local/regional knowledge
- Ambiguous questions
- Trick questions

## Display Issues

### Panel Covers Game Options

**Solution**:
1. Click and drag the panel header
2. Move to a different corner
3. Minimize when not needed

### Panel Too Small/Large

**Current Limitation**:
- Panel size is fixed
- Future versions may add resize option

**Workaround**:
- Zoom browser in/out (Ctrl/Cmd + or -)

### Text Truncated

**For Question Text**:
- Full question is sent to AI
- Display is truncated for space
- Hover/click to see full text (future feature)

### Confidence Colors Not Showing

**Cause**: CSS not loaded properly

**Solutions**:
1. Reload extension
2. Refresh page
3. Check browser console for CSS errors

## Performance Issues

### High CPU Usage

**Cause**: MutationObserver watching DOM changes

**Solutions**:
1. This is normal during gameplay
2. Disable extension when not playing
3. CPU usage drops when page is idle

### Memory Leaks

**Symptom**: Browser becomes slow over time

**Solutions**:
1. Refresh the page periodically
2. Close other browser tabs
3. Reload the extension
4. Clear question history in storage

### Extension Slows Down Website

**Unlikely, but if it happens**:
1. Disable extension temporarily
2. Test if website is faster without it
3. Report the issue with details
4. Use extension only during actual gameplay

## Browser Compatibility Issues

### Not Working in Chromium-Based Browsers

**Supported**:
- Google Chrome (88+)
- Microsoft Edge (88+)
- Brave (tested)
- Opera (should work)

**Not Supported**:
- Firefox (different extension API)
- Safari (different extension API)

**Solutions**:
1. Use Google Chrome for best compatibility
2. Update browser to latest version

### Not Working in Incognito Mode

**Cause**: Extensions disabled in incognito by default

**Solutions**:
1. Go to chrome://extensions/
2. Find "2CanPlay AI Assistant"
3. Click "Details"
4. Enable "Allow in incognito"

**Note**: Your API key and settings will still work

## Data and Privacy Issues

### Question History Not Showing

**Cause**: No questions processed yet or storage cleared

**Solutions**:
1. Play a few games to build history
2. Check if extension is enabled
3. Questions are stored locally (not persistent across devices)

### Cannot Clear History

**Current Limitation**:
- No clear history button in MVP

**Workaround**:
1. Uninstall and reinstall extension
2. Or use Chrome DevTools:
   - Open console (F12)
   - Run: `chrome.storage.local.clear()`

### Concerns About API Key Security

**Security Measures**:
- Keys stored in Chrome's secure storage (encrypted)
- Never sent to any server except OpenAI
- Not accessible to websites
- Removed when extension is uninstalled

**Best Practices**:
1. Don't share your API key
2. Rotate keys periodically
3. Monitor usage on OpenAI dashboard
4. Revoke old keys

## Getting More Help

### Still Having Issues?

1. **Check Browser Console**:
   - Press F12
   - Go to Console tab
   - Look for errors
   - Take screenshot

2. **Check Extension Console**:
   - Go to chrome://extensions/
   - Enable Developer mode
   - Click "background page" or "service worker"
   - Check for errors

3. **Gather Information**:
   - Chrome version
   - Extension version
   - Error messages
   - Steps to reproduce
   - Screenshots

4. **Report Issue**:
   - Create GitHub issue (if applicable)
   - Include all gathered information
   - Describe expected vs actual behavior

### Temporary Workarounds

While waiting for fixes:
1. **Disable/Re-enable**: Often fixes temporary glitches
2. **Reload Extension**: Resets state
3. **Refresh Page**: Reloads content script
4. **Restart Browser**: Clears all extension state
5. **Use Different Model**: Some issues are model-specific

## Known Limitations

These are not bugs, but current limitations:

1. **No OCR Support**: Cannot read questions in images
2. **Text-Only**: Cannot analyze visual questions
3. **Single Language**: Optimized for English questions
4. **No Auto-Submit**: Manual answer selection required
5. **12-Second Window**: Must respond within game time limit
6. **DOM-Dependent**: Relies on website structure
7. **OpenAI Only**: No other AI providers yet

Future versions may address these limitations.

## Emergency Reset

If nothing else works:

1. **Complete Reset**:
   ```
   1. Uninstall extension
   2. Close Chrome completely
   3. Reopen Chrome
   4. Reinstall extension
   5. Reconfigure settings
   ```

2. **Clear All Data**:
   ```
   1. Open chrome://extensions/
   2. Remove extension
   3. Open Chrome DevTools (F12)
   4. Application tab → Storage → Clear site data
   5. Reinstall extension
   ```

This will reset everything to factory state.

---

**If you've tried everything here and still have issues, please report them with detailed information.**
