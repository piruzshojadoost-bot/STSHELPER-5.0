// Event handlers och UI för genuina tecken

import { genuinaTeckenService, type GenuintTecken } from './genuinaTeckenService';
import { PhraseHighlighter } from './phraseHighlighter';
import { originalTextDisplay, buildVideoUrl } from '../../ui';

let highlighter: PhraseHighlighter | null = null;
let currentTooltip: HTMLElement | null = null;

// Cache för att undvika onödiga uppdateringar
let lastMatchCount = 0;

/**
 * Uppdatera badge på Genuina tecken-knappen
 */
function updateGenuinaBadge(matchCount: number) {
    const badge = document.getElementById('genuinaTeckenBadge');
    const btn = document.getElementById('genuinaTeckenBtn');
    
    if (!badge || !btn) return;
    
    // Undvik onödiga DOM-uppdateringar
    if (matchCount === lastMatchCount) return;
    lastMatchCount = matchCount;
    
    if (matchCount > 0) {
        badge.textContent = String(matchCount);
        badge.classList.remove('hidden');
        btn.classList.add('genuina-btn-active');
    } else {
        badge.classList.add('hidden');
        btn.classList.remove('genuina-btn-active');
    }
}

/**
 * Sätt upp genuina tecken funktionalitet
 */
export async function setupGenuinaTecken() {
    // Ladda genuina tecken data
    await genuinaTeckenService.load();

    if (!genuinaTeckenService.isLoaded()) {
        console.warn('Genuina tecken kunde inte laddas');
        return;
    }

    // Sätt upp highlighting på text input
    if (originalTextDisplay) {
        highlighter = new PhraseHighlighter(originalTextDisplay);

        // Highlight när användaren skriver + uppdatera badge
        originalTextDisplay.addEventListener('input', () => {
            highlighter?.highlight();
            // Kolla om det finns matchningar och uppdatera badge
            const text = originalTextDisplay.textContent || '';
            const matches = genuinaTeckenService.findMatches(text);
            updateGenuinaBadge(matches.length);
        });

        // Highlight när textfältet får focus (om det redan finns text)
        originalTextDisplay.addEventListener('focus', () => {
            if (originalTextDisplay.textContent?.trim()) {
                highlighter?.highlight(true);
            }
        });

        // Hantera klick på highlightade fraser
        originalTextDisplay.addEventListener('click', handlePhraseClick);
    }

    // Sätt upp modal handlers
    setupModal();
}

/**
 * Hantera klick på highlightad fras
 */
function handlePhraseClick(e: Event) {
    const target = e.target as HTMLElement;

    if (target.classList.contains('genuine-phrase')) {
        const teckenId = target.dataset.teckenId;
        const phrase = target.dataset.phrase;

        if (teckenId) {
            showTooltip(target, teckenId, phrase || '');
        }
    } else {
        // Klick utanför - stäng tooltip
        hideTooltip();
    }
}

/**
 * Visa tooltip med tecken-info
 */
