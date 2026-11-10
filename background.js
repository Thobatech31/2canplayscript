/**
 * Background Service Worker for 2CanPlay AI Assistant
 * HIGH ACCURACY MODE - Multi-stage verification for maximum correctness
 * One wrong answer = game over, so accuracy is CRITICAL
 */

// In-memory cache for verified questions (survives during session)
const questionCache = new Map();

// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
  console.log('2CanPlay AI Assistant installed - HIGH ACCURACY MODE');
  
  // Set default settings with accuracy-focused defaults
  chrome.storage.sync.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.sync.set({
        settings: {
          enabled: true,
          aiProvider: 'gemini', // gemini | openai
          apiKey: '',
          model: 'gemini-pro', // Default to Gemini Pro (FREE)
          verificationMode: 'strict', // strict | balanced | fast
          useVerification: true, // Enable multi-stage verification
          minConfidenceThreshold: 0.7, // Only show answers above 70% confidence
          showConfidence: true,
          showExplanation: true,
          panelPosition: 'top-right',
          timeout: 8000 // Longer timeout for verification
        }
      });
    }
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processQuestion') {
    handleQuestionProcessing(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['settings'], (result) => {
      sendResponse({ success: true, data: result.settings });
    });
    return true;
  }
  
  if (request.action === 'saveSettings') {
    chrome.storage.sync.set({ settings: request.data }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

/**
 * Process question through HIGH ACCURACY multi-stage verification
 */
async function handleQuestionProcessing(questionData) {
  const startTime = Date.now();
  
  // Get settings
  const settings = await new Promise((resolve) => {
    chrome.storage.sync.get(['settings'], (result) => {
      resolve(result.settings || {});
    });
  });
  
  if (!settings.apiKey) {
    throw new Error('API key not configured. Please set it in extension settings.');
  }
  
  console.log('[HighAccuracy] Starting multi-stage processing...');
  
  // Check cache first (previously verified answers)
  const cacheKey = generateCacheKey(questionData);
  if (questionCache.has(cacheKey)) {
    console.log('[HighAccuracy] Cache hit - returning verified answer');
    const cached = questionCache.get(cacheKey);
    return {
      ...cached,
      processingTime: Date.now() - startTime,
      fromCache: true
    };
  }
  
  // Multi-stage verification process
  let result;
  
  if (settings.verificationMode === 'strict' && settings.useVerification) {
    // STRICT MODE: Multi-stage verification for maximum accuracy
    result = await strictVerificationMode(questionData, settings);
  } else if (settings.verificationMode === 'balanced' && settings.useVerification) {
    // BALANCED MODE: Primary + reasoning verification
    result = await balancedVerificationMode(questionData, settings);
  } else {
    // FAST MODE: Single AI call (original behavior)
    result = await fastMode(questionData, settings);
  }
  
  // Calculate processing time
  const processingTime = Date.now() - startTime;
  console.log(`[HighAccuracy] Processing completed in ${processingTime}ms`);
  
  // Cache if high confidence
  if (result.confidence === 'high' && result.verified) {
    questionCache.set(cacheKey, result);
    console.log('[HighAccuracy] Answer cached for future use');
  }
  
  // Store in history
  await storeQuestionHistory({
    ...questionData,
    ...result,
    processingTime,
    timestamp: new Date().toISOString()
  });
  
  return {
    ...result,
    processingTime
  };
}

/**
 * Generate cache key for question
 */
function generateCacheKey(questionData) {
  const normalizedQuestion = questionData.question.trim().toLowerCase();
  const normalizedOptions = questionData.options.map(o => o.trim().toLowerCase()).sort().join('|');
  return `${normalizedQuestion}::${normalizedOptions}`;
}

/**
 * STRICT MODE: Multi-stage verification (highest accuracy)
 * Stage 1: Primary analysis
 * Stage 2: Cross-verification with reasoning
 * Stage 3: Factual verification
 */
async function strictVerificationMode(questionData, settings) {
  console.log('[Strict] Stage 1: Primary analysis...');
  
  // Stage 1: Get primary answer with detailed reasoning
  const primary = await callPrimaryAnalysis(questionData, settings);
  
  console.log('[Strict] Stage 2: Cross-verification...');
  
  // Stage 2: Verify by asking AI to evaluate each option independently
  const verification = await callVerificationAnalysis(questionData, primary, settings);
  
  console.log('[Strict] Stage 3: Final evaluation...');
  
  // Stage 3: Combine results and determine confidence
  return evaluateAndCombineResults(primary, verification, 'strict');
}

/**
 * BALANCED MODE: Primary + reasoning verification (good accuracy, faster)
 */
async function balancedVerificationMode(questionData, settings) {
  console.log('[Balanced] Primary analysis with verification...');
  
  // Get primary answer with reasoning
  const primary = await callPrimaryAnalysis(questionData, settings);
  
  // Quick verification: Ask AI to challenge its own answer
  const verification = await callSelfChallengeVerification(questionData, primary, settings);
  
  return evaluateAndCombineResults(primary, verification, 'balanced');
}

/**
 * FAST MODE: Single AI call (original behavior)
 */
async function fastMode(questionData, settings) {
  console.log('[Fast] Single AI call...');
  return await callAIService(questionData, settings);
}

/**
 * STAGE 1: Primary analysis with detailed reasoning
 */
async function callPrimaryAnalysis(questionData, settings) {
  const { question, options, category } = questionData;
  
  const systemPrompt = `You are an expert trivia analyst with a perfect accuracy record. Your reputation depends on getting every answer exactly right.

CRITICAL: One wrong answer means total failure. You must:
1. Carefully analyze the question to understand what is being asked
2. Evaluate EACH option against the question
3. Identify why incorrect options are wrong
4. Provide evidence-based reasoning for the correct answer
5. Be honest about uncertainty - flag ambiguous questions

Response in JSON format with detailed reasoning.`;

  const userPrompt = `${category ? `Category: ${category}\n\n` : ''}Question: ${question}

Options:
${options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}

Analyze each option systematically and identify the correct answer. Provide your response in this JSON format:
{
  "option": "A",
  "answer": "Full text of the answer",
  "confidence": "high|medium|low",
  "reasoning": "Detailed explanation of why this is correct",
  "elimination": {
    "A": "Why this option is correct/incorrect",
    "B": "Why this option is correct/incorrect",
    "C": "Why this option is correct/incorrect",
    "D": "Why this option is correct/incorrect"
  },
  "certainty_score": 0.95,
  "potential_ambiguity": "Any concerns or ambiguities"
}`;

  return await makeAICall(systemPrompt, userPrompt, settings, 600);
}

/**
 * STAGE 2: Verification by independent option evaluation
 */
async function callVerificationAnalysis(questionData, primaryResult, settings) {
  const { question, options } = questionData;
  
  const systemPrompt = `You are an independent fact-checker verifying trivia answers. Your job is to challenge the proposed answer and look for errors.

Review the question and the proposed answer. Determine if it's truly correct or if there's a better answer.`;

  const userPrompt = `Question: ${question}

Options:
${options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}

Proposed Answer: ${primaryResult.option} - ${primaryResult.answer}
Reasoning: ${primaryResult.reasoning}

Your task: Verify this answer. Is it definitely correct? Could any other option be correct? Respond in JSON:
{
  "agrees_with_primary": true/false,
  "verified_option": "A",
  "verification_confidence": "high|medium|low",
  "concerns": "Any issues found",
  "alternative_answer": "If you disagree, what's the correct answer",
  "final_assessment": "Your conclusion"
}`;

  return await makeAICall(systemPrompt, userPrompt, settings, 400);
}

/**
 * BALANCED MODE: Self-challenge verification
 */
async function callSelfChallengeVerification(questionData, primaryResult, settings) {
  const { question, options } = questionData;
  
  const systemPrompt = `You are reviewing your own answer. Challenge yourself: could you be wrong?`;

  const userPrompt = `Question: ${question}
Your answer: ${primaryResult.option} - ${primaryResult.answer}

Play devil's advocate: What's the strongest argument AGAINST your answer? Could you be wrong? Respond in JSON:
{
  "maintains_answer": true/false,
  "challenges": "Arguments against your answer",
  "final_confidence": "high|medium|low",
  "revised_answer": "Only if you changed your mind"
}`;

  return await makeAICall(systemPrompt, userPrompt, settings, 300);
}

/**
 * Make AI API call (supports both OpenAI and Gemini)
 */
async function makeAICall(systemPrompt, userPrompt, settings, maxTokens = 300) {
  if (settings.aiProvider === 'gemini') {
    return await makeGeminiCall(systemPrompt, userPrompt, settings, maxTokens);
  } else {
    return await makeOpenAICall(systemPrompt, userPrompt, settings, maxTokens);
  }
}

/**
 * Make Google Gemini API call
 */
async function makeGeminiCall(systemPrompt, userPrompt, settings, maxTokens = 300) {
  try {
    const model = settings.model || 'gemini-pro';
    const apiKey = settings.apiKey;
    
    // Combine system and user prompts for Gemini
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}\n\nIMPORTANT: Respond with valid JSON only.`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: combinedPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: maxTokens,
          topP: 0.8,
          topK: 10
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Gemini API request failed');
    }
    
    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from response (Gemini sometimes wraps it in markdown)
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Gemini response');
    }
    
    return JSON.parse(jsonMatch[0]);
    
  } catch (error) {
    console.error('[Gemini Error]', error);
    throw new Error(`Gemini processing failed: ${error.message}`);
  }
}

/**
 * Make OpenAI API call with error handling
 */
async function makeOpenAICall(systemPrompt, userPrompt, settings, maxTokens = 300) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1, // Very low temperature for consistency
        max_tokens: maxTokens
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'AI API request failed');
    }
    
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
    
  } catch (error) {
    console.error('[AI Error]', error);
    throw new Error(`AI processing failed: ${error.message}`);
  }
}

/**
 * Evaluate and combine results from multiple stages
 */
function evaluateAndCombineResults(primary, verification, mode) {
  let finalConfidence;
  let verified = false;
  let explanation;
  
  if (mode === 'strict') {
    // Strict mode: Both must agree with high confidence
    const bothAgree = verification.agrees_with_primary && 
                     verification.verified_option === primary.option;
    const bothHighConfidence = primary.confidence === 'high' && 
                              verification.verification_confidence === 'high';
    
    if (bothAgree && bothHighConfidence) {
      finalConfidence = 'high';
      verified = true;
      explanation = `✓ Verified: ${primary.reasoning}`;
    } else if (bothAgree) {
      finalConfidence = 'medium';
      verified = true;
      explanation = `⚠ Verified but with moderate confidence: ${primary.reasoning}`;
    } else {
      // Disagreement - flag as uncertain
      finalConfidence = 'low';
      verified = false;
      explanation = `⚠ Verification found concerns: ${verification.concerns || 'Conflicting analysis'}. Using primary answer but LOW confidence.`;
    }
  } else {
    // Balanced mode: Self-challenge
    if (verification.maintains_answer && verification.final_confidence === 'high') {
      finalConfidence = 'high';
      verified = true;
      explanation = `✓ Verified: ${primary.reasoning}`;
    } else if (verification.maintains_answer) {
      finalConfidence = 'medium';
      verified = true;
      explanation = `⚠ ${primary.reasoning}. Note: ${verification.challenges}`;
    } else {
      // Changed mind
      finalConfidence = 'low';
      verified = false;
      explanation = `⚠ Answer challenged: ${verification.challenges}. Confidence is LOW.`;
    }
  }
  
  return {
    suggestedAnswer: primary.answer,
    suggestedOption: primary.option,
    confidence: finalConfidence,
    verified: verified,
    explanation: explanation,
    detailedReasoning: primary.reasoning,
    elimination: primary.elimination,
    verificationNotes: mode === 'strict' ? verification.final_assessment : verification.challenges
  };
}

/**
 * FALLBACK: Simple AI call for fast mode
 */
async function callAIService(questionData, settings) {
  const { question, options, category } = questionData;
  
  const prompt = buildAIPrompt(question, options, category);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a trivia expert. Analyze carefully and provide the correct answer with reasoning. Respond in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 400
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'AI API request failed');
    }
    
    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);
    
    return {
      suggestedAnswer: aiResponse.answer,
      suggestedOption: aiResponse.option,
      confidence: aiResponse.confidence,
      explanation: aiResponse.explanation || aiResponse.reasoning,
      verified: false
    };
    
  } catch (error) {
    console.error('AI service error:', error);
    throw new Error(`AI processing failed: ${error.message}`);
  }
}

/**
 * Build AI prompt
 */
function buildAIPrompt(question, options, category) {
  let prompt = `Question: ${question}\n\n`;
  
  if (category) {
    prompt += `Category: ${category}\n\n`;
  }
  
  prompt += 'Options:\n';
  options.forEach((option, index) => {
    prompt += `${String.fromCharCode(65 + index)}. ${option}\n`;
  });
  
  prompt += '\nProvide your response in the following JSON format:\n';
  prompt += '{\n';
  prompt += '  "option": "A",  // The letter of the correct option\n';
  prompt += '  "answer": "Full text of the answer",\n';
  prompt += '  "confidence": "high|medium|low",\n';
  prompt += '  "explanation": "Brief explanation why this is the correct answer"\n';
  prompt += '}';
  
  return prompt;
}

/**
 * Store question in history
 */
async function storeQuestionHistory(questionRecord) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['questionHistory'], (result) => {
      const history = result.questionHistory || [];
      history.push(questionRecord);
      
      // Keep only last 100 questions
      if (history.length > 100) {
        history.shift();
      }
      
      chrome.storage.local.set({ questionHistory: history }, resolve);
    });
  });
}
