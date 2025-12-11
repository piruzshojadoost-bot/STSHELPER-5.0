
import { WordMapEntry, Sign } from '../types';
import { appState, learnedPreferences, alphabetSignsMap } from '../state';
import { updateSelectionUI, buildVideoUrl, ICON_LOADING_SVG, showMessage } from '../ui';
import { openImproveSignMenuModal, openModal, openThumbDownReasonModal, openGoodChoiceReasonModal, openChangeGrammarSignModal } from './modals';
import { saveUserData } from '../hooks/useLexicon';
import { reorderSignsWithPreferences } from '../utils/sorting';

// --- DOM ELEMENTS ---
const videoGrid = document.getElementById('videoGrid') as HTMLElement;
const videoNavControls = document.getElementById('videoNavControls') as HTMLElement;
const prevSentenceBtn = document.getElementById('prevSentenceBtn') as HTMLButtonElement;
const nextSentenceBtn = document.getElementById('nextSentenceBtn') as HTMLButtonElement;
const sentenceCounter = document.getElementById('sentenceCounter') as HTMLElement;
const showAllVideosBtn = document.getElementById('showAllVideosBtn') as HTMLButtonElement;
const alphabetGrid = document.getElementById('alphabetGrid') as HTMLElement;

// --- CONSTANTS ---
export const PRIMARY_VOTE_VALUE = 999;

// --- STATE ---
let globalCardIndex = 0; // Moved to module scope to persist across clears

// --- VIDEO OBSERVER FOR LAZY LOADING ---
function createVideoObserver(): IntersectionObserver {
    return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const card = entry.target as HTMLElement;
            const video = card.querySelector('video') as HTMLVideoElement;
            
            if (entry.isIntersecting && video && !video.src && video.dataset.src) {
                // Load video when card enters viewport
                video.src = video.dataset.src;
                video.load();
            }
        });
    }, { 
        rootMargin: '100px', // Start loading 100px before visible
        threshold: 0.1 
    });
}

// --- EVENT HANDLERS FOR CARD ACTIONS ---
function getCardContext(cardElement: HTMLElement): { phraseTokens: WordMapEntry[], lookupKey: string, fullOriginalPhrase: string, cardId: string, isSpelledOut: boolean, cardContainer: HTMLElement } | null {
    const cardId = cardElement.dataset.cardId;
    if (!cardId) return null;
    const cardData = appState.cardIdDataMap.get(cardId);
    if (!cardData || !cardData.phraseTokens || cardData.phraseTokens.length === 0) {
        return null;
    }
    
    return {
        ...cardData,
        lookupKey: cardData.phraseTokens[0].base.toLowerCase(),
        cardId,
        isSpelledOut: cardData.phraseTokens[0].isSpelledOut || false,
        cardContainer: cardElement
    };
}

function handleThumbUpClick(cardElement: HTMLElement) {
    const context = getCardContext(cardElement);
    if (!context || !context.phraseTokens[0].signs) return;
    const cardId = cardElement.dataset.cardId;
    const cardData = cardId ? appState.cardIdDataMap.get(cardId) : null;
    const sign = cardData?.currentSign || context.phraseTokens[0].signs[0];
    openGoodChoiceReasonModal({ ...context, sign }, cardElement);
    // Autosave user data after action
    saveUserData().catch(() => {});
}

function handleThumbDownClick(cardElement: HTMLElement) {
    const context = getCardContext(cardElement);
    if (!context || !context.phraseTokens[0].signs) return;
    const cardId = cardElement.dataset.cardId;
    const cardData = cardId ? appState.cardIdDataMap.get(cardId) : null;
    const sign = cardData?.currentSign || context.phraseTokens[0].signs[0];
    openThumbDownReasonModal({ ...context, sign }, cardElement);
    // Autosave user data after action
    saveUserData().catch(() => {});
}

function handleChangeClick(cardElement: HTMLElement) {
    const context = getCardContext(cardElement);
    if (!context) return;
    openImproveSignMenuModal(context, cardElement);
    // Autosave user data after action
    saveUserData().catch(() => {});
}