function showTooltip(anchorElement: HTMLElement, teckenId: string, phrase: string) {
    hideTooltip(); // Ta bort tidigare tooltip

    const tecken = genuinaTeckenService.findById(teckenId);
    if (!tecken) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'genuine-tooltip';
    tooltip.innerHTML = `
        <div class="genuine-tooltip-header">
            <span class="genuine-tooltip-badge">
                💡 Genuint tecken
            </span>
            <button class="genuine-tooltip-close" data-action="close-tooltip">&times;</button>
        </div>
        <div class="genuine-tooltip-phrase">${escapeHTML(phrase)}</div>
        <div class="genuine-tooltip-id">ID: ${escapeHTML(teckenId)}</div>
        ${tecken.synonymer.length > 0 ? `
            <div class="genuine-tooltip-synonyms">
                <div class="genuine-tooltip-synonyms-label">Synonymer:</div>
                <div class="genuine-tooltip-synonyms-list">
                    ${tecken.synonymer.map(syn => `
                        <span class="genuine-synonym-tag">${escapeHTML(syn)}</span>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        <div class="genuine-tooltip-actions">
            <button class="btn btn-primary btn-sm" data-action="show-video" data-tecken-id="${teckenId}">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Se tecken
            </button>
        </div>
    `;

    // Positionera tooltip
    const rect = anchorElement.getBoundingClientRect();
    tooltip.style.position = 'fixed';
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.top = `${rect.bottom + 8}px`;

    // Justera om tooltip går utanför skärmen
    document.body.appendChild(tooltip);
    const tooltipRect = tooltip.getBoundingClientRect();
    
    if (tooltipRect.right > window.innerWidth - 16) {
        tooltip.style.left = `${window.innerWidth - tooltipRect.width - 16}px`;
    }
    if (tooltipRect.bottom > window.innerHeight - 16) {
        tooltip.style.top = `${rect.top - tooltipRect.height - 8}px`;
    }

    currentTooltip = tooltip;

    // Event listeners för tooltip
    tooltip.querySelector('[data-action="close-tooltip"]')?.addEventListener('click', hideTooltip);
    tooltip.querySelector('[data-action="show-video"]')?.addEventListener('click', () => {
        // TODO: Implementera visa video direkt
        console.log('Visa video för tecken:', teckenId);
        hideTooltip();
    });

    // Stäng vid klick utanför
    setTimeout(() => {
        document.addEventListener('click', outsideClickListener);
    }, 0);
}

/**
 * Dölj tooltip
 */
function hideTooltip() {
    if (currentTooltip) {
        currentTooltip.remove();
        currentTooltip = null;
        document.removeEventListener('click', outsideClickListener);
    }
}

/**
 * Listener för klick utanför tooltip
 */
function outsideClickListener(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (currentTooltip && !currentTooltip.contains(target) && !target.classList.contains('genuine-phrase')) {
        hideTooltip();
    }
}

/**
 * Sätt upp modal för genuina tecken lista
 */
function setupModal() {
    const modal = document.getElementById('genuinaTeckenModal');
    const openBtn = document.getElementById('genuinaTeckenBtn');
    const closeBtn = document.getElementById('genuinaTeckenClose');
    const searchInput = document.getElementById('genuinaTeckenSearch') as HTMLInputElement;
    const listContainer = document.getElementById('genuinaTeckenList');

    if (!modal || !openBtn || !closeBtn || !searchInput || !listContainer) {
        console.warn('Genuina tecken modal element saknas');
        return;
    }

    // Öppna modal
    openBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        searchInput.value = '';
        renderList('');
        searchInput.focus();
    });

    // Stäng modal
    const closeModal = () => {
        modal.classList.add('hidden');
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Sök i modal
    searchInput.addEventListener('input', () => {
        renderList(searchInput.value);
    });

    // Escape-tangent stänger modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

/**
 * Rendera lista över genuina tecken
 */
function renderList(query: string) {
    const listContainer = document.getElementById('genuinaTeckenList');
    if (!listContainer) return;

    const results = genuinaTeckenService.search(query);

    if (results.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                Inga genuina tecken hittades
            </div>
        `;
        return;
    }

    listContainer.innerHTML = results.map(tecken => `
        <div class="genuine-item" data-tecken-id="${escapeHTML(tecken.id)}" data-phrase="${escapeHTML(tecken.tecken)}">
            <div class="genuine-item-phrase">${escapeHTML(tecken.tecken)}</div>
            <div class="genuine-item-id">ID: ${escapeHTML(tecken.id)}</div>
            ${tecken.synonymer.length > 0 ? `
                <div class="genuine-item-synonyms">
                    ${escapeHTML(tecken.synonymer.join(', '))}
                </div>
            ` : ''}
        </div>
    `).join('');

    // Klick handler för att infoga i textfält
    listContainer.querySelectorAll('.genuine-item').forEach(item => {
        item.addEventListener('click', () => {
            const phrase = (item as HTMLElement).dataset.phrase;
            const teckenId = (item as HTMLElement).dataset.teckenId;
            console.log('Genuine item clicked:', { teckenId, phrase });
            let videoContainer = item.querySelector('.genuine-video-container');
            if (videoContainer) {
                // Om video redan visas, ta bort den
                videoContainer.remove();
            } else {
                // Annars visa video
                const videoUrl = buildVideoUrl(teckenId, phrase, 'tecken', undefined, true);
                videoContainer = document.createElement('div');
                videoContainer.className = 'genuine-video-container';
                videoContainer.innerHTML = `<video src="${videoUrl}" controls autoplay style="max-width:220px; margin-left:12px; vertical-align:middle;"></video>`;
                item.appendChild(videoContainer);
            }
        });
    });
}

/**
 * Escape HTML för säkerhet
 */
function escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
