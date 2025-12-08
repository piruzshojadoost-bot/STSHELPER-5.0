
import { appState } from '../../state';

export async function updateSelectionUI() {
    const selectionCount = appState.selection.length;
    const feedbackBtn = document.getElementById('mainFeedbackBtn') as HTMLButtonElement;
    const thumbUpBtn = document.getElementById('thumbUpSelectionBtn') as HTMLButtonElement;
    const thumbDownBtn = document.getElementById('thumbDownSelectionBtn') as HTMLButtonElement;
    const combinationActionContainer = document.getElementById('combinationActionContainer') as HTMLElement;
    const videoGrid = document.getElementById('videoGrid') as HTMLElement;

    const isSelectToolActive = videoGrid && videoGrid.dataset.activeTool === 'select';
    const showSelectionActions = selectionCount > 0 && isSelectToolActive;
    
    if (thumbUpBtn && thumbDownBtn) {
        thumbUpBtn.classList.toggle('hidden', !showSelectionActions);
        thumbDownBtn.classList.toggle('hidden', !showSelectionActions);
    }
    
    if (combinationActionContainer) {
        combinationActionContainer.classList.toggle('hidden', !(selectionCount >= 2 && isSelectToolActive));
    }

    if (feedbackBtn) {
        if (showSelectionActions) {
            feedbackBtn.textContent = `Kommentera (${selectionCount})`;
            feedbackBtn.dataset.tooltipText = 'Lämna en gemensam kommentar för alla valda tecken.';
            feedbackBtn.disabled = false;
            // Dynamic import to avoid circular dependency with modals.ts
            feedbackBtn.onclick = (e) => import('../../components/modals').then(m => m.openGroupCommentModal(e.currentTarget as HTMLElement));
        } else {
            feedbackBtn.textContent = 'Ge Feedback';
            feedbackBtn.dataset.tooltipText = 'Lämna en övergripande kommentar om hela meningen.';
            
            const sentenceForFeedback = appState.isShowingAllSentences 
                ? appState.sentences.flat() // Provide all words if all are shown
                : appState.sentences[appState.currentSentenceIndex];

            if (sentenceForFeedback && sentenceForFeedback.length > 0) {
                 feedbackBtn.disabled = false;
                 feedbackBtn.onclick = (e) => import('../../components/modals').then(m => m.openSentenceFeedbackModal(sentenceForFeedback, e.currentTarget as HTMLElement));
            } else {
                feedbackBtn.disabled = true;
                feedbackBtn.onclick = null;
            }
        }
    }
    
    document.querySelectorAll<HTMLElement>('.video-card[data-card-id]').forEach(card => {
        const cardId = card.dataset.cardId;
        if (cardId) {
            card.classList.toggle('is-selected', appState.selection.includes(cardId));
        }
    });
}
