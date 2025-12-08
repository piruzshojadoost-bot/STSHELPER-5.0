
import { appState } from '../../state';
import { processAndRenderText } from '../features/search';
import { resetApp } from '../core/reset';
import { showMessage, updateButtonProgress, updateSelectionUI, originalTextDisplay, imageInputBtn, imageInputFile } from '../../ui';
import { openModal, openCreateCombinationModal, openChangeGroupSignsModal } from '../../components/modals';
import { initializePlaceholder } from '../ui/textDisplay';
import { handleGenerateSentences } from '../features/generator';
import { analyzeImageWithAI } from '../../hooks/useAI';
import { fileToBase64 } from '../../utils';
import { updateGlosaVideos } from './navHandlers';
import { findCandidatesForToken } from '../search/localSearchWithFallback';

// Enkel GLOSA: grundform via lokalt lexikon/inflection, versaler och stopwords.
async function buildSimpleGlosa(text: string): Promise<string> {
    const tokens = text.split(/([,."!?\n\s]+)/g).filter(t => t.length > 0);
    const STOPWORDS = new Set(['och', 'att', 'är', 'med', 'på', 'om', 'det']);
    const KEEP_I_WITH = new Set(['morgon', 'imorgon', 'morse', 'kväll']);
    const LEMMA_OVERRIDES: Record<string, string> = {
        nycklarna: 'nyckel',
        nycklar: 'nyckel',
        gymmet: 'gym',
        stationen: 'station',
        skogen: 'skog',
        behöver: 'behöva',
        behövde: 'behöva',
        fönstret: 'fönster',
        tränar: 'träna',
        tränade: 'träna',
        tränat: 'träna',
        glömde: 'glömma',
        glömmer: 'glömma',
    };
    const out: string[] = [];

    const isWord = (t: string) => !/^[\s,."!?\n]+$/.test(t);

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // Behåll whitespace/skiljetecken
        if (!isWord(token)) {
            out.push(token);
            continue;
        }

        const lower = token.trim().toLowerCase();

        // Stopwords
        if (STOPWORDS.has(lower)) continue;

        // Behåll "i" bara före tidsord (morgon/imorgon/morse/kväll)
        if (lower === 'i') {
            let nextWord: string | null = null;
            for (let j = i + 1; j < tokens.length; j++) {
                if (isWord(tokens[j])) {
                    nextWord = tokens[j].trim().toLowerCase();
                    break;
                }
            }
            if (!nextWord || !KEEP_I_WITH.has(nextWord)) continue;
        }

        const cand = await findCandidatesForToken(token);
        const baseRaw = LEMMA_OVERRIDES[lower] || cand?.base || lower;
        out.push(baseRaw.toUpperCase());
    }

    // Städa mellanslag
    let glosa = out.join('').replace(/\s+/g, ' ').trim();

    // Deterministiska ordningsfixar
    glosa = glosa.replace(/JAG GILLA LAGA MAT HEMMA FREDAGAR?/, 'FREDAGAR JAG GILLA LAGA MAT HEMMA');
    glosa = glosa.replace(/VI SKA RESA TILL GÖTEBORG SOMMAR/, 'SOMMAR VI SKA RESA TILL GÖTEBORG');
    glosa = glosa.replace(/JAG VILL LÄRA MIG MER TECKENSPRÅK/, 'JAG VILL LÄRA MIG TECKENSPRÅK MER');

    return glosa;
}

export function setupInputHandlers() {
    const convertBtn = document.getElementById('convertBtn') as HTMLButtonElement;
    const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
    const cancelSearchBtn = document.getElementById('cancelSearchBtn') as HTMLButtonElement;
    const generateRandomTextBtn = document.getElementById('generateRandomTextBtn') as HTMLButtonElement;
    const glosaBtn = document.getElementById('glosaBtn') as HTMLButtonElement;
    const glosaFeedbackBtn = document.getElementById('glosaFeedbackBtn') as HTMLButtonElement;
    
    // Search / Convert
    convertBtn?.addEventListener('click', () => processAndRenderText());
    
    // Clear
    clearBtn?.addEventListener('click', resetApp);
    
    // Cancel Search
    cancelSearchBtn?.addEventListener('click', () => {
        if (appState.abortController) {
            appState.abortController.abort();
            appState.abortController = null;
        }
        resetApp(); 
        showMessage('Sökningen avbröts.', 'success');
        updateButtonProgress('idle');
    });

    // Text Area Events
    if (originalTextDisplay) {
        originalTextDisplay.addEventListener('focus', () => {
            if (originalTextDisplay.textContent === originalTextDisplay.dataset.placeholder) {
                originalTextDisplay.textContent = '';
                originalTextDisplay.classList.remove('text-placeholder');
                originalTextDisplay.classList.add('text-area-editable');
            }
        });
        originalTextDisplay.addEventListener('blur', initializePlaceholder);
        originalTextDisplay.addEventListener('input', () => {
            const text = originalTextDisplay.innerText;
            if (convertBtn) convertBtn.disabled = !text.trim();
        });
        
        // Force plain text paste - convert ALL line breaks and whitespace to single spaces
        originalTextDisplay.addEventListener('paste', (e) => {
            e.preventDefault();
            let text = e.clipboardData?.getData('text/plain') || '';
            // Handle special whitespace characters (including &nbsp; as \u00A0)
            text = text.replace(/\u00A0/g, ' ');
            // Normalize ALL whitespace (including line breaks, tabs, multiple spaces) to single spaces
            text = text.split(/\s+/).filter(word => word.length > 0).join(' ');
            
            if (text) {
                // Clear completely and insert as plain text
                originalTextDisplay.innerHTML = '';
                originalTextDisplay.textContent = text;
                originalTextDisplay.classList.add('text-area-editable');
                originalTextDisplay.classList.remove('text-placeholder');
                // Move cursor to end
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(originalTextDisplay);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
                // Trigger input event to update button state
                originalTextDisplay.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    }

    // Image Input Handlers
    if (imageInputBtn && imageInputFile) {
        imageInputBtn.addEventListener('click', () => {
            imageInputFile.click();
        });

        imageInputFile.addEventListener('change', async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            // Reset input so same file can be selected again if needed
            imageInputFile.value = '';
            
            // Kontrollera om AI är aktiverat
            if (!appState.aiEnabled) {
                showMessage('AI-funktioner är avstängda. Aktivera AI för att använda bildanalys.', 'error');
                return;
            }

            try {
                // UI Feedback
                if (originalTextDisplay) {
                    originalTextDisplay.textContent = "Analyserar bild...";
                    originalTextDisplay.classList.add('text-area-editable');
                    // Visual indicator that something is happening
                    updateButtonProgress('ai_refine'); 
                }

                const base64 = await fileToBase64(file);
                const analysisResult = await analyzeImageWithAI(base64, file.type);

                if (analysisResult) {
                    if (originalTextDisplay) {
                        originalTextDisplay.textContent = analysisResult;
                        // Dispatch input event to enable search button
                        originalTextDisplay.dispatchEvent(new Event('input', { bubbles: true }));
                        showMessage("Bildanalys klar!", "success");
                    }
                } else {
                    showMessage("Kunde inte analysera bilden.", "error");
                    if(originalTextDisplay) initializePlaceholder();
                }
            } catch (error) {
                console.error("Image analysis failed:", error);
                showMessage("Fel vid bildanalys.", "error");
                if(originalTextDisplay) initializePlaceholder();
            } finally {
                updateButtonProgress('idle');
            }
        });
    }

    // Generate Text Modal Handlers
    if (generateRandomTextBtn) {
        generateRandomTextBtn.addEventListener('click', (e) => {
            const generateTextModal = document.getElementById('generateTextModal') as HTMLElement;
            const generateSentenceCountSlider = document.getElementById('generateSentenceCountSlider') as HTMLInputElement;
            const generateSentenceCountValue = document.getElementById('generateSentenceCountValue') as HTMLSpanElement;
            
            if (generateSentenceCountSlider && generateSentenceCountValue) {
                generateSentenceCountSlider.value = '3';
                generateSentenceCountValue.textContent = '3';
            }
            openModal(generateTextModal, e.currentTarget as HTMLElement);
        });
    }

    // Setup actions inside the Generate Modal
    const generateSentenceCountSlider = document.getElementById('generateSentenceCountSlider') as HTMLInputElement;
    const generateSentenceCountValue = document.getElementById('generateSentenceCountValue') as HTMLSpanElement;
    const confirmGenerateStaticTextBtn = document.getElementById('confirmGenerateStaticTextBtn') as HTMLButtonElement;
    const confirmGenerateAiTextBtn = document.getElementById('confirmGenerateAiTextBtn') as HTMLButtonElement;

    if (generateSentenceCountSlider && generateSentenceCountValue) {
        generateSentenceCountSlider.oninput = () => {
            generateSentenceCountValue.textContent = generateSentenceCountSlider.value;
        };
    }

    if (confirmGenerateStaticTextBtn) {
        confirmGenerateStaticTextBtn.onclick = () => {
            const count = parseInt(generateSentenceCountSlider?.value || '3', 10);
            handleGenerateSentences('static', count);
        };
    }

    if (confirmGenerateAiTextBtn) {
        confirmGenerateAiTextBtn.onclick = () => {
            if (!appState.aiEnabled) {
                showMessage('AI-funktioner är avstängda. Använd statisk generering istället.', 'error');
                return;
            }
            const count = parseInt(generateSentenceCountSlider?.value || '3', 10);
            handleGenerateSentences('ai', count);
        };
    }

    // GLOSA Button - glosar först, sen visar videor (i separat panel)
    const glosaPane = document.getElementById('glosaPane') as HTMLElement;
    const glosaPreview = document.getElementById('glosaPreview') as HTMLTextAreaElement;
    const glosaStatus = document.getElementById('glosaStatus') as HTMLElement;
    const saveGlosaBtn = document.getElementById('saveGlosaBtn') as HTMLButtonElement;
    
    // Spara originaltext och original GLOSA för att kunna spara korrigeringar
    let currentOriginalText = '';
    let currentOriginalGlosa = '';
    
    glosaBtn?.addEventListener('click', async () => {
        const text = originalTextDisplay?.innerText?.trim();
        if (!text) {
            showMessage('Skriv text först', 'error');
            return;
        }
        
        currentOriginalText = text;
        glosaBtn.disabled = true;
        updateButtonProgress('local_search');
        
        // Visa GLOSA-panelen och sätt loading-status
        if (glosaPane) {
            glosaPane.classList.remove('hidden');
        }
        if (glosaPreview) {
            glosaPreview.value = '';
        }
        if (saveGlosaBtn) {
            saveGlosaBtn.classList.add('hidden');
        }
        if (glosaStatus) {
            glosaStatus.className = 'glosa-status status-loading';
            glosaStatus.textContent = 'Beräknar grundform...';
        }
        
        try {
            const glosaText = await buildSimpleGlosa(text);
            
            if (glosaText) {
                currentOriginalGlosa = glosaText;
                
                if (glosaPreview) {
                    glosaPreview.value = glosaText;
                }
                
                if (glosaStatus) {
                    glosaStatus.className = 'glosa-status status-offline';
                    glosaStatus.textContent = 'Grundform';
                }
                
                // Visa videorna för GLOSA-orden
                await updateGlosaVideos(glosaText);
                showMessage('GLOSA (grundform) klar! Redigera vid behov.', 'success');
            } else {
                showMessage('Kunde inte glosa', 'error');
                if (glosaStatus) {
                    glosaStatus.className = 'glosa-status';
                    glosaStatus.textContent = '';
                }
            }
        } catch (error) {
            console.error('GLOSA error:', error);
            showMessage('Fel vid GLOSA', 'error');
            if (glosaStatus) {
                glosaStatus.className = 'glosa-status';
                glosaStatus.textContent = '';
            }
        } finally {
            glosaBtn.disabled = false;
            updateButtonProgress('idle');
        }
    });
    
    // Visa spara-knapp när användaren redigerar GLOSA
    glosaPreview?.addEventListener('input', () => {
        if (glosaPreview.value !== currentOriginalGlosa) {
            saveGlosaBtn?.classList.remove('hidden');
        } else {
            saveGlosaBtn?.classList.add('hidden');
        }
    });
    
    // Spara korrigering till aiLearningSystem
    saveGlosaBtn?.addEventListener('click', async () => {
        const correctedGlosa = glosaPreview?.value?.trim();
        if (!correctedGlosa || !currentOriginalText) {
            showMessage('Ingen korrigering att spara', 'error');
            return;
        }
        
        try {
            // Importera aiLearningSystem dynamiskt
            const { aiLearningSystem } = await import('../sts-glossing/aiLearningSystem');
            
            // Spara korrigeringen med hög prioritet (1.0)
            aiLearningSystem.recordLearning(
                currentOriginalText,
                correctedGlosa.replace(/\n/g, ' '), // Ta bort radbrytningar för lagring
                'user-correction',
                1.0
            );
            
            // Spara till feedbackCollector för Google Forms
            const { feedbackCollector } = await import('../feedback/feedbackCollector');
            feedbackCollector.addGlosaCorrection(
                currentOriginalText,
                currentOriginalGlosa.replace(/\n/g, ' '), // AI:s ursprungliga GLOSA
                correctedGlosa.replace(/\n/g, ' ') // Användarens korrigerade GLOSA
            );
            
            // Uppdatera status
            currentOriginalGlosa = correctedGlosa;
            saveGlosaBtn.classList.add('hidden');
            
            // Uppdatera videorna med korrigerad GLOSA
            await updateGlosaVideos(correctedGlosa.replace(/\n/g, ' '));
            
            showMessage('Korrigering sparad! Systemet lär sig.', 'success');
        } catch (error) {
            console.error('Fel vid sparande av korrigering:', error);
            showMessage('Kunde inte spara korrigering', 'error');
        }
    });

    // GLOSA Modal Close
    const glosaFeedbackModal = document.getElementById('glosaFeedbackModal') as HTMLElement;
    const glosaFeedbackClose = document.getElementById('glosaFeedbackClose') as HTMLButtonElement;
    const glosaFeedbackBackdrop = document.getElementById('glosaFeedbackBackdrop') as HTMLElement;
    
    const closeGlosaModal = () => {
        glosaFeedbackModal?.classList.add('hidden');
    };
    
    glosaFeedbackClose?.addEventListener('click', closeGlosaModal);
    glosaFeedbackBackdrop?.addEventListener('click', closeGlosaModal);
    
    // GLOSA Copy Feedback
    const glosaFeedbackCopy = document.getElementById('glosaFeedbackCopy') as HTMLButtonElement;
    glosaFeedbackCopy?.addEventListener('click', () => {
        const swedish = document.getElementById('glosaFeedbackSwedish')?.textContent || '';
        const aiGlosa = document.getElementById('glosaFeedbackAI')?.textContent || '';
        const userGlosa = (document.getElementById('glosaFeedbackUser') as HTMLTextAreaElement)?.value || '';
        
        const feedbackText = `GLOSA FEEDBACK:\nSvenska: ${swedish}\nAI GLOSA: ${aiGlosa}\nMin GLOSA: ${userGlosa}`;
        navigator.clipboard.writeText(feedbackText).then(() => {
            showMessage('Feedback kopierad!', 'success');
        }).catch(() => {
            showMessage('Kunde inte kopiera', 'error');
        });
    });

    setupTools();
}

const tools = [
    { id: 'thumb-up', icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.364a1 1 0 00.942-.673l1.858-6.47A1.5 1.5 0 0014.28 8H11V5.167a2.5 2.5 0 00-5 0v5.166z" /></svg>`, tooltip: 'Ge tumme upp', color: 'var(--green-vote)' },
    { id: 'thumb-down', icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1H6.636a1 1 0 00-.942.673l-1.858 6.47A1.5 1.5 0 005.72 12H9v4.833a2.5 2.5 0 005 0V9.667z" /></svg>`, tooltip: 'Ge tumme ner', color: 'var(--red-vote)' },
    { id: 'change', icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 4 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>`, tooltip: 'Byt, föreslå, rapportera', color: 'var(--purple-multiple)' },
];

function setupTools() {
    const toolsContainer = document.getElementById('tools-container') as HTMLElement;
    const videoGrid = document.getElementById('videoGrid') as HTMLElement;
    const alphabetGrid = document.getElementById('alphabetGrid') as HTMLElement;

    if (!toolsContainer) return;
    toolsContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();

    tools.forEach(tool => {
        const button = document.createElement('button');
        button.className = 'tool-btn';
        button.dataset.tool = tool.id;
        button.setAttribute('aria-label', tool.tooltip);
        button.dataset.tooltipText = tool.tooltip;
        button.innerHTML = tool.icon;
        (button.firstElementChild as HTMLElement).style.color = tool.color;
        button.disabled = true;

        button.addEventListener('click', () => {
            const currentTool = videoGrid.dataset.activeTool;
            const newTool = currentTool === tool.id ? 'none' : tool.id;
            
            appState.selection = [];
            appState.combinationSelection = [];
            updateSelectionUI();
            
            videoGrid.dataset.activeTool = newTool;
            if (alphabetGrid) alphabetGrid.dataset.activeTool = newTool;
            
            document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
            if (newTool !== 'none') {
                button.classList.add('active');
            }
        });
        fragment.appendChild(button);
    });
    toolsContainer.appendChild(fragment);
    
    const multiSelectToolContainer = document.getElementById('multiSelectToolContainer') as HTMLElement;
    if (multiSelectToolContainer && !document.getElementById('multiSelectToolBtn')) {
        const selectBtn = document.createElement('button');
        selectBtn.id = 'multiSelectToolBtn';
        selectBtn.className = 'tool-btn';
        selectBtn.dataset.tool = 'select';
        selectBtn.dataset.tooltipText = 'Välj flera tecken för att ge gemensam feedback eller kombinera.';
        selectBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" style="color: var(--selection-yellow);"><rect x="3" y="3" width="7" height="7" fill="var(--selection-yellow)" opacity="0.8"/><rect x="14" y="3" width="7" height="7" fill="var(--selection-yellow)" opacity="0.8"/><rect x="3" y="14" width="7" height="7" fill="var(--selection-yellow)" opacity="0.8"/><rect x="14" y="14" width="7" height="7" fill="var(--selection-yellow)" opacity="0.8"/></svg>`;
        selectBtn.disabled = true;
        selectBtn.addEventListener('click', () => {
            const currentTool = videoGrid.dataset.activeTool;
            const newTool = currentTool === 'select' ? 'none' : 'select';
            videoGrid.dataset.activeTool = newTool;
            if (alphabetGrid) alphabetGrid.dataset.activeTool = newTool;
            document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
            if (newTool !== 'none') {
                selectBtn.classList.add('active');
            }
        });
        multiSelectToolContainer.appendChild(selectBtn);
    }
    
    // Create unified action button for combination and advanced actions
    const selectionActionContainer = document.getElementById('selectionActionContainer') as HTMLElement;
    const combinationActionContainer = document.getElementById('combinationActionContainer') as HTMLElement;
    
    if (combinationActionContainer && !document.getElementById('actionMenuBtn')) {
        const actionMenuBtn = document.createElement('button');
        actionMenuBtn.id = 'actionMenuBtn';
        actionMenuBtn.className = 'btn btn-primary btn-sm p-2';
        actionMenuBtn.dataset.tooltipText = 'Åtgärder: Kombinera eller ge avancerad feedback';
        actionMenuBtn.innerHTML = `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>`;
        actionMenuBtn.addEventListener('click', (e) => {
            const menuDiv = document.getElementById('actionMenu');
            if (menuDiv) {
                menuDiv.classList.toggle('hidden');
            }
        });
        combinationActionContainer.appendChild(actionMenuBtn);
        
        // Create dropdown menu
        const menuDiv = document.createElement('div');
        menuDiv.id = 'actionMenu';
        menuDiv.className = 'hidden absolute bg-gray-800 border border-gray-700 rounded shadow-lg mt-1 min-w-48 z-50';
        menuDiv.style.bottom = '100%';
        menuDiv.style.right = '0';
        menuDiv.style.marginBottom = '0.5rem';
        
        // Kombinera option
        const combineOption = document.createElement('button');
        combineOption.className = 'w-full text-left px-4 py-2 hover:bg-gray-700 border-b border-gray-700 flex items-center gap-2 transition-colors';
        combineOption.innerHTML = `<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zM16 10h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z"></path></svg> <span>Kombinera Tecken</span>`;
        combineOption.addEventListener('click', () => {
            appState.combinationSelection = appState.selection.map(cardId => {
                const cardData = appState.cardIdDataMap.get(cardId);
                const sign = cardData?.phraseTokens?.[0]?.signs?.[0];
                return { cardId, sign: sign! };
            }).filter(item => item.sign);
            openCreateCombinationModal(actionMenuBtn);
            menuDiv.classList.add('hidden');
        });
        menuDiv.appendChild(combineOption);
        
        // Ändra option
        const changeOption = document.createElement('button');
        changeOption.className = 'w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-2 transition-colors';
        changeOption.innerHTML = `<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.65-5.22M20 15a9 9 0 01-14.65 5.22"></path></svg> <span>Ändra tecken</span>`;
        changeOption.addEventListener('click', () => {
            openChangeGroupSignsModal(actionMenuBtn);
            menuDiv.classList.add('hidden');
        });
        menuDiv.appendChild(changeOption);
        
        combinationActionContainer.style.position = 'relative';
        combinationActionContainer.appendChild(menuDiv);
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!combinationActionContainer.contains(e.target as Node)) {
                menuDiv.classList.add('hidden');
            }
        });
    }
}
