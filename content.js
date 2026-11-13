/**
 * Content Script for 2CanPlay AI Assistant
 * Monitors the game interface and extracts questions with Game Card isolation
 */

class TwoCanPlayAssistant {
  constructor() {
    this.isEnabled = true;
    this.currentQuestionNumber = null;
    this.lastProcessedQuestion = null;
    this.activeQuestionId = null;
    this.observer = null;
    this.floatingPanel = null;
    this.processingQuestion = false;
    this.autoClick = false;
    this.autoPlay = false;
    this.autoDouble = true;
    this.usedDoubleForQuestion = null;
    this.autoNavigating = false;
    this.lastAutoPlayTime = 0;
    this.stuckTimer = null;
    
    this.init();
  }
  
  async init() {
    console.log('[TwoCanPlay] AI Assistant initialized');
    
    const settings = await this.getSettings();
    this.isEnabled = settings?.enabled !== false;
    this.autoClick = settings?.autoClick === true;
    this.autoPlay = settings?.autoPlay === true;
    this.autoDouble = settings?.autoDouble !== false;
    
    if (!this.isEnabled) {
      console.log('[TwoCanPlay] Assistant is disabled in settings');
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
      } else if (request.action === 'settingsUpdated') {
        if (request.settings) {
          this.isEnabled = request.settings.enabled !== false;
          this.autoClick = request.settings.autoClick === true;
          this.autoPlay = request.settings.autoPlay === true;
          this.autoDouble = request.settings.autoDouble !== false;
          this.updatePanelVisibility();
        }
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

  isOurPanelElement(element) {
    if (!element) return false;
    return element.id === 'twocanplay-ai-panel' || Boolean(element.closest && element.closest('#twocanplay-ai-panel'));
  }
  
  createFloatingPanel() {
    const existing = document.getElementById('twocanplay-ai-panel');
    if (existing) existing.remove();
    
    const panel = document.createElement('div');
    panel.id = 'twocanplay-ai-panel';
    panel.className = 'twocanplay-ai-panel';
    panel.innerHTML = `
      <div class="tcp-panel-header">
        <span class="tcp-panel-title">🤖 AI Assistant</span>
        <button class="tcp-panel-minimize" title="Minimize">−</button>
      </div>
      <div class="tcp-panel-content">
        <div class="tcp-status">Waiting for question...</div>
      </div>
    `;
    
    document.body.appendChild(panel);
    this.floatingPanel = panel;
    
    panel.querySelector('.tcp-panel-minimize').addEventListener('click', () => {
      panel.classList.toggle('minimized');
    });
    
    this.makeDraggable(panel);
  }
  
  makeDraggable(element) {
    const header = element.querySelector('.tcp-panel-header');
    let isDragging = false;
    let initialX;
    let initialY;
    
    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('tcp-panel-minimize')) return;
      
      isDragging = true;
      initialX = e.clientX - element.offsetLeft;
      initialY = e.clientY - element.offsetTop;
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      const currentX = e.clientX - initialX;
      const currentY = e.clientY - initialY;
      
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
    let debounceTimer;
    
    this.observer = new MutationObserver((mutations) => {
      if (!this.isEnabled) return;
      
      // Ignore mutations originating strictly from our own floating panel
      const isFromPanelOnly = mutations.every(m => {
        return m.target && (m.target.id === 'twocanplay-ai-panel' || m.target.closest?.('#twocanplay-ai-panel'));
      });
      if (isFromPanelOnly) return;
      
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.checkForQuestion();
        if (this.autoPlay) {
          this.checkAutoPlayNavigation();
        }
      }, 100);
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false
    });
    
