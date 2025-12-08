import { appState, idToWordMap, feedbackMap, sentenceFeedbackMap, positiveFeedbackMap, negativeFeedbackMap, questionClarifications, learnedPreferences, localUserSigns, updateLatestFeedbackJson } from '../state';
import { WordMapEntry, Sign, ModalContexts, Example, RelatedSignInfo, PositiveFeedbackEntry, NegativeFeedbackEntry } from '../types';
import { showMessage, activateFeedbackButton, isDevMode, buildVideoUrl, playVideo, getLexiconUrl, ICON_LOADING_SVG, FEEDBACK_SUMMARY_PREFIX } from '../ui';
import { generateLearningSummaryAI, convertSummaryToJsonAI } from '../hooks/useAI';
import { openModal as openModalSystem, closeModal as closeModalSystem, initializeModalSystem } from './modals/ModalSystem';
import { ensureWordDataEnriched } from '../hooks/useDataEnrichment';
import { delay } from '../utils';
import { ensureFullLexiconLoaded, saveUserData } from '../hooks/useLexicon';
// ARCHIVED: initializeLexiconExplorer - moved to _archived/LexiconExplorer.ts
import { updateGrammarCard } from './VideoGrid';
import { findCandidatesForToken } from '../modules/search/localSearchWithFallback';
import { initializeAlphabetModals } from '../modules/features/alphabetPlayer';
import { openSignDetailsModal } from '../modules/features/signDetails';
import { initializeSuggestionModalEventListeners, openSuggestionModal } from '../modules/features/recorder';
import { feedbackCollector } from '../modules/feedback/feedbackCollector';

async function triggerCloudSync() {
    try {
        const { puterCloudSync } = await import('../modules/cloud/puterCloudSync');
        puterCloudSync.scheduleSyncToCloud();
    } catch (e) {
        // Cloud sync not available, ignore
    }
}

// --- Åter-exportera för att inte bryta API:et ---
export { openModalSystem as openModal, closeModalSystem as closeModal };
export { openSignDetailsModal }; // Re-export för bakåtkompatibilitet

// --- MODAL-SPECIFIK LOGIK ---

export function showFeedbackVideo(cardId: string, signId: string) {
    const cardData = appState.cardIdDataMap.get(cardId);
    let sign: Sign | undefined;
    
    if (cardData) {
        sign = cardData.phraseTokens
            .flatMap(t => t.signs || [])
            .find(s => s.id === signId);
    }
    
    if (!sign) {
        const wordForSignId = idToWordMap.get(signId);
        if (wordForSignId) {
            sign = { id: signId, word: wordForSignId };
        } else {
            showMessage(`Kunde inte hitta tecken med ID: ${signId}`, 'error');
            return;
        }
    }

    const modal = document.getElementById('feedbackVideoModal') as HTMLElement;
    const player = document.getElementById('feedbackVideoPlayer') as HTMLVideoElement;
    const title = document.getElementById('feedbackVideoTitle') as HTMLElement;
    const errorEl = document.getElementById('feedbackVideoError') as HTMLElement;

    if (!modal || !player || !title || !errorEl) return;
    
    title.textContent = `Tecken för "${cardData?.fullOriginalPhrase || sign.word}" (ID: ${sign.id})`;
    playVideo(player, errorEl, player.parentElement!, sign.id, sign.word);
    
    openModalSystem(modal);
}

export function openGroupCommentModal(openerElement: HTMLElement) {
    const modal = document.getElementById('groupCommentModal') as HTMLElement;
    if (!modal) return;
    appState.modalContexts.sentenceFeedback = { sentence: [] }; 
    openModalSystem(modal, openerElement);

    const commentText = modal.querySelector('textarea') as HTMLTextAreaElement;
    commentText.value = '';
    
    const saveBtn = modal.querySelector('#groupCommentSaveBtn') as HTMLButtonElement;
    if(saveBtn) {
        saveBtn.onclick = () => {
            const comment = commentText.value.trim();
            if (comment) {
                appState.selection.forEach(cardId => {
                    const cardData = appState.cardIdDataMap.get(cardId);
                    if(cardData) {
                        feedbackMap.set(cardId, {
                            feedback: comment,
                            originalWords: cardData.fullOriginalPhrase,
                            groupId: 'group-comment-' + Date.now()
                        });
                        const cardElement = document.querySelector(`.video-card[data-card-id="${cardId}"]`);
                        cardElement?.classList.add('feedback-reported');
                    }
                });
                updateLatestFeedbackJson(); // UPDATE JSON REALTIME
                triggerCloudSync(); // CLOUD SYNC
                activateFeedbackButton();
                showMessage(`${appState.selection.length} tecken har kommenterats.`, 'success');
            }
            closeModalSystem(modal);
            appState.selection = [];
            import('../ui').then(({ updateSelectionUI }) => { updateSelectionUI(); });
        };
    }
}

