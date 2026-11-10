# Installation Instructions for 2CanPlay AI Assistant

**GitHub Repository**: https://github.com/Thobatech31/2canplayscript

---

## 📦 Quick Installation Guide

### Step 1: Download the Extension

**Option A: Clone with Git**
```bash
git clone https://github.com/Thobatech31/2canplayscript.git
cd 2canplayscript
```

**Option B: Download ZIP (Easiest)**
1. Go to https://github.com/Thobatech31/2canplayscript
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. Extract the ZIP file to a folder (e.g., `Downloads/2canplayscript`)

---

### Step 2: Install on Chrome

1. Open **Google Chrome**
2. Type in address bar: **`chrome://extensions/`**
3. Turn ON **"Developer mode"** (toggle switch in top-right)
4. Click **"Load unpacked"**
5. Navigate to and select the `2canplayscript` folder (where you extracted/cloned it)
6. Click **"Select Folder"**

✅ Extension is now installed! You'll see it in your extensions list.

---

### Step 3: Get OpenAI API Key

The extension uses OpenAI's AI models, so you need an API key:

1. Visit https://platform.openai.com/api-keys
2. Sign up or log in with your account
3. Click **"Create new secret key"**
4. Give it a name (e.g., "2CanPlay Assistant")
5. **COPY THE KEY** (starts with `sk-...`)
6. Save it somewhere safe - you'll need it in the next step

⚠️ **IMPORTANT**: Add credits to your OpenAI account
- Go to https://platform.openai.com/account/billing
- Click **"Add payment method"**
- Add **$5-10 credits** (enough for 500-1000 questions in Strict mode)
- Without credits, the AI won't work!

---

### Step 4: Configure the Extension

1. Click the **puzzle piece icon** (🧩) in Chrome toolbar
2. Find **"2CanPlay AI Assistant"** in the list
3. Click on it to open the popup
4. Enter your settings:

   **API Key**: Paste your OpenAI API key (from Step 3)
   
   **AI Model**: Select **GPT-4o** (recommended for best accuracy)
   
   **Verification Mode**: Select **Strict** (highest accuracy, 4-6s response)
   - Strict = 95-98% accuracy, takes 4-6 seconds
   - Balanced = 90-95% accuracy, takes 2-4 seconds
   - Fast = 85-90% accuracy, takes 1-2 seconds
   
   **Display Options**:
   - ✅ Show confidence level
   - ✅ Show detailed explanation
   - ✅ Enable multi-stage verification
   
5. Click **"Save Settings"**
6. You should see status change to **"Active"** with a green dot

---

### Step 5: Test It Out!

1. Visit https://2canplay.ng
2. Log in to your account
3. Start a trivia game
4. Wait for a question to appear
5. The AI assistant panel should appear automatically in 4-6 seconds

**What you'll see:**
```
┌──────────────────────────────────┐
│ 🤖 AI Assistant              [−] │
├──────────────────────────────────┤
│ Q1 | Sports | ✓ VERIFIED         │
│                                  │
│ What is the primary focus of the │
│ Giller Prize?                    │
│                                  │
│ ✅ D: Canadian fiction           │
│ Confidence: HIGH                 │
│                                  │
│ ✓ Verified: The Giller Prize... │
│                                  │
│ ⚡ 4200ms      ⏱️ 8s remaining   │
└──────────────────────────────────┘
```

---

## 🎯 Understanding the Interface

### Verification Badges

- **✓ VERIFIED** (green) - AI passed multi-stage verification, high confidence
- **⚠ UNVERIFIED** (orange) - AI has concerns, use caution

### Confidence Levels

- **✅ HIGH** - Very reliable, safe to trust (especially if VERIFIED)
- **⚠️ MEDIUM** - Moderately reliable, review the explanation
- **❓ LOW** - AI is uncertain, use your own knowledge

### Strategy

```
1. Question appears (12 seconds total)
2. Wait 4-6s for AI (Strict mode)
3. Check badge: ✓ VERIFIED or ⚠ UNVERIFIED?
4. Check confidence: HIGH, MEDIUM, or LOW?
5. Read explanation: Does reasoning make sense?
6. Make decision (2-3s remaining)
7. Select answer in game
```

**Timing**: 6s AI + 3s review + 1s select = 10s (2s buffer) ✅

