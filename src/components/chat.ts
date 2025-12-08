
import { appState, learnedPreferences, localUserSigns, homonymMap, feedbackMap, sentenceFeedbackMap, positiveFeedbackMap, negativeFeedbackMap, questionClarifications, localLexiconMap } from '../state';
import { showMessage, isDevMode, FEEDBACK_SUMMARY_PREFIX, buildVideoUrl } from '../ui';
import { ChatHistoryMessage, Sign } from '../types';
import { convertSummaryToJsonAI, generateLearningSummaryAI } from '../hooks/useAI';
import { openModal, clearFeedbackData } from './modals';
import { saveUserData, handleExportBackup } from '../hooks/useLexicon'; // Import save functions
import { populateVideoGrid, renderCurrentSentence } from './VideoGrid'; 
import { getSortedSearchResults, fileToBase64 } from '../utils';
import { markdownToHtml } from '../utils/textUtils';

// Inline prompts (prompts.ts removed)
const CHAT_SYSTEM_INSTRUCTION = `Du är expert på svenskt teckenspråk (STS). Svara på användarens frågor om tecken, grammatik och dövkultur.`;
const createFeedbackChatPrompt = (jsonReport: string, userText: string) => `Feedback: ${jsonReport}\n\nSvar på: ${userText}`;

// --- DOM ELEMENTS (Initialized in setup) ---
let aiChatModal: HTMLElement;
// General Chat Elements
let aiChatView: HTMLElement;
let aiChatHistory: HTMLElement;
let aiChatInput: HTMLTextAreaElement;
let aiChatSendBtn: HTMLButtonElement;
let aiChatFileUploadBtn: HTMLButtonElement;
let aiChatFileInput: HTMLInputElement;
let aiChatFilePreviewContainer: HTMLElement;

// Feedback/System Chat Elements
let aiFeedbackView: HTMLElement;
let aiFeedbackHistory: HTMLElement;
let aiFeedbackInput: HTMLTextAreaElement;
let aiFeedbackSendBtn: HTMLButtonElement;
let feedbackTabBadge: HTMLElement;
let showJsonBtn: HTMLButtonElement; // NEW

// Tabs
let tabAiChat: HTMLButtonElement;
let tabAiFeedback: HTMLButtonElement;

// Internal Search Elements
let aiChatSearchToggleBtn: HTMLButtonElement;
let aiChatSearchContainer: HTMLElement;
let aiChatSearchInput: HTMLInputElement;
let aiChatCloseSearchBtn: HTMLButtonElement;
let aiChatSearchResults: HTMLElement;

// --- STATE ---
type ActiveTab = 'chat' | 'feedback';
let activeTab: ActiveTab = 'chat';
let feedbackLocalHistory: ChatHistoryMessage[] = [];

function switchTab(tab: ActiveTab) {
    activeTab = tab;
    
    if (tab === 'chat') {
        aiChatView.classList.remove('hidden');
        aiFeedbackView.classList.add('hidden');
        
        tabAiChat.classList.add('border-blue-500', 'text-blue-400');
        tabAiChat.classList.remove('border-transparent', 'text-gray-400');
        
        tabAiFeedback.classList.remove('border-blue-500', 'text-blue-400');
        tabAiFeedback.classList.add('border-transparent', 'text-gray-400');
        
        renderChatHistory(appState.chatHistory, aiChatHistory);
    } else {
        aiChatView.classList.add('hidden');
        aiFeedbackView.classList.remove('hidden');
        
        tabAiFeedback.classList.add('border-blue-500', 'text-blue-400');
        tabAiFeedback.classList.remove('border-transparent', 'text-gray-400');
        
        tabAiChat.classList.remove('border-blue-500', 'text-blue-400');
        tabAiChat.classList.add('border-transparent', 'text-gray-400');
        
        renderChatHistory(feedbackLocalHistory, aiFeedbackHistory);
    }
}