export function openSentenceFeedbackModal(sentence: WordMapEntry[], openerElement: HTMLElement) {
    const modal = document.getElementById('sentenceFeedbackModal') as HTMLElement;
    if (!modal) return;
    appState.modalContexts.sentenceFeedback = { sentence };
    openModalSystem(modal, openerElement);
    
    const title = document.getElementById('sentenceFeedbackTitle');
    const text = document.getElementById('sentenceFeedbackText');
    if(title) title.textContent = 'Feedback på mening';
    if(text) text.textContent = `"${sentence.map(w => w.original).join('')}"`;

    const saveBtn = modal.querySelector('#sentenceFeedbackSaveBtn') as HTMLButtonElement;
    if(saveBtn) {
        saveBtn.onclick = () => {
            const comment = (modal.querySelector('textarea') as HTMLTextAreaElement).value.trim();
            const sentenceKey = sentence.map(w => w.original).join('');
            if (comment) {
                sentenceFeedbackMap.set(sentenceKey, comment);
                updateLatestFeedbackJson(); // UPDATE JSON REALTIME
                triggerCloudSync(); // CLOUD SYNC
                activateFeedbackButton();
                showMessage('Tack för din feedback!', 'success');
            }
            closeModalSystem(modal);
        };
    }
}

export function clearFeedbackData() {
    feedbackMap.clear();
    positiveFeedbackMap.clear();
    negativeFeedbackMap.clear();
    sentenceFeedbackMap.clear();
    questionClarifications.clear();
    
    updateLatestFeedbackJson(); // UPDATE JSON REALTIME
    
    import('./VideoGrid').then(({ renderCurrentSentence }) => {
        import('../ui').then(({ updateSelectionUI }) => {
             updateSelectionUI();
             if (!appState.isShowingAllSentences) {
                renderCurrentSentence();
            }
        });
    });
}

async function generateReport() {
    const summaryText = document.getElementById('feedbackSummaryText') as HTMLTextAreaElement;
    if (!summaryText) return;
    
    summaryText.value = "Analyserar feedback...";
    
    // NOTE: In the new flow, appState.latestFeedbackJson is already up-to-date thanks to updateLatestFeedbackJson()
    // But for robustness in this specific legacy/manual reporting modal, we can ensure it's set.
    if (!appState.latestFeedbackJson) {
         updateLatestFeedbackJson();
    }
    const feedbackJson = appState.latestFeedbackJson;

    const summary = await generateLearningSummaryAI(feedbackJson);
    const finalReport = summary || "Kunde inte generera sammanfattning. (AI svarade inte)";
    
    // Add the magic prefix so AI recognizes it when pasted
    const fullReport = FEEDBACK_SUMMARY_PREFIX + "\n\n" + finalReport;
    
    summaryText.value = fullReport;
    appState.latestReportSummary = fullReport; // PERSIST REPORT TEXT
}

