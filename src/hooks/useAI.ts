
// import { generateTextHuggingFace } from '../services/huggingFaceApi'; // Borttagen, endast offline glossning
import { quotaTracker } from '../services/quotaTracker';
import { appState } from '../state';
import { showMessage, updateButtonProgress } from '../ui';
import { WordMapEntry } from '../types';

// Inline prompts (prompts.ts removed)
const ANALYSIS_SYSTEM_INSTRUCTION = `Du är expert på svenskt teckenspråk (STS). Returnera BARA base form-ord. VARJE MENING SLUTAR MED PUNKT.`;
const IMAGE_ANALYSIS_PROMPT = `Analysera bilden. Om den innehåller text, returnera ENDAST texten. Annars, identifiera huvudobjekt.`;
const FEEDBACK_SUMMARY_INSTRUCTION = `Analysera feedback för teckenspråksappen. Generera koncis sammanfattning i punktform.`;
const FEEDBACK_CONVERSION_INSTRUCTION = `Omvandla JSON-rapport med feedback till strukturerad JSON-uppdatering.`;
const createSentenceGenerationPrompt = (count: number, words: string[]) => `Generera ${count} intressanta meningar med dessa ord: ${words.join(', ')}`;

import { clearLocalSearchCache } from '../modules/search/localSearchWithFallback';
import { offlineEngine } from '../modules/sts-glossing/offlineGlosaEngine';
// import { aiLearningSystem } from '../modules/sts-glossing/aiLearningSystem'; // Borttagen, endast offline glossning

// Alla AI-modeller och online-tjänster är borttagna. Endast offline glossning används.

// NOTE: Using Puter.js and HuggingFace APIs - no client initialization needed

export function updateAIStatusIndicator() {
    const indicator = document.getElementById('aiStatusIndicator') as HTMLElement;
    if (!indicator) return;
    
    if (appState.usePuter) {
        indicator.classList.remove('ai-offline', 'ai-loading');
        indicator.classList.add('ai-online');
        indicator.title = '✅ AI Online - Puter.js available';
    } else {
        indicator.classList.remove('ai-online', 'ai-loading');
        indicator.classList.add('ai-offline');
        indicator.title = '⚠️ AI Offline - Using local GLOSA only';
    }
}

export async function initializeAI(resetApp: () => void) {
    clearLocalSearchCache();
    
    try {
        // Check if Puter.js is available
        if (typeof (window as any).puter !== 'undefined') {
            console.log('✅ Puter.js loaded and ready');
            appState.usePuter = true;
            appState.aiReady = true;
            showMessage('✅ AI-systemet är redo (Puter)', 'success', 3000);
            
            // Ladda cloud-data vid start
            try {
                const { puterCloudSync } = await import('../modules/cloud/puterCloudSync');
                const loaded = await puterCloudSync.loadFromCloud();
                if (loaded) {
                    console.log('☁️ Cloud data loaded successfully');
                }
            } catch (cloudError) {
                console.warn('Cloud sync not available:', cloudError);
            }
        } else {
            console.warn('⚠️ Puter.js not available');
            appState.usePuter = false;
        }
    } catch (error) {
        console.error('AI initialization failed:', error);
        showMessage('❌ AI kunde inte initieras', 'error', 5000);
        appState.aiReady = false;
    }
    
    // Update AI Status Indicator
    updateAIStatusIndicator();
}

export function handleAIError(error: any, context: string) {
    const errorMessage = error?.message || (typeof error === 'string' ? error : 'Ett okänt fel inträffade.');
    console.error(`AI ${context} misslyckades:`, error);
    let userMessage = `AI-analys misslyckades.`;
    if (errorMessage.includes('429') || /quota|rate limit/i.test(errorMessage)) {
        userMessage = "AI-analys misslyckades: För många anrop. Vänta en stund.";
    } else if (errorMessage.includes('401') || errorMessage.includes('authentication')) {
        userMessage = "AI-nyckel ogiltig. Försöker nästa API...";
    } else {
        userMessage += ` ${errorMessage}`;
    }
    showMessage(userMessage, 'error', 8000);
    if (context === 'analysis' || context === 'sentence-generation') {
        updateButtonProgress('idle');
    }
}

// Importera STS-glossing-modulen för rent teckenspråksglosning