function renderChatHistory(messages: ChatHistoryMessage[], container: HTMLElement) {
    if (!container) return;
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    messages.forEach(message => {
        if (message.role === 'user' && message.file) {
             const attachmentContainer = document.createElement('div');
             attachmentContainer.className = 'chat-attachment';
             let attachmentHtml = '';
             if (message.file.type.startsWith('image/')) {
                 attachmentHtml = `<img src="${message.file.base64}" alt="${message.file.name}" />`;
             } else {
                 attachmentHtml = `<span>${message.file.name}</span>`;
             }
             attachmentContainer.innerHTML = attachmentHtml;
             fragment.appendChild(attachmentContainer);
        }

        if (message.text) {
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`;
            bubble.innerHTML = markdownToHtml(message.text);
            fragment.appendChild(bubble);
        }
    });
    container.appendChild(fragment);
    container.scrollTop = container.scrollHeight;
}

function renderChatFilePreview() {
    if (!aiChatFilePreviewContainer) return;

    if (appState.chatFile) {
        const file = appState.chatFile.file;
        let previewHtml = '';

        if (file.type.startsWith('image/')) {
            previewHtml = `<img src="${appState.chatFile.base64}" alt="${file.name}" />`;
        } else {
            previewHtml = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>${file.name}</span>
            `;
        }
        
        aiChatFilePreviewContainer.innerHTML = `
            <div class="chat-file-preview">
                ${previewHtml}
                <button id="removeChatFileBtn" aria-label="Ta bort fil">&times;</button>
            </div>
        `;
        
        document.getElementById('removeChatFileBtn')?.addEventListener('click', () => {
            appState.chatFile = null;
            aiChatFileInput.value = ''; // Reset file input
            renderChatFilePreview();
        });
    } else {
        aiChatFilePreviewContainer.innerHTML = '';
    }
}

async function applyFeedbackFromJson(feedbackJsonString: string): Promise<any | null> {
    try {
        const learningUpdate = await convertSummaryToJsonAI(feedbackJsonString);
        if (learningUpdate) {
            if (learningUpdate.learnedPreferences) {
                learningUpdate.learnedPreferences.forEach((pref: { lookupKey: string; signId: string; vote: number; }) => {
                    const { lookupKey, signId, vote } = pref;
                    const votes = learnedPreferences.get(lookupKey) || new Map();
                    votes.set(signId, (votes.get(signId) || 0) + vote);
                    learnedPreferences.set(lookupKey, votes);
                });
            }
            if (learningUpdate.newWords) {
                    learningUpdate.newWords.forEach((word: { lookupKey: string; signs: Sign[]; }) => {
                        localUserSigns.set(word.lookupKey, { signs: word.signs });
                    });
            }
            if (learningUpdate.homonymResolutions) {
                    learningUpdate.homonymResolutions.forEach((res: { word: string; pos: string; signId: string; signWord: string; }) => {
                        const { word, pos, signId, signWord } = res;
                        const posMap = homonymMap.get(word) || new Map();
                        posMap.set(pos, { id: signId, word: signWord });
                        homonymMap.set(word, posMap);
                    });
            }
            
            // Clear underlying data
            clearFeedbackData();
            
            // Remove glow from AI button
            const aiBtn = document.getElementById('askAiAboutStsBtn') as HTMLButtonElement;
            if (aiBtn) {
                aiBtn.classList.remove('glow-attention');
            }
            
            // Save to IndexedDB (browser memory)
            if (isDevMode()) {
                await saveUserData();
            }
            return learningUpdate;
        }
        return null;
    } catch (error) {
        console.error("Error applying feedback:", error);
        return null;
    }
}

// --- Main Chat Send Handler ---
async function handleSendChatMessage() {
    // If in feedback mode, use the feedback handler
    if (activeTab === 'feedback') {
        handleSendFeedbackMessage();
        return;
    }

    if (!appState.aiReady && !appState.usePuter) return;

    const text = aiChatInput.value.trim();
    const fileInfo = appState.chatFile;

    if (!text && !fileInfo) return;

    aiChatInput.value = '';
    aiChatInput.style.height = 'auto'; 
    aiChatSendBtn.disabled = true;
    
    appState.chatFile = null;
    if (aiChatFileInput) aiChatFileInput.value = '';
    renderChatFilePreview();

    const userMessage: ChatHistoryMessage = {
        role: 'user',
        text: text,
        file: fileInfo ? {
            name: fileInfo.file.name,
            type: fileInfo.mimeType,
            base64: fileInfo.base64
        } : null
    };
    appState.chatHistory.push(userMessage);
    renderChatHistory(appState.chatHistory, aiChatHistory);

    const aiBubble = document.createElement('div');
    aiBubble.className = 'chat-bubble chat-bubble-ai is-thinking';
    aiBubble.textContent = '';
    aiChatHistory.appendChild(aiBubble);
    aiChatHistory.scrollTop = aiChatHistory.scrollHeight;

    // Build message for Puter.js
    const systemPrompt = 'Du är en hjälpsam expert på svenskt teckenspråk (STS). Svara på användarens frågor om tecken, grammatik och dövkultur. Var koncis och pedagogisk.';
    
    // Build conversation history for multi-turn chat
    const messages = appState.chatHistory
        .filter(m => m.role === 'user' || m.role === 'model')
        .map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.text || ''
        }));
    
    // Add current message
    messages.push({ role: 'user', content: text });
    
    try {
        const puter = (window as any).puter;
        if (puter && puter.ai) {
            // Use Claude Sonnet 4.5 for better Swedish conversation
            const response = await puter.ai.chat(messages, { 
                model: 'claude-sonnet-4-5',
                system: systemPrompt
            });
            
            // Handle different response formats
            let fullResponse = '';
            if (typeof response === 'string') {
                fullResponse = response;
            } else if (response?.message?.content) {
                // Claude format: response.message.content[0].text or response.message.content
                if (Array.isArray(response.message.content)) {
                    fullResponse = response.message.content[0]?.text || '';
                } else {
                    fullResponse = response.message.content;
                }
            } else if (response?.text) {
                fullResponse = response.text;
            } else {
                fullResponse = response?.toString() || '';
            }
            
            aiBubble.innerHTML = markdownToHtml(fullResponse);
            aiChatHistory.scrollTop = aiChatHistory.scrollHeight;
            aiBubble.classList.remove('is-thinking');
            appState.chatHistory.push({ role: 'model', text: fullResponse });
        } else {
            throw new Error('Puter.js AI not available');
        }
    } catch (error) {
        console.error("Chat error:", error);
        const errorMessage = "Ursäkta, ett fel inträffade. Kontrollera att du är inloggad på Puter.";
        aiBubble.textContent = errorMessage;
        aiBubble.classList.remove('is-thinking');
        appState.chatHistory.push({ role: 'model', text: errorMessage });
    } finally {
        aiChatSendBtn.disabled = false;
        aiChatInput.focus();
    }
}