// Grid-level click listener for tool-based interactions
videoGrid.addEventListener('click', (e) => {
    const tool = videoGrid.dataset.activeTool;
    const card = (e.target as HTMLElement).closest<HTMLElement>('.video-card:not(.video-card-no-sign)');
    
    if (tool && tool !== 'none' && card) {
        e.preventDefault();
        e.stopPropagation();

        const cardId = card.dataset.cardId;

        switch (tool) {
            case 'thumb-up':
                if (appState.multiSelectMode && appState.selectedCardIds.size > 0) {
                    handleGroupThumbUp();
                } else {
                    handleThumbUpClick(card);
                }
                break;
            case 'thumb-down':
                if (appState.multiSelectMode && appState.selectedCardIds.size > 0) {
                    handleGroupThumbDown();
                } else {
                    handleThumbDownClick(card);
                }
                break;
            case 'change':
                if (appState.multiSelectMode && appState.selectedCardIds.size > 0) {
                    handleGroupChange();
                } else {
                    handleChangeClick(card);
                }
                break;
            case 'select':
                if (cardId) {
                    if (appState.multiSelectMode) {
                        if (appState.selectedCardIds.has(cardId)) {
                            appState.selectedCardIds.delete(cardId);
                        } else {
                            appState.selectedCardIds.add(cardId);
                        }
                        updateMultiSelectUI();
                    } else {
                        const index = appState.selection.indexOf(cardId);
                        if (index > -1) {
                            appState.selection.splice(index, 1);
                        } else {
                            appState.selection.push(cardId);
                        }
                        updateSelectionUI();
                    }
                }
                break;
        }
    }
});

// --- MULTI-SELECT HANDLERS ---
function handleGroupThumbUp() {
    const words = Array.from(appState.selectedCardIds)
        .map(id => appState.cardIdDataMap.get(id)?.fullOriginalPhrase || '')
        .filter(w => w);
    showMessage(`✓ Tumme upp för: ${words.join(', ')}`, 'success');
    appState.selectedCardIds.forEach(id => {
        const card = document.querySelector(`.video-card[data-card-id="${id}"]`);
        card?.classList.add('feedback-reported');
    });
    appState.selectedCardIds.clear();
    updateMultiSelectUI();
}

function handleGroupThumbDown() {
    const words = Array.from(appState.selectedCardIds)
        .map(id => appState.cardIdDataMap.get(id)?.fullOriginalPhrase || '')
        .filter(w => w);
    showMessage(`👎 Tumme ner för: ${words.join(', ')}`, 'error');
    appState.selectedCardIds.forEach(id => {
        const card = document.querySelector(`.video-card[data-card-id="${id}"]`);
        card?.classList.add('feedback-reported');
    });
    appState.selectedCardIds.clear();
    updateMultiSelectUI();
}

function handleGroupChange() {
    import('./modals').then(({ openMultiSelectFeedbackModal }) => {
        openMultiSelectFeedbackModal(videoGrid);
    });
}

export function updateMultiSelectUI() {
    const cards = document.querySelectorAll('.video-card');
    cards.forEach(card => {
        const cardId = card.getAttribute('data-card-id');
        if (appState.selectedCardIds.has(cardId!)) {
            card.classList.add('selected-multi');
        } else {
            card.classList.remove('selected-multi');
        }
    });
}


// --- FUNCTIONS ---
export function updateNavControls() {
    if (!videoNavControls || !sentenceCounter || !prevSentenceBtn || !nextSentenceBtn) return;
    
    if (appState.sentences.length > 1) {
        videoNavControls.classList.remove('hidden');
        prevSentenceBtn.disabled = appState.isShowingAllSentences || appState.currentSentenceIndex <= 0;
        nextSentenceBtn.disabled = appState.isShowingAllSentences || appState.currentSentenceIndex >= appState.sentences.length - 1;
        sentenceCounter.textContent = `Mening ${appState.currentSentenceIndex + 1} / ${appState.sentences.length}`;
        sentenceCounter.classList.toggle('hidden', appState.isShowingAllSentences);
    } else {
        videoNavControls.classList.add('hidden');
    }
}