export async function openFeedbackSummaryModal(openerElement: HTMLElement) {
    const modal = document.getElementById('feedbackSummaryModal') as HTMLElement;
    const summaryText = document.getElementById('feedbackSummaryText') as HTMLTextAreaElement;
    const applyAndCopyJsonBtn = document.getElementById('applyAndCopyJsonBtn') as HTMLButtonElement;
    const clearBtn = document.getElementById('feedbackSummaryClearBtn') as HTMLButtonElement;
    const refreshBtn = document.getElementById('feedbackSummaryRefreshBtn') as HTMLButtonElement;
    const copyBtn = document.getElementById('feedbackSummaryCopyBtn') as HTMLButtonElement;

    if (!modal || !summaryText || !applyAndCopyJsonBtn) return;

    if (clearBtn) {
         clearBtn.onclick = () => {
             clearFeedbackData();
             appState.latestReportSummary = null;
             summaryText.value = "";
             closeModalSystem(modal);
             showMessage("Feedback rensad.", "success");
         };
    }
    
    if (refreshBtn) {
        refreshBtn.onclick = () => generateReport();
    }
    
    if (copyBtn) {
        copyBtn.onclick = async () => {
            if (!summaryText.value) return;
            try {
                await navigator.clipboard.writeText(summaryText.value);
                showMessage("Text kopierad!", "success");
            } catch (err) {
                // Fallback
                summaryText.select();
                document.execCommand('copy');
                showMessage("Text kopierad!", "success");
            }
        };
    }

    openModalSystem(modal, openerElement);

    // Load persisted text if available, otherwise generate
    if (appState.latestReportSummary) {
        summaryText.value = appState.latestReportSummary;
    } else {
        // Check if there is any feedback to report on
        const hasFeedback = feedbackMap.size > 0 || sentenceFeedbackMap.size > 0 || negativeFeedbackMap.size > 0 || positiveFeedbackMap.size > 0;
        if (hasFeedback) {
            generateReport();
        } else {
            summaryText.value = "Ingen feedback registrerad än.";
        }
    }

    applyAndCopyJsonBtn.onclick = async () => {
        if (!appState.latestFeedbackJson) {
             updateLatestFeedbackJson();
        }
        
        applyAndCopyJsonBtn.disabled = true;
        applyAndCopyJsonBtn.innerText = "Bearbetar...";

        const learningUpdate = await convertSummaryToJsonAI(appState.latestFeedbackJson);
        
        if (learningUpdate) {
             if (learningUpdate.learnedPreferences) {
                for (const pref of learningUpdate.learnedPreferences) {
                     if (!learnedPreferences.has(pref.lookupKey)) {
                         learnedPreferences.set(pref.lookupKey, new Map());
                     }
                     const currentVal = learnedPreferences.get(pref.lookupKey)!.get(pref.signId) || 0;
                     learnedPreferences.get(pref.lookupKey)!.set(pref.signId, currentVal + pref.vote);
                }
             }
             if (learningUpdate.newWords) {
                 for (const word of learningUpdate.newWords) {
                     // Naive update to localUserSigns
                     localUserSigns.set(word.lookupKey, word.signs);
                 }
             }

             const jsonString = JSON.stringify(learningUpdate, null, 2);
             
            // Copy to clipboard
            try {
                await navigator.clipboard.writeText(jsonString);
                showMessage("Inlärning tillämpad och JSON kopierad!", "success");
            } catch (e) {
                const textarea = document.createElement('textarea');
                textarea.value = jsonString;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                showMessage("Inlärning tillämpad och JSON kopierad!", "success");
            }

            // Clear underlying data but KEEP the report text so user can see history
            clearFeedbackData(); 
            
            if (isDevMode()) {
                await saveUserData();
            }
            // Do not close modal automatically, let user read
        } else {
            showMessage("Kunde inte konvertera feedback till JSON.", "error");
        }
        applyAndCopyJsonBtn.disabled = false;
        applyAndCopyJsonBtn.innerText = "Tillämpa Inlärning & Kopiera JSON";
    };
}

function setupFeedbackListeners() {
    const goodChoiceModal = document.getElementById('goodChoiceReasonModal');
    const thumbDownModal = document.getElementById('thumbDownReasonModal');

    if (goodChoiceModal) {
        const btnContext = document.getElementById('goodChoiceReasonContextBtn');
        const btnPrimary = document.getElementById('goodChoiceReasonPrimaryBtn');

        const handleGood = (isPrimary: boolean) => {
            const context = appState.modalContexts.goodChoiceReason;
            if (context && context.sign) {
                const weight = isPrimary ? 999 : 1;
                const lookup = context.lookupKey || "";
                
                if (!learnedPreferences.has(lookup)) {
                    learnedPreferences.set(lookup, new Map());
                }
                const currentWeight = learnedPreferences.get(lookup)!.get(context.sign.id) || 0;
                learnedPreferences.get(lookup)!.set(context.sign.id, currentWeight + weight);
                
                // Use the explicit cardId if available, or fallback to "unknown" if missing.
                // This fixes the [object Object] bug in feedback reports.
                const cardId = context.cardId || `card-${Date.now()}`;
                
                const map = positiveFeedbackMap.get(cardId) || new Map<string, PositiveFeedbackEntry>();
                const entry = map.get(context.sign.id) || { sign: context.sign, originalWords: context.fullOriginalPhrase!, count: 0 };
                entry.count += 1;
                map.set(context.sign.id, entry);
                positiveFeedbackMap.set(cardId, map);
                
                updateLatestFeedbackJson(); // UPDATE JSON REALTIME
                triggerCloudSync(); // CLOUD SYNC
                
                // Add to feedback collector for Google Forms
                feedbackCollector.addThumbUp(context.sign.word, context.sign.id);

                if(context.cardContainer) {
                    context.cardContainer.classList.add('feedback-thumb-up');
                    context.cardContainer.classList.remove('feedback-thumb-down');
                }
                activateFeedbackButton();
                showMessage(isPrimary ? "Sparat som primärval!" : "Tack för din feedback!", "success");
                // Feedback sparas lokalt - användaren kan skicka via Feedback-knappen när de vill
                closeModalSystem(goodChoiceModal);
            }
        };

        btnContext?.addEventListener('click', () => handleGood(false));
        btnPrimary?.addEventListener('click', () => handleGood(true));
    }

    if (thumbDownModal) {
        const saveNegative = (reason: string) => {
            const context = appState.modalContexts.thumbDownReason;
            if (context && context.sign) {
                // Use the explicit cardId if available
                const cardId = context.cardId || `card-${Date.now()}`;
                
                const map = negativeFeedbackMap.get(cardId) || new Map<string, NegativeFeedbackEntry>();
                map.set(context.sign.id, { sign: context.sign, originalWords: context.fullOriginalPhrase!, reason });
                negativeFeedbackMap.set(cardId, map);
                
                updateLatestFeedbackJson(); // UPDATE JSON REALTIME
                triggerCloudSync(); // CLOUD SYNC
                
                // Add to feedback collector for Google Forms
                feedbackCollector.addThumbDown(context.sign.word, context.sign.id, reason);

                if (context.cardContainer) {
                    context.cardContainer.classList.add('feedback-thumb-down');
                    context.cardContainer.classList.remove('feedback-thumb-up');
                }
                activateFeedbackButton();
                showMessage("Tack, vi ska se över detta.", "success");
                // Feedback sparas lokalt - användaren kan skicka via Feedback-knappen när de vill
                closeModalSystem(thumbDownModal);
            }
        };

        document.getElementById('thumbDownReasonIncorrectBtn')?.addEventListener('click', () => saveNegative("Fel tecken"));
        document.getElementById('thumbDownReasonContextBtn')?.addEventListener('click', () => saveNegative("Fel kontext"));
        document.getElementById('thumbDownReasonOldBtn')?.addEventListener('click', () => saveNegative("Gammalt tecken"));
        document.getElementById('thumbDownReasonRegionalBtn')?.addEventListener('click', () => saveNegative("Regionalt tecken"));
        
        const otherBtn = document.getElementById('thumbDownReasonOtherBtn');
        const otherContainer = document.getElementById('thumbDownOtherReasonContainer');
        const saveOtherBtn = document.getElementById('saveThumbDownReasonBtn');
        
        otherBtn?.addEventListener('click', () => {
            otherContainer?.classList.remove('hidden');
        });
        
        saveOtherBtn?.addEventListener('click', () => {
            const text = otherContainer?.querySelector('textarea')?.value || "Annat";
            saveNegative(text);
            otherContainer?.classList.add('hidden'); 
        });
    }
}


