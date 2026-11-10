# Deployment & Distribution Guide

Complete step-by-step guide to deploy, distribute, and install the 2CanPlay AI Assistant.

---

## 📋 Table of Contents

1. [Push to GitHub](#1-push-to-github)
2. [Install on Chrome (Developer Mode)](#2-install-on-chrome-developer-mode)
3. [Share with Others (GitHub)](#3-share-with-others-github)
4. [Publish to Chrome Web Store](#4-publish-to-chrome-web-store-optional)
5. [Host Documentation (Optional)](#5-host-documentation-optional)

---

## 1. Push to GitHub

### Step 1.1: Initialize Git Repository

```bash
cd /Users/mac/Documents/project_folder/2canplayscript

# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: 2CanPlay AI Assistant with High-Accuracy Mode"
```

### Step 1.2: Create GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click the **"+"** icon → **"New repository"**
3. Fill in:
   - **Repository name**: `2canplay-ai-assistant`
   - **Description**: `AI-powered trivia assistant for 2CanPlay with multi-stage verification`
   - **Visibility**: 
     - ✅ **Public** (if you want to share)
     - 🔒 **Private** (if you want to keep it private)
   - ⚠️ **Don't** initialize with README (we already have one)
4. Click **"Create repository"**

### Step 1.3: Connect and Push

GitHub will show you commands. Use these:

```bash
# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/2canplay-ai-assistant.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 1.4: Verify Upload

1. Refresh your GitHub repository page
2. You should see all files uploaded
3. README.md will be displayed automatically

✅ **Done!** Your code is now on GitHub.

---

## 2. Install on Chrome (Developer Mode)

This is how **you** install it on your own computer.

### Step 2.1: Prepare Extension

Your extension is already ready! It's in:
```
/Users/mac/Documents/project_folder/2canplayscript/
```

### Step 2.2: Open Chrome Extensions Page

**Method 1**: Type in address bar
```
chrome://extensions/
```

**Method 2**: Menu
1. Click **three dots** (⋮) in Chrome
2. **More tools** → **Extensions**

### Step 2.3: Enable Developer Mode

1. Look for **"Developer mode"** toggle in top-right corner
2. **Turn it ON** (should be blue/enabled)

### Step 2.4: Load Extension

1. Click **"Load unpacked"** button (appears after enabling Developer mode)
2. Navigate to `/Users/mac/Documents/project_folder/2canplayscript/`
3. Select that folder (don't go inside, select the folder itself)
4. Click **"Select"** or **"Open"**

### Step 2.5: Configure Extension

1. Extension appears in your extensions list
2. Click the **extension icon** in Chrome toolbar (puzzle piece icon)
3. Find "2CanPlay AI Assistant" and click it
4. Enter your **OpenAI API Key**
5. Select **GPT-4o** model
6. Choose **Strict** verification mode
7. Click **"Save Settings"**

### Step 2.6: Test It

1. Visit [2canplay.ng](https://2canplay.ng)
2. Start a trivia game
3. Watch for the floating AI panel when questions appear

✅ **Done!** Extension is now working on your Chrome.

---

## 3. Share with Others (GitHub)

Once your extension is on GitHub, others can download and install it.

### Step 3.1: Update README with Installation Instructions

Your README.md already has installation instructions. Make sure the GitHub URL is correct.

### Step 3.2: Create a Release (Optional but Recommended)

1. Go to your GitHub repository
2. Click **"Releases"** (right sidebar)
3. Click **"Create a new release"**
4. Fill in:
   - **Tag**: `v1.0.0`
   - **Release title**: `v1.0.0 - Initial Release (High-Accuracy Mode)`
   - **Description**:
     ```
     ## 2CanPlay AI Assistant v1.0.0
     
     AI-powered trivia assistant with multi-stage verification.
     
     ### Features
     - Multi-stage AI verification (Strict/Balanced/Fast modes)
     - 95%+ accuracy target in strict mode
     - Question caching
     - Verification badges
     
     ### Installation
     1. Download the ZIP file below
     2. Extract it
     3. Follow INSTALLATION.md instructions
     
     ### Requirements
     - Google Chrome
     - OpenAI API key
     ```
5. Click **"Publish release"**

### Step 3.3: Share the Link

Share this link with others:
```
https://github.com/YOUR_USERNAME/2canplay-ai-assistant
```

### For Others to Install

**Option A: Clone with Git**
```bash
git clone https://github.com/YOUR_USERNAME/2canplay-ai-assistant.git
cd 2canplay-ai-assistant
```
Then follow [Installation Instructions](#2-install-on-chrome-developer-mode)

**Option B: Download ZIP**
1. Go to GitHub repository
2. Click green **"Code"** button
3. Click **"Download ZIP"**
4. Extract ZIP file
5. Follow [Installation Instructions](#2-install-on-chrome-developer-mode)

✅ **Done!** Others can now download and use your extension.

---

## 4. Publish to Chrome Web Store (Optional)

If you want to distribute widely (anyone can install with one click).

⚠️ **Note**: This requires:
- One-time $5 developer registration fee
- Review process (1-3 days)
- Better icons (current ones are placeholders)

### Step 4.1: Prepare for Submission

#### Create Better Icons (Required)

Current icons are simple placeholders. Create professional icons:

1. **Design Requirements**:
   - 16x16px (toolbar)
   - 48x48px (management page)
   - 128x128px (web store)
   - PNG format
   - Transparent background recommended

2. **Tools to Create Icons**:
   - [Canva](https://www.canva.com) - Free, easy
   - [Figma](https://www.figma.com) - Professional
   - [GIMP](https://www.gimp.org) - Free Photoshop alternative
   - [Favicon.io](https://favicon.io) - Quick generator

3. **Replace Icons**:
   - Put new icons in `icons/` folder
   - Keep filenames: `icon16.png`, `icon48.png`, `icon128.png`

#### Create Promotional Images

For Chrome Web Store listing:

1. **Small promotional tile** (440x280px)
2. **Screenshots** (1280x800px or 640x400px)
   - Show the extension in action
   - At least 1, recommend 3-5

### Step 4.2: Register as Chrome Developer

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. **Sign in** with Google account
3. **Pay $5 registration fee** (one-time, lifetime)
4. Fill in developer information

### Step 4.3: Prepare ZIP Package

```bash
cd /Users/mac/Documents/project_folder/2canplayscript

# Create ZIP (exclude unnecessary files)
zip -r 2canplay-ai-assistant-v1.0.0.zip . \
  -x "*.git*" \
  -x "*.DS_Store" \
  -x "*.md" \
  -x "create_*.py" \
  -x "create_*.sh"

# Or manually:
# - Select all files in the folder
# - Right-click → "Compress"
# - Rename to 2canplay-ai-assistant-v1.0.0.zip
```

**Important**: The ZIP should contain files directly, NOT a folder:
```
✅ CORRECT:
  manifest.json
  background.js
  content.js
  ...

❌ WRONG:
  2canplayscript/
    manifest.json
    background.js
    ...
```

### Step 4.4: Submit to Chrome Web Store

1. Go to [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **"New Item"**
3. **Upload ZIP file**
4. Fill in **Store Listing**:

   **Product Details**:
   - **Name**: `2CanPlay AI Assistant`
   - **Summary**: `AI-powered trivia assistant with multi-stage verification for maximum accuracy`
   - **Description**: (Copy from README.md, make it compelling)
   - **Category**: `Productivity`
   - **Language**: `English (United States)`

   **Graphic Assets**:
   - Upload promotional images
   - Upload screenshots

   **Privacy**:
   - **Single purpose**: `Assist with trivia questions using AI`
   - **Permissions justification**: Explain why you need each permission
   - **Privacy policy**: Required if collecting data
     - You're NOT collecting data, but still write a simple policy
     - Can host on GitHub as `PRIVACY_POLICY.md`

   **Distribution**:
   - **Visibility**: Public or Unlisted
   - **Pricing**: Free
   - **Regions**: Select countries

5. Click **"Submit for Review"**

### Step 4.5: Wait for Approval

- Review takes **1-3 days** typically
- Check email for updates
- May request changes if issues found

### Step 4.6: After Approval

Once approved:
- Extension gets a Chrome Web Store URL
- Users can install with one click
- Automatic updates when you publish new versions

✅ **Done!** Extension is publicly available.

---

## 5. Host Documentation (Optional)

Host your documentation as a website (free).

### Option A: GitHub Pages (Easiest)

1. **Create `docs/` folder** in your repository:
   ```bash
   mkdir docs
   cp README.md docs/index.md
   cp INSTALLATION.md USAGE.md ACCURACY_GUIDE.md docs/
   ```

2. **Enable GitHub Pages**:
   - Go to repository **Settings**
   - Scroll to **Pages** section
   - **Source**: Select `main` branch and `/docs` folder
   - Click **Save**

3. **Your docs URL**:
   ```
   https://YOUR_USERNAME.github.io/2canplay-ai-assistant/
   ```

### Option B: GitBook (Professional)

1. Go to [GitBook.com](https://www.gitbook.com)
2. Sign up free
3. Import from GitHub
4. Organize your docs
5. Publish

### Option C: Netlify/Vercel (Advanced)

For custom documentation site with features.

✅ **Done!** Documentation is now hosted.

---

## 📊 Quick Reference: What Goes Where

| Item | Location | Purpose |
|------|----------|---------|
| **Source Code** | GitHub | Version control, sharing |
| **Developer Install** | Chrome Extensions Page | Testing, personal use |
| **Public Distribution** | Chrome Web Store | Easy install for everyone |
| **Documentation** | GitHub Pages / GitBook | Help users |
| **Support** | GitHub Issues | Track bugs, requests |

---

## 🚀 Recommended Workflow

### For Personal Use (Now)
```
1. ✅ Already done: Extension is built
2. ⏭️ Next: Push to GitHub (backup)
3. ⏭️ Next: Install on Chrome
4. ⏭️ Next: Test on 2canplay.ng
5. ⏭️ Next: Get OpenAI API key and configure
```

### For Sharing (Later)
```
1. Test thoroughly yourself
2. Push to GitHub
3. Create release
4. Share GitHub link with friends
5. They download and install
```

### For Public Release (Much Later)
```
1. Create professional icons
2. Create screenshots
3. Write privacy policy
4. Register as Chrome developer ($5)
5. Submit to Chrome Web Store
6. Wait for approval
7. Share Web Store link publicly
```

---

## 🎯 Your Next Steps (Right Now)

### Immediate (Next 10 Minutes)

1. **Push to GitHub** (backup your work)
   ```bash
   cd /Users/mac/Documents/project_folder/2canplayscript
   git init
   git add .
   git commit -m "Initial commit: High-Accuracy AI Assistant"
   # Then create GitHub repo and push
   ```

2. **Install on Chrome** (test it yourself)
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Load unpacked extension
   - Configure with API key

3. **Test on 2canplay.ng**
   - Visit the site
   - Start a game
   - Verify extension works

### Short-term (This Week)

1. **Get OpenAI API Key**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create API key
   - Add credits to account

2. **Test Thoroughly**
   - Try all three modes (Strict/Balanced/Fast)
   - Test different question types
   - Verify accuracy

3. **Document Issues**
   - Note any problems
   - Check console for errors
   - Adjust selectors if needed for 2canplay.ng

### Long-term (Optional)

1. **Share with Friends** (if you want)
   - Send them GitHub link
   - They follow installation guide

2. **Publish to Web Store** (if you want public distribution)
   - Create better icons
   - Submit to Chrome Web Store
   - Wait for approval

---

## ❓ FAQs

### Do I need to host the extension somewhere?

**No.** Chrome extensions are installed locally. You don't need a server.

- **For you**: Install from local folder
- **For others**: They download from GitHub and install locally
- **For public**: Chrome Web Store hosts it (after approval)

### Can people use it without Chrome Web Store?

**Yes!** Anyone can:
1. Download from your GitHub
2. Install in Developer mode
3. Use the extension

Chrome Web Store just makes it easier (one-click install).

### Do I need to pay for hosting?

**No.** Everything is free:
- GitHub: Free
- Chrome extension hosting: Free (just local files)
- Chrome Web Store: $5 one-time fee (optional, only for public listing)
- GitHub Pages: Free (optional, for documentation)

### What if the 2canplay.ng website changes?

The extension uses DOM selectors that might break if the website changes. You would need to:
1. Update the selectors in `content.js`
2. Push changes to GitHub
3. Users reload the extension

---

## 📞 Support

If you need help:
- Check INSTALLATION.md for detailed steps
- Check TROUBLESHOOTING.md for common issues
- Check console (F12) for errors
- Create GitHub issue if something breaks

---

**You're ready to deploy! Start with pushing to GitHub and installing on Chrome.** 🚀