---

## 💰 Costs (OpenAI API)

### Per Question Cost

| Mode | Model | Cost per Question |
|------|-------|------------------|
| Strict | GPT-4o | $0.005-0.008 |
| Balanced | GPT-4o | $0.003-0.005 |
| Fast | GPT-4o-mini | $0.0002 |

### Example Costs

- **10 questions** (Strict + GPT-4o): ~$0.05-0.08
- **50 questions**: ~$0.25-0.40
- **100 questions**: ~$0.50-0.80
- **500 questions**: ~$2.50-4.00

**Very affordable!** Less than the cost of a coffee for 100 verified answers.

---

## 🔧 Troubleshooting

### Extension Not Appearing

**Problem**: Extension installed but not showing in toolbar

**Solution**:
1. Click puzzle icon (🧩) in Chrome toolbar
2. Find "2CanPlay AI Assistant"
3. Click the pin icon to pin it to toolbar

---

### Questions Not Being Detected

**Problem**: Floating panel doesn't appear when questions show

**Solutions**:
1. Refresh the 2canplay.ng page
2. Check extension is enabled (toggle in popup)
3. Open browser console (F12) and look for errors
4. The website structure might have changed - report this issue

---

### "API Key Not Configured" Error

**Problem**: Error message about API key

**Solutions**:
1. Open extension popup (click icon)
2. Verify API key is entered correctly
3. API key should start with `sk-`
4. Copy-paste again to avoid typos
5. Make sure you saved settings

---

### "Insufficient Credits" Error

**Problem**: AI not responding, credit error

**Solutions**:
1. Go to https://platform.openai.com/account/billing
2. Check your credit balance
3. Add more credits (minimum $5)
4. Wait a minute for credits to activate
5. Try again

---

### Slow Responses (More than 6 seconds)

**Problem**: Taking too long to get answers

**Solutions**:
1. Check your internet connection
2. Try switching to **Balanced mode** (faster)
3. Try **GPT-4o-mini** model (much faster but less accurate)
4. Check OpenAI status: https://status.openai.com

---

### Getting Wrong Answers

**Problem**: AI suggesting incorrect answers

**Important**: No AI is 100% accurate!

**Check**:
1. Was confidence level LOW? → Don't trust low confidence
2. Was badge ⚠ UNVERIFIED? → AI had concerns
3. Did explanation make sense? → Always review reasoning
4. Was it a recent event (2024+)? → AI training data has cutoff

**Remember**: 
- HIGH + ✓ VERIFIED = Very safe (~95%+ accuracy)
- MEDIUM or LOW = Use your judgment
- Always read the explanation

---

## 📚 Additional Documentation

For more details, check these files in the repository:

- **README.md** - Full feature list and overview
- **QUICK_START.md** - 5-minute getting started guide
- **USAGE.md** - Detailed usage during gameplay
- **ACCURACY_GUIDE.md** - How to maximize accuracy, verification modes
- **TROUBLESHOOTING.md** - Comprehensive troubleshooting guide
- **NEXT_STEPS.md** - Complete checklist and next steps

---

## 🆘 Still Having Issues?

1. Read **TROUBLESHOOTING.md** for more solutions
2. Check browser console (F12) for error messages
3. Check extension console:
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "service worker" under the extension
4. Create an issue on GitHub: https://github.com/Thobatech31/2canplayscript/issues

---

## ✅ Installation Checklist

```
[ ] Downloaded/cloned repository
[ ] Installed extension in Chrome (chrome://extensions/)
[ ] Got OpenAI API key (platform.openai.com/api-keys)
[ ] Added credits to OpenAI account ($5-10)
[ ] Configured extension with API key
[ ] Selected GPT-4o model
[ ] Enabled Strict verification mode
[ ] Tested on 2canplay.ng
[ ] Verified questions are detected
[ ] Verified AI provides answers with verification badges
```

---

## 🎉 You're Ready!

Once all steps are complete:
- Extension will automatically detect questions
- AI will provide verified answers in 4-6 seconds
- You'll see confidence levels and verification badges
- Perfect balance between speed and accuracy

**Good luck with your trivia games! 🎯🤖**

---

**Repository**: https://github.com/Thobatech31/2canplayscript  
**Issues**: https://github.com/Thobatech31/2canplayscript/issues