export function openGoodChoiceReasonModal(context: NonNullable<ModalContexts['goodChoiceReason']>, openerElement: HTMLElement) {
    const modal = document.getElementById('goodChoiceReasonModal') as HTMLElement;
    if (!modal) return;
    appState.modalContexts.goodChoiceReason = context;
    const title = document.getElementById('goodChoiceReasonTitle');
    if(title) title.textContent = `Bra val för "${context.sign?.word}"?`;
    openModalSystem(modal, openerElement);
}

export function openThumbDownReasonModal(context: NonNullable<ModalContexts['thumbDownReason']>, openerElement: HTMLElement) {
    const modal = document.getElementById('thumbDownReasonModal') as HTMLElement;
    if (!modal) return;
    appState.modalContexts.thumbDownReason = context;
    const title = document.getElementById('thumbDownReasonTitle');
    if(title) title.textContent = `Problem med "${context.sign?.word}"?`;
    openModalSystem(modal, openerElement);
}

export function openImproveSignMenuModal(context: NonNullable<ModalContexts['improveSign']>, openerElement: HTMLElement) {
    const modal = document.getElementById('improveSignModal') as HTMLElement;
    if (!modal) return;
    appState.modalContexts.improveSign = context;
    openModalSystem(modal, openerElement);
}

