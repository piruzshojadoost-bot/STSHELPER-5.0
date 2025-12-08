
import { appState } from '../../state';
import { WordMapEntry } from '../../types';
import { originalTextDisplay, getLexiconUrl } from '../../ui';

export function initializePlaceholder() {
    if (!originalTextDisplay) return;
    if (!originalTextDisplay.textContent?.trim() || originalTextDisplay.textContent === originalTextDisplay.dataset.placeholder) {
        originalTextDisplay.textContent = originalTextDisplay.dataset.placeholder || '';
        originalTextDisplay.classList.remove('text-area-editable');
    } else {
        originalTextDisplay.classList.add('text-area-editable');
    }
}

export function renderAnalyzedText(wordMap: WordMapEntry[], onWordClick: (word: WordMapEntry, el: HTMLElement) => void) {
    if (!originalTextDisplay) return;
    originalTextDisplay.innerHTML = '';
    
    wordMap.forEach(wordData => {
        // Skip line breaks - don't render them, just show text as flowing
        if (wordData.original.trim() === '') {
            // For whitespace, just add a space
            originalTextDisplay.appendChild(document.createTextNode(' '));
            return;
        }
        
        const span = document.createElement('span');
        span.textContent = wordData.original;
        if (wordData.isWord && appState.isClickableMode) {
            span.classList.add('clickable-word-span');
            if (wordData.isSpelledOut) {
                span.classList.add('is-spelled-out');
                span.dataset.tooltipText = `<span class="tooltip-blue">Stavas ut!</span> Ordet "<strong>${wordData.base}</strong>" hittades inte och stavas ut istället.`;
            } else if (wordData.signs && wordData.signs.length > 0) {
                span.classList.add('has-video');
                if (wordData.isCompound) {
                    span.classList.add('is-compound');
                    span.dataset.tooltipText = `<span class="tooltip-orange">Sammansatt ord!</span> Klicka för detaljerad information.`;
                } else if (wordData.signs.length > 1) {
                    span.classList.add('has-multiple-videos');
                    span.dataset.tooltipText = `<span class="tooltip-purple">${wordData.signs.length} tecken finns!</span> Klicka för detaljer och välj rätt tecken nedan.`;
                } else {
                    span.dataset.tooltipText = `<span class="tooltip-green">1 tecken finns!</span> Klicka för att se exempel, glosa och mer information.`;
                }
            } else {
                span.classList.add('no-video');
                span.dataset.tooltipText = `Inget tecken hittades lokalt. Klicka för att söka efter "<strong>${wordData.base}</strong>" på lexikonets webbplats.`;
            }
            
            span.addEventListener('click', (e) => {
                if (wordData.signs && wordData.signs.length > 0) {
                    onWordClick(wordData, e.currentTarget as HTMLElement);
                } else {
                    const targetUrl = getLexiconUrl('search', wordData.base);
                    if (targetUrl) {
                        window.open(targetUrl, '_blank');
                    }
                }
            });
        }
        originalTextDisplay.appendChild(span);
    });
}
