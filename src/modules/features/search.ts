
import { appState } from '../../state';
import { WordMapEntry } from '../../types';
import { findCandidatesForToken } from '../search/localSearchWithFallback';
import { updateButtonProgress, showMessage, getLexiconUrl, originalTextDisplay } from '../../ui';
import { renderAnalyzedText } from '../ui/textDisplay';
import { splitTextIntoSentences } from '../logic/textProcessing';
import { enrichWordMapDataInBackground } from '../../hooks/useDataEnrichment';
import { renderCurrentSentence, resetAndShowGrammarPlaceholder } from '../../components/VideoGrid';
import { openSignDetailsModal } from '../../components/modals';
import { displayWordInfo } from './wordInfo';

// DOM Elements specific to search visibility handling
const videoDisplayContainer = document.getElementById('videoDisplayContainer') as HTMLElement;
const toolsAndActionsContainer = document.getElementById('tools-and-actions-container') as HTMLElement;
const showAllVideosBtn = document.getElementById('showAllVideosBtn') as HTMLButtonElement;

async function handleWordClick(wordData: WordMapEntry, openerElement: HTMLElement) {
    if (wordData.signs && wordData.signs.length > 0) {
        appState.modalContexts.signDetailsContext = wordData;
        openSignDetailsModal(wordData, openerElement);
        // Display word info with examples and related videos
        displayWordInfo(wordData.base);
    } else {
        const targetUrl = getLexiconUrl('search', wordData.base);
        if (targetUrl) {
            window.open(targetUrl, '_blank');
        }
    }
}

function handleSearchResult(result: WordMapEntry[]) {
    appState.wordMap = result;
    
    // Rendera den klickbara texten
    renderAnalyzedText(result, handleWordClick);
    
    // Dela upp i meningar via logik-modulen
    appState.sentences = splitTextIntoSentences(result);
    
    if (appState.sentences.length > 0) {
        if(videoDisplayContainer) videoDisplayContainer.classList.remove('hidden');
        if(toolsAndActionsContainer) toolsAndActionsContainer.classList.remove('hidden');
        
        if(showAllVideosBtn) showAllVideosBtn.textContent = 'Visa Alla';
        appState.isShowingAllSentences = false;
        appState.currentSentenceIndex = 0;
        appState.currentGrammarSentenceIndex = 0; 
        appState.aiTranslatedSentences.clear();
        
        // Rendera första meningen i rutnätet
        renderCurrentSentence();
        
        // Scroll till videorna
        const videoGrid = document.getElementById('videoGrid');
        if (videoGrid) {
            setTimeout(() => {
                videoGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    } else {
        if(videoDisplayContainer) videoDisplayContainer.classList.add('hidden');
        if(toolsAndActionsContainer) toolsAndActionsContainer.classList.add('hidden');
        resetAndShowGrammarPlaceholder();
    }
    
    // Starta bakgrundsprocess för att hämta mer data (exempel, relaterat)
    enrichWordMapDataInBackground(result);
}

export async function processAndRenderText(textToProcess?: string) {
    const textContent = textToProcess ?? (originalTextDisplay.innerText || '');
    
    if (!textContent.trim() || textContent.trim() === originalTextDisplay.dataset.placeholder) {
        showMessage("Textrutan är tom.", 'error');
        return;
    }

    updateButtonProgress('local_search');
    
    // Tokenisera texten (bevara skiljetecken, radbrytningar och mellanslag för korrekt återskapande)
    const tokens = textContent.split(/([,."!?\n\s]+)/g).filter(token => token.length > 0);
    
    const promises = tokens.map(async (token): Promise<WordMapEntry> => {
        // Om token bara är skiljetecken, radbrytningar eller mellanslag
        if (/^[\s,."!?\n]+$/.test(token)) {
            return { original: token, base: token, isWord: false, pos: 'PUNCT', signs: null };
        }

        // Sök i lokalt lexikon
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

    const localResults = await Promise.all(promises);
    
    handleSearchResult(localResults);
    
    updateButtonProgress('success');
}