export function openCreateCombinationModal(openerElement: HTMLElement) {
    const modal = document.getElementById('createCombinationModal') as HTMLElement;
    if (!modal) return;
    
    // Visa preview av valda tecken
    const previewGrid = modal.querySelector('#combinationPreviewGrid') as HTMLElement;
    if (previewGrid && appState.combinationSelection.length > 0) {
        previewGrid.innerHTML = '';
        appState.combinationSelection.forEach(({ sign }) => {
            const previewCard = document.createElement('div');
            previewCard.className = 'bg-gray-800 p-2 rounded text-sm';
            previewCard.textContent = sign.word;
            previewGrid.appendChild(previewCard);
        });
    }
    
    const searchInput = modal.querySelector('#newWordSearchInput') as HTMLInputElement;
    const suggestionsList = modal.querySelector('#newWordSuggestions') as HTMLElement;
    
    if (searchInput && suggestionsList) {
        searchInput.addEventListener('input', async (e) => {
            const query = (e.target as HTMLInputElement).value.trim();
            if (query.length < 1) {
                suggestionsList.classList.add('hidden');
                return;
            }
            
            const { getSortedSearchResults } = await import('../utils');
            const { localLexiconMap, idToWordMap } = await import('../state');
            const words = getSortedSearchResults(query, 100);
            
            const allSigns: Sign[] = [];
            if (words.length > 0) {
                words.forEach(word => {
                    const signs = localLexiconMap.get(word);
                    if (signs) allSigns.push(...signs);
                });
                
                if (/^\d+$/.test(query) && idToWordMap.has(query.padStart(5, '0'))) {
                    const id = query.padStart(5, '0');
                    const word = idToWordMap.get(id)!;
                    allSigns.unshift({ id, word });
                }
            }
            
            const uniqueSigns = Array.from(new Map(allSigns.map(sign => [sign.id, sign])).values()).slice(0, 8);
            suggestionsList.classList.remove('hidden');
            suggestionsList.innerHTML = '';
            
            if (uniqueSigns.length === 0) {
                suggestionsList.innerHTML = '<div class="text-xs text-gray-500 px-3 py-2">Inga tecken hittades</div>';
                return;
            }
            
            uniqueSigns.forEach(sign => {
                const btn = document.createElement('button');
                btn.className = 'w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors text-sm';
                btn.textContent = `${sign.word} (ID: ${sign.id})`;
                btn.addEventListener('click', () => {
                    searchInput.value = `${sign.word} ✓`;
                    suggestionsList.classList.add('hidden');
                });
                suggestionsList.appendChild(btn);
            });
        });
    }
    
    // Spara kombination
    const saveBtn = modal.querySelector('#saveCombinationBtn') as HTMLButtonElement;
    const wordInput = modal.querySelector('#newCombinationWordInput') as HTMLInputElement;
    const commentInput = modal.querySelector('#newCombinationCommentInput') as HTMLTextAreaElement;
    
    if (saveBtn) {
        // Ta bort gamla listeners först
        const newSaveBtn = saveBtn.cloneNode(true) as HTMLButtonElement;
        saveBtn.parentNode?.replaceChild(newSaveBtn, saveBtn);
        
        newSaveBtn.addEventListener('click', async () => {
            if (appState.combinationSelection.length === 0) {
                showMessage('Inga tecken valda för kombination', 'error');
                return;
            }
            
            const newWord = wordInput?.value.trim();
            if (!newWord) {
                showMessage('Ange ett ord eller fras för kombinationen', 'error');
                return;
            }
            
            const combinedSigns = appState.combinationSelection.map(item => item.sign);
            const comment = commentInput?.value.trim() || '';
            
            // Spara till localUserSigns
            const lookupKey = newWord.toLowerCase();
            localUserSigns.set(lookupKey, {
                signs: combinedSigns,
                isCompound: true
            });
            
            // Spara till feedbackCollector
            const originalWords = appState.combinationSelection.map(item => {
                const cardData = appState.cardIdDataMap.get(item.cardId);
                return cardData?.fullOriginalPhrase || '';
            }).filter(w => w).join(' ');
            
            feedbackCollector.addNewSignSuggestion(originalWords || newWord, undefined, comment || `Kombination: ${combinedSigns.map(s => s.word).join(' + ')}`);
            
            // Uppdatera feedback JSON
            updateLatestFeedbackJson();
            triggerCloudSync();
            activateFeedbackButton();
            
            // Spara användardata
            if (isDevMode()) {
                await saveUserData();
            }
            
            showMessage(`Kombination "${newWord}" sparad!`, 'success');
            closeModalSystem(modal);
            appState.combinationSelection = [];
            
            // Rensa inputs
            if (wordInput) wordInput.value = '';
            if (commentInput) commentInput.value = '';
        });
    }
    
    openModalSystem(modal, openerElement);
}

export async function handleApplyNewSignFromSearch(newSign: Sign) {
    const context = appState.modalContexts.changeReason;
    if (!context) return;

    if (appState.changeSignMode === 'grammar') {
        const grammarCardIndex = context.grammarCardIndex;
        if (typeof grammarCardIndex !== 'number') return;
        
        const translatedSentence = appState.aiTranslatedSentences.get(appState.currentGrammarSentenceIndex);
        if (!translatedSentence) return;

        const wordToUpdate = translatedSentence[grammarCardIndex];
        wordToUpdate.signs = [newSign];
        wordToUpdate.gloss = newSign.word; 
        updateGrammarCard(grammarCardIndex, wordToUpdate);

        const cardId = `grammar-card-${grammarCardIndex}`;
        feedbackMap.set(cardId, {
            feedback: `Användare ändrade AI:s val från '${context.originalSigns[0]?.word || 'inget'}' till '${newSign.word}'.`,
            originalWords: wordToUpdate.original,
            suggestedSigns: [newSign]
        });
        
        updateLatestFeedbackJson(); // UPDATE JSON REALTIME
        triggerCloudSync(); // CLOUD SYNC
        
        activateFeedbackButton();
        showMessage(`Tecken för "${wordToUpdate.original}" ändrat till "${newSign.word}".`, 'success');
    } else { 
        // Use the cardId stored in context to prevent [object Object] bug
        const cardId = context.cardId; 
        
        appState.modalContexts.goodChoiceReason = {
            ...context,
            sign: newSign,
            cardId: cardId, 
            fullOriginalPhrase: context.phraseTokens.map(t => t.original).join(''),
            cardContainer: cardId ? document.getElementById(cardId) as HTMLElement : undefined
        };
        openModalSystem(document.getElementById('goodChoiceReasonModal') as HTMLElement);
    }

    closeModalSystem(document.getElementById('changeSignModal') as HTMLElement);
}