export function updateGrammarNavControls() {
    const grammarNav = document.getElementById('grammarNavControls');
    const counter = document.getElementById('grammarSentenceCounter');
    const prevBtn = document.getElementById('prevGrammarSentenceBtn');
    const nextBtn = document.getElementById('nextGrammarSentenceBtn');
    
    if (!grammarNav || !counter || !prevBtn || !nextBtn) return;
    
    if (appState.sentences.length > 1) {
        counter.textContent = `Mening ${appState.currentGrammarSentenceIndex + 1} / ${appState.sentences.length}`;
        (prevBtn as HTMLButtonElement).disabled = appState.currentGrammarSentenceIndex <= 0;
        (nextBtn as HTMLButtonElement).disabled = appState.currentGrammarSentenceIndex >= appState.sentences.length - 1;
    } else {
        grammarNav.classList.add('hidden');
    }
}

export function resetAndShowGrammarPlaceholder() {
    const container = document.getElementById('grammarDisplayContainer');
    const grid = document.getElementById('grammarGrid');
    const placeholder = document.getElementById('grammarPlaceholder');
    const nav = document.getElementById('grammarNavControls');

    if (!container || !grid || !placeholder || !nav) return;
    
    if (appState.sentences.length > 0) {
        container.classList.remove('hidden');
        grid.innerHTML = '';
        grid.appendChild(placeholder);
        placeholder.classList.remove('hidden');
        nav.classList.add('hidden');
    } else {
        container.classList.add('hidden');
    }
}

export function renderCurrentSentence() {
    if (appState.sentences.length === 0) return;
    
    // Update main video grid
    appState.currentGrammarSentenceIndex = appState.currentSentenceIndex;
    const currentSentence = appState.sentences[appState.currentSentenceIndex];
    populateVideoGrid(currentSentence);
    updateNavControls();
    
    // Reset grammar grid to show the "Translate" button for the new sentence
    resetAndShowGrammarPlaceholder();
    updateGrammarNavControls();
}

// New function to update a single card in the grammar grid
export function updateGrammarCard(index: number, newWordData: WordMapEntry) {
    const cardId = `grammar-card-${index}`;
    const cardElement = document.getElementById(cardId) as HTMLElement;
    if (!cardElement) return;

    // Create a new card with the updated information
    const newCardElement = createInteractiveCardElement(cardId, newWordData.original, [newWordData], false, index, 'gloss', true);

    // Re-add the info button/badge if it existed
    if (newWordData.rationale) {
        const infoBtn = document.createElement('button');
        infoBtn.className = 'grammar-info-btn';
        infoBtn.innerHTML = 'i';
        infoBtn.dataset.tooltipText = newWordData.rationale;
        newCardElement.appendChild(infoBtn);
    }
    
    // Replace the old card with the new one
    cardElement.replaceWith(newCardElement);
}


// Updated to render STS Translation Cards with Videos
export function renderGrammarGrid(wordMap: WordMapEntry[], isLoading = false) {
    const container = document.getElementById('grammarDisplayContainer');
    const grid = document.getElementById('grammarGrid');
    const placeholder = document.getElementById('grammarPlaceholder');
    const nav = document.getElementById('grammarNavControls');

    if (!container || !grid || !placeholder || !nav) return;

    placeholder.classList.add('hidden');
    grid.innerHTML = '';

    if (isLoading) {
        grid.innerHTML = `<div class="flex items-center justify-center h-48">${ICON_LOADING_SVG} <span class="ml-2">Översätter...</span></div>`;
        nav.classList.add('hidden');
        return;
    }

    if (!wordMap || wordMap.length === 0) {
        resetAndShowGrammarPlaceholder();
        return;
    }
    
    nav.classList.remove('hidden');
    
    const fragment = document.createDocumentFragment();
    wordMap.forEach((wordData, index) => {
        if (!wordData.isWord) return;

        const fullPhrase = wordData.original;
        
        // Create one card per word to match populateVideoGrid ordning
        let cardElement: HTMLElement;
        const cardId = `grammar-card-${index}`;
        const phraseTokens = [wordData];
        appState.cardIdDataMap.set(cardId, { phraseTokens, fullOriginalPhrase: fullPhrase, currentVariantIndex: 0, currentSign: wordData.signs?.[0] || null });
        
        if (wordData.signs && wordData.signs.length > 0) {
            // Visa första varianten eller compoundsignen
            cardElement = createInteractiveCardElement(cardId, fullPhrase, phraseTokens, false, index, 'gloss', true);
            cardElement.addEventListener('click', () => {
                openChangeGrammarSignModal(cardId, index);
            });
        } else {
            // No signs found
            cardElement = createNoSignCardElement(fullPhrase, phraseTokens, cardId);
        }
        
        if (wordData.rationale) {
            const infoBtn = document.createElement('button');
            infoBtn.className = 'grammar-info-btn';
            infoBtn.innerHTML = 'i';
            infoBtn.dataset.tooltipText = wordData.rationale;
            cardElement.appendChild(infoBtn);
        }
        
        fragment.appendChild(cardElement);
    });
    
    grid.appendChild(fragment);
}

