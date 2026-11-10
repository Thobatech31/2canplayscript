# Development Guide

This guide is for developers who want to modify, extend, or contribute to the 2CanPlay AI Assistant.

## Development Setup

### Prerequisites

- Google Chrome (latest version)
- Text editor or IDE (VS Code recommended)
- Git (for version control)
- OpenAI API key (for testing)
- Basic knowledge of JavaScript, Chrome Extensions, and APIs

### Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 2canplayscript
   ```

2. **Load extension in Chrome**
   - Navigate to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the project folder

3. **Make changes**
   - Edit files in your code editor
   - Save changes

4. **Reload extension**
   - Go to `chrome://extensions/`
   - Click the refresh icon on the extension
   - Test your changes on 2canplay.ng

## Project Architecture

### File Overview

```
content.js          → Runs on 2canplay.ng pages (question detection)
background.js       → Service worker (AI processing, storage)
popup.js            → Extension popup logic
popup.html/css      → Popup interface
floating-panel.css  → Floating assistant styling
manifest.json       → Extension configuration
```

### Communication Flow

```
┌─────────────────────┐
│   2canplay.ng Page  │
│  (DOM with question)│
└──────────┬──────────┘
           │ MutationObserver detects
           ↓
┌─────────────────────┐
│   content.js        │
│  • Extract question │
│  • Extract options  │
│  • Check duplicates │
└──────────┬──────────┘
           │ chrome.runtime.sendMessage
           ↓
┌─────────────────────┐
│   background.js     │
│  • Get settings     │
│  • Call OpenAI API  │
│  • Store history    │
└──────────┬──────────┘
           │ OpenAI API call
           ↓
┌─────────────────────┐
│   OpenAI API        │
│  • Analyze question │
│  • Return answer    │
└──────────┬──────────┘
           │ Response
           ↓
┌─────────────────────┐
│   background.js     │
│  • Process response │
└──────────┬──────────┘
           │ Return to content script
           ↓
┌─────────────────────┐
│   content.js        │
│  • Display result   │
│  • Update panel     │
└─────────────────────┘
```

## Key Components Deep Dive

### 1. Question Detection (content.js)

**Purpose**: Monitor DOM and extract question data

**Key Methods**:

```javascript
startMonitoring()
  → Sets up MutationObserver
  → Runs periodic checks (1s intervals)

checkForQuestion()
  → Calls extractQuestionData()
  → Validates and checks for duplicates
  → Triggers processQuestion()

extractQuestionData()
  → Tries multiple selectors
  → Extracts: question, options, number, countdown, category
  → Returns structured data or null

isDuplicateQuestion()
  → Compares with last processed question
  → Prevents re-processing same question
```

**Customization Points**:

To adapt to different websites or DOM changes:

```javascript
// Add new selectors in extractQuestionData()
const possibleQuestionSelectors = [
  '.question-text',        // Existing
  '.quiz-question',        // Add new ones
  '[data-question]',
  // ... your custom selectors
];
```

### 2. AI Processing (background.js)

**Purpose**: Handle AI API communication and data storage

**Key Methods**:

```javascript
handleQuestionProcessing(questionData)
  → Main orchestrator
  → Gets settings
  → Calls AI service
  → Stores history
  → Returns result

callAIService(questionData, settings)
  → Constructs API request
  → Sends to OpenAI
  → Parses response
  → Handles errors

buildAIPrompt(question, options, category)
  → Creates structured prompt
  → Formats options as A, B, C, D
  → Requests JSON response format
```

**Customization Points**:

To change AI provider or prompt:

```javascript
// Modify the prompt in buildAIPrompt()
const systemPrompt = `
You are a trivia expert specialized in [specific domain].
Analyze questions with focus on [specific criteria].
...
`;

// Change API endpoint
const response = await fetch('https://api.other-provider.com/...', {
  // ... new provider configuration
});
```

### 3. UI Components

**Floating Panel (content.js + floating-panel.css)**:

```javascript
createFloatingPanel()
  → Creates DOM elements
  → Injects styles
  → Sets up event listeners
  
makeDraggable(element)
  → Handles mouse events for dragging
  
displayResult(questionData, result)
  → Formats and displays AI response
  → Updates panel content
```

**Popup Interface (popup.js + popup.html/css)**:

```javascript
loadSettings()
  → Loads from Chrome storage
  → Populates form fields
  
saveSettings()
  → Validates input
  → Saves to Chrome storage
  → Notifies content script

loadStats()
  → Retrieves question history
  → Calculates statistics
  → Updates UI
```

## Extending the Extension

### Adding a New AI Provider

1. **Update settings** (popup.html):
   ```html
   <select id="aiProvider">
     <option value="openai">OpenAI</option>
     <option value="anthropic">Anthropic Claude</option>
     <option value="google">Google Gemini</option>
   </select>
   ```

2. **Implement provider logic** (background.js):
   ```javascript
   async function callAIService(questionData, settings) {
     if (settings.aiProvider === 'anthropic') {
       return await callAnthropic(questionData, settings);
     } else if (settings.aiProvider === 'google') {
       return await callGoogleGemini(questionData, settings);
     }
     // ... existing OpenAI logic
   }
   
   async function callAnthropic(questionData, settings) {
     // Implement Anthropic API call
   }
   ```