export async function refineTextWithAI(textContent: string, wordsToRefine: string[]): Promise<WordMapEntry[] | null> {
    const { aiAnalysisCache } = await import('../state');
    const cacheKey = `${textContent.trim()}_${wordsToRefine.join(',')}`;
    
    if (aiAnalysisCache.has(cacheKey)) {
        console.log('📦 Cache hit - skipping API call');
        return aiAnalysisCache.get(cacheKey)!;
    }

    appState.abortController = new AbortController();
    const systemInstruction = ANALYSIS_SYSTEM_INSTRUCTION;
    const prompt = textContent;

    try {
        // TRY OFFLINE FIRST
        console.log('🟣 Trying offline GLOSA engine first...');
        const offlineConfidence = offlineEngine.getConfidence(textContent);
        console.log(`📊 Offline confidence: ${(offlineConfidence * 100).toFixed(0)}%`);
        
        if (offlineConfidence > 0.6) {
            try {
                const offlineResult = offlineEngine.translateToGlosaOffline(textContent);
                console.log('✅ Offline GLOSA successful:', offlineResult);
                return [{
                    original: textContent,
                    base: textContent,
                    isWord: true,
                    pos: 'noun',
                    signs: null,
                    gloss: offlineResult
                }];
            } catch (e) {
                console.warn('Offline GLOSA failed, trying Puter...', e);
            }
        }

        // FALLBACK TO HUGGINGFACE API (with token if available)
        try {
            console.log('🟢 Calling HuggingFace for GLOSA translation...');
            const hfEndpoint = 'https://api-inference.huggingface.co/models/TheBloke/CapybaraHermes-2.5-Mistral-7B-GGUF';
            const hfToken = import.meta.env.VITE_HUGGINGFACE_TOKEN || '';
            
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (hfToken) headers['Authorization'] = `Bearer ${hfToken}`;
            
            const response = await fetch(hfEndpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    inputs: `${systemInstruction}\n\nSvenska: ${prompt}\n\nReturna BARA base form-ord. VARJE MENING SLUTAR MED PUNKT.`,
                    parameters: { max_new_tokens: 200 }
                })
            });
            
            if (response.ok && appState.abortController?.signal.aborted === false) {
                const data = await response.json();
                const result = data[0]?.generated_text || '';
                if (result && result.length > 20) {
                    console.log('✅ HuggingFace GLOSA translation successful');
                    aiLearningSystem.recordLearning(textContent, result.trim(), 'huggingface-glosa', 0.85);
                    appState.abortController = null;
                    return [{
                        original: textContent,
                        base: textContent,
                        isWord: true,
                        pos: 'noun',
                        signs: null,
                        gloss: result.trim()
                    }];
                }
            }
        } catch (error: any) {
            console.warn('HuggingFace GLOSA failed:', error?.message || error);
        }
    } catch (error: any) {
        console.error('GLOSA error:', error);
        handleAIError(error, 'glosa');
    }

    appState.abortController = null;
    return null;
}

export async function generateSentencesWithAI(count: number): Promise<string[] | null> {
    const { searchableLexicon } = await import('../state');
    const lexiconSample = [...searchableLexicon].sort(() => 0.5 - Math.random()).slice(0, 10);
    const prompt = createSentenceGenerationPrompt(count, lexiconSample);

    try {
        if (appState.usePuter && (window as any).puter?.ai?.chat) {
            console.log('🔵 Calling Puter AI for sentence generation...');
            const response = await (window as any).puter.ai.chat({
                messages: [
                    { role: 'system', content: 'Du är en kreativ svensk skribent. Generera enkla, vardagliga meningar på svenska.' },
                    { role: 'user', content: `${prompt}\n\nGenerera exakt ${count} meningar som JSON-lista. Format: ["mening1", "mening2", ...]` }
                ],
                model: 'gpt-4o-mini'
            });
            
            const result = response.message?.content || response || '';
            
            if (result) {
                try {
                    const jsonMatch = result.match(/\[[\s\S]*?\]/);
                    const jsonStr = jsonMatch ? jsonMatch[0] : result;
                    const sentences = JSON.parse(jsonStr);
                    
                    if (Array.isArray(sentences)) {
                        console.log('✅ Puter AI generated sentences:', sentences.length);
                        return sentences.slice(0, count);
                    }
                } catch (parseError) {
                    console.warn('Failed to parse Puter AI JSON response:', parseError);
                }
            }
        } else {
            console.warn('⚠️ Puter AI not available for sentence generation');
            showMessage('AI inte tillgänglig. Aktivera dev mode först.', 'error');
        }
    } catch (error: any) {
        console.warn('Puter sentence generation failed:', error?.message || error);
        handleAIError(error, 'puter-sentences');
    }

    return null;
}