export function updateGridWithAIResults(wordMap: WordMapEntry[]) {
    wordMap.forEach((wordData, index) => {
        if (!wordData.isWord) return;

        const cardId = `card-${index}`;
        const placeholder = document.getElementById(cardId);

        if (placeholder && placeholder.classList.contains('video-card-placeholder')) {
            let newCard: HTMLElement;
            if (wordData.signs && wordData.signs.length > 0) {
                // Main grid should show original Swedish word
                newCard = createInteractiveCardElement(cardId, wordData.original, [wordData], false, index, 'original');
            } else {
                newCard = createNoSignCardElement(wordData.original, [wordData], cardId);
            }
            placeholder.replaceWith(newCard);
        }
    });
    updateSelectionUI();
}


export function populateVideoGrid(wordsToProcess: WordMapEntry[]) {
    appState.videoObserver?.disconnect();
    videoGrid.innerHTML = '';
    appState.cardIdDataMap.clear();
    globalCardIndex = 0;
    
    // Create new observer for lazy loading videos
    appState.videoObserver = createVideoObserver();
    
    document.querySelectorAll<HTMLButtonElement>('.tool-btn').forEach(btn => btn.disabled = wordsToProcess.filter(w => w.isWord).length === 0);

    const fragment = document.createDocumentFragment();
    wordsToProcess.forEach((wordData, index) => {
        if (!wordData.isWord) return;

        const cardId = `card-${globalCardIndex++}`;
        const phraseTokens = [wordData];
        const fullPhrase = wordData.original;
        
        appState.cardIdDataMap.set(cardId, { phraseTokens, fullOriginalPhrase: fullPhrase, currentVariantIndex: 0, currentSign: wordData.signs?.[0] || null });
        
        let cardElement: HTMLElement;
        if (wordData.signs && wordData.signs.length > 0) {
            // Main grid always uses 'original' display mode
            cardElement = createInteractiveCardElement(cardId, fullPhrase, phraseTokens, false, index, 'original');
            // Observe for lazy loading
            appState.videoObserver?.observe(cardElement);
        } else if (wordData.rationale === "Ingen träff") {
            cardElement = createPlaceholderCardElement(fullPhrase, cardId);
        } else {
            cardElement = createNoSignCardElement(fullPhrase, phraseTokens, cardId);
        }
        fragment.appendChild(cardElement);
    });
    videoGrid.appendChild(fragment);

    updateSelectionUI();
}