export function openChangeGrammarSignModal(cardId: string, index: number) {
    const cardData = appState.cardIdDataMap.get(cardId);
    if (!cardData) return;

    const context: NonNullable<ModalContexts['improveSign']> = {
        phraseTokens: cardData.phraseTokens,
        lookupKey: cardData.phraseTokens[0].base,
        fullOriginalPhrase: cardData.fullOriginalPhrase,
        cardId: cardId,
        isSpelledOut: false,
        cardContainer: document.getElementById(cardId) as HTMLElement,
        grammarCardIndex: index
    };
    
    appState.changeSignMode = 'grammar';
    openChangeSignModal(context);
}

function openChangeSignModal(context: NonNullable<ModalContexts['improveSign']>) {
    const modal = document.getElementById('changeSignModal') as HTMLElement;
    const searchInput = document.getElementById('changeSignSearchInput') as HTMLInputElement;
    const alternativesGrid = document.getElementById('changeSignAlternativesGrid') as HTMLElement;
    if (!modal || !searchInput || !alternativesGrid) return;

    const createChangeSignCard = (sign: Sign): HTMLElement => {
        const card = document.createElement('div');
        card.className = 'video-card alternative-item';
        card.dataset.signId = sign.id;
        card.dataset.signWord = sign.word;

        const playerWrapper = document.createElement('div');
        playerWrapper.className = 'video-card-player-wrapper';
    
        const videoPlayer = document.createElement('video');
        videoPlayer.className = 'video-card-player';
        videoPlayer.src = buildVideoUrl(sign.id, sign.word);
        videoPlayer.muted = true;
        videoPlayer.playsInline = true;
        videoPlayer.loop = true;
        videoPlayer.disablePictureInPicture = true;

        card.onmouseover = () => { videoPlayer.play().catch(() => {}); };
        card.onmouseout = () => { videoPlayer.pause(); };
    
        const titleEl = document.createElement('p');
        titleEl.className = 'video-card-title';
        titleEl.textContent = sign.word.toUpperCase();
        
        playerWrapper.append(videoPlayer, titleEl);
        card.append(playerWrapper);

        return card;
    };

    const renderAlternatives = async (query: string) => {
        alternativesGrid.innerHTML = `<div class="col-span-full flex justify-center p-8">${ICON_LOADING_SVG}</div>`;
        const { getSortedSearchResults } = await import('../utils');
        const words = getSortedSearchResults(query, 100);
        
        const allSigns: Sign[] = [];
        if (words.length > 0) {
             const { localLexiconMap, idToWordMap } = await import('../state');
             
            words.forEach(word => {
                const signs = localLexiconMap.get(word);
                if (signs) allSigns.push(...signs);
            });
            
             if (/^\d+$/.test(query) && idToWordMap.has(query.padStart(5, '0'))) {
                 const id = query.padStart(5, '0');
                 const word = idToWordMap.get(id)!;
                 allSigns.unshift({ id, word });
            }
        }
        
        const uniqueSigns = Array.from(new Map(allSigns.map(sign => [sign.id, sign])).values());
        
        alternativesGrid.innerHTML = '';
        if (uniqueSigns.length === 0) {
            alternativesGrid.innerHTML = '<p class="col-span-full text-center text-gray-400 p-4">Inga tecken hittades.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        uniqueSigns.forEach(sign => {
            fragment.appendChild(createChangeSignCard(sign));
        });
        alternativesGrid.appendChild(fragment);
    };
    
    appState.modalContexts.changeReason = {
        phraseTokens: context.phraseTokens,
        lookupKey: context.lookupKey,
        newSign: { id: '', word: '' },
        originalSigns: context.phraseTokens[0]?.signs || [],
        grammarCardIndex: context.grammarCardIndex,
        cardId: context.cardId 
    };
    
    searchInput.value = context.lookupKey;
    renderAlternatives(context.lookupKey);
    
    const onInput = () => renderAlternatives(searchInput.value);
    searchInput.removeEventListener('input', onInput);
    searchInput.addEventListener('input', onInput);

    const onClickAlternative = (e: MouseEvent) => {
        const card = (e.target as HTMLElement).closest<HTMLElement>('.alternative-item');
        if (card && card.dataset.signId && card.dataset.signWord) {
            const newSign: Sign = { id: card.dataset.signId, word: card.dataset.signWord };
            handleApplyNewSignFromSearch(newSign);
        }
    };
    alternativesGrid.removeEventListener('click', onClickAlternative);
    alternativesGrid.addEventListener('click', onClickAlternative);

    openModalSystem(modal, context.cardContainer);
}

