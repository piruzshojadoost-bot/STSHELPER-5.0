
import { appState } from '../../state';
import { updateButtonProgress, originalTextDisplay, isDevMode } from '../../ui';
import { saveUserData } from '../../hooks/useLexicon';
import { closeModal } from '../../components/modals';
import { resetAndShowGrammarPlaceholder } from '../../components/VideoGrid';
import { initializePlaceholder } from '../ui/textDisplay';

export async function resetApp() {
    // DOM Elements
    const videoDisplayContainer = document.getElementById('videoDisplayContainer') as HTMLElement;
    const toolsAndActionsContainer = document.getElementById('tools-and-actions-container') as HTMLElement;
    const videoNavControls = document.getElementById('videoNavControls') as HTMLElement;
    const videoGrid = document.getElementById('videoGrid') as HTMLElement;
    const alphabetGrid = document.getElementById('alphabetGrid') as HTMLElement;
    const playAllBtn = document.getElementById('playAllBtn') as HTMLButtonElement;
    const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
    const toolsContainer = document.getElementById('tools-container') as HTMLElement;
    const glosaPane = document.getElementById('glosaPane') as HTMLElement;
    const glosaPreview = document.getElementById('glosaPreview') as HTMLTextAreaElement;
    const glosaStatus = document.getElementById('glosaStatus') as HTMLElement;
    const saveGlosaBtn = document.getElementById('saveGlosaBtn') as HTMLButtonElement;

    appState.videoObserver?.disconnect();
    appState.alphabetObserver?.disconnect();

    document.querySelectorAll('.modal.show').forEach(modal => {
        closeModal(modal as HTMLElement);
    });

    if(originalTextDisplay) originalTextDisplay.innerHTML = '';
    if(videoDisplayContainer) videoDisplayContainer.classList.add('hidden');
    if(toolsAndActionsContainer) toolsAndActionsContainer.classList.add('hidden');
    if(videoNavControls) videoNavControls.classList.add('hidden');
    if(videoGrid) videoGrid.innerHTML = '';
    
    // Reset GLOSA panel
    if(glosaPane) glosaPane.classList.add('hidden');
    if(glosaPreview) glosaPreview.value = '';
    if(saveGlosaBtn) saveGlosaBtn.classList.add('hidden');
    if(glosaStatus) {
        glosaStatus.className = 'glosa-status';
        glosaStatus.textContent = '';
    }
    
    resetAndShowGrammarPlaceholder();
    
    appState.isClickableMode = true; 
    appState.wordMap = [];
    appState.videoSuggestions = [];
    appState.selection = [];
    appState.combinationSelection = [];
    appState.chat = null;
    appState.chatHistory = [];
    appState.chatFile = null;
    
    if (isDevMode()) {
        await saveUserData();
    }

    if (toolsContainer) {
        toolsContainer.querySelectorAll('button.tool-btn').forEach(btn => {
            (btn as HTMLButtonElement).disabled = true;
            btn.classList.remove('active');
        });
    }
    
    if(videoGrid) videoGrid.dataset.activeTool = 'none';
    if(alphabetGrid) alphabetGrid.dataset.activeTool = 'none';

    appState.latestReportContent = null;
    appState.latestFeedbackJson = "";
    appState.sentences = [];
    appState.currentSentenceIndex = 0;
    appState.currentGrammarSentenceIndex = 0;
    appState.aiTranslatedSentences.clear();
    appState.isShowingAllSentences = false;
    appState.isPlayingAll = false;
    if (playAllBtn) playAllBtn.textContent = 'Spela Alla';
    updateButtonProgress('idle');
    initializePlaceholder();

    if (clearBtn) {
        clearBtn.classList.add('glow-once-feedback');
        setTimeout(() => {
            clearBtn.classList.remove('glow-once-feedback');
        }, 800);
    }
}