export function renderAlphabet() {
    // Get element dynamically since modal may not exist at module load time
    const grid = document.getElementById('alphabetGrid') as HTMLElement;
    if (!grid) {
        console.warn('alphabetGrid not found in DOM');
        return;
    }
    
    appState.alphabetObserver?.disconnect();
    grid.innerHTML = '';
    
    const sortedLetters = [...alphabetSignsMap.keys()].sort((a, b) => a.localeCompare(b, 'sv'));
    
    if (sortedLetters.length === 0) {
        grid.innerHTML = '<p class="text-gray-400 text-center p-4">Alfabetet laddas...</p>';
        return;
    }
    
    const fragment = document.createDocumentFragment();

    sortedLetters.forEach(letter => {
        const signs = alphabetSignsMap.get(letter);
        if (!signs || signs.length === 0) return;
        
        const cardId = `alphabet-card-${letter}`;
        const wordMapEntry: WordMapEntry = {
            original: letter.toUpperCase(),
            base: letter,
            isWord: true,
            pos: 'bokstav',
            signs: signs
        };
        // Alphabet cards show the letter, which is the 'original' phrase
        const cardElement = createInteractiveCardElement(cardId, letter.toUpperCase(), [wordMapEntry], true, -1, 'original');
        
        // For alphabet cards: load video src directly (not lazy) to show thumbnails immediately
        // since there are only 29 letters and they should all be visible at once
        const video = cardElement.querySelector('video') as HTMLVideoElement;
        if (video && video.dataset.src) {
            video.src = video.dataset.src;
            video.load();
        }
        
        fragment.appendChild(cardElement);
    });
    grid.appendChild(fragment);
}

export function createNoSignCardElement(fullOriginalPhrase: string, phraseTokensForLookup: WordMapEntry[], cardId: string) {
    const cardContainer = document.createElement('div');
    cardContainer.id = cardId;
    cardContainer.className = 'video-card video-card-no-sign';
    cardContainer.innerHTML = `<p style="align-self: flex-start;">${fullOriginalPhrase.toUpperCase()}</p><p class="text-xs text-gray-400">Inget tecken hittades.</p>`;
    
    const improveBtn = document.createElement('button');
    improveBtn.className = 'btn btn-secondary btn-sm';
    improveBtn.textContent = 'Förbättra';
    improveBtn.onclick = (e) => {
        appState.cardIdDataMap.set(cardId, { phraseTokens: phraseTokensForLookup, fullOriginalPhrase, currentVariantIndex: 0, currentSign: null });
        const context = {
            phraseTokens: phraseTokensForLookup,
            lookupKey: phraseTokensForLookup[0].base.toLowerCase(),
            fullOriginalPhrase,
            cardId,
            isSpelledOut: false,
            cardContainer
        };
        openImproveSignMenuModal(context, e.currentTarget as HTMLElement);
    };
    cardContainer.appendChild(improveBtn);
    return cardContainer;
}

export function createPlaceholderCardElement(word: string, cardId: string): HTMLElement {
    const cardContainer = document.createElement('div');
    cardContainer.id = cardId;
    cardContainer.className = 'video-card video-card-placeholder';
    cardContainer.innerHTML = `
        <div class="placeholder-content">
            <p class="font-bold">${word.toUpperCase()}</p>
            ${ICON_LOADING_SVG}
            <p>Söker...</p>
        </div>
    `;
    return cardContainer;
}