3. **Update manifest** for new permissions if needed:
   ```json
   {
     "host_permissions": [
       "https://api.anthropic.com/*"
     ]
   }
   ```

### Adding Question Caching

1. **Create cache structure** (background.js):
   ```javascript
   const questionCache = new Map();
   
   function getCacheKey(question, options) {
     return `${question}-${options.join('|')}`;
   }
   
   async function handleQuestionProcessing(questionData) {
     const cacheKey = getCacheKey(
       questionData.question, 
       questionData.options
     );
     
     if (questionCache.has(cacheKey)) {
       return questionCache.get(cacheKey);
     }
     
     const result = await callAIService(questionData, settings);
     questionCache.set(cacheKey, result);
     return result;
   }
   ```

2. **Add cache management**:
   ```javascript
   // Clear cache after session
   chrome.runtime.onSuspend.addListener(() => {
     questionCache.clear();
   });
   
   // Or implement TTL (time-to-live)
   ```

### Adding OCR Support

1. **Install Tesseract.js** (would need build process):
   ```bash
   npm install tesseract.js
   ```

2. **Capture and process screenshot** (content.js):
   ```javascript
   async function extractQuestionWithOCR() {
     // Capture question area
     const canvas = await captureQuestionArea();
     
     // Run OCR
     const { data: { text } } = await Tesseract.recognize(
       canvas,
       'eng',
       { logger: m => console.log(m) }
     );
     
     return parseOCRText(text);
   }
   ```

### Adding Answer Accuracy Tracking

1. **Detect correct answer** (content.js):
   ```javascript
   function detectCorrectAnswer() {
     // Watch for visual feedback (green highlight, checkmark, etc.)
     const correctElements = document.querySelectorAll('.correct-answer, .is-correct');
     // Return detected correct option
   }
   ```

2. **Update history with accuracy** (background.js):
   ```javascript
   async function storeQuestionHistory(questionRecord) {
     // ... existing code
     
     // Wait for user selection
     setTimeout(async () => {
       const correctAnswer = await getCorrectAnswer();
       const wasCorrect = correctAnswer === questionRecord.suggestedOption;
       
       // Update record
       questionRecord.wasCorrect = wasCorrect;
       // Re-save to storage
     }, 15000); // Wait 15s for answer reveal
   }
   ```

3. **Display accuracy stats** (popup.js):
   ```javascript
   function calculateAccuracy(history) {
     const answered = history.filter(q => q.wasCorrect !== undefined);
     const correct = answered.filter(q => q.wasCorrect).length;
     return (correct / answered.length * 100).toFixed(1);
   }
   ```

## Debugging

### Chrome DevTools

**Content Script Console**:
1. Open 2canplay.ng
2. Press F12 → Console tab
3. Look for messages starting with "2CanPlay AI Assistant"

**Background Script Console**:
1. Go to `chrome://extensions/`
2. Enable Developer mode
3. Click "service worker" link under extension
4. Opens dedicated console for background.js

**Popup Console**:
1. Right-click extension icon
2. Select "Inspect popup"
3. Opens DevTools for popup.html

### Logging Best Practices

```javascript
// Use clear, searchable log prefixes
console.log('[TwoCanPlay] Question detected:', questionData);
console.error('[TwoCanPlay] AI API error:', error);
console.warn('[TwoCanPlay] Low confidence answer:', confidence);

// Group related logs
console.group('[TwoCanPlay] Processing question');
console.log('Question:', question);
console.log('Options:', options);
console.log('Category:', category);
console.groupEnd();
```

### Common Debugging Scenarios

**Question not detected**:
1. Check if selectors match current DOM
2. Log `document.querySelectorAll('.question')` in page console
3. Verify MutationObserver is running
4. Check for JavaScript errors

**AI not responding**:
1. Check background script console for errors
2. Verify API key in storage: `chrome.storage.sync.get('settings', console.log)`
3. Test API key directly with curl:
   ```bash
   curl https://api.openai.com/v1/chat/completions \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"test"}]}'
   ```

**Panel not displaying**:
1. Check if panel element exists: `document.getElementById('twocanplay-ai-panel')`
2. Verify CSS is loaded
3. Check z-index issues with other page elements

## Testing

### Manual Testing Checklist

Create a test document and check off each item:

```markdown
## Installation
- [ ] Extension loads without errors
- [ ] No console errors on load
- [ ] Icons display correctly

## Configuration
- [ ] Can save settings
- [ ] Settings persist after reload
- [ ] Invalid API key shows error
- [ ] Toggle switch works

## Question Detection
- [ ] Detects questions on 2canplay.ng
- [ ] Extracts all 4 options correctly
- [ ] Captures question number
- [ ] Detects category when present
- [ ] Doesn't process duplicates

## AI Processing
- [ ] Gets response from OpenAI
- [ ] Response time < 3 seconds
- [ ] Handles API errors gracefully
- [ ] Shows confidence level
- [ ] Shows explanation

## UI
- [ ] Floating panel appears
- [ ] Panel is draggable
- [ ] Minimize/expand works
- [ ] Updates for each question
- [ ] Doesn't block game UI

## Performance
- [ ] No memory leaks (check Task Manager)
- [ ] CPU usage acceptable
- [ ] Works for 20+ questions in a row
- [ ] No lag on page

## Edge Cases
- [ ] Handles network disconnection
- [ ] Handles API rate limiting
- [ ] Handles malformed questions
- [ ] Handles questions with <4 options
- [ ] Handles very long questions
```

### Automated Testing (Future)

Example test structure:

```javascript
// test/content.test.js (with Jest)
describe('Question Detection', () => {
  test('extracts question text correctly', () => {
    document.body.innerHTML = `
      <div class="question-text">What is 2+2?</div>
    `;
    
    const data = extractQuestionData();
    expect(data.question).toBe('What is 2+2?');
  });
  
  test('extracts all options', () => {
    // ... setup DOM with options
    const data = extractQuestionData();
    expect(data.options).toHaveLength(4);
  });
});
```

## Performance Optimization

### Current Performance Characteristics

- Question detection: ~100ms
- AI response: 1-3 seconds
- Panel rendering: <50ms
- Memory usage: ~10-20MB

### Optimization Opportunities

1. **Debounce MutationObserver**:
   ```javascript
   let debounceTimer;
   this.observer = new MutationObserver(() => {
     clearTimeout(debounceTimer);
     debounceTimer = setTimeout(() => {
       this.checkForQuestion();
     }, 100);
   });
   ```

2. **Cache selectors**:
   ```javascript
   this.cachedElements = {
     questionArea: document.querySelector('.game-area'),
     // ... cache other frequently accessed elements
   };
   ```

3. **Lazy load panel**:
   ```javascript
   // Only create panel when first question detected
   if (!this.floatingPanel && questionData) {
     this.createFloatingPanel();
   }
   ```

4. **Minimize API payload**:
   ```javascript
   // Truncate very long questions
   const truncatedQuestion = question.length > 500 
     ? question.substring(0, 500) + '...'
     : question;
   ```

## Code Style Guidelines

### JavaScript Style

```javascript
// Use modern ES6+ syntax
const functionName = () => {
  // Arrow functions for methods
};

// Async/await instead of promises
async function fetchData() {
  const result = await apiCall();
  return result;
}

// Destructuring
const { question, options } = questionData;

// Template literals
const message = `Processing question ${number}`;

// Optional chaining
const category = questionData?.category;
```

### Naming Conventions

```javascript
// Classes: PascalCase
class TwoCanPlayAssistant {}

// Functions/variables: camelCase
function extractQuestionData() {}
const isEnabled = true;

// Constants: UPPER_SNAKE_CASE
const MAX_HISTORY_SIZE = 100;
const API_TIMEOUT = 5000;

// Private methods: prefix with underscore (convention)
_handleError() {}
```

### Comments

```javascript
/**
 * Extract question and options from DOM
 * @returns {Object|null} Question data or null if not found
 */
function extractQuestionData() {
  // Try multiple selectors for robustness
  const selectors = [...];
  
  // Find question text
  let questionText = null;
  // ... implementation
}
```

## Contribution Guidelines

### Branching Strategy

```bash
main              # Production-ready code
├── develop       # Development branch
├── feature/xyz   # New features
├── fix/xyz       # Bug fixes
└── docs/xyz      # Documentation updates
```

### Pull Request Process

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Update documentation
5. Submit PR with description:
   - What changed
   - Why it changed
   - How to test it
   - Screenshots (for UI changes)

### Commit Message Format

```
type(scope): subject

body

footer
```

Example:
```
feat(detection): add support for image-based questions

Implemented OCR using Tesseract.js to extract text from
question images when text-based detection fails.

Closes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Release Process

### Version Numbering

Follow Semantic Versioning: `MAJOR.MINOR.PATCH`

- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

### Release Checklist

- [ ] Update version in manifest.json
- [ ] Update CHANGELOG.md
- [ ] Test all features
- [ ] Create git tag: `v1.0.1`
- [ ] Build production bundle (if applicable)
- [ ] Update Chrome Web Store listing
- [ ] Upload new version
- [ ] Create GitHub release with notes

## Additional Resources

### Chrome Extension Documentation
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)
- [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Service Workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/)

### OpenAI API
- [API Reference](https://platform.openai.com/docs/api-reference)
- [Chat Completions](https://platform.openai.com/docs/guides/chat)
- [Best Practices](https://platform.openai.com/docs/guides/production-best-practices)

### Tools
- [VS Code](https://code.visualstudio.com/) - Recommended IDE
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/) - Debugging
- [Postman](https://www.postman.com/) - API testing

## Getting Help

### Internal Documentation
- README.md - User documentation
- This file (DEVELOPMENT.md) - Developer guide
- Inline code comments - Implementation details

### External Resources
- Chrome Extension Development Discord/Forum
- Stack Overflow (tag: chrome-extension)
- OpenAI Developer Forum

---

**Happy coding! 🚀**
