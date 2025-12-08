
import { appState } from '../../state';
import { renderCurrentSentence, populateVideoGrid, updateNavControls, renderGrammarGrid } from '../../components/VideoGrid';
import { handlePlayAll } from '../features/playback';
import { translateToGlosa } from '../../hooks/useAI';
import { showMessage, getLexiconUrl } from '../../ui';
import { findCandidatesForToken } from '../search/localSearchWithFallback';
import { renderGlossesOnly } from '../features/renderGlosses';
import { renderAnalyzedText } from '../ui/textDisplay';
import { openSignDetailsModal } from '../../components/modals';
import { displayWordInfo } from '../features/wordInfo';
import { splitTextIntoSentences } from '../logic/textProcessing';
import { enrichWordMapDataInBackground } from '../../hooks/useDataEnrichment';
import { WordMapEntry } from '../../types';
import { openFeedbackPreviewModal } from '../feedback/feedbackPreviewModal';
import { updateFeedbackBadge, clearFeedbackGlow } from '../../services/ui/feedbackNotificationService';

// DOM Elements for video display
const videoDisplayContainer = document.getElementById('videoDisplayContainer') as HTMLElement;
const toolsAndActionsContainer = document.getElementById('tools-and-actions-container') as HTMLElement;
const showAllVideosBtn = document.getElementById('showAllVideosBtn') as HTMLButtonElement;

/**
 * GLOSA Video Update Function
 * Använder EXAKT samma flöde som Search:
 * tokeniserar → findCandidates → renderCurrentSentence → populateVideoGrid
 */