function initializeImproveSignModalEventListeners() {
    const improveSignModal = document.getElementById('improveSignModal');
    if (!improveSignModal) return;

    const changeBtn = document.getElementById('improveActionChangeBtn');
    const suggestBtn = document.getElementById('improveActionSuggestBtn');
    const reportBtn = document.getElementById('improveActionReportBtn');

    changeBtn?.addEventListener('click', () => {
        const context = appState.modalContexts.improveSign;
        if (!context) return;
        closeModalSystem(improveSignModal);
        appState.changeSignMode = 'main'; 
        openChangeSignModal(context); 
    });

    suggestBtn?.addEventListener('click', () => {
        const context = appState.modalContexts.improveSign;
        if (!context) return;
        closeModalSystem(improveSignModal);
        openSuggestionModal(context);
    });

    reportBtn?.addEventListener('click', async () => {
        const context = appState.modalContexts.improveSign;
        if (!context) return;
        const wordData = context.phraseTokens[0]; 
        if (!wordData) return;
        closeModalSystem(improveSignModal);
        await openSignDetailsModal(wordData, context.cardContainer);
        const feedbackTextarea = document.getElementById('signFeedbackTextarea') as HTMLTextAreaElement;
        feedbackTextarea?.focus();
    });
}

// --- MULTI-SELECT FEEDBACK MODAL ---
export function openMultiSelectFeedbackModal(openerElement: HTMLElement) {
    const modal = document.getElementById('multiSelectFeedbackModal') as HTMLElement;
    if (!modal) return;
    
    const wordsList = Array.from(appState.selection)
        .map((id: string) => appState.cardIdDataMap.get(id)?.fullOriginalPhrase || '')
        .filter(w => w)
        .join(', ');
    
    const title = modal.querySelector('#multiSelectFeedbackTitle');
    if (title) title.textContent = `Feedback för: ${wordsList}`;
    
    openModalSystem(modal, openerElement);
    
    const changeBtn = modal.querySelector('#multiSelectChangeBtn') as HTMLButtonElement;
    const suggestBtn = modal.querySelector('#multiSelectSuggestBtn') as HTMLButtonElement;
    const reportBtn = modal.querySelector('#multiSelectReportBtn') as HTMLButtonElement;
    
    changeBtn?.addEventListener('click', () => {
        showMessage(`✎ Ändringsförslag för: ${wordsList}`, 'success');
        closeModalSystem(modal);
        appState.selection.forEach((id: string) => {
            const card = document.querySelector(`.video-card[data-card-id="${id}"]`);
            card?.classList.add('feedback-reported');
        });
        appState.selection.length = 0;
        updateMultiSelectUI();
    });
    
    suggestBtn?.addEventListener('click', () => {
        showMessage(`💡 Förslag från användar för: ${wordsList}`, 'success');
        closeModalSystem(modal);
        appState.selection.forEach((id: string) => {
            const card = document.querySelector(`.video-card[data-card-id="${id}"]`);
            card?.classList.add('feedback-reported');
        });
        appState.selection.length = 0;
        updateMultiSelectUI();
    });
    
    reportBtn?.addEventListener('click', () => {
        showMessage(`📋 Rapportering för: ${wordsList}`, 'success');
        closeModalSystem(modal);
        appState.selection.forEach((id: string) => {
            const card = document.querySelector(`.video-card[data-card-id="${id}"]`);
            card?.classList.add('feedback-reported');
        });
        appState.selection.length = 0;
        updateMultiSelectUI();
    });
}