export function createInteractiveCardElement(
    cardId: string, 
    fullOriginalPhrase: string, 
    phraseTokensForLookup: WordMapEntry[], 
    isAlphabetCard = false, 
    wordIndex: number = -1,
    displayMode: 'original' | 'gloss' = 'original',
    isGrammarGlossCard = false
): HTMLElement {
    const wordData = phraseTokensForLookup[0];
    
    // For grammar gloss cards, show just text - no videos
    if (isGrammarGlossCard && displayMode === 'gloss') {
        const cardContainer = document.createElement('div');
        cardContainer.id = cardId;
        cardContainer.className = 'video-card video-card-gloss-text';
        cardContainer.dataset.cardId = cardId;
        
        const glossText = wordData.gloss || wordData.base?.toUpperCase() || fullOriginalPhrase.toUpperCase();
        
        const titleEl = document.createElement('p');
        titleEl.className = 'video-card-title gloss-text-display';
        titleEl.textContent = glossText.toUpperCase();
        titleEl.style.fontSize = '24px';
        titleEl.style.fontWeight = 'bold';
        titleEl.style.padding = '20px';
        titleEl.style.textAlign = 'center';
        titleEl.style.wordBreak = 'break-word';
        
        cardContainer.appendChild(titleEl);
        return cardContainer;
    }
    
    const cardContainer = document.createElement('div');
    cardContainer.className = 'video-card';
    cardContainer.id = cardId; 
    cardContainer.dataset.cardId = cardId;
    if(wordIndex !== -1) {
        cardContainer.dataset.wordIndex = String(wordIndex);
    }

    let signs = wordData.signs!;

    const primarySign = signs[0];
    const isCompound = wordData.isCompound === true;

    const playerWrapper = document.createElement('div');
    playerWrapper.className = 'video-card-player-wrapper relative'; // Ensure relative for loader positioning
    
    // --- LOADER ELEMENT ---
    const loader = document.createElement('div');
    loader.className = 'absolute inset-0 flex items-center justify-center bg-gray-900 z-10 transition-opacity duration-200';
    loader.innerHTML = ICON_LOADING_SVG;
    // ---------------------

    const videoPlayer = document.createElement('video');
    videoPlayer.className = 'video-card-player';
    // Use data-src for lazy loading - observer will set src when visible
    const videoUrl = buildVideoUrl(primarySign.id, primarySign.word);
    console.log('VideoGrid: Genererad videolänk:', videoUrl, 'id:', primarySign.id, 'word:', primarySign.word);
    videoPlayer.dataset.src = videoUrl;
    videoPlayer.muted = true;
    videoPlayer.playsInline = true;
    videoPlayer.loop = !isCompound; // Don't loop if compound word
    videoPlayer.disablePictureInPicture = true;
    videoPlayer.preload = 'metadata'; // Load first frame for thumbnail display

    // --- VARIANT COUNTER & NAVIGATION (top-left) ---
    let currentVariantIndex = 0;
    let variantCounter: HTMLDivElement | null = null;
    let variantContainer: HTMLDivElement | null = null;
    
    const updateVariantCounter = () => {
        if (variantCounter) {
            variantCounter.textContent = `${currentVariantIndex + 1}/${signs.length}`;
        }
    };
    
    const switchVariant = (direction: 'prev' | 'next') => {
        if (direction === 'next') {
            currentVariantIndex = (currentVariantIndex + 1) % signs.length;
        } else {
            currentVariantIndex = (currentVariantIndex - 1 + signs.length) % signs.length;
        }
        const newSign = signs[currentVariantIndex];
        const videoUrl = buildVideoUrl(newSign.id, newSign.word);
        console.log('VideoGrid: Genererad videolänk:', videoUrl, 'id:', newSign.id, 'word:', newSign.word);
        videoPlayer.src = videoUrl;
        updateVariantCounter();
        videoPlayer.play().catch(e => console.warn("Variant play failed:", e));
        // Save current variant index in cardIdDataMap so feedback uses correct sign
        const cardData = appState.cardIdDataMap.get(cardId);
        if (cardData) {
            cardData.currentVariantIndex = currentVariantIndex;
            cardData.currentSign = newSign;
        }
    };
    
    if (signs.length > 1) {
        // Container for variant controls
        variantContainer = document.createElement('div');
        variantContainer.className = 'absolute top-0 left-0 flex items-center gap-0 rounded bg-black/50 px-0.5 py-0 z-50';
        variantContainer.style.pointerEvents = 'auto';
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'variant-nav-btn text-white font-bold rounded hover:bg-white/30 transition-colors';
        prevBtn.textContent = '◀';
        prevBtn.style.fontSize = '9px';
        prevBtn.style.padding = '2px 3px';
        prevBtn.style.pointerEvents = 'auto';
        prevBtn.style.cursor = 'pointer';
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            switchVariant('prev');
        });
        variantContainer.appendChild(prevBtn);
        
        // Counter badge
        variantCounter = document.createElement('div');
        if (isCompound) {
            variantCounter.textContent = `🔗1/${signs.length}`;
        } else {
            variantCounter.textContent = `1/${signs.length}`;
        }
        variantCounter.className = 'text-white font-semibold leading-tight select-none';
        variantCounter.style.fontSize = '9px';
        variantCounter.style.padding = '2px 4px';
        variantCounter.style.minWidth = '20px';
        variantCounter.style.textAlign = 'center';
        variantContainer.appendChild(variantCounter);
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'variant-nav-btn text-white font-bold rounded hover:bg-white/30 transition-colors';
        nextBtn.textContent = '▶';
        nextBtn.style.fontSize = '9px';
        nextBtn.style.padding = '2px 3px';
        nextBtn.style.pointerEvents = 'auto';
        nextBtn.style.cursor = 'pointer';
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            switchVariant('next');
        });
        variantContainer.appendChild(nextBtn);
        
        playerWrapper.appendChild(variantContainer);
    }
    // ------------------------------------
    
    // --- GENUINT TECKEN BADGE (top-right) ---
    if (wordData.isGenuine) {
        const genuineBadge = document.createElement('div');
        genuineBadge.className = 'genuine-sign-badge absolute top-0 right-0 z-50';
        genuineBadge.innerHTML = `
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
            </svg>
            <span>Genuint</span>
        `;
        genuineBadge.title = 'Genuint tecken - idiomatisk fras';
        playerWrapper.appendChild(genuineBadge);
    }
    // ------------------------------------

    // For compound words: play signs sequentially and update counter
    if (isCompound) {
        videoPlayer.addEventListener('ended', () => {
            currentVariantIndex++;
            if (currentVariantIndex < signs.length) {
                const nextSign = signs[currentVariantIndex];
                const videoUrl = buildVideoUrl(nextSign.id, nextSign.word);
                console.log('VideoGrid: Genererad videolänk:', videoUrl, 'id:', nextSign.id, 'word:', nextSign.word);
                videoPlayer.src = videoUrl;
                if (variantCounter) {
                    variantCounter.textContent = `🔗 ${currentVariantIndex + 1}/${signs.length}`;
                }
                videoPlayer.play().catch(e => console.warn("Compound play failed:", e));
            } else {
                // Loop back to first sign
                currentVariantIndex = 0;
                const videoUrl = buildVideoUrl(signs[0].id, signs[0].word);
                console.log('VideoGrid: Genererad videolänk:', videoUrl, 'id:', signs[0].id, 'word:', signs[0].word);
                videoPlayer.src = videoUrl;
                if (variantCounter) {
                    variantCounter.textContent = `🔗 1/${signs.length}`;
                }
                videoPlayer.play().catch(e => console.warn("Compound loop failed:", e));
            }
        });
    }

    // Hide loader when video metadata is loaded (shows first frame as thumbnail)
    const hideLoader = () => {
        loader.classList.add('opacity-0');
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 200);
    };
    
    // Use loadedmetadata to show first frame faster (thumbnail)
    videoPlayer.addEventListener('loadedmetadata', hideLoader);
    videoPlayer.addEventListener('loadeddata', hideLoader);
    videoPlayer.addEventListener('canplay', hideLoader);
    
    // Also hide on error to avoid stuck spinner (or maybe show error icon in future)
    videoPlayer.addEventListener('error', () => {
        loader.classList.add('hidden');
    });
    
    // Ensure video starts paused (shows as still image)
    videoPlayer.pause();


    cardContainer.onmouseover = () => {
        if (appState.isPlayingAll) return;
        
        // Ensure video src is set (lazy loading may not have triggered yet)
        if (!videoPlayer.src && videoPlayer.dataset.src) {
            videoPlayer.src = videoPlayer.dataset.src;
        }
        
        // Reset to first sign when hovering over compound word
        if (isCompound) {
            currentVariantIndex = 0;
            const videoUrl = buildVideoUrl(signs[0].id, signs[0].word);
            console.log('VideoGrid: Genererad videolänk:', videoUrl, 'id:', signs[0].id, 'word:', signs[0].word);
            videoPlayer.src = videoUrl;
            if (variantCounter) {
                variantCounter.textContent = `🔗 1/${signs.length}`;
            }
        } else if (signs && signs.length > 1) {
            // Reset to first variant for non-compound words too
            currentVariantIndex = 0;
            const videoUrl = buildVideoUrl(signs[0].id, signs[0].word);
            console.log('VideoGrid: Genererad videolänk:', videoUrl, 'id:', signs[0].id, 'word:', signs[0].word);
            videoPlayer.src = videoUrl;
            updateVariantCounter();
        }
        videoPlayer.play().catch(e => {
            if (e.name !== 'AbortError') console.warn("Hover-play was prevented:", e);
        });
    };
    cardContainer.onmouseout = () => {
        if (appState.isPlayingAll) return;
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
        // Reset to first sign
        if (isCompound) {
            currentVariantIndex = 0;
            const videoUrl = buildVideoUrl(signs[0].id, signs[0].word);
            console.log('VideoGrid: Genererad videolänk:', videoUrl, 'id:', signs[0].id, 'word:', signs[0].word);
            videoPlayer.src = videoUrl;
            if (variantCounter) {
                variantCounter.textContent = `🔗 1/${signs.length}`;
            }
        } else if (signs && signs.length > 1) {
            currentVariantIndex = 0;
            const videoUrl = buildVideoUrl(signs[0].id, signs[0].word);
            console.log('VideoGrid: Genererad videolänk:', videoUrl, 'id:', signs[0].id, 'word:', signs[0].word);
            videoPlayer.src = videoUrl;
            updateVariantCounter();
        }
    };

    const titleEl = document.createElement('p');
    titleEl.className = 'video-card-title';
    
    let displayText = '';

    if (displayMode === 'gloss') {
        // For the AI grid, prioritize the AI's gloss. Fallback to sign word.
        displayText = wordData.gloss || primarySign.word;
    } else {
        // For the top/original grid, use the original swedish word.
        displayText = fullOriginalPhrase;
    }
    
    titleEl.textContent = displayText.toUpperCase();
    
    // Append loader along with video
    playerWrapper.append(videoPlayer, loader, titleEl);

    // Only append action buttons if NOT an alphabet card
    if (!isAlphabetCard) {
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';
        
        const thumbUpBtn = document.createElement('button');
        thumbUpBtn.className = 'video-card-btn thumb-up-btn';
        thumbUpBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.364a1 1 0 00.942-.673l1.858-6.47A1.5 1.5 0 0014.28 8H11V5.167a2.5 2.5 0 00-5 0v5.166z" /></svg>`;
        thumbUpBtn.setAttribute('aria-label', 'Ge tumme upp');
        thumbUpBtn.dataset.tooltipText = 'Tumme upp';
        thumbUpBtn.onclick = (e) => { e.stopPropagation(); handleThumbUpClick(cardContainer); };

        const thumbDownBtn = document.createElement('button');
        thumbDownBtn.className = 'video-card-btn thumb-down-btn';
        thumbDownBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1H6.636a1 1 0 00-.942.673l-1.858 6.47A1.5 1.5 0 005.72 12H9v4.833a2.5 2.5 0 005 0V9.667z" /></svg>`;
        thumbDownBtn.setAttribute('aria-label', 'Ge tumme ner');
        thumbDownBtn.dataset.tooltipText = 'Tumme ner';
        thumbDownBtn.onclick = (e) => { e.stopPropagation(); handleThumbDownClick(cardContainer); };

        const changeBtn = document.createElement('button');
        changeBtn.className = 'video-card-btn change-btn';
        changeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg>`;
        changeBtn.setAttribute('aria-label', 'Förbättra tecken');
        changeBtn.dataset.tooltipText = 'Byt, föreslå, rapportera';
        changeBtn.onclick = (e) => { e.stopPropagation(); handleChangeClick(cardContainer); };

        actionButtons.append(thumbUpBtn, thumbDownBtn, changeBtn);
        cardContainer.append(playerWrapper, actionButtons);
    } else {
        // Alphabet cards: just player, no buttons
        cardContainer.append(playerWrapper);
    }

    if (isAlphabetCard) {
        appState.alphabetObserver?.observe(cardContainer);
    }
    return cardContainer;
}
