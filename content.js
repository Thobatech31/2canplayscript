/**
 * Content Script for 2CanPlay AI Assistant
 * Monitors the game interface and extracts questions
 */

class TwoCanPlayAssistant {
  constructor() {
    this.isEnabled = true;
    this.currentQuestionNumber = null;
    this.lastProcessedQuestion = null;
    this.observer = null;
    this.floatingPanel = null;
    this.processingQuestion = false;
    
    this.init();
  }
  
  async init() {
    console.log('2CanPlay AI Assistant initialized');
    
    // Check if extension is enabled
    const settings = await this.getSettings();
    this.isEnabled = settings?.enabled !== false;
    
    if (!this.isEnabled) {
      console.log('Assistant is disabled');
      return;
    }
    
    // Create floating panel
    this.createFloatingPanel();
    
    // Start monitoring for questions
    this.startMonitoring();
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggleAssistant') {
        this.isEnabled = request.enabled;
        this.updatePanelVisibility();
        sendResponse({ success: true });
      }
    });
  }
  
  async getSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        resolve(response?.data || {});
      });
    });
  }
  
  createFloatingPanel() {
    // Remove existing panel if any
    const existing = document.getElementById('twocanplay-ai-panel');
    if (existing) existing.remove();
    
    const panel = document.createElement('div');
    panel.id = 'twocanplay-ai-panel';
    panel.className = 'twocanplay-ai-panel';
    panel.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">🤖 AI Assistant</span>
        <button class="panel-minimize" title="Minimize">−</button>
      </div>
      <div class="panel-content">
        <div class="status">Waiting for question...</div>
      </div>
    `;
    
    document.body.appendChild(panel);
    this.floatingPanel = panel;
    
    // Add minimize functionality
    panel.querySelector('.panel-minimize').addEventListener('click', () => {
      panel.classList.toggle('minimized');
    });
    
    // Make panel draggable
    this.makeDraggable(panel);
  }
  
  makeDraggable(element) {
    const header = element.querySelector('.panel-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    
    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('panel-minimize')) return;
      
      isDragging = true;
      initialX = e.clientX - element.offsetLeft;
      initialY = e.clientY - element.offsetTop;
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      
      element.style.left = currentX + 'px';
      element.style.top = currentY + 'px';
      element.style.right = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
  
  updatePanelVisibility() {
    if (this.floatingPanel) {
      this.floatingPanel.style.display = this.isEnabled ? 'block' : 'none';
    }
  }
  
  startMonitoring() {
    // Use MutationObserver to detect DOM changes
    this.observer = new MutationObserver((mutations) => {
      if (!this.isEnabled || this.processingQuestion) return;
      
      this.checkForQuestion();
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // Also check periodically
    setInterval(() => {
      if (!this.isEnabled || this.processingQuestion) return;
      this.checkForQuestion();
    }, 1000);
  }
  
  checkForQuestion() {
    const questionData = this.extractQuestionData();
    
    if (questionData && !this.isDuplicateQuestion(questionData)) {
      console.log('New question detected:', questionData);
      this.processQuestion(questionData);
    }
  }
  
  extractQuestionData() {
    // Try multiple selectors to find question elements
    // These selectors need to be adjusted based on actual 2canplay.ng DOM structure
    
    const possibleQuestionSelectors = [
      '.question-text',
      '[class*="question"]',
      '[class*="Question"]',
      'h2', 'h3', 'h4' // Fallback to headings
    ];
    
    const possibleOptionSelectors = [
      '.option',
      '.answer-option',
      '[class*="option"]',
      '[class*="answer"]',
      'button[class*="option"]',
      'div[class*="option"]'
    ];
    
    const possibleTimerSelectors = [
      '.countdown',
      '.timer',
      '[class*="countdown"]',
      '[class*="timer"]'
    ];
    
    let questionText = null;
    let questionElement = null;
    
    // Find question
    for (const selector of possibleQuestionSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const text = el.textContent?.trim();
        if (text && text.length > 10 && text.includes('?')) {
          questionText = text;
          questionElement = el;
          break;
        }
      }
      if (questionText) break;
    }
    
    if (!questionText) return null;
    
    // Find options
    let options = [];
    for (const selector of possibleOptionSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length >= 2 && elements.length <= 6) {
        options = Array.from(elements).map(el => el.textContent?.trim()).filter(Boolean);
        if (options.length >= 2) break;
      }
    }
    
    if (options.length < 2) {
      // Try to find options near the question
      const parent = questionElement?.parentElement;
      if (parent) {
        const buttons = parent.querySelectorAll('button, div[role="button"]');
        if (buttons.length >= 2) {
          options = Array.from(buttons).map(el => el.textContent?.trim()).filter(Boolean);
        }
      }
    }
    
    // Extract question number
    let questionNumber = null;
    const numberMatch = questionText.match(/(?:Question|Q\.?)\s*(\d+)/i);
    if (numberMatch) {
      questionNumber = parseInt(numberMatch[1]);
    } else {
      // Look for question counter in the page
      const counterElements = document.querySelectorAll('[class*="question-count"], [class*="counter"]');
      for (const el of counterElements) {
        const match = el.textContent?.match(/(\d+)/);
        if (match) {
          questionNumber = parseInt(match[1]);
          break;
        }
      }
    }
    
    // Extract countdown
    let countdown = null;
    for (const selector of possibleTimerSelectors) {
      const timer = document.querySelector(selector);
      if (timer) {
        const match = timer.textContent?.match(/(\d+)/);
        if (match) {
          countdown = parseInt(match[1]);
          break;
        }
      }
    }
    
    // Extract category (if visible)
    let category = null;
    const categoryElements = document.querySelectorAll('[class*="category"], [class*="topic"]');
    if (categoryElements.length > 0) {
      category = categoryElements[0].textContent?.trim();
    }
    
    return {
      question: questionText,
      options: options.length >= 2 ? options : null,
      questionNumber,
      countdown,
      category
    };
  }
  
  isDuplicateQuestion(questionData) {
    if (!this.lastProcessedQuestion) return false;
    
    return (
      this.lastProcessedQuestion.question === questionData.question &&
      JSON.stringify(this.lastProcessedQuestion.options) === JSON.stringify(questionData.options)
    );
  }
  
  async processQuestion(questionData) {
    if (!questionData.options || questionData.options.length < 2) {
      console.log('Invalid question data - no options found');
      this.updatePanel('❌ Could not extract answer options', 'error');
      return;
    }
    
    this.processingQuestion = true;
    this.lastProcessedQuestion = questionData;
    
    this.updatePanel('🔍 Processing question...', 'processing');
    
    try {
      const result = await this.sendToAI(questionData);
      this.displayResult(questionData, result);
    } catch (error) {
      console.error('Error processing question:', error);
      this.updatePanel(`❌ Error: ${error.message}`, 'error');
    } finally {
      this.processingQuestion = false;
    }
  }
  
  async sendToAI(questionData) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'processQuestion', data: questionData },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error || 'Unknown error'));
          }
        }
      );
    });
  }
  
  displayResult(questionData, result) {
    const { suggestedAnswer, suggestedOption, confidence, explanation, verified, verificationNotes } = result;
    
    const confidenceEmoji = {
      high: '✅',
      medium: '⚠️',
      low: '❓'
    }[confidence] || '❓';
    
    // Verification badge
    const verificationBadge = verified 
      ? '<span class="verified-badge">✓ VERIFIED</span>' 
      : '<span class="unverified-badge">⚠ UNVERIFIED</span>';
    
    const content = `
      <div class="question-info">
        ${questionData.questionNumber ? `<div class="question-number">Q${questionData.questionNumber}</div>` : ''}
        ${questionData.category ? `<div class="category">${questionData.category}</div>` : ''}
        ${verificationBadge}
      </div>
      <div class="question-text">${this.truncate(questionData.question, 100)}</div>
      <div class="answer-section">
        <div class="suggested-answer">
          <strong>${confidenceEmoji} ${suggestedOption}</strong>: ${suggestedAnswer}
        </div>
        <div class="confidence">Confidence: <span class="confidence-${confidence}">${confidence.toUpperCase()}</span></div>
        ${explanation ? `<div class="explanation">${explanation}</div>` : ''}
        ${verificationNotes && confidence === 'low' ? `<div class="warning">⚠️ ${verificationNotes}</div>` : ''}
      </div>
      <div class="meta">
        <span class="processing-time">⚡ ${result.processingTime}ms</span>
        ${result.fromCache ? '<span class="cache-badge">📦 Cached</span>' : ''}
        ${questionData.countdown ? `<span class="countdown">⏱️ ${questionData.countdown}s remaining</span>` : ''}
      </div>
    `;
    
    this.updatePanel(content, 'result');
  }
  
  updatePanel(content, state = 'idle') {
    if (!this.floatingPanel) return;
    
    const panelContent = this.floatingPanel.querySelector('.panel-content');
    if (panelContent) {
      panelContent.innerHTML = typeof content === 'string' ? `<div class="status ${state}">${content}</div>` : content;
      panelContent.className = `panel-content ${state}`;
    }
  }
  
  truncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}

// Initialize assistant when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new TwoCanPlayAssistant();
  });
} else {
  new TwoCanPlayAssistant();
}
