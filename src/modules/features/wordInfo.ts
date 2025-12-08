import { fullLexiconMap } from '../../state';
import { buildVideoUrl, playVideo } from '../../services/media/videoService';

export function displayWordInfo(word: string) {
    const wordInfoTitle = document.getElementById('wordInfoTitle');
    const currentWordName = document.getElementById('currentWordName');
    const examplesAndRelatedContainer = document.getElementById('examplesAndRelatedContainer');

    if (!wordInfoTitle || !currentWordName) return;

    const normalizedWord = word.toLowerCase();
    const entries = fullLexiconMap.get(normalizedWord) || [];

    // Clear previous content
    if (examplesAndRelatedContainer) {
        examplesAndRelatedContainer.classList.add('hidden');
    }

    if (entries.length === 0) return;

    // Set title
    currentWordName.textContent = word;
    wordInfoTitle.style.display = 'block';
    
    // Add gloss/explanation if available
    const entry = entries[0];
    if (entry.gloss) {
        const glossEl = document.createElement('p');
        glossEl.className = 'text-sm text-gray-400 mb-4 italic';
        glossEl.innerHTML = `<strong>Förklaring:</strong> ${entry.gloss}`;
        wordInfoTitle.parentElement?.insertBefore(glossEl, examplesAndRelatedContainer);
    }
}