export async function analyzeImageWithAI(base64Data: string, mimeType: string): Promise<string | null> {
    try {
        if (appState.usePuter && (window as any).puter?.ai?.chat) {
            try {
                console.log('🔵 Calling Puter Gemini 2.5 Pro for image analysis...');
                const response = await (window as any).puter.ai.chat({
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'image',
                                    src: `data:${mimeType};base64,${base64Data}`
                                },
                                {
                                    type: 'text',
                                    content: IMAGE_ANALYSIS_PROMPT
                                }
                            ]
                        }
                    ],
                    model: aiModelSettings.imagePuter
                });
                
                return response.message?.content || response || "(Bildanalys misslyckades)";
            } catch (error) {
                console.warn('Puter image analysis failed:', error);
                handleAIError(error, 'puter-image');
            }
        }
    } catch (error) {
        console.error('Image analysis error:', error);
    }

    return "(Bildanalys kräver Puter AI.)";
}

export async function generateLearningSummaryAI(feedbackJson: string): Promise<string | null> {
    const systemInstruction = FEEDBACK_SUMMARY_INSTRUCTION;
    
    try {
        if (appState.usePuter && (window as any).puter?.ai?.chat) {
            try {
                console.log('🔵 Calling Puter Claude Opus 4.5 for feedback summary...');
                const response = await (window as any).puter.ai.chat({
                    messages: [
                        { role: 'system', content: systemInstruction },
                        { role: 'user', content: `Skapa en inlärningssammanfattning från: ${feedbackJson}` }
                    ],
                    model: aiModelSettings.summaryPuter
                });
                
                return response.message?.content || response || null;
            } catch (error) {
                console.warn('Puter feedback summary failed:', error);
                handleAIError(error, 'puter-summary');
            }
        }
    } catch (error) {
        console.error('Feedback summary error:', error);
    }

    return null;
}

export async function convertSummaryToJsonAI(feedbackJson: string): Promise<any | null> {
    const systemInstruction = FEEDBACK_CONVERSION_INSTRUCTION;
    const prompt = `Analysera denna feedback-JSON och konvertera den enligt schemat:\n\n${feedbackJson}

Du MÅSTE returnera ENDAST en giltig JSON-struktur med fälten: newWords, learnedPreferences, homonymResolutions (alla kan vara null/arrays).`;

    try {
        if (appState.usePuter && (window as any).puter?.ai?.chat) {
            try {
                console.log('🔵 Calling Puter GPT-5.1 for JSON conversion...');
                const response = await (window as any).puter.ai.chat({
                    messages: [
                        { role: 'system', content: systemInstruction },
                        { role: 'user', content: prompt }
                    ],
                    model: aiModelSettings.jsonPuter
                });
                
                const responseText = response.message?.content || response;
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
                return JSON.parse(jsonStr);
            } catch (error) {
                console.warn('Puter JSON conversion failed:', error);
                handleAIError(error, 'puter-json');
            }
        }
    } catch (error) {
        console.error('JSON conversion error:', error);
    }

    return null;
}

export async function translateToGlosa(swedishText: string): Promise<string | null> {
    if (!swedishText.trim()) return null;

    let offlineResult: string | null = null;
    let offlineConfidence = 0;

    try {
        // Försök alltid offline glossning först
        offlineConfidence = offlineEngine.getConfidence(swedishText);
        // Offline confidence log
        console.log('Offline confidence: ' + (offlineConfidence * 100).toFixed(0) + '%');
        if (offlineConfidence > 0.6) {
            offlineResult = offlineEngine.translateToGlosaOffline(swedishText);
            if (offlineResult && offlineResult.length > 0) {
                console.log('✅ Offline GLOSA successful:', offlineResult);
                return offlineResult;
            }
        }

        // Fallback: tokenisering och lookup som sökfunktionen
        const tokens = swedishText.split(/([,\."!\?\n\s]+)/g).filter(token => token.length > 0);
        const { findCandidatesForToken } = await import('../modules/search/localSearchWithFallback');
        const promises = tokens.map(async (token) => {
            if (/^[\s,\."!\?\n]+$/.test(token)) {
                return token;
            }
            const cand = await findCandidatesForToken(token);
            return cand?.base?.toUpperCase() || token.toUpperCase();
        });
        const results = await Promise.all(promises);
        const glosaStr = results.join(' ');
        console.log('🔄 Fallback glosa:', glosaStr);
        return glosaStr.trim();
    } catch (error: any) {
        console.error('GLOSA translation error:', error);
        showMessage('GLOSA-översättning misslyckades', 'error');
        return null;
    }
}
