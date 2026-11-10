# 2CanPlay AI Assistant

An intelligent Chrome browser extension that helps users answer trivia questions on the 2CanPlay platform using AI-powered question analysis.

## Features

- 🤖 **Automatic Question Detection** - Monitors the game interface and detects questions as they appear
- ⚡ **Fast AI Processing** - Analyzes questions and provides answers within seconds
- 🎯 **Smart Answer Suggestions** - Evaluates multiple-choice options and suggests the most likely correct answer
- 📊 **Confidence Levels** - Shows confidence ratings (high/medium/low) for each answer
- 💡 **Explanations** - Provides brief explanations for suggested answers
- 📱 **Floating Assistant Panel** - Non-intrusive interface that doesn't block the game
- 📈 **Session Statistics** - Tracks questions processed and response times
- 🎨 **Modern UI** - Clean, gradient-styled interface with smooth animations

## Installation

### Prerequisites

- Google Chrome browser
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Steps

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd 2canplayscript
   ```

2. **Load the extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `2canplayscript` folder

3. **Configure the extension**
   - Click the extension icon in your Chrome toolbar
   - Enter your OpenAI API key
   - Select your preferred AI model (GPT-4o Mini recommended for speed)
   - Click "Save Settings"

4. **Start using**
   - Visit [2canplay.ng](https://2canplay.ng)
   - Start a trivia game
   - The AI assistant will automatically appear when questions are detected

## Usage

### Basic Operation

1. **Enable the Assistant**: Toggle on in the extension popup
2. **Play the Game**: Start any trivia game on 2CanPlay
3. **View AI Suggestions**: The floating panel will show suggested answers automatically
4. **Make Your Choice**: Review the AI suggestion and select your answer in the game

### Floating Panel Features

The floating panel displays:
- Question number and category
- Detected question text
- Suggested answer with option letter (A, B, C, D)
- Confidence level indicator
- Brief explanation
- Processing time
- Remaining countdown time

### Panel Controls

- **Drag to Move**: Click and drag the header to reposition the panel
- **Minimize**: Click the "−" button to collapse the panel
- **Always Visible**: Panel remains on screen during gameplay

## Configuration Options

### AI Settings

- **API Key**: Your OpenAI API key (required)
- **Model**: Choose between:
  - `gpt-4o-mini` - Fastest, most cost-effective (recommended)
  - `gpt-4o` - Balanced performance and accuracy
  - `gpt-4-turbo` - Most accurate (slower, more expensive)

### Display Options

- **Show Confidence**: Display confidence levels for answers
- **Show Explanation**: Display explanations for suggested answers

### Session Statistics

View in the extension popup:
- Total questions processed
- Average response time
- Question history (last 10 questions)

## Technical Architecture

### Components

1. **Manifest (manifest.json)**
   - Chrome Extension Manifest V3
   - Defines permissions and resources

2. **Background Service Worker (background.js)**
   - Manages extension lifecycle
   - Handles AI API communication
   - Stores question history
   - Processes settings

3. **Content Script (content.js)**
   - Monitors 2CanPlay website for questions
   - Extracts question and answer options
   - Manages floating panel UI
   - Prevents duplicate processing

4. **Popup Interface (popup.html/js/css)**
   - Extension settings configuration
   - Session statistics display
   - Enable/disable controls

5. **Floating Panel (floating-panel.css)**
   - Styled overlay for displaying AI suggestions
   - Draggable and minimizable
   - Responsive design

### Question Detection Flow

```
2CanPlay Website
    ↓
MutationObserver (monitors DOM changes)
    ↓
Question Extraction (text + options)
    ↓
Background Service Worker
    ↓
OpenAI API (question analysis)
    ↓
Structured Response (answer + confidence + explanation)
    ↓
Floating Panel Display
```

### DOM Extraction Strategy

The extension uses multiple selector strategies to find questions:
- `.question-text`, `[class*="question"]` - Question text
- `.option`, `[class*="option"]` - Answer options
- `.countdown`, `[class*="timer"]` - Countdown timer
- Category and question number detection

## Performance

### Target Metrics

- **Question Detection**: 95%+ accuracy
- **Response Time**: < 3 seconds (typically 1-2s with GPT-4o-mini)
- **Duplicate Prevention**: Minimal false positives

### Optimization Features

- Efficient DOM monitoring with MutationObserver
- Duplicate question detection
- Structured AI responses (JSON format)
- Local caching of question history

## Privacy & Security

- ✅ Only reads publicly displayed content
- ✅ API keys stored securely in Chrome storage
- ✅ HTTPS communication with OpenAI
- ✅ No collection of personal information
- ✅ No interaction with private game APIs

## Troubleshooting

### Extension Not Detecting Questions

1. Ensure the extension is enabled (check popup)
2. Verify you're on the correct website (2canplay.ng)
3. Refresh the page after enabling the extension
4. Check browser console for errors (F12)

### AI Not Responding

1. Verify API key is correct and active
2. Check your OpenAI account has credits
3. Try a different model
4. Check network connectivity

### Floating Panel Not Appearing

1. Check if panel is minimized (look for small bar)
2. Panel may be positioned off-screen - reload page
3. Ensure content script loaded (check Extensions page)

### Questions Processed Multiple Times

1. Extension may be loaded multiple times
2. Try disabling and re-enabling in popup
3. Refresh the page

## Development

### Project Structure

```
2canplayscript/
├── manifest.json           # Extension manifest
├── background.js          # Service worker
├── content.js            # Content script
├── popup.html            # Extension popup
├── popup.js              # Popup logic
├── popup.css             # Popup styles
├── floating-panel.css    # Floating panel styles
├── icons/                # Extension icons (to be added)
└── README.md            # This file
```

### Local Testing

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test on 2canplay.ng

### Adding Icons

Create PNG icons in the following sizes:
- 16x16 px - Toolbar icon
- 48x48 px - Extension management
- 128x128 px - Chrome Web Store

Place them in an `icons/` folder.

## Future Enhancements

- [ ] Multiple AI provider support (Anthropic, Google, etc.)
- [ ] Local question knowledge base
- [ ] Question caching for repeated questions
- [ ] Advanced category recognition
- [ ] OCR support for image-based questions
- [ ] Answer accuracy analytics
- [ ] Personalized question history with search
- [ ] Dark mode support
- [ ] Keyboard shortcuts
- [ ] Answer submission automation (optional)

## API Costs

### OpenAI Pricing (as of 2024)

- **GPT-4o-mini**: ~$0.00015 per question (recommended)
- **GPT-4o**: ~$0.0025 per question
- **GPT-4-turbo**: ~$0.01 per question

*100 questions with GPT-4o-mini ≈ $0.015*

## License

This project is provided as-is for educational and personal use.

## Disclaimer

This extension is an independent tool designed to assist with trivia questions using AI. It:
- Does not guarantee correct answers
- Should be used responsibly
- Does not violate 2CanPlay's terms (reads public content only)
- Is not affiliated with or endorsed by 2CanPlay

## Support

For issues, questions, or contributions, please open an issue in the repository.

---

**Built with ❤️ for trivia enthusiasts**
# 2canplayscript
