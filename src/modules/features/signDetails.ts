
import { appState, idToWordMap } from '../../state';
import { WordMapEntry, Example, RelatedSignInfo, Sign } from '../../types';
import { getLexiconUrl, buildVideoUrl, playVideo, ICON_LOADING_SVG } from '../../ui';
import { openModal } from '../../components/modals/ModalSystem';
import { ensureFullLexiconLoaded } from '../../hooks/useLexicon';
import { ensureWordDataEnriched } from '../../hooks/useDataEnrichment';
import { delay } from '../../utils';

export async function openSignDetailsModal(wordData: WordMapEntry, openerElement?: HTMLElement | null): Promise<void> {
    const modal = document.getElementById('signDetailsModal') as HTMLElement;
    if (!modal) return;
    
    // Sätt context för feedback-funktioner
    appState.modalContexts.signDetailsContext = wordData;
    
    const titleEl = document.getElementById('signDetailsTitle') as HTMLElement;
    const videoPlayer = document.getElementById('signDetailsVideoPlayer') as HTMLVideoElement;
    const videoError = document.getElementById('signDetailsVideoError') as HTMLElement;
    const mainSignWord = document.getElementById('signDetailsMainSignWord') as HTMLElement;
    const mainSignId = document.getElementById('signDetailsMainSignId') as HTMLElement;
    const lexiconLink = document.getElementById('signDetailsLexiconLink') as HTMLAnchorElement;

    const glossContainer = document.getElementById('signDetailsGlossContainer') as HTMLElement;
    const glossEl = document.getElementById('signDetailsGloss') as HTMLElement;
    const korpusLink = document.getElementById('signDetailsKorpusLink') as HTMLAnchorElement;
    const extrasContainer = document.getElementById('signDetailsExtras') as HTMLElement;
    
    // Create or get the main video loader overlay
    let videoLoader = videoPlayer.parentElement?.querySelector('.video-loader') as HTMLElement;
    if (!videoLoader) {
        videoLoader = document.createElement('div');
        videoLoader.className = 'video-loader absolute inset-0 flex items-center justify-center bg-black/50 z-10 hidden pointer-events-none';
        videoLoader.innerHTML = ICON_LOADING_SVG;
        videoPlayer.parentElement?.appendChild(videoLoader);
    }
    
    // Helper to handle loading state for main video
    const playMainVideo = (id: string, word: string, type: 'tecken' | 'example' | 'related' = 'tecken', phraseNumber?: number, contextSentence?: string) => {
        videoLoader.classList.remove('hidden'); // Show loader
        videoError.classList.add('hidden');
        
        // Listen for load completion
        const onLoaded = () => {
            videoLoader.classList.add('hidden');
            videoPlayer.removeEventListener('canplay', onLoaded);
            videoPlayer.removeEventListener('loadeddata', onLoaded);
        };
        
        videoPlayer.addEventListener('canplay', onLoaded);
        videoPlayer.addEventListener('loadeddata', onLoaded);
        
        // Handle error to hide loader
        const onError = () => {
             videoLoader.classList.add('hidden');
             videoPlayer.removeEventListener('error', onError);
        };
        videoPlayer.addEventListener('error', onError);

        playVideo(videoPlayer, videoError, videoPlayer, id, word, type, phraseNumber, contextSentence);
    };

    extrasContainer.innerHTML = '';
    glossContainer.classList.add('hidden');
    korpusLink.classList.add('hidden');
    videoError.classList.add('hidden');
    videoPlayer.classList.remove('hidden');
    
    titleEl.textContent = `Information för "${wordData.original}"`;

    if (!wordData.signs || wordData.signs.length === 0) {
        mainSignWord.textContent = 'Inget tecken valt';
        mainSignId.textContent = '';
        lexiconLink.href = getLexiconUrl('search', wordData.base);
        videoPlayer.classList.add('hidden');
        videoError.classList.remove('hidden');
        videoError.textContent = 'Inget tecken är valt för detta ord.';
        extrasContainer.innerHTML = `<p class="text-sm text-gray-400">Du kan lämna feedback för ordet nedan.</p>`;
        
        openModal(modal, openerElement || document.activeElement as HTMLElement);
        await delay(150);
        return; 
    }

    const primarySign = wordData.signs[0];
    mainSignWord.textContent = primarySign.word;
    mainSignId.textContent = `ID: ${primarySign.id}`;
    lexiconLink.href = getLexiconUrl('ord', primarySign.id);

    playMainVideo(primarySign.id, primarySign.word);
    
    openModal(modal, openerElement || document.activeElement as HTMLElement);

    (async () => {
        const showLoading = () => {
             extrasContainer.innerHTML = `<div class="flex justify-center p-4 text-gray-400">${ICON_LOADING_SVG}<span class="ml-2">Hämtar exempel...</span></div>`;
        };

        if (!appState.fullLexiconLoaded) {
            showLoading();
        }

        const loadSuccess = await ensureFullLexiconLoaded((progress) => {
            appState.onlineLexiconProgress = progress;
        });
        
        if (!modal.classList.contains('show')) return;

        extrasContainer.innerHTML = ''; 
        
        if (!loadSuccess) {
            extrasContainer.innerHTML = `<p class="text-sm text-red-400">Kunde inte ladda ytterligare detaljer.</p>`;
            return;
        }

        await ensureWordDataEnriched(wordData);
        
        if (!modal.classList.contains('show')) return;

        if (wordData.gloss || (appState.lexiconMetadata?.korpusUrlPattern && primarySign.id)) {
            glossContainer.classList.remove('hidden');
            glossEl.textContent = wordData.gloss || 'Glosa är inte tillgänglig.';
            if (appState.lexiconMetadata?.korpusUrlPattern && primarySign.id) {
                korpusLink.href = appState.lexiconMetadata.korpusUrlPattern.replace('[id]', primarySign.id);
                korpusLink.classList.remove('hidden');
            }
        }

        const allExamples = [
            ...(wordData.examples || []).map(ex => ({ ...ex, type: 'example' as const })),
            ...(wordData.related || []).map(rel => ({ ...rel, type: 'related' as const }))
        ];

        if (allExamples.length > 0) {
            const header = document.createElement('h4');
            header.className = 'text-lg font-semibold mb-3';
            header.textContent = 'Exempel & Relaterat';
            extrasContainer.appendChild(header);

            const list = document.createElement('div');
            list.className = 'space-y-2';
            
            const itemsPerPage = 10;
            let currentPage = 0;
            
            const renderItems = (items: typeof allExamples) => {
                items.forEach(item => {
                    let word, id, type, phraseNum;
                    if (item.type === 'example') {
                        const ex = item as Example;
                        word = ex.word; id = ex.id; type = 'example'; phraseNum = ex.phraseNumber;
                    } else {
                        const rel = item as RelatedSignInfo;
                        id = rel.relatedId;
                        type = 'related';
                        phraseNum = rel.phraseNumber;
                        word = rel.relatedWord;
                        if (!word && id) {
                            const paddedId = id.toString().padStart(5, '0');
                            word = idToWordMap.get(paddedId);
                        }
                        if (!word) {
                            word = rel.originalWord;
                        }
                    }

                    const sentenceBtn = document.createElement('button');
                    sentenceBtn.className = 'w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-sm text-gray-300 hover:text-white transition-colors';
                    sentenceBtn.textContent = item.sentence || word;
                    sentenceBtn.onclick = () => {
                        if (item.sentence) {
                            mainSignWord.textContent = `"${item.sentence}"`;
                            mainSignId.textContent = `Tecken: ${word.toUpperCase()} | ID: ${id} (${type === 'example' ? 'Exempel' : 'Relaterat'})`;
                        } else {
                            mainSignWord.textContent = word;
                            mainSignId.textContent = `ID: ${id} (${type === 'example' ? 'Exempel' : 'Relaterat'})`;
                        }
                        playMainVideo(id, word, type as any, phraseNum, item.sentence);
                    };
                    list.appendChild(sentenceBtn);
                });
            };
            
            const firstPageItems = allExamples.slice(0, itemsPerPage);
            renderItems(firstPageItems);
            extrasContainer.appendChild(list);
            
            if (allExamples.length > itemsPerPage) {
                const showMoreBtn = document.createElement('button');
                showMoreBtn.className = 'mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors';
                showMoreBtn.textContent = `Visa fler (${allExamples.length - itemsPerPage} till)`;
                showMoreBtn.onclick = () => {
                    const nextPageItems = allExamples.slice((currentPage + 1) * itemsPerPage, (currentPage + 2) * itemsPerPage);
                    renderItems(nextPageItems);
                    currentPage++;
                    if ((currentPage + 1) * itemsPerPage >= allExamples.length) {
                        showMoreBtn.style.display = 'none';
                    } else {
                        showMoreBtn.textContent = `Visa fler (${allExamples.length - (currentPage + 1) * itemsPerPage} till)`;
                    }
                };
                extrasContainer.appendChild(showMoreBtn);
            }
        } else {
            extrasContainer.innerHTML += `<p class="text-sm text-gray-500 italic">Inga exempel hittades.</p>`;
        }

    })();
}