// --- CHANGE GROUP SIGNS MODAL ---
export function openChangeGroupSignsModal(openerElement: HTMLElement) {
    const modal = document.getElementById('changeGroupSignsModal') as HTMLElement;
    if (!modal) return;
    
    openModalSystem(modal, openerElement);
    
    const contentDiv = document.getElementById('changeGroupSignsContent') as HTMLElement;
    if (!contentDiv) return;
    
    contentDiv.innerHTML = ''; // Clear previous content
    
    // För varje valt ord, skapa en sektion
    const selectedCardData = Array.from(appState.selection).map(cardId => {
        const cardData = appState.cardIdDataMap.get(cardId);
        return { cardId, cardData };
    }).filter(item => item.cardData);
    
    const changesToMake: Map<string, Sign | null> = new Map(); // cardId -> newSign or null to keep original
    
    selectedCardData.forEach(({ cardId, cardData }) => {
        if (!cardData) return;
        
        const wordText = cardData.fullOriginalPhrase;
        const originalSign = cardData.phraseTokens?.[0]?.signs?.[0];
        
        const section = document.createElement('div');
        section.className = 'border border-gray-700 rounded-lg p-4 space-y-3';
        section.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <h4 class="font-semibold">${wordText}</h4>
                <button class="reset-btn-${cardId} text-xs text-gray-400 hover:text-white underline">Återställ</button>
            </div>
            <div class="relative">
                <input type="text" class="modal-input search-input-${cardId}" placeholder="Sök efter nytt tecken i lexikon...">
                <div class="suggestions-list-${cardId} suggestions-list hidden absolute top-full left-0 right-0 mt-1 z-50"></div>
            </div>
            <div class="selected-video-${cardId} flex items-center gap-2 hidden">
                <span class="text-sm font-medium">Valt tecken:</span>
                <video class="selected-video-player-${cardId}" style="height: 80px; width: auto;" muted></video>
            </div>
        `;
        
        contentDiv.appendChild(section);
        
        // Search handler
        const searchInput = section.querySelector(`.search-input-${cardId}`) as HTMLInputElement;
        const suggestionsList = section.querySelector(`.suggestions-list-${cardId}`) as HTMLElement;
        const selectedVideoDiv = section.querySelector(`.selected-video-${cardId}`) as HTMLElement;
        const selectedVideoPlayer = section.querySelector(`.selected-video-player-${cardId}`) as HTMLVideoElement;
        const resetBtn = section.querySelector(`.reset-btn-${cardId}`) as HTMLButtonElement;
        
        searchInput?.addEventListener('input', async (e) => {
            const query = (e.target as HTMLInputElement).value.trim();
            if (query.length < 1) {
                suggestionsList?.classList.add('hidden');
                return;
            }
            
            const { getSortedSearchResults } = await import('../utils');
            const { localLexiconMap, idToWordMap } = await import('../state');
            const words = getSortedSearchResults(query, 100);
            
            const allSigns: Sign[] = [];
            if (words.length > 0) {
                words.forEach(word => {
                    const signs = localLexiconMap.get(word);
                    if (signs) allSigns.push(...signs);
                });
                
                if (/^\d+$/.test(query) && idToWordMap.has(query.padStart(5, '0'))) {
                    const id = query.padStart(5, '0');
                    const word = idToWordMap.get(id)!;
                    allSigns.unshift({ id, word });
                }
            }
            
            const uniqueSigns = Array.from(new Map(allSigns.map(sign => [sign.id, sign])).values()).slice(0, 8);
            suggestionsList?.classList.remove('hidden');
            suggestionsList!.innerHTML = '';
            
            if (uniqueSigns.length === 0) {
                suggestionsList!.innerHTML = '<div class="text-xs text-gray-500 px-3 py-2">Inga tecken hittades</div>';
                return;
            }
            
            uniqueSigns.forEach(sign => {
                const btn = document.createElement('button');
                btn.className = 'w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors text-sm';
                btn.textContent = `${sign.word} (ID: ${sign.id})`;
                btn.addEventListener('click', () => {
                    changesToMake.set(cardId, sign);
                    searchInput.value = `${sign.word} ✓`;
                    suggestionsList.classList.add('hidden');
                    
                    // Show preview
                    selectedVideoDiv.classList.remove('hidden');
                    selectedVideoPlayer.src = buildVideoUrl(sign.id, sign.word);
                    selectedVideoPlayer.load();
                });
                suggestionsList?.appendChild(btn);
            });
        });
        
        resetBtn?.addEventListener('click', () => {
            changesToMake.delete(cardId);
            searchInput.value = '';
            selectedVideoDiv.classList.add('hidden');
        });
    });
    
    // Save button
    const saveBtn = modal.querySelector('#changeGroupSignsSaveBtn') as HTMLButtonElement;
    const cancelBtn = modal.querySelector('#changeGroupSignsCancelBtn') as HTMLButtonElement;
    
    saveBtn?.addEventListener('click', () => {
        if (changesToMake.size > 0) {
            showMessage(`${changesToMake.size} tecken bytt!`, 'success');
        }
        closeModalSystem(modal);
        appState.selection = [];
        import('../ui').then(({ updateSelectionUI }) => { updateSelectionUI(); });
    });
    
    cancelBtn?.addEventListener('click', () => {
        closeModalSystem(modal);
    });
}

function updateMultiSelectUI() {
    import('./VideoGrid').then(({ updateMultiSelectUI: updateUI }) => {
        updateUI();
    });
}

// --- HUVUDINITIALISERING FÖR MODALER ---

export function initializeModals() {
    initializeModalSystem();
    (window as any).showFeedbackVideo = showFeedbackVideo;
    // ARCHIVED: initializeLexiconExplorer() - moved to _archived/
    initializeAlphabetModals();
    initializeImproveSignModalEventListeners();
    setupFeedbackListeners(); 
    initializeSuggestionModalEventListeners(); 
}