import { WordMapEntry } from '../../types';
import { ICON_LOADING_SVG } from '../../ui';

export function renderGlossesOnly(wordMap: WordMapEntry[], isLoading = false) {
    const grid = document.getElementById('grammarGrid');
    const container = document.getElementById('grammarDisplayContainer');
    
    if (!grid) return;
    
    // Show container if hidden
    if (container) container.classList.remove('hidden');
    
    grid.innerHTML = '';
    grid.className = 'gloss-grid';
    
    if (isLoading) {
        grid.innerHTML = `<div class="flex items-center justify-center h-48 col-span-full">${ICON_LOADING_SVG} <span class="ml-2">Översätter...</span></div>`;
        return;
    }
    
    if (!wordMap || wordMap.length === 0) {
        grid.innerHTML = '';
        return;
    }
    
    wordMap.forEach((word) => {
        if (!word.isWord) return;
        
        const gloss = (word.gloss || word.base || word.original || '').toUpperCase();
        
        const card = document.createElement('div');
        card.className = 'gloss-card';
        
        const glossEl = document.createElement('div');
        glossEl.className = 'gloss-text';
        glossEl.textContent = gloss;
        
        card.appendChild(glossEl);
        grid.appendChild(card);
    });
    
    // Add CSS for gloss cards
    if (!document.getElementById('glossCardStyles')) {
        const style = document.createElement('style');
        style.id = 'glossCardStyles';
        style.textContent = `
            .gloss-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                padding: 12px;
                width: 100%;
            }
            
            .gloss-card {
                background: #667eea;
                color: white;
                padding: 6px 12px;
                border-radius: 6px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: default;
                font-weight: 600;
            }
            
            .gloss-text {
                font-size: 14px;
                text-align: center;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                line-height: 1.2;
            }
            
            .gloss-card:hover {
                background: #764ba2;
                transition: background 0.2s ease;
            }
        `;
        document.head.appendChild(style);
    }
}