    // Polling backup every 400ms for fast detection
    setInterval(() => {
      if (!this.isEnabled) return;
      this.checkForQuestion();
      if (this.autoPlay) {
        this.checkAutoPlayNavigation();
      }
    }, 400);
  }
  
  checkForQuestion() {
    const executeCheck = () => {
      const questionData = this.extractQuestionData();
      
      if (questionData && !this.isDuplicateQuestion(questionData)) {
        this.processQuestion(questionData);
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(executeCheck);
    } else {
      setTimeout(executeCheck, 0);
    }
  }

  /**
   * Find the central Game Card container holding the current trivia question & options
   */
  getGameContainer() {
    // 1. Locate by counter element (e.g. "1/10", "2/10", "3/10")
    const countCandidates = document.querySelectorAll('span, div, p, [class*="count"]');
    for (const el of countCandidates) {
      if (this.isOurPanelElement(el)) continue;
      if (el.children.length > 2) continue;
      const txt = el.textContent?.trim();
      if (txt && /^\d{1,2}\s*\/\s*\d{1,2}$/.test(txt)) {
        let curr = el.parentElement;
        while (curr && curr !== document.body && curr !== document.documentElement) {
          const btns = curr.querySelectorAll('button, div[role="button"], [class*="option"], [class*="choice"], [class*="answer"]');
          if (btns.length >= 2) {
            // Ensure container includes question text or has multiple option buttons
            const hasQuestion = Array.from(curr.querySelectorAll('h1, h2, h3, h4, p, div, span')).some(
              e => !this.isOurPanelElement(e) && e.textContent?.trim().length >= 8 && e.textContent.includes('?')
            );
            if (hasQuestion || btns.length >= 4) {
              return curr;
            }
          }
          curr = curr.parentElement;
        }
      }
    }

    // 2. Locate by countdown timer element
    const timer = document.querySelector('.countdown, .timer, [class*="countdown"], [class*="timer"]');
    if (timer && !this.isOurPanelElement(timer)) {
      let curr = timer.parentElement;
      while (curr && curr !== document.body && curr !== document.documentElement) {
        const btns = curr.querySelectorAll('button, div[role="button"], [class*="option"], [class*="choice"], [class*="answer"]');
        if (btns.length >= 2) {
          return curr;
        }
        curr = curr.parentElement;
      }
    }

    // 3. Fallback to main/card containers
    const cards = document.querySelectorAll('[class*="card"], [class*="quiz"], [class*="game"], main');
    for (const card of cards) {
      if (this.isOurPanelElement(card)) continue;
      const btns = card.querySelectorAll('button, div[role="button"], [class*="option"], [class*="choice"], [class*="answer"]');
      if (btns.length >= 2 && btns.length <= 10) {
        return card;
      }
    }

    return document.body;
  }

  /**
   * Extract question counter (e.g. Q1/10, Q2/10)
   */
  extractQuestionNumber(gameContainer) {
    let questionNumber = null;
    let totalQuestions = null;

    // Search in game container first, then fall back to full document
    const searchRoots = gameContainer !== document.body
      ? [gameContainer, document]
      : [document];

    for (const root of searchRoots) {
      const candidates = root.querySelectorAll('span, div, p, [class*="count"], [class*="round"]');
      for (const el of candidates) {
        if (this.isOurPanelElement(el)) continue;
        // Only leaf-ish elements (no more than 1 child layer of text)
        if (el.children.length > 1) continue;
        const txt = el.textContent?.trim();
        if (txt) {
          const match = txt.match(/^(\d{1,2})\s*\/\s*(\d{1,2})$/);
          if (match) {
            const qNum = parseInt(match[1], 10);
            const total = parseInt(match[2], 10);
            // Sanity check: exclude powerup "50/50" and rounds with > 20 questions
            if (txt === '50/50' || qNum === 50 || total > 20) continue;
            if (qNum >= 1 && total >= qNum) {
              questionNumber = qNum;
              totalQuestions = total;
              break;
            }
          }
        }
      }
      if (questionNumber) break;
    }

    if (!questionNumber) {
      const counterEls = document.querySelectorAll('[class*="question-count"], [class*="counter"]');
      for (const el of counterEls) {
        if (this.isOurPanelElement(el)) continue;
        const match = el.textContent?.match(/(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num >= 1) {
            questionNumber = num;
            break;
          }
        }
      }
    }

    return { questionNumber, totalQuestions };
  }

  /**
   * Extract trivia answer options strictly inside the Game Card
   */
  /**
   * Locate the question text element (to ensure options appear after it)
   */
  findQuestionElement(gameContainer) {
    if (!gameContainer) return null;

    const questionSelectors = [
      '[class*="question-text"]',
      '[class*="QuestionText"]',
      '.question',
      '[class*="question"]',
      '[class*="Question"]',
      'h1, h2, h3, h4, h5',
      'p',
      'div'
    ];

    for (const sel of questionSelectors) {
      const candidates = gameContainer.querySelectorAll(sel);
      for (const el of candidates) {
        if (this.isOurPanelElement(el)) continue;
        if (el.closest('.modal, [class*="modal"], [class*="dialog"], [class*="popup"]')) continue;
        if (el.closest('button, [role="button"]')) continue;

        const text = el.textContent?.trim().replace(/\s+/g, ' ');
        if (!text || text.length < 8 || text.length > 350) continue;
        if (/spin again|play again|would you like to|are you sure|game over|out of time/i.test(text)) continue;
        if (/^\d{1,2}\s*\/\s*\d{1,2}$/.test(text)) continue;
        if (/^\d+\s*(pts|xp)$/i.test(text)) continue;

        if (text.includes('?')) {
          return el;
        }
      }
    }

    return null;
  }

  /**
   * Extract actual trivia answer button elements strictly inside the Game Card
   */
  getOptionButtons(gameContainer) {
    if (!gameContainer) return [];

    const allButtons = Array.from(
      gameContainer.querySelectorAll('button, div[role="button"], [class*="option"], [class*="choice"], [class*="answer"]')
    );

    const questionEl = this.findQuestionElement(gameContainer);
    const validItems = [];
    const seen = new Set();

    for (const btn of allButtons) {
      if (this.isOurPanelElement(btn)) continue;
      
      // Exclude modals, headers, navbars, sidebars
      if (btn.closest('.modal, [class*="modal"], [class*="dialog"], [class*="popup"], [class*="game-over"]')) continue;
      if (btn.closest('header, nav, footer, [class*="header"], [class*="nav"], [class*="menu"], [class*="sidebar"]')) continue;

      // Exclude powerups / boosters / lifelines by container or class
      if (btn.closest('[class*="powerup"], [class*="power-up"], [class*="booster"], [class*="boost"], [class*="lifeline"], [class*="perk"], [class*="tool"], [class*="power_up"]')) continue;
      if (btn.matches('[class*="powerup"], [class*="power-up"], [class*="booster"], [class*="lifeline"], [class*="perk"]')) continue;

      // Exclude powerups by aria-label / title
      const aria = (btn.getAttribute('aria-label') || btn.getAttribute('title') || '').toLowerCase();
      if (/powerup|booster|lifeline|freeze|skip|50[\/-]50|hint|double/.test(aria)) continue;

      const rawText = btn.textContent?.trim();
      if (!rawText) continue;

      const cleanText = rawText.replace(/\s+/g, ' ').trim();

      // Exclude navigation / system action buttons
      if (/^(logout|log out|login|sign in|sign out|play|spin|homepage|home|menu|settings|profile|share|close|back|next|help|sound|mute)$/i.test(cleanText)) continue;
      if (/spin again|play again|go to homepage|terms|privacy|game over|out of time/i.test(cleanText)) continue;

      // Exclude powerup labels & score badges
      if (/^(50\/50|50:50|x2|2x|\+?\d+\s*(xp|pts)|skip|\d+pts)$/i.test(cleanText)) continue;

      // If button has an SVG or IMG icon AND its text is a single number (powerup badge like "1"), it is a powerup icon button
      const hasIcon = btn.querySelector('svg, img, [class*="icon"]');
      if (hasIcon && /^\d{1,2}$/.test(cleanText)) continue;

      // If question element was found, options MUST appear after the question element in DOM order
      if (questionEl) {
        const position = questionEl.compareDocumentPosition(btn);
        if (position & Node.DOCUMENT_POSITION_PRECEDING) {
          continue; // Button is placed above the question (e.g. powerups)
        }
      }

      if (cleanText.length > 200) continue;

      const lower = cleanText.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        validItems.push({
          element: btn,
          text: cleanText
        });
      }
    }

    return validItems;
  }

  /**
   * Extract trivia answer options strictly inside the Game Card
   */
  extractOptions(gameContainer) {
    const items = this.getOptionButtons(gameContainer);
    return items.map(item => item.text);
  }

  /**
   * Extract question text inside the Game Card
   */
  extractQuestionText(gameContainer, options) {
    // 1. Search candidate elements inside game container
    const questionSelectors = [
      '[class*="question-text"]',
      '[class*="QuestionText"]',
      '.question',
      '[class*="question"]',
      '[class*="Question"]',
      'h1, h2, h3, h4, h5',
      'p',
      'div'
    ];

    for (const sel of questionSelectors) {
      const candidates = gameContainer.querySelectorAll(sel);
      for (const el of candidates) {
        if (this.isOurPanelElement(el)) continue;
        if (el.closest('.modal, [class*="modal"], [class*="dialog"], [class*="popup"]')) continue;
        if (el.closest('button, [role="button"]')) continue;

        const text = el.textContent?.trim().replace(/\s+/g, ' ');
        if (!text || text.length < 8 || text.length > 350) continue;
        if (/spin again|play again|would you like to|are you sure|game over|out of time/i.test(text)) continue;
        if (/^\d{1,2}\s*\/\s*\d{1,2}$/.test(text)) continue;
        if (/^\d+\s*(pts|xp)$/i.test(text)) continue;
        if (options.some(opt => opt.toLowerCase() === text.toLowerCase())) continue;

        // If it includes '?', it is definitely the question!
        if (text.includes('?')) {
          return text;
        }
      }
    }

    // 2. Any text element with '?' in the game card
    const allTextEls = gameContainer.querySelectorAll('p, span, div, h1, h2, h3, h4, h5');
    for (const el of allTextEls) {
      if (this.isOurPanelElement(el)) continue;
      if (el.closest('.modal, [class*="modal"], [class*="dialog"], [class*="popup"]')) continue;
      if (el.closest('button, [role="button"]')) continue;

      const text = el.textContent?.trim().replace(/\s+/g, ' ');
      if (!text || text.length < 8 || text.length > 350) continue;
      if (!text.includes('?')) continue;
      if (/spin again|play again|would you like to|are you sure/i.test(text)) continue;
      if (options.some(opt => opt.toLowerCase() === text.toLowerCase())) continue;

      return text;
    }

    // 3. Fallback: Questions without '?' (e.g. "Identify the country with...", "The capital of France is...")
    for (const sel of ['h1, h2, h3, h4', 'p', 'div']) {
      const els = gameContainer.querySelectorAll(sel);
      for (const el of els) {
        if (this.isOurPanelElement(el)) continue;
        if (el.closest('.modal, [class*="modal"], [class*="dialog"], [class*="popup"]')) continue;
        if (el.closest('button, [role="button"]')) continue;
        if (el.children.length > 2) continue;

        const text = el.textContent?.trim().replace(/\s+/g, ' ');
        if (!text || text.length < 10 || text.length > 350) continue;
        if (/^\d{1,2}\s*\/\s*\d{1,2}$/.test(text)) continue;
        if (/^\d+\s*(pts|xp)$/i.test(text)) continue;
        if (/^\d+$/.test(text)) continue;
        if (/spin again|play again|out of time|game over/i.test(text)) continue;
        if (options.some(opt => opt.toLowerCase() === text.toLowerCase())) continue;

        return text;
      }
    }

    return null;
  }
  
  extractQuestionData() {
    // 0. Check if currently on the Wheel / Spin screen (do NOT treat as a question!)
    const isWheelScreen = Array.from(document.querySelectorAll('button, div[role="button"], h1, h2, h3, div')).some(el => {
      if (this.isOurPanelElement(el)) return false;
      const t = el.textContent?.trim().toLowerCase();
      return t === 'spin the wheel' || t === 'spin again' || (t && t.includes('spin attempts')) || (t && t.includes('you have') && t.includes('spin'));
    });
    const hasTimer = document.querySelector('.countdown, .timer, [class*="countdown"], [class*="timer"]');
    if (isWheelScreen && !hasTimer) {
      if (this.lastProcessedQuestion !== null) {
        this.lastProcessedQuestion = null;
        this.activeQuestionId = null;
        if (!this.autoPlay) {
          this.updatePanel('🎡 Ready to spin! Spin the wheel to begin.', 'idle');
        }
      }
      return null;
    }

    // 1. Check for Game Over or Out of Time modals
    // But ONLY block if the game card with question options is NOT simultaneously visible.
    // This prevents the "Round Ended!" state from blocking a new round's first question.
    const gameOverModal = Array.from(document.querySelectorAll('h1, h2, h3, h4, div, button')).find(el => {
      if (this.isOurPanelElement(el)) return false;
      const txt = el.textContent?.trim().toUpperCase();
      return txt === 'GAME OVER' || txt === 'OUT OF TIME!' ||
             (txt && (txt.includes('CONGRATULATIONS') || txt.includes('VIEW LEADERBOARD') || txt.includes('WOULD YOU LIKE TO PLAY AGAIN') || txt.includes('WOULD YOU LIKE TO SPIN AGAIN')));
    });

    if (gameOverModal) {
      // Check if a fresh game card with ≥2 answer buttons is currently visible alongside the modal.
      // If yes, the new round has already begun and we should NOT block.
      const freshGame = Array.from(document.querySelectorAll('[class*="count"], span'))
        .filter(el => !this.isOurPanelElement(el) && /^\d{1,2}\s*\/\s*\d{1,2}$/.test(el.textContent?.trim()));
      if (freshGame.length === 0) {
        // Real game over — no new round yet
        if (this.lastProcessedQuestion !== null) {
          this.lastProcessedQuestion = null;
          this.activeQuestionId = null;
          this.updatePanel('⏱️ Round ended — waiting for next spin...', 'idle');
        }
        return null;
      }
      // Otherwise fall through — a new game card is already on screen
    }

    // 2. Locate the central Game Card
    const gameContainer = this.getGameContainer();
    if (!gameContainer) return null;

    // 3. Extract question counter (e.g. "1/10", "2/10", "3/10")
    const { questionNumber, totalQuestions } = this.extractQuestionNumber(gameContainer);

    // 4. Extract Answer Options (filtered strictly to game card, 2 to 6 options)
    const options = this.extractOptions(gameContainer);
    if (!options || options.length < 2) {
      return null;
    }

    // 5. Extract Question Text
    const questionText = this.extractQuestionText(gameContainer, options);
    if (!questionText) {
      return null;
    }

    // 6. Extract countdown timer (if visible)
    let countdown = null;
    const possibleTimerSelectors = ['.countdown', '.timer', '[class*="countdown"]', '[class*="timer"]'];
    for (const selector of possibleTimerSelectors) {
      const timer = gameContainer.querySelector(selector) || document.querySelector(selector);
      if (timer && !this.isOurPanelElement(timer)) {
        const match = timer.textContent?.match(/(\d+)/);
        if (match) {
          countdown = parseInt(match[1], 10);
          break;
        }
      }
    }

    return {
      question: questionText,
      options: options,
      questionNumber,
      totalQuestions,
      countdown,
      category: null
    };
  }
  
  isDuplicateQuestion(questionData) {
    if (!this.lastProcessedQuestion) return false;
    
    // If question number is known and has changed (e.g. Q1 -> Q2 or Q2 -> Q3), NOT a duplicate!
    if (questionData.questionNumber && this.lastProcessedQuestion.questionNumber &&
        questionData.questionNumber !== this.lastProcessedQuestion.questionNumber) {
      return false;
    }

    const currentQ = questionData.question.trim().toLowerCase();
    const lastQ = (this.lastProcessedQuestion.question || '').trim().toLowerCase();

    // If question text is identical, it's the current question
    if (currentQ === lastQ) {
      return true;
    }
    
    return false;
  }
  
  async processQuestion(questionData) {
    if (!questionData.options || questionData.options.length < 2) {
      return;
    }
    
    // Create unique ID for this question instance using question text as the key
    // (don't include question number in ID in case number is null)
    const questionId = questionData.question.trim().toLowerCase();
    if (this.activeQuestionId === questionId) {
      return; // Already processing this exact question
    }

    this.processingQuestion = true;
    this.activeQuestionId = questionId;
    this.lastProcessedQuestion = questionData;
    
    const qBadge = questionData.questionNumber 
      ? `Q${questionData.questionNumber}${questionData.totalQuestions ? `/${questionData.totalQuestions}` : ''}`
      : 'Question';

    console.log(`[TwoCanPlay] 🎯 ${qBadge} detected:`, questionData.question);
    console.log('[TwoCanPlay] Options:', questionData.options);
    
    // Auto-activate Double Points (x2) on Question 8, 9, 10
    if (this.autoDouble && questionData.questionNumber >= 8 && this.usedDoubleForQuestion !== questionData.questionNumber) {
      setTimeout(() => {
        const doubleBtn = this.findDoublePointPowerup();
        if (doubleBtn) {
          console.log(`[TwoCanPlay] ✨ Auto-activating Double Points (x2) on ${qBadge}`);
          this.usedDoubleForQuestion = questionData.questionNumber;
          doubleBtn.style.outline = '3px solid #ecc94b';
          doubleBtn.style.boxShadow = '0 0 15px rgba(236, 201, 75, 0.7)';
          this.triggerClick(doubleBtn);
        }
      }, 150);
    }
    
    this.updatePanel(`🔍 Analyzing ${qBadge}...`, 'processing');
    
    try {
      const result = await this.sendToAI(questionData);
      // Only display result if this question is still active
      if (this.activeQuestionId === questionId) {
        this.displayResult(questionData, result);
      }
    } catch (error) {
      console.error('[TwoCanPlay] Error processing question:', error);
      if (this.activeQuestionId === questionId) {
        this.updatePanel(`❌ Error: ${error.message}`, 'error');
      }
    } finally {
      if (this.activeQuestionId === questionId) {
        this.processingQuestion = false;
      }
    }
  }
  
  async sendToAI(questionData) {
    return new Promise((resolve, reject) => {
      if (!chrome.runtime?.id) {
        reject(new Error('Extension was updated. Please refresh this page (Cmd+R / F5).'));
        return;
      }

      try {
        chrome.runtime.sendMessage(
          { action: 'processQuestion', data: questionData },
          (response) => {
            if (chrome.runtime.lastError) {
              const msg = chrome.runtime.lastError.message || '';
              if (msg.toLowerCase().includes('context invalidated')) {
                reject(new Error('Extension reloaded. Please refresh this page!'));
              } else {
                reject(new Error(msg));
              }
            } else if (response?.success) {
              resolve(response.data);
            } else {
              reject(new Error(response?.error || 'No response from AI service'));
            }
          }
        );
      } catch (err) {
        if (err.message && err.message.toLowerCase().includes('context invalidated')) {
          reject(new Error('Extension reloaded. Please refresh this page!'));
        } else {
          reject(err);
        }
      }
    });
  }
  
  displayResult(questionData, result) {
    const { suggestedAnswer, suggestedOption, confidence, explanation, verified, verificationNotes } = result;
    
    const confidenceEmoji = {
      high: '✅',
      medium: '⚠️',
      low: '❓'
    }[confidence] || '❓';
    
    const verificationBadge = verified 
      ? '<span class="tcp-verified-badge">✓ VERIFIED</span>' 
      : '<span class="tcp-unverified-badge">⚠ UNVERIFIED</span>';
    
    const qNumText = questionData.questionNumber 
      ? `Q${questionData.questionNumber}${questionData.totalQuestions ? `/${questionData.totalQuestions}` : ''}`
      : null;

    const content = `
      <div class="tcp-q-info">
        ${qNumText ? `<div class="tcp-q-number">${qNumText}</div>` : ''}
        ${questionData.category ? `<div class="tcp-category">${questionData.category}</div>` : ''}
        ${verificationBadge}
      </div>
      <div class="tcp-q-display-text">${this.truncate(questionData.question, 120)}</div>
      <div class="tcp-answer-section">
        <div class="tcp-suggested-answer">
          <strong>${confidenceEmoji} ${suggestedOption}</strong>: ${suggestedAnswer}
        </div>
        <div class="tcp-confidence">Confidence: <span class="tcp-confidence-${confidence || 'low'}">${(confidence || 'low').toUpperCase()}</span></div>
        ${explanation ? `<div class="tcp-explanation">${explanation}</div>` : ''}
        ${verificationNotes && confidence === 'low' ? `<div class="tcp-warning">⚠️ ${verificationNotes}</div>` : ''}
      </div>
      <div class="tcp-meta">
        <span class="tcp-processing-time">⚡ ${result.processingTime || 0}ms</span>
        ${result.fromCache ? '<span class="tcp-cache-badge">📦 Cached</span>' : ''}
        ${questionData.countdown ? `<span class="tcp-countdown">⏱️ ${questionData.countdown}s remaining</span>` : ''}
      </div>
    `;
    
    this.updatePanel(content, 'result');

    // Trigger auto-click if enabled
    if (this.autoClick) {
      this.performAutoClick(result, questionData);
    }
  }

  performAutoClick(result, questionData) {
    const gameContainer = this.getGameContainer();
    if (!gameContainer) return;

    const optionItems = this.getOptionButtons(gameContainer);
    if (!optionItems || optionItems.length === 0) {
      console.warn('[TwoCanPlay] No option buttons found to auto-click');
      return;
    }

    const targetAnswer = (result.suggestedAnswer || '').trim().toLowerCase();
    const targetOptionLetter = (result.suggestedOption || '').trim().toUpperCase();

    const cleanTarget = targetAnswer.replace(/^[A-D][.)\s-]+/i, '').trim();

    // Check for exact text match across buttons
    const exactMatch = cleanTarget ? optionItems.find(item => {
      const itemTxt = item.text.trim().toLowerCase();
      const cleanItemTxt = itemTxt.replace(/^[A-D][.)\s-]+/i, '').trim();
      return itemTxt === targetAnswer || cleanItemTxt === cleanTarget;
    }) : null;

    let targetButton = null;

    if (exactMatch && targetOptionLetter) {
      const optionIndex = targetOptionLetter.charCodeAt(0) - 65;
      if (optionIndex >= 0 && optionIndex < optionItems.length) {
        const letterItem = optionItems[optionIndex];
        const letterItemClean = letterItem.text.trim().toLowerCase().replace(/^[A-D][.)\s-]+/i, '').trim();
        if (letterItemClean === cleanTarget) {
          // Perfect harmony: Option letter and text both point to this button!
          targetButton = letterItem.element;
        } else {
          // Desync detected: AI output letter B but named option A text! Prioritize text match
          console.warn(`[TwoCanPlay] Mismatch: Option letter ${targetOptionLetter} (${letterItem.text}) vs Answer text (${result.suggestedAnswer}). Prioritizing text match.`);
          targetButton = exactMatch.element;
        }
      } else {
        targetButton = exactMatch.element;
      }
    } else if (targetOptionLetter) {
      // 1. PRIMARY: Match by AI's chosen Option Letter Index (A=0, B=1, C=2, D=3)
      const optionIndex = targetOptionLetter.charCodeAt(0) - 65;
      if (optionIndex >= 0 && optionIndex < optionItems.length) {
        targetButton = optionItems[optionIndex].element;
      }
    } else if (exactMatch) {
      // 2. FALLBACK: Match by exact text
      targetButton = exactMatch.element;
    }

    if (targetButton) {
      // Visual indicator on the button
      targetButton.style.transition = 'all 0.2s ease';
      targetButton.style.outline = '3px solid #38a169';
      targetButton.style.boxShadow = '0 0 15px rgba(56, 161, 105, 0.6)';

      let clickDelay = 600;
      if (this.autoDouble && questionData.questionNumber >= 8 && this.usedDoubleForQuestion !== questionData.questionNumber) {
        const doubleBtn = this.findDoublePointPowerup();
        if (doubleBtn) {
          console.log(`[TwoCanPlay] ✨ Activating Double Points (x2) before auto-clicking on Q${questionData.questionNumber}`);
          this.usedDoubleForQuestion = questionData.questionNumber;
          doubleBtn.style.outline = '3px solid #ecc94b';
          doubleBtn.style.boxShadow = '0 0 15px rgba(236, 201, 75, 0.7)';
          this.triggerClick(doubleBtn);
          clickDelay = 1100; // Extra time for double points multiplier animation
        }
      }

      console.log(`[TwoCanPlay] 🤖 Auto-clicking answer in ${clickDelay}ms:`, targetButton.textContent.trim());

      // Safe human-like delay before clicking
      setTimeout(() => {
        this.triggerClick(targetButton);
        console.log('[TwoCanPlay] ✅ Answer auto-clicked successfully!');
      }, clickDelay);
    } else {
      console.warn('[TwoCanPlay] Could not find button to auto-click for:', result.suggestedAnswer);
    }
  }

  findDoublePointPowerup() {
    // 1. Direct query across clickable elements
    const allCandidates = Array.from(document.querySelectorAll('button, div[role="button"], [class*="powerup"], [class*="booster"], [class*="boost"], [class*="item"], div, span, img'));
    
    for (const el of allCandidates) {
      if (this.isOurPanelElement(el)) continue;

      // Check aria-label / title
      const aria = (el.getAttribute('aria-label') || el.getAttribute('title') || '').toLowerCase();
      if (aria.includes('double') || aria.includes('x2') || aria.includes('2x')) {
        const clickable = el.closest('button, [role="button"]') || el;
        if (this.isPowerupAvailable(clickable)) return clickable;
      }

      // Check img alt or src
      if (el.tagName === 'IMG') {
        const src = (el.src || '').toLowerCase();
        const alt = (el.alt || '').toLowerCase();
        if (src.includes('double') || src.includes('x2') || alt.includes('double') || alt.includes('x2')) {
          const clickable = el.closest('button, [role="button"]') || el.parentElement || el;
          if (this.isPowerupAvailable(clickable)) return clickable;
        }
      }

      // Check class name
      const className = typeof el.className === 'string' ? el.className.toLowerCase() : '';
      if (className.includes('double') || className.includes('x2')) {
        const clickable = el.closest('button, [role="button"]') || el;
        if (this.isPowerupAvailable(clickable)) return clickable;
      }

      // Check text content on leaf elements
      if (el.children.length <= 1) {
        const txt = el.textContent?.trim().toLowerCase();
        if (txt === 'x2' || txt === '2x' || txt === 'double' || txt === 'double point' || txt === 'double points' || txt.includes('double x2')) {
          const clickable = el.closest('button, [role="button"]') || el.parentElement || el;
          if (this.isPowerupAvailable(clickable)) return clickable;
        }
      }
    }

    // 2. Row/container fallback: locate the 4-item powerup row and pick the double-point item
    const rows = Array.from(document.querySelectorAll('[class*="powerup"], [class*="power-up"], [class*="boost"], [class*="booster"], [class*="lifeline"]'));
    for (const row of rows) {
      if (this.isOurPanelElement(row)) continue;
      const items = Array.from(row.children);
      for (const item of items) {
        const t = (item.textContent || '').toLowerCase();
        const hasImg = item.querySelector('img[src*="double" i], img[src*="x2" i], img[alt*="double" i]');
        if (t.includes('x2') || t.includes('double') || hasImg) {
          if (this.isPowerupAvailable(item)) return item;
        }
      }
      // In 2canplay, the 4th item in the powerup row is Double Point
      if (items.length === 4) {
        const fourthItem = items[3];
        if (this.isPowerupAvailable(fourthItem)) return fourthItem;
      }
    }

    return null;
  }

  isPowerupAvailable(el) {
    if (!el || !this.isElementVisible(el)) return false;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;

    // Check computed opacity
    const style = window.getComputedStyle(el);
    if (parseFloat(style.opacity) < 0.5) return false;

    // Check count badge (e.g. badge showing 0)
    const badge = el.querySelector('span, div, [class*="badge"], [class*="count"]');
    if (badge && badge.textContent?.trim() === '0') return false;

    return true;
  }

  triggerClick(element) {
    if (!element) return;
    try {
      const clickableEl = element.closest('button, [role="button"]') || element;
      clickableEl.focus?.();
      clickableEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, view: window }));
      clickableEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
      clickableEl.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, view: window }));
      clickableEl.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
      clickableEl.click();
    } catch (e) {
      console.error('[TwoCanPlay] Click error:', e);
      try { element.click?.(); } catch (_) {}
    }
  }

  isElementVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden';
  }

  checkAutoPlayNavigation() {
    if (!this.autoPlay || this.autoNavigating || this.processingQuestion) return;

    // Never navigate if an active trivia question with options is on screen
    const gameContainer = this.getGameContainer();
    const activeOptions = gameContainer ? this.extractOptions(gameContainer) : [];
    if (activeOptions && activeOptions.length >= 2) {
      return; // Question is currently active
    }

    const now = Date.now();
    // Throttle navigation actions to prevent double clicks
    if (now - this.lastAutoPlayTime < 2200) return;

    const allButtons = Array.from(document.querySelectorAll('button, div[role="button"], a[role="button"]'));

    // --- STEP 1: Home / Dashboard Screen -> Click "Spin the wheel" ---
    const spinWheelBtn = allButtons.find(btn => {
      if (this.isOurPanelElement(btn)) return false;
      const text = btn.textContent?.trim().toLowerCase();
      return text === 'spin the wheel' || text === 'go for a spin';
    });

    if (spinWheelBtn && this.isElementVisible(spinWheelBtn)) {
      this.autoNavigating = true;
      this.lastAutoPlayTime = now;
      this.updatePanel('🎡 <strong>Auto-Play:</strong> Spinning wheel in 1.5s...', 'loading');
      spinWheelBtn.style.outline = '3px solid #805ad5';

      setTimeout(() => {
        console.log('[TwoCanPlay] 🔄 Auto-Play: Clicking "Spin the wheel"');
        this.triggerClick(spinWheelBtn);
        setTimeout(() => {
          this.autoNavigating = false;
        }, 2000);
      }, 1500);
      return;
    }

    // --- STEP 2: Wheel / Category Landed Screen -> Click "Play" ---
    const playBtn = allButtons.find(btn => {
      if (this.isOurPanelElement(btn)) return false;
      const text = btn.textContent?.trim().toLowerCase();
      return text === 'play';
    });

    if (playBtn && this.isElementVisible(playBtn)) {
      // Confirm this is the wheel/category screen and NOT a question option
      const hasWheelContext = Array.from(document.querySelectorAll('span, div, p, h1, h2, h3')).some(el => {
        if (this.isOurPanelElement(el)) return false;
        const t = el.textContent?.trim().toLowerCase();
        return t && (t.includes('category:') || t.includes('you have') || t.includes('spin again') || t.includes('go for a spin') || t.includes('spins'));
      });

      if (hasWheelContext) {
        this.autoNavigating = true;
        this.lastAutoPlayTime = now;
        this.updatePanel('🎮 <strong>Auto-Play:</strong> Starting round in 1.5s...', 'loading');
        playBtn.style.outline = '3px solid #805ad5';

        setTimeout(() => {
          console.log('[TwoCanPlay] 🔄 Auto-Play: Clicking "Play"');
          this.triggerClick(playBtn);
          setTimeout(() => {
            this.autoNavigating = false;
          }, 2000);
        }, 1500);
        return;
      }
    }

    // --- STEP 3: Round Finished / Congratulations / Game Over / Out of Time -> Refresh page to spin & play again ---
    const isSessionEnded = Array.from(document.querySelectorAll('h1, h2, h3, h4, div, p, button')).some(el => {
      if (this.isOurPanelElement(el)) return false;
      const t = el.textContent?.trim().toLowerCase();
      return t && (
        t === 'congratulations!' ||
        t.includes('congratulations') ||
        t.includes('view leaderboard') ||
        t === 'game over' ||
        t.includes('out of time') ||
        t.includes('round ended') ||
        t.includes('play again') ||
        t.includes('spin again') ||
        t.includes('would you like to play again') ||
        t.includes('would you like to spin again')
      );
    });

    if (isSessionEnded) {
      this.autoNavigating = true;
      this.lastAutoPlayTime = now;
      this.updatePanel('🏁 <strong>Auto-Play:</strong> Round complete! Refreshing in 2.5s for next spin...', 'loading');

      setTimeout(() => {
        console.log('[TwoCanPlay] 🔄 Auto-Play: Round ended. Refreshing page to start next spin and game...');
        window.location.reload();
      }, 2500);
      return;
    }
  }

  updatePanel(content, state = 'idle') {
    if (!this.floatingPanel) return;
    
    const panelContent = this.floatingPanel.querySelector('.tcp-panel-content');
    if (panelContent) {
      panelContent.innerHTML = typeof content === 'string' ? `<div class="tcp-status ${state}">${content}</div>` : content;
      panelContent.className = `tcp-panel-content ${state}`;
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