// --- Feedback Chat Send Handler ---
async function handleSendFeedbackMessage() {
    const text = aiFeedbackInput.value.trim();
    if (!text) return;

    aiFeedbackInput.value = '';
    aiFeedbackSendBtn.disabled = true;

    // Add user message locally
    feedbackLocalHistory.push({ role: 'user', text: text });
    renderChatHistory(feedbackLocalHistory, aiFeedbackHistory);

    const aiBubble = document.createElement('div');
    aiBubble.className = 'chat-bubble chat-bubble-ai is-thinking';
    aiFeedbackHistory.appendChild(aiBubble);

    // The JSON is now automatically updated in state
    const jsonReport = appState.latestFeedbackJson || "{}";

    const isConfirming = /^(ja|jo|spara|kör|fixa|ok|okej)$/i.test(text);
    const isRejecting = /^(nej|avbryt|sluta)$/i.test(text);
    
    if (isConfirming) {
         aiBubble.textContent = "Bearbetar din feedback...";
         const learningUpdate = await applyFeedbackFromJson(jsonReport);

        if (learningUpdate) {
            const jsonOutput = JSON.stringify(learningUpdate, null, 2);
            const confirmationText = `Klart! Jag har uppdaterat appens lokala minne.\n\nHär är JSON-koden för dina ändringar:\n\n\`\`\`json\n${jsonOutput}\n\`\`\``;
            
            aiBubble.innerHTML = markdownToHtml(confirmationText);
            feedbackLocalHistory.push({ role: 'model', text: confirmationText });
            feedbackTabBadge.classList.add('hidden'); // Hide badge
        } else {
            const errorText = "Något gick fel när jag försökte spara ändringarna. Försök igen senare.";
            aiBubble.innerHTML = markdownToHtml(errorText);
            feedbackLocalHistory.push({ role: 'model', text: errorText });
        }
    } else if (isRejecting) {
        const responseText = "Okej, jag sparar inget just nu. Återkom om du ändrar dig!";
        aiBubble.textContent = responseText;
        feedbackLocalHistory.push({ role: 'model', text: responseText });
    } else {
        // User is asking a question or discussing the feedback
        // We use Puter.js AI
        const puter = (window as any).puter;
        if (!puter?.ai) {
             aiBubble.textContent = "AI-tjänsten är inte tillgänglig. Kör appen på puter.com för full funktionalitet.";
             feedbackLocalHistory.push({ role: 'model', text: "AI-tjänsten är inte tillgänglig." });
        } else {
            try {
                // Use the new factory function for the prompt
                const prompt = createFeedbackChatPrompt(jsonReport, text);
                
                const response = await puter.ai.chat(prompt, { model: 'claude-sonnet-4-5' });
                
                // Handle different response formats
                let responseText = '';
                if (typeof response === 'string') {
                    responseText = response;
                } else if (response?.message?.content) {
                    if (Array.isArray(response.message.content)) {
                        responseText = response.message.content[0]?.text || '';
                    } else {
                        responseText = response.message.content;
                    }
                } else if (response?.text) {
                    responseText = response.text;
                } else {
                    responseText = response?.toString() || '';
                }
                
                aiBubble.innerHTML = markdownToHtml(responseText);
                feedbackLocalHistory.push({ role: 'model', text: responseText });

            } catch (e) {
                console.error(e);
                aiBubble.textContent = "Kunde inte analysera din fråga just nu.";
                feedbackLocalHistory.push({ role: 'model', text: "Kunde inte analysera din fråga just nu." });
            }
        }
    }
    
    aiBubble.classList.remove('is-thinking');
    aiFeedbackSendBtn.disabled = false;
    aiFeedbackInput.focus();
}