export async function updateGlosaVideos(glossaResult: string) {
    try {
        // Splitta GLOSA exakt som Search gör
        const tokens = glossaResult.split(/([,."!?\n\s]+)/g).filter(token => token.length > 0);
        
        if (tokens.length === 0) {
            console.warn('⚠️ Inga GLOSA-token att visa');
            return;
        }
        
        console.log(`📍 GLOSA processerar ${tokens.length} token exakt som Search`);
        
        // Använd samma tokeniseringsprocess som Search
        const promises = tokens.map(async (token): Promise<WordMapEntry> => {
            // Om token bara är skiljetecken, radbrytningar eller mellanslag
            if (/^[\s,."!?\n]+$/.test(token)) {
                return { original: token, base: token, isWord: false, pos: 'PUNCT', signs: null };
            }

            // Sök i lokalt lexikon - SAMMA som Search
            const cand = await findCandidatesForToken(token);
            
            if (cand) {
                return {
                    original: token,
                    base: cand.base,
                    isWord: true,
                    pos: '',
                    signs: cand.signs,
                    isCompound: !!cand.isCompound,
                    rationale: cand.method
                };
            } else {
                return {
                    original: token,
                    base: token.toLowerCase().trim(),
                    isWord: true,
                    pos: '',
                    signs: null,
                    isCompound: false,
                    rationale: 'Ingen lokalt tecken hittades'
                };
            }
        });

        const glosaWordMap = await Promise.all(promises);
        
        if (glosaWordMap.length > 0) {
            console.log(`✅ GLOSA: ${glosaWordMap.length} ord, anropar renderCurrentSentence → populateVideoGrid`);
            
            // Uppdatera appState - SAMMA som Search
            appState.wordMap = glosaWordMap;
            appState.sentences = splitTextIntoSentences(glosaWordMap);
            appState.currentSentenceIndex = 0;
            appState.currentGrammarSentenceIndex = 0;
            
            if(showAllVideosBtn) showAllVideosBtn.textContent = 'Visa Alla';
            appState.isShowingAllSentences = false;
            appState.aiTranslatedSentences.clear();
            
            // Funktionen för att hantera ord-klick - SAMMA som Search
            const handleWordClick = (wordData: WordMapEntry, openerElement: HTMLElement) => {
                if (wordData.signs && wordData.signs.length > 0) {
                    appState.modalContexts.signDetailsContext = wordData;
                    openSignDetailsModal(wordData, openerElement);
                    displayWordInfo(wordData.base);
                } else {
                    const targetUrl = getLexiconUrl('search', wordData.base);
                    if (targetUrl) {
                        window.open(targetUrl, '_blank');
                    }
                }
            };
            
            // Visa videokontroller - SAMMA som Search
            if (videoDisplayContainer) videoDisplayContainer.classList.remove('hidden');
            if (toolsAndActionsContainer) toolsAndActionsContainer.classList.remove('hidden');
            
            // GLOSA FLÖDE (svenskan bevaras i originalTextDisplay):
            // 1. Visa GLOSA-orden överst (svenskan finns redan kvar)
            renderGlossesOnly(glosaWordMap);
            
            // 3. Anropa renderCurrentSentence (samma som Search)
            renderCurrentSentence();
            
            // populateVideoGrid anropas inuti renderCurrentSentence, så vi får videorna automatiskt
            
            updateNavControls();
            
            // 4. Starta bakgrundsbearbetning - SAMMA som Search
            enrichWordMapDataInBackground(glosaWordMap);
            
            // Scroll till videorna
            const videoGrid = document.getElementById('videoGrid');
            if (videoGrid) {
                setTimeout(() => {
                    videoGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        } else {
            console.warn('⚠️ Inga GLOSA-ord att visa');
        }
    } catch (error) {
        console.error('❌ Fel vid GLOSA-uppdatering:', error);
    }
}

export function setupNavHandlers() {
    const prevSentenceBtn = document.getElementById('prevSentenceBtn') as HTMLButtonElement;
    const nextSentenceBtn = document.getElementById('nextSentenceBtn') as HTMLButtonElement;
    const showAllVideosBtn = document.getElementById('showAllVideosBtn') as HTMLButtonElement;
    const playAllBtn = document.getElementById('playAllBtn') as HTMLButtonElement;
    const askAiAboutStsBtn = document.getElementById('askAiAboutStsBtn') as HTMLButtonElement;
    const feedbackNavBtn = document.getElementById('feedbackNavBtn') as HTMLButtonElement;

    feedbackNavBtn?.addEventListener('click', () => {
        clearFeedbackGlow();
        openFeedbackPreviewModal();
    });
    
    updateFeedbackBadge();

    // Main Sentence Navigation
    prevSentenceBtn?.addEventListener('click', () => {
        if (appState.currentSentenceIndex > 0) {
            appState.currentSentenceIndex--;
            renderCurrentSentence();
        }
    });

    nextSentenceBtn?.addEventListener('click', () => {
        if (appState.currentSentenceIndex < appState.sentences.length - 1) {
            appState.currentSentenceIndex++;
            renderCurrentSentence();
        }
    });

    // Show All / Show Individual
    showAllVideosBtn?.addEventListener('click', () => {
        appState.isShowingAllSentences = !appState.isShowingAllSentences;
        showAllVideosBtn.textContent = appState.isShowingAllSentences ? 'Visa Enskilda' : 'Visa Alla';
        if (appState.isShowingAllSentences) {
             const allWords = appState.sentences.flat();
            populateVideoGrid(allWords);
        } else {
            renderCurrentSentence();
        }
        updateNavControls();
    });

    // Play All
    playAllBtn?.addEventListener('click', handlePlayAll);

    // GLOSA Button - Ask AI about Swedish Sign Language
    askAiAboutStsBtn?.addEventListener('click', async () => {
        const textDisplay = document.getElementById('originalTextDisplay');
        if (!textDisplay || !textDisplay.textContent?.trim()) {
            showMessage('❌ Skriv eller klistra in text först', 'error', 3000);
            return;
        }

        const textContent = textDisplay.textContent.trim();
        askAiAboutStsBtn.disabled = true;
        askAiAboutStsBtn.classList.add('glow-attention');

        try {
            showMessage('🔵 Översätter till GLOSA...', 'success', 2000);
            const glossaResult = await translateToGlosa(textContent);

            if (glossaResult) {
                showMessage('✅ GLOSA-translation klar!', 'success', 2000);
                const glossaDisplay = document.getElementById('glossaDisplay') || (() => {
                    const div = document.createElement('div');
                    div.id = 'glossaDisplay';
                    div.style.cssText = 'margin-top: 1rem; padding: 1rem; background: #a5e7ef; border-radius: 0.5rem; font-family: FreeSans-SWL, monospace; font-size: 1.2rem; line-height: 1.8;';
                    textDisplay.parentElement?.insertAdjacentElement('afterend', div);
                    return div;
                })();
                // Format GLOSA: STORA BOKSTÄVER + grundform
                glossaDisplay.textContent = glossaResult.toUpperCase().trim();
                
                // NYTT: Uppdatera videor för GLOSA-orden
                await updateGlosaVideos(glossaResult);
            } else {
                showMessage('⚠️ GLOSA-translation misslyckades', 'error', 3000);
            }
        } catch (error) {
            console.error('GLOSA error:', error);
            showMessage('❌ Något gick fel vid GLOSA-translation', 'error', 5000);
        } finally {
            askAiAboutStsBtn.disabled = false;
            askAiAboutStsBtn.classList.remove('glow-attention');
        }
    });
}
