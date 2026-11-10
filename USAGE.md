# Usage Guide

## Getting Started

Once installed and configured, the 2CanPlay AI Assistant works automatically while you play trivia games on 2canplay.ng.

## Basic Workflow

### 1. Start a Game

1. Visit [2canplay.ng](https://2canplay.ng)
2. Log in to your account
3. Start any trivia game (Quick Quiz, Challenge, etc.)

### 2. Play Normally

The assistant runs in the background and automatically:
- Detects when a new question appears
- Extracts the question text and answer options
- Sends it to the AI for analysis
- Displays the suggestion in the floating panel

You don't need to click anything or interact with the assistant during gameplay.

### 3. Review AI Suggestions

When a question appears, the floating panel will update within 1-3 seconds with:

```
🤖 AI Assistant
─────────────────────────
Q12 | Sports

What is the primary focus of the Giller Prize?

✅ D: Canadian fiction
Confidence: high

The Giller Prize recognises excellence in Canadian fiction.

⚡ 1247ms    ⏱️ 10s remaining
```

### 4. Make Your Decision

- Review the AI's suggested answer
- Check the confidence level
- Read the explanation (if shown)
- Select your answer in the game interface

**Important**: The extension does NOT automatically submit answers. You must click your chosen option in the game.

## Understanding the Floating Panel

### Panel Components

#### Header
- **Title**: "🤖 AI Assistant"
- **Minimize Button**: Click to collapse/expand the panel

#### Question Info
- **Question Number**: Shows which question you're on (e.g., Q12)
- **Category**: Game category if detected (e.g., Sports, History)

#### Question Text
- Truncated display if question is long (hover/expand to see full text)

#### Answer Section
- **Suggested Answer**: Shows the option letter (A, B, C, D) and full text
- **Confidence Indicator**:
  - ✅ **High**: AI is very confident (typically >85%)
  - ⚠️ **Medium**: AI is moderately confident (60-85%)
  - ❓ **Low**: AI is uncertain (<60%)
- **Explanation**: Brief reasoning for the suggested answer

#### Meta Information
- **Processing Time**: How long the AI took to respond
- **Countdown**: Time remaining to answer (if detected)

### Panel Interactions

#### Moving the Panel
- Click and drag the header to reposition
- Panel position is remembered during the session

#### Minimizing
- Click the "−" button to minimize
- Click the header when minimized to expand

#### Panel States

**Waiting**
```
Waiting for question...
```

**Processing**
```
🔍 Processing question...
```
(Animated pulse effect)

**Error**
```
❌ Error: API key not configured
```
or
```
❌ Could not extract answer options
```

**Result**
Shows the full answer details

## Using the Extension Popup

Click the extension icon in Chrome's toolbar to open the control panel.

### Toggle Assistant

Use the toggle switch to quickly enable/disable the assistant without removing it.

### Settings

#### API Key
- Paste your OpenAI API key here
- Click the link to get one if you don't have it
- Must start with `sk-`

#### AI Model
Choose based on your needs:

| Model | Speed | Accuracy | Cost/Question |
|-------|-------|----------|---------------|
| GPT-4o Mini | ⚡⚡⚡ | ⭐⭐ | ~$0.00015 |
| GPT-4o | ⚡⚡ | ⭐⭐⭐ | ~$0.0025 |
| GPT-4 Turbo | ⚡ | ⭐⭐⭐⭐ | ~$0.01 |

**Recommendation**: Use GPT-4o Mini for the best speed/cost ratio. Upgrade to GPT-4o if you notice accuracy issues.

#### Display Options
- **Show confidence level**: Display high/medium/low confidence
- **Show explanation**: Display reasoning for the answer

### Session Stats

View your current session statistics:
- **Questions Processed**: Total questions analyzed
- **Avg Response Time**: Average AI processing time in milliseconds

### View History

Click "View History" to see the last 10 questions processed, including:
- Question text
- AI suggestions
- Confidence levels
- Processing times

## Best Practices

### For Optimal Performance

1. **Stable Internet**: Ensure good connection for fast AI responses
2. **API Credits**: Keep your OpenAI account funded
3. **Model Selection**: Use GPT-4o Mini for speed in time-limited games
4. **Panel Position**: Place panel where it doesn't cover the game options
5. **Confidence Check**: Always check confidence levels before trusting suggestions

### When to Trust the AI

✅ **High Confidence Answers**
- Generally very reliable
- Strong factual basis
- Clear reasoning

⚠️ **Medium Confidence Answers**
- AI has some uncertainty
- Cross-check if you have knowledge
- Use your judgment

❓ **Low Confidence Answers**
- AI is guessing
- Question may be ambiguous
- Rely on your own knowledge

### When AI May Struggle

The AI may have difficulty with:
- Very recent events (after its training data cutoff)
- Highly specialized local knowledge
- Trick questions with misleading wording
- Questions requiring visual information not in text
- Ambiguous questions with multiple valid interpretations

### Time Management

Each question typically has 12 seconds. Here's the timing breakdown:

| Phase | Time |
|-------|------|
| Question appears | 0s |
| AI processing | 1-3s |
| Your review | 3-4s |
| Selection | 1s |
| **Total** | **5-8s** |

This leaves a comfortable buffer even with slower responses.

## Common Scenarios

### Scenario 1: Fast Response

```
Question appears at 12s
AI responds in 1.2s (at 10.8s remaining)
You review and select (at 8s remaining)
✓ Plenty of time
```

### Scenario 2: Slow Response

```
Question appears at 12s
AI responds in 4s (at 8s remaining)
You review and select (at 5s remaining)
✓ Still acceptable
```

### Scenario 3: No Options Detected

```
❌ Could not extract answer options
→ The DOM structure may be different
→ Select manually based on your knowledge
→ Report issue if persistent
```

### Scenario 4: API Error

```
❌ Error: Insufficient credits
→ Add credits to OpenAI account
→ Check API key is active
→ Verify key in settings
```

## Advanced Tips

### Maximize Accuracy
1. Use GPT-4o or GPT-4 Turbo for important games
2. Always read explanations to verify reasoning
3. Cross-reference with your own knowledge on low confidence answers

### Minimize Costs
1. Use GPT-4o Mini (default)
2. Only enable when actually playing
3. 100 questions ≈ $0.015 with GPT-4o Mini

### Optimize Layout
1. Drag panel to a corner that doesn't block options
2. Minimize when not needed (e.g., during category selection)
3. Expand only when reviewing AI suggestions

## Keyboard Shortcuts

Currently, the extension doesn't have keyboard shortcuts, but you can:
- Use browser shortcuts to interact (Alt+D for address bar)
- Use game shortcuts if available
- Focus remains on the game for answer selection

## Privacy During Use

The extension:
- ✅ Only reads visible question text
- ✅ Only sends questions to OpenAI
- ✅ Stores history locally in your browser
- ❌ Does NOT access your account credentials
- ❌ Does NOT interact with game servers
- ❌ Does NOT share data with third parties

## Limitations

### What the Extension CAN Do
- Detect text-based questions
- Extract multiple-choice options
- Analyze and suggest answers
- Provide explanations
- Track session statistics

### What the Extension CANNOT Do
- Automatically submit answers
- Guarantee 100% accuracy
- Access questions before they appear
- Work on other websites
- Function offline

## Troubleshooting During Use

Quick fixes for common issues during gameplay:

| Issue | Quick Fix |
|-------|-----------|
| Panel not updating | Refresh page |
| Slow responses | Check internet/Switch to GPT-4o Mini |
| Wrong answers | Check confidence level/Use judgment |
| Panel blocking game | Drag to new position |
| Extension stopped | Toggle off and on in popup |

For detailed troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## Getting Help

If you need assistance:
1. Check the status indicator in the extension popup
2. Review error messages in the floating panel
3. Check browser console (F12) for technical errors
4. Consult the troubleshooting guide
5. Report issues with detailed information

---

**Enjoy smarter trivia gameplay with AI assistance!**