function handleShowJson() {
    // Add user-like message
    feedbackLocalHistory.push({ role: 'user', text: "Visa JSON med alla ändringar" });
    renderChatHistory(feedbackLocalHistory, aiFeedbackHistory);

    const jsonReport = appState.latestFeedbackJson || "Inga ändringar registrerade.";
    const formattedMessage = `Här är den aktuella JSON-datan för dina ändringar:\n\n\`\`\`json\n${jsonReport}\n\`\`\``;

    feedbackLocalHistory.push({ role: 'model', text: formattedMessage });
    
    // Delay slightly to make it feel like a response
    setTimeout(() => {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble chat-bubble-ai';
        bubble.innerHTML = markdownToHtml(formattedMessage);
        aiFeedbackHistory.appendChild(bubble);
        aiFeedbackHistory.scrollTop = aiFeedbackHistory.scrollHeight;
    }, 300);
}


export async function handleOpenChat(e: Event) {
    // Always open the modal
    openModal(aiChatModal, e.currentTarget as HTMLElement);
    
    // Check if Puter.js is available
    const puter = (window as any).puter;
    const aiAvailable = puter?.ai;
    
    // Update usePuter state
    if (puter?.ai) {
        appState.usePuter = true;
        appState.aiReady = true;
    }

    // Initialize standard greeting if empty
    if (appState.chatHistory.length === 0) {
        if (aiAvailable) {
            const greeting = "Hej! Jag är din AI-assistent för STS-helper. Ställ frågor om svenskt teckenspråk, grammatik eller tecken!";
            appState.chatHistory.push({ role: 'model', text: greeting });
        } else {
            const greeting = "Hej! AI-chatten är gratis via Puter.js. Du kan fortfarande ge feedback på tecken och spara ändringar i ditt personliga lexikon.";
            appState.chatHistory.push({ role: 'model', text: greeting });
        }
    }

    // CHECK FOR PENDING FEEDBACK
    const changeCount = feedbackMap.size + positiveFeedbackMap.size + negativeFeedbackMap.size + sentenceFeedbackMap.size; 
    
    if (changeCount > 0) {
        // Setup the feedback specific message
        feedbackLocalHistory = []; // Reset local session for this specific interaction
        const proactiveGreeting = `Hej! 👋 Jag ser att du har gjort cirka ${changeCount} ändringar i tecknen (tumme upp/ner/byten).\n\nVill du att jag sparar dessa ändringar till ditt personliga lexikon i minnet nu? (Svara 'Ja' eller 'Spara').`;
        
        feedbackLocalHistory.push({ role: 'model', text: proactiveGreeting });
        
        // Update Badge
        feedbackTabBadge.textContent = changeCount.toString();
        feedbackTabBadge.classList.remove('hidden');
        
        // Auto-switch to Feedback Tab
        switchTab('feedback');
    } else {
        feedbackTabBadge.classList.add('hidden');
        switchTab('chat');
    }
}

