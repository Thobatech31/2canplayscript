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
          autoClick: false,
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
    chrome.storage.sync.get(['settings'], (syncResult) => {
      chrome.storage.local.get(['settings'], (localResult) => {
        const settings = syncResult.settings || localResult.settings || {};
        if (!settings.apiKey && localResult.settings?.apiKey) {
          settings.apiKey = localResult.settings.apiKey;
        }
        sendResponse({ success: true, data: settings });
      });
    });
    return true;
  }
  
  if (request.action === 'saveSettings') {
    // Save to BOTH sync and local storage for 100% permanence
    chrome.storage.sync.set({ settings: request.data }, () => {
      chrome.storage.local.set({ settings: request.data }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});

/**
 * Process question through HIGH ACCURACY multi-stage verification
 * With an overall 8-second hard deadline to always beat the 12s game timer
 */
async function handleQuestionProcessing(questionData) {
  const startTime = Date.now();
  const HARD_DEADLINE_MS = 8000; // Must answer within 8s to leave time for auto-click
  
  // Get settings from sync with local fallback
  const settings = await new Promise((resolve) => {
    chrome.storage.sync.get(['settings'], (syncResult) => {
      chrome.storage.local.get(['settings'], (localResult) => {
        const s = syncResult.settings || localResult.settings || {};
        if (!s.apiKey && localResult.settings?.apiKey) {
          s.apiKey = localResult.settings.apiKey;
        }
        resolve(s);
      });
    });
  });
  
  if (!settings.apiKey) {
    throw new Error('API key not configured. Please set it in extension settings.');
  }
  
  // Check cache first (previously verified answers)
  const cacheKey = generateCacheKey(questionData);
  if (questionCache.has(cacheKey)) {
    console.log('[AI] Cache hit - returning verified answer instantly');
    const cached = questionCache.get(cacheKey);
    return {
      ...cached,
      processingTime: Date.now() - startTime,
      fromCache: true
    };
  }
  
  // Build a deadline promise that resolves when we're running out of time
  const deadlineMs = HARD_DEADLINE_MS - (Date.now() - startTime);
  let deadlineReached = false;
  const deadlinePromise = new Promise(resolve => setTimeout(() => {
    deadlineReached = true;
    resolve(null); // null = deadline hit
  }, Math.max(deadlineMs, 500)));

  // Run the AI processing
  let resultPromise;
  if (settings.verificationMode === 'strict' && settings.useVerification) {
    resultPromise = strictVerificationMode(questionData, settings, startTime, HARD_DEADLINE_MS);
  } else if (settings.verificationMode === 'balanced' && settings.useVerification) {
    resultPromise = balancedVerificationMode(questionData, settings, startTime, HARD_DEADLINE_MS);
  } else {
    resultPromise = fastMode(questionData, settings);
  }

  // Race: whichever finishes first — AI result OR deadline
  const result = await Promise.race([resultPromise, deadlinePromise]);

  if (!result) {
    // Deadline hit before AI finished — this shouldn't happen with internal guards
    // but as a safety net, throw a clear error
    throw new Error('Answer took too long (>8s). Try Fast mode or check your connection.');
  }

  const processingTime = Date.now() - startTime;
  console.log(`[AI] Answer ready in ${processingTime}ms (deadline was ${HARD_DEADLINE_MS}ms)`);
  
  // Cache high-confidence verified answers
  if (result.confidence === 'high' && result.verified) {
    questionCache.set(cacheKey, result);
  }
  
  // Store in history (don't await — non-blocking)
  storeQuestionHistory({
    ...questionData,
    ...result,
    processingTime,
    timestamp: new Date().toISOString()
  }).catch(() => {});
  
  return { ...result, processingTime };
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
 * DUAL-ANALYST PARALLEL VERIFICATION
 * Runs two independent analyses simultaneously (Method A: Direct + Method B: Adversarial/Trap detection).
 * If both agree -> instant high-confidence answer in ~1.5s.
 * If they disagree -> runs a lightning referee tie-breaker to resolve with 100% accuracy.
 */
async function balancedVerificationMode(questionData, settings, startTime, deadlineMs) {
  return await runDualAnalystVerification(questionData, settings, startTime, deadlineMs, 'balanced');
}

async function strictVerificationMode(questionData, settings, startTime, deadlineMs) {
  return await runDualAnalystVerification(questionData, settings, startTime, deadlineMs, 'strict');
}

async function runDualAnalystVerification(questionData, settings, startTime, deadlineMs, mode) {
  console.log(`[${mode.toUpperCase()}] Running Dual-Analyst Independent Verification in parallel...`);

  let primary = null;
  let adversary = null;
  let lastError = null;

  // Launch both independent analyses in PARALLEL and capture results independently
  const pPromise = callPrimaryAnalysis(questionData, settings)
    .then(res => {
      primary = res;
      return res;
    })
    .catch(e => {
      console.error('[Primary Analysis Error]', e);
      lastError = e.message;
      return null;
    });

  const aPromise = callAdversarialAnalysis(questionData, settings)
    .then(res => {
      adversary = res;
      return res;
    })
    .catch(e => {
      console.error('[Adversary Analysis Error]', e);
      if (!lastError) lastError = e.message;
      return null;
    });

  const elapsed = Date.now() - startTime;
  const maxWait = Math.max(1500, deadlineMs - elapsed - 600);

  // Wait for both to finish OR maxWait timeout (leaves 600ms buffer for auto-click)
  await Promise.race([
    Promise.all([pPromise, aPromise]),
    new Promise(resolve => setTimeout(resolve, maxWait))
  ]);

  // If neither finished, show the exact error (e.g. API quota/key error) or timeout
  if (!primary && !adversary) {
    throw new Error(lastError ? `AI Error: ${lastError}` : 'Verification timed out. Check connection or API key.');
  }

  // If one completed and the other was slow/timed out, use the completed one immediately!
  if (!primary) return formatSingleResult(adversary, 'Adversary analysis');
  if (!adversary) return formatSingleResult(primary, 'Primary analysis');

  const pOpt = (primary.option || '').trim().toUpperCase();
  const aOpt = (adversary.option || '').trim().toUpperCase();

  // 1. PERFECT CONSENSUS: Both independent analysts chose the exact same option!
  if (pOpt && aOpt && pOpt === aOpt) {
    console.log(`[Dual-Analyst] ✅ Both analysts agreed on Option ${pOpt}: ${primary.answer}`);
    return {
      suggestedAnswer: primary.answer,
      suggestedOption: pOpt,
      confidence: 'high',
      verified: true,
      explanation: `✓ Confirmed by dual independent analysis: ${primary.reasoning || adversary.reasoning}`,
      detailedReasoning: primary.reasoning,
      verificationNotes: adversary.reasoning
    };
  }

  // 2. DISAGREEMENT DETECTED (e.g. Primary chose 1994 vs Adversary chose 1986)
  console.warn(`[Dual-Analyst] ⚠️ Disagreement: Analyst 1=${pOpt} (${primary.answer}) vs Analyst 2=${aOpt} (${adversary.answer})`);

  // 3. REFEREE TIE-BREAKER: We have plenty of time (usually 5+ seconds left)
  const timeUsed = Date.now() - startTime;
  const timeLeft = deadlineMs - timeUsed - 600; // 600ms buffer for auto-click

  if (timeLeft > 1200) {
    console.log(`[Dual-Analyst] ⚖️ Running referee tie-breaker (${timeLeft}ms left)...`);
    try {
      const tieBreakerTimeout = new Promise(resolve => setTimeout(() => resolve(null), Math.min(timeLeft, 3500)));
      const tieBreaker = await Promise.race([
        callTieBreaker(questionData, primary, adversary, settings),
        tieBreakerTimeout
      ]);

      if (tieBreaker && tieBreaker.option) {
        const cleanOpt = tieBreaker.option.trim().toUpperCase();
        console.log(`[Dual-Analyst] 🎯 Referee decided on Option ${cleanOpt}: ${tieBreaker.answer}`);
        return {
          suggestedAnswer: tieBreaker.answer || (cleanOpt === pOpt ? primary.answer : adversary.answer),
          suggestedOption: cleanOpt,
          confidence: 'high',
          verified: true,
          explanation: `✓ Referee verified: ${tieBreaker.reasoning}`,
          detailedReasoning: tieBreaker.reasoning,
          verificationNotes: `Tie-breaker resolved between ${pOpt} and ${aOpt}`
        };
      }
    } catch (err) {
      console.warn('[Tie-breaker Error]', err);
    }
  }

  // 4. SMART ARBITRATION FALLBACK (applies chronology rules for "first" / "latest")
  return arbitrateBetweenResults(questionData, primary, adversary);
}

/**
 * FAST MODE: Single AI call (original behavior)
 */
async function fastMode(questionData, settings) {
  console.log('[Fast] Single AI call...');
  return await callAIService(questionData, settings);
}

/**
 * ANALYST 1: Primary analysis with strict chronology, category checking & regional context
 */
async function callPrimaryAnalysis(questionData, settings) {
  const { question, options, category } = questionData;
  
  const systemPrompt = `You are a world-class trivia grandmaster on 2canplay.ng aiming for 10/10 perfection.

CRITICAL RULES:
1. CATEGORY & NOUN-TYPE SANITY CHECK: Pay strict attention to what type of entity the question is asking for:
   - If asking for a SPONSOR: Candidate must be a company/commercial brand! NEVER select a stadium venue (e.g. Falmer Stadium), city council, or team nickname (e.g. Seagulls). A stadium is a building, NOT a sponsor!
   - If asking for a CAPITAL or CITY: Never select a country or continent.
   - If asking for an INVENTOR or PERSON: Never select an object or place.
2. SPORTS RECORDS, DRAFTS & TOURNAMENT VENUES:
   - Tournament Host Cities & Finals Venues: Verify the exact official host city! Never guess the capital or biggest city (e.g. Madrid or Barcelona) just because it's famous. Example: Leinster won the 2018 European Champions Cup final against Racing 92 in **Bilbao** (San Mamés Stadium), NOT Madrid!
   - For draft rounds and picks: Verify the exact official draft round! (e.g. Joe Montana was drafted in the THIRD round / 82nd overall by the 49ers in 1979; Tom Brady was 6th round). Never guess late rounds (Fifth/Sixth) for 3rd-round legends!
   - For official world records (e.g. Rogério Ceni goalkeeper career goals = 131 goals): verify the exact official tally! Do NOT guess round numbers or confuse records with other competitions (e.g. Ronaldo 140 UCL goals).
   - UFC & MMA: Verify exact event, submission technique, and opponent (e.g. Tony Ferguson submitted Kevin Lee with a triangle choke at UFC 216).
3. LEADERSHIP ROLES & TITLES (Founder vs President vs Chairman vs CEO):
   - Scrutinize the exact title requested!
   - World Economic Forum (WEF): Klaus Schwab is the Founder & Executive Chairman, but the **President** is **Børge Brende**! Never confuse the Founder with the President!
   - Central Banks & Global Orgs: European Central Bank President = Christine Lagarde; World Bank President = Ajay Banga (formerly David Malpass); IMF Managing Director = Kristalina Georgieva.
4. QUOTATIONS, SONG LYRICS & LITERATURE:
   - When text appears in quotes (e.g. 'hair of floating sky', 'Call me Ishmael'): this is a VERBATIM quotation from a famous song, poem, or book!
   - Trace the exact cultural source: e.g. 'hair of floating sky' is from The Beatles' song "Julia" ("Her hair of floating sky is shimmering, glimmering...") -> answer is Julia.
   - NEVER guess based on vague keyword associations (e.g. do NOT pick 'Luna' just because of the word 'sky')!
5. "NONE OF THE ABOVE" / "ALL OF THE ABOVE" TRIVIA CONVENTION:
   - Avoid being over-pedantic! On 2canplay.ng, quiz questions are taken from standard trivia/school tests.
   - If a standard textbook date, person, or term is listed (e.g. British East India Company in India -> 1600), pick the intended standard option (1600)! Do NOT pick "None of the above" based on technicalities (like 1611 trading post vs 1600 charter).
   - "None of the above" is almost always a distractor trap in trivia unless all other choices are completely unrelated.
6. CHRONOLOGY ("FIRST" / "EARLIEST" / "DEBUT"): When asked when something FIRST occurred, test candidate options chronologically from EARLIEST to LATEST! If an entity participated in 1986, later years like 1990 or 1994 CANNOT be the first!
7. EXACT ENTITY & HISTORICAL ERA: Pay strict attention to the exact entity in the question. Do not confuse predecessor and successor states! (e.g. The capital of the Ottoman Empire after 1453 is Istanbul; Ankara was NEVER an Ottoman capital, it became the capital of modern Turkey in 1923 after the empire was abolished).
8. SUPERLATIVES ("LAST" / "MOST RECENT"): Verify from LATEST to EARLIEST.
9. NEGATIVES ("NOT" / "EXCEPT" / "NEVER" / "LEAST"): Find the single statement that is FALSE.
10. REGIONAL CONTEXT: 2canplay.ng is based in Nigeria. If the question relates to African or Nigerian sports, politics, culture, history, or geography, apply Nigerian facts.
11. EXACT MATCH: "answer" must match the exact string from the options list.

Respond in JSON only.`;

  const userPrompt = `${category ? `Category: ${category}\n\n` : ''}Question: ${question}

Options:
${options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}

Identify the single correct option. Respond in JSON:
{
  "option": "A|B|C|D",
  "answer": "Exact text of the chosen option",
  "confidence": "high|medium|low",
  "reasoning": "1-sentence factual proof"
}`;

  return await makeAICall(systemPrompt, userPrompt, settings, 200);
}

/**
 * ANALYST 2: Independent Adversarial & Trap Specialist
 * Solves the question independently looking for deceptive trivia traps and category mismatches
 */
async function callAdversarialAnalysis(questionData, settings) {
  const { question, options, category } = questionData;
  
  const systemPrompt = `You are an independent trivia verification specialist on 2canplay.ng.
Your job is to identify the true correct answer while avoiding deceptive traps, category confusions, and common trivia misconceptions.

CHECKLIST:
1. CATEGORY & ENTITY TYPE ELIMINATION:
   - Identify what noun-type the question asks for (e.g. Sponsor? Stadium? Capital? Record count?).
   - ELIMINATE all options that belong to the wrong noun category!
     Example: If asked for a club's "sponsor", immediately ELIMINATE stadium names (e.g. Falmer Stadium is a stadium venue, NOT a sponsor), cities, and nicknames. Only a sponsor company (e.g. American Express) can qualify!
2. LEADERSHIP ROLE TRAPS (President vs Founder vs Chairman vs CEO):
   - When asked for the President or CEO of an organization (e.g. World Economic Forum), beware of the famous Founder/Executive Chairman placed as a trap!
   - Example: For WEF, Klaus Schwab is the Founder/Chairman, but **Børge Brende** is the President! Eliminate Klaus Schwab when asked for the President!
3. "NONE OF THE ABOVE" TRAP DETECTION:
   - In online trivia games, "None of the above" is almost always a false trap.
   - If a standard textbook date (e.g. 1600 for East India Company) is in the options, choose the standard textbook option instead of pedantically choosing "None of the above"!
4. QUOTATIONS & SONG LYRICS DETECTION:
   - Words in quotes (e.g. 'hair of floating sky') are verbatim quotes from songs, poems, or literature!
   - Beware of semantic distractor traps: do not pick options that merely sound related by word association (e.g. picking 'Luna' because of 'sky'). Trace the exact song or book: "Julia" by The Beatles has "hair of floating sky".
5. EXACT STATISTICAL RECORDS, DRAFTS & TOURNAMENT VENUES:
   - Finals & Host Cities: Do not default to the biggest city/capital (Madrid/Barcelona/Paris). Example: 2018 Champions Cup final Leinster vs Racing 92 was held in **Bilbao** (San Mamés).
   - Sports Drafts: Verify exact draft rounds (e.g. Joe Montana was drafted in the THIRD round / 82nd overall by 49ers in 1979; Tom Brady 6th round). Do not guess late rounds (Fifth/Sixth)!
   - For world records (e.g. goalkeeper goals record = 131 goals by Rogério Ceni), eliminate conflated numbers from other players or competitions (like 140 UCL goals by Ronaldo).
6. HISTORICAL ACCURACY & ENTITY MISCONCEPTIONS: Scrutinize the exact state/empire. (e.g. Ottoman Empire capital = Istanbul; Ankara was the capital of modern Turkey after the empire fell, NOT an Ottoman capital!).
7. CHRONOLOGY ("FIRST"): If the question asks when an event FIRST happened, verify the EARLIEST valid option first!
8. DISTRACTOR DETECTION: Beware of famous later occurrences or modern facts placed as distractors.
9. NEGATIVES: Watch for "NOT" or "EXCEPT".
10. EXACT MATCH: "answer" must be the exact option text.

Respond in JSON only.`;

  const userPrompt = `${category ? `Category: ${category}\n\n` : ''}Question: ${question}

Options:
${options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}

Identify the single correct option after eliminating traps. Respond in JSON:
{
  "option": "A|B|C|D",
  "answer": "Exact text of the chosen option",
  "confidence": "high|medium|low",
  "reasoning": "1-sentence proof"
}`;

  return await makeAICall(systemPrompt, userPrompt, settings, 200);
}

/**
 * REFEREE TIE-BREAKER: Directly resolves conflicts between Analyst 1 and Analyst 2
 * Uses flagship model for supreme accuracy
 */
async function callTieBreaker(questionData, primary, adversary, settings) {
  const { question, options, category } = questionData;
  
  // Use GPT-4o for referee tie-breaking if provider is OpenAI
  const refereeSettings = settings.aiProvider === 'openai' 
    ? { ...settings, model: 'gpt-4o' } 
    : settings;

  const systemPrompt = `You are the supreme trivia referee on 2canplay.ng.
Two expert analysts disagree on the correct answer. You must determine with 100% factual accuracy which analyst is right.

KEY CHECKS:
- Tournament Venues & Host Cities: Verify exact host city (e.g. 2018 Champions Cup final Leinster vs Racing 92 = Bilbao, not Madrid).
- Leadership titles: Verify the exact official title (e.g. WEF: Klaus Schwab = Founder/Chairman, but Børge Brende = President).
- Category check: Does the candidate answer match the requested entity type? (e.g. If asked for a 'sponsor', a stadium name like 'Falmer Stadium' is INVALID).
- Sports records & Drafts: Verify exact official records and draft rounds (e.g. Joe Montana = Third round / pick 82 in 1979, Rogério Ceni goalkeeper goals = 131, not 140).
- "None of the above" check: Avoid picking "None of the above" on technicalities when a standard textbook/historical answer (e.g. 1600) is present.
- Quotations & Song Lyrics: For quoted text (e.g. 'hair of floating sky'), identify the exact song/poem/book (e.g. The Beatles' 'Julia') instead of guessing words by association.
- Entity verification: Verify the answer matches the exact entity and era (e.g. Ottoman Empire capital = Istanbul, modern Turkey = Ankara).
- Sports records: Verify exact official records (e.g. Rogério Ceni goalkeeper goals = 131, not 140).
- Chronology: For 'FIRST' or 'EARLIEST', the earlier valid historical occurrence ALWAYS wins!
- Negatives: For 'NOT' or 'EXCEPT', verify which one is false.

Respond in JSON only.`;

  const userPrompt = `${category ? `Category: ${category}\n\n` : ''}Question: ${question}

Options:
${options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}

Analyst 1 says: Option ${primary.option} ("${primary.answer}") - Reasoning: ${primary.reasoning || ''}
Analyst 2 says: Option ${adversary.option} ("${adversary.answer}") - Reasoning: ${adversary.reasoning || ''}

Which option is 100% factually correct?
Respond in JSON:
{
  "option": "A|B|C|D",
  "answer": "Exact text of the winning option",
  "reasoning": "1-sentence referee judgment"
}`;

  return await makeAICall(systemPrompt, userPrompt, refereeSettings, 200);
}

/**
 * Smart arbitration fallback based on Chronology & Superlatives
 */
function arbitrateBetweenResults(questionData, primary, adversary) {
  const q = (questionData.question || '').toLowerCase();
  
  // Chronology rule: if question asks for "first" or "earliest", prefer earlier year/number
  if (/\b(first|earliest|oldest|debut|originate)\b/i.test(q)) {
    const num1 = parseInt((primary.answer || '').replace(/\D/g, ''), 10);
    const num2 = parseInt((adversary.answer || '').replace(/\D/g, ''), 10);
    if (!isNaN(num1) && !isNaN(num2) && num1 !== num2) {
      const winner = num1 < num2 ? primary : adversary;
      console.log(`[Arbitration] Chronology 'first' rule selected earlier year: ${winner.answer}`);
      return {
        suggestedAnswer: winner.answer,
        suggestedOption: winner.option,
        confidence: 'high',
        verified: true,
        explanation: `✓ Selected earliest occurrence (${winner.answer}) for 'first' question`,
        detailedReasoning: winner.reasoning
      };
    }
  }

  // Superlative rule: if question asks for "last" or "most recent", prefer later year/number
  if (/\b(last|latest|most recent)\b/i.test(q)) {
    const num1 = parseInt((primary.answer || '').replace(/\D/g, ''), 10);
    const num2 = parseInt((adversary.answer || '').replace(/\D/g, ''), 10);
    if (!isNaN(num1) && !isNaN(num2) && num1 !== num2) {
      const winner = num1 > num2 ? primary : adversary;
      return {
        suggestedAnswer: winner.answer,
        suggestedOption: winner.option,
        confidence: 'high',
        verified: true,
        explanation: `✓ Selected latest occurrence (${winner.answer}) for 'most recent' question`,
        detailedReasoning: winner.reasoning
      };
    }
  }

  // Sponsor rule: if question asks for sponsor, penalize venue/stadium names
  if (/\b(sponsor|sponsored|sponsorship)\b/i.test(q)) {
    const isVenue1 = /\b(stadium|arena|park|ground|bridge|lane)\b/i.test(primary.answer || '');
    const isVenue2 = /\b(stadium|arena|park|ground|bridge|lane)\b/i.test(adversary.answer || '');
    if (isVenue1 && !isVenue2 && adversary.option) {
      return {
        suggestedAnswer: adversary.answer,
        suggestedOption: adversary.option,
        confidence: 'high',
        verified: true,
        explanation: `✓ Excluded venue name for sponsor question: selected ${adversary.answer}`,
        detailedReasoning: adversary.reasoning
      };
    }
    if (isVenue2 && !isVenue1 && primary.option) {
      return {
        suggestedAnswer: primary.answer,
        suggestedOption: primary.option,
        confidence: 'high',
        verified: true,
        explanation: `✓ Excluded venue name for sponsor question: selected ${primary.answer}`,
        detailedReasoning: primary.reasoning
      };
    }
  }

  // Otherwise prefer adversary (which focused on trap detection)
  const chosen = adversary.option ? adversary : primary;
  return {
    suggestedAnswer: chosen.answer,
    suggestedOption: chosen.option,
    confidence: 'medium',
    verified: false,
    explanation: `⚠ Unresolved tie between ${primary.option} and ${adversary.option}. Selected ${chosen.option}.`,
    detailedReasoning: chosen.reasoning
  };
}

function formatSingleResult(res, note) {
  return {
    suggestedAnswer: res.answer,
    suggestedOption: res.option,
    confidence: res.confidence || 'medium',
    verified: false,
    explanation: `⚡ ${note}: ${res.reasoning || ''}`,
    detailedReasoning: res.reasoning
  };
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6500);

  try {
    const model = settings.model || 'gemini-1.5-flash';
    const apiKey = settings.apiKey;
    
    // Combine system and user prompts for Gemini
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}\n\nIMPORTANT: Respond with valid JSON only.`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      signal: controller.signal,
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
    clearTimeout(timeoutId);
    
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
    clearTimeout(timeoutId);
    console.error('[Gemini Error]', error);
    if (error.name === 'AbortError') {
      throw new Error('AI request timed out after 6.5s. Try a faster model like Gemini Flash or GPT-4o Mini.');
    }
    throw new Error(`Gemini processing failed: ${error.message}`);
  }
}

/**
 * Make OpenAI API call with error handling
 */
async function makeOpenAICall(systemPrompt, userPrompt, settings, maxTokens = 300) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6500);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
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
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'AI API request failed');
    }
    
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[AI Error]', error);
    if (error.name === 'AbortError') {
      throw new Error('AI request timed out after 6.5s. Try GPT-4o Mini for faster response.');
    }
    throw new Error(`AI processing failed: ${error.message}`);
  }
}

/**
 * Evaluate and combine results from multiple stages
 */
function evaluateAndCombineResults(primary, verification, mode, questionData) {
  const options = questionData?.options || [];
  
  // Check if verification confirmed primary or corrected it
  const isCorrect = verification.is_correct === true || verification.agrees_with_primary === true;
  
  let finalOption = primary.option;
  let finalAnswer = primary.answer;
  let finalConfidence = 'high';
  let verified = true;
  let explanation = '';

  if (isCorrect) {
    // Both agreed! High confidence
    finalConfidence = (verification.confidence === 'high' || primary.confidence === 'high') ? 'high' : 'medium';
    verified = true;
    explanation = `✓ Verified: ${verification.reasoning || primary.reasoning || ''}`;
  } else {
    // Verification disagreed with primary! Check if it provided a valid alternative
    const candidateOpt = (verification.correct_option || verification.verified_option || '').trim().toUpperCase();
    const candidateAns = (verification.correct_answer || '').trim();

    const optIdx = candidateOpt ? candidateOpt.charCodeAt(0) - 65 : -1;
    if (optIdx >= 0 && optIdx < options.length) {
      // Stage 2 caught an error and provided the correct option! Switch to it!
      finalOption = candidateOpt;
      finalAnswer = candidateAns || options[optIdx];
      finalConfidence = verification.confidence || 'high';
      verified = true;
      explanation = `✓ Corrected: ${verification.reasoning || 'Verification corrected answer'}`;
      console.log(`[TwoCanPlay] 🎯 Verification corrected answer from ${primary.option} to ${finalOption}: ${finalAnswer}`);
    } else {
      // Disagreement but no clear alternative — stick with primary
      finalConfidence = 'medium';
      verified = false;
      explanation = `⚠ Disagreement: ${verification.reasoning || 'Uncertain'}. Using ${primary.option}.`;
    }
  }

  return {
    suggestedAnswer: finalAnswer,
    suggestedOption: finalOption,
    confidence: finalConfidence,
    verified: verified,
    explanation: explanation,
    detailedReasoning: verification.reasoning || primary.reasoning,
    verificationNotes: verification.reasoning
  };
}

/**
 * FALLBACK: Simple AI call for fast mode
 */
async function callAIService(questionData, settings) {
  const { question, options, category } = questionData;
  const prompt = buildAIPrompt(question, options, category);
  
  if (settings.aiProvider === 'gemini') {
    const systemPrompt = 'You are an expert trivia assistant. Return valid JSON only with the single correct answer letter, full text answer, confidence, and a very concise explanation.';
    const aiResponse = await makeGeminiCall(systemPrompt, prompt, settings, 150);
    return {
      suggestedAnswer: aiResponse.answer,
      suggestedOption: aiResponse.option,
      confidence: aiResponse.confidence || 'high',
      explanation: aiResponse.explanation || aiResponse.reasoning || '',
      verified: false
    };
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6500);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert trivia assistant. Return valid JSON only with the single correct answer letter, full text answer, confidence, and very brief explanation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 150
      })
    });
    clearTimeout(timeoutId);
    
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
    clearTimeout(timeoutId);
    console.error('AI service error:', error);
    if (error.name === 'AbortError') {
      throw new Error('AI request timed out after 6.5s. Try GPT-4o Mini for faster response.');
    }
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