// --- INTERNAL SEARCH FUNCTIONALITY ---

function createMiniVideoCard(sign: Sign): HTMLElement {
    const card = document.createElement('div');
    card.className = 'video-card alternative-item text-xs';
    card.style.cssText = 'aspect-ratio: 1/1; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; cursor: pointer; background: var(--bg-dark);';
    
    const playerWrapper = document.createElement('div');
    playerWrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const video = document.createElement('video');
    video.className = 'video-card-player';
    video.src = buildVideoUrl(sign.id, sign.word);
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.disablePictureInPicture = true;
    video.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';

    const title = document.createElement('div');
    title.textContent = sign.word.toUpperCase();
    title.style.cssText = 'position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; padding: 4px; text-align: center; font-weight: bold; pointer-events: none;';

    // Action button overlay
    const actionOverlay = document.createElement('div');
    actionOverlay.style.cssText = 'position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: white; opacity: 0.8;';
    actionOverlay.innerHTML = '+';
    
    playerWrapper.append(video, title, actionOverlay);
    card.appendChild(playerWrapper);

    // Hover to play
    card.onmouseenter = () => video.play().catch(() => {});
    card.onmouseleave = () => {
        video.pause();
        video.currentTime = 0;
    };

    // Click to insert
    card.onclick = (e) => {
        e.stopPropagation();
        // Insert formatted text into chat input
        const textToInsert = ` [Tecken: ${sign.word.toUpperCase()} (ID: ${sign.id})] `;
        aiChatInput.value += textToInsert;
        aiChatInput.focus();
        closeInternalSearch();
        showMessage(`Infogade "${sign.word}" i chatten.`, 'success');
    };

    return card;
}

function openInternalSearch() {
    aiChatSearchContainer.classList.remove('hidden');
    aiChatSearchContainer.classList.add('flex');
    aiChatSearchInput.focus();
}

function closeInternalSearch() {
    aiChatSearchContainer.classList.add('hidden');
    aiChatSearchContainer.classList.remove('flex');
    aiChatSearchInput.value = '';
    aiChatSearchResults.innerHTML = '';
}

function handleInternalSearchInput() {
    const query = aiChatSearchInput.value.trim().toLowerCase();
    aiChatSearchResults.innerHTML = '';

    if (query.length < 1) return;

    const words = getSortedSearchResults(query, 50);
    const fragment = document.createDocumentFragment();
    
    words.forEach(word => {
        const signs = localLexiconMap.get(word);
        if (signs) {
            signs.forEach(sign => {
                fragment.appendChild(createMiniVideoCard(sign));
            });
        }
    });

    if (fragment.children.length === 0) {
        aiChatSearchResults.innerHTML = '<p class="col-span-full text-center text-gray-400 mt-4">Inga träffar.</p>';
    } else {
        aiChatSearchResults.appendChild(fragment);
    }
}

export function setupChatEventListeners() {
    // Initialize DOM elements
    aiChatModal = document.getElementById('askAiAboutStsModal') as HTMLElement;
    
    // Views
    aiChatView = document.getElementById('aiChatView') as HTMLElement;
    aiFeedbackView = document.getElementById('aiFeedbackView') as HTMLElement;
    
    // Tabs
    tabAiChat = document.getElementById('tabAiChat') as HTMLButtonElement;
    tabAiFeedback = document.getElementById('tabAiFeedback') as HTMLButtonElement;
    feedbackTabBadge = document.getElementById('feedbackTabBadge') as HTMLElement;
    
    // General Chat
    aiChatHistory = document.getElementById('aiChatHistory') as HTMLElement;
    aiChatInput = document.getElementById('aiChatInput') as HTMLTextAreaElement;
    aiChatSendBtn = document.getElementById('aiChatSendBtn') as HTMLButtonElement;
    aiChatFileUploadBtn = document.getElementById('aiChatFileUploadBtn') as HTMLButtonElement;
    aiChatFileInput = document.getElementById('aiChatFileInput') as HTMLInputElement;
    aiChatFilePreviewContainer = document.getElementById('aiChatFilePreviewContainer') as HTMLElement;
    
    // Feedback Chat
    aiFeedbackHistory = document.getElementById('aiFeedbackHistory') as HTMLElement;
    aiFeedbackInput = document.getElementById('aiFeedbackInput') as HTMLTextAreaElement;
    aiFeedbackSendBtn = document.getElementById('aiFeedbackSendBtn') as HTMLButtonElement;
    showJsonBtn = document.getElementById('showJsonBtn') as HTMLButtonElement;
    
    // Search
    aiChatSearchToggleBtn = document.getElementById('aiChatSearchToggleBtn') as HTMLButtonElement;
    aiChatSearchContainer = document.getElementById('aiChatSearchContainer') as HTMLElement;
    aiChatSearchInput = document.getElementById('aiChatSearchInput') as HTMLInputElement;
    aiChatCloseSearchBtn = document.getElementById('aiChatCloseSearchBtn') as HTMLButtonElement;
    aiChatSearchResults = document.getElementById('aiChatSearchResults') as HTMLElement;

    const aiChatBtn = document.getElementById('askAiAboutStsBtn') as HTMLButtonElement;
    aiChatBtn?.addEventListener('click', handleOpenChat);

    // Clear History Button
    const clearChatBtn = document.getElementById('clearChatHistoryBtn');
    clearChatBtn?.addEventListener('click', () => {
        if(confirm("Vill du rensa chatthistoriken?")) {
            appState.chatHistory = [];
            renderChatHistory([], aiChatHistory);
            // Re-add greeting
            const greeting = "Hej! Jag är din AI-assistent för STS-helper. Hur kan jag hjälpa dig idag?";
            appState.chatHistory.push({ role: 'model', text: greeting });
            renderChatHistory(appState.chatHistory, aiChatHistory);
        }
    });

    // Tab Switch Listeners
    tabAiChat?.addEventListener('click', () => switchTab('chat'));
    tabAiFeedback?.addEventListener('click', () => switchTab('feedback'));

    // Chat Input Listeners
    aiChatSendBtn?.addEventListener('click', handleSendChatMessage);
    aiChatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendChatMessage();
        }
    });
    aiChatInput?.addEventListener('input', () => {
        aiChatInput.style.height = 'auto';
        aiChatInput.style.height = (aiChatInput.scrollHeight) + 'px';
    });
    
    // Feedback Input Listeners
    aiFeedbackSendBtn?.addEventListener('click', handleSendFeedbackMessage);
    aiFeedbackInput?.addEventListener('keydown', (e) => {
         if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendFeedbackMessage();
        }
    });

    // Show JSON Button Listener
    showJsonBtn?.addEventListener('click', handleShowJson);

    aiChatFileUploadBtn?.addEventListener('click', () => aiChatFileInput.click());
    aiChatFileInput?.addEventListener('change', async (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                appState.chatFile = { file, base64, mimeType: file.type };
                renderChatFilePreview();
            } catch (error) {
                console.error("Fel vid filinläsning:", error);
                showMessage("Kunde inte läsa filen.", "error");
            }
        }
    });

    // Internal Search Listeners
    aiChatSearchToggleBtn?.addEventListener('click', openInternalSearch);
    aiChatCloseSearchBtn?.addEventListener('click', closeInternalSearch);
    aiChatSearchInput?.addEventListener('input', handleInternalSearchInput);

    // Global delegation for dynamically created Copy Buttons in Chat
    aiChatModal?.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        const btn = target.closest('.code-copy-btn');
        
        if (btn) {
            const wrapper = btn.closest('.code-block-wrapper');
            const codeEl = wrapper?.querySelector('code');
            if (codeEl && codeEl.textContent) {
                try {
                    await navigator.clipboard.writeText(codeEl.textContent);
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = `<span>Kopierad!</span>`;
                    setTimeout(() => {
                        btn.innerHTML = originalHtml;
                    }, 2000);
                    showMessage("Kopierat till urklipp!", "success");
                } catch (err) {
                    console.error("Copy failed", err);
                    showMessage("Kunde inte kopiera.", "error");
                }
            }
        }
    });
}