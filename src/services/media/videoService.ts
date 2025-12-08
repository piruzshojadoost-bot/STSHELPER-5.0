
import { localVideoMap, fullLexiconMap } from '../../state';

export const VIDEO_BASE_URL = "https://teckensprakslexikon.su.se/movies/";

export function buildVideoUrl(
    videoId: string, 
    baseWord: string, 
    type: 'tecken' | 'example' | 'related' = 'tecken', 
    phraseNumber?: number, 
    forceHyphens?: boolean,
    keepSwedishChars: boolean = false 
): string {
    if (videoId.startsWith('local-video-')) {
        return localVideoMap.get(videoId) || '';
    }

    let cleanId = videoId;
    if (/^\d+$/.test(videoId)) {
        cleanId = cleanId.padStart(5, '0');
    }

    const folder = cleanId.substring(0, 2);

    let wordForUrl = baseWord;
    if (baseWord.toLowerCase() === 'idag') {
        wordForUrl = 'i-dag';
    }
    
    let normalizedForDictionary = wordForUrl.toLowerCase();
    
    // Only replace Swedish chars if we are NOT keeping them
    if (!keepSwedishChars) {
        normalizedForDictionary = normalizedForDictionary
            .replace(/å|ä/g, 'a')
            .replace(/ö/g, 'o');
    }

    let normalizedWord;

    // Strict URL construction based on forceHyphens flag
    if (forceHyphens === true) {
        // Force hyphens: replace spaces with hyphens
        normalizedWord = encodeURIComponent(normalizedForDictionary.replace(/\s+/g, '-'));
    } else if (forceHyphens === false) {
        // Force concatenated: remove spaces and hyphens
        normalizedWord = encodeURIComponent(normalizedForDictionary.replace(/[\s-]+/g, ''));
    } else {
        // Default behavior if not specified
        if (type === 'example' || type === 'related') {
             // For examples, default is usually concatenated in the wild, but inconsistent.
             // We default to concatenated here, but playVideo will retry.
             normalizedWord = encodeURIComponent(normalizedForDictionary.replace(/\s+/g, ''));
        } else {
            // For main signs
            const wordParts = normalizedForDictionary.split(/\s+/).filter(p => p);
            if (wordParts.length > 2) {
                normalizedWord = encodeURIComponent(wordParts.join(''));
            } else if (wordParts.length === 2) {
                normalizedWord = encodeURIComponent(wordParts.join('-'));
            } else {
                normalizedWord = encodeURIComponent(normalizedForDictionary);
            }
        }
    }
    
    const resolutionPath = '180x180/';
    
    let finalUrl: string;
    if ((type === 'example' || type === 'related') && phraseNumber) {
        finalUrl = `${VIDEO_BASE_URL}${folder}/${normalizedWord}-${cleanId}-fras-${phraseNumber}.mp4`;
    } else {
        finalUrl = `${VIDEO_BASE_URL}${folder}/${resolutionPath}${normalizedWord}-${cleanId}-tecken.mp4`;
    }
    
    return finalUrl;
}

export function playVideo(
    player: HTMLVideoElement, 
    errorEl: HTMLElement, 
    container: HTMLElement, 
    id: string, 
    word: string, 
    type: 'tecken' | 'example' | 'related' = 'tecken', 
    phraseNumber?: number,
    contextSentence?: string 
) {
    if (!player || !errorEl || !container) return;
    container.classList.remove('hidden');
    errorEl.classList.add('hidden');
    player.classList.remove('hidden');

    // Prepare candidate URLs
    const candidates = new Set<string>();

    // Helper to add variations
    const addVariants = (keepSwedish: boolean) => {
         // Default logic
         candidates.add(buildVideoUrl(id, word, type, phraseNumber, undefined, keepSwedish));
         // Force hyphens
         candidates.add(buildVideoUrl(id, word, type, phraseNumber, true, keepSwedish));
         // Force concatenated
         candidates.add(buildVideoUrl(id, word, type, phraseNumber, false, keepSwedish));
    };

    // Try normalized first (usually correct for main signs)
    addVariants(false);
    // Try keeping Swedish chars (sometimes correct, especially for examples)
    addVariants(true);
    
    const urlsToTry = Array.from(candidates);
    let currentUrlIndex = 0;

    // Function to attempt rescue search in full lexicon
    const attemptRescue = (): { id: string, word: string, phraseNumber?: number } | null => {
        if (!contextSentence) return null;
        console.log(`Försöker hitta räddningsvideo för mening: "${contextSentence}"`);
        
        for (const [lexiconWord, entries] of fullLexiconMap.entries()) {
            for (const entry of entries) {
                 if (entry.examples) {
                     // Exact match for sentence
                     const match = entry.examples.find((ex: any) => ex.sentence && ex.sentence.trim() === contextSentence.trim());
                     if (match) {
                         console.log(`Hittade matchande mening under ordet: "${entry.word}" (ID: ${entry.id})`);
                         return { id: entry.id, word: entry.word, phraseNumber: match.phraseNumber };
                     }
                     
                     // Fallback: partial match (first few words) if exact doesn't work
                     const sentenceStart = contextSentence.trim().split(' ').slice(0, 3).join(' ');
                     const partialMatch = entry.examples.find((ex: any) => 
                         ex.sentence && ex.sentence.trim().startsWith(sentenceStart) && sentenceStart.length > 5
                     );
                     if (partialMatch) {
                         console.log(`Hittade delvis matchande mening under ordet: "${entry.word}" (ID: ${entry.id})`);
                         return { id: entry.id, word: entry.word, phraseNumber: partialMatch.phraseNumber };
                     }
                 }
            }
        }
        return null;
    };

    // Error handler that iterates through candidates
    player.onerror = () => {
        currentUrlIndex++;
        
        if (currentUrlIndex < urlsToTry.length) {
            console.warn(`Video URL misslyckades: ${player.src}. Testar alternativ: ${urlsToTry[currentUrlIndex]}`);
            player.src = urlsToTry[currentUrlIndex];
        } else {
            // All standard candidates failed. Try rescue if applicable.
            // Only try rescue once per play request to avoid loops.
            if ((type === 'example' || type === 'related') && contextSentence && !player.dataset.rescueAttempted) {
                player.dataset.rescueAttempted = "true";
                const rescueMatch = attemptRescue();
                if (rescueMatch) {
                     const newPhraseNumber = rescueMatch.phraseNumber || phraseNumber;
                     // For rescue, we also just try the default URL construction first
                     const rescueUrl = buildVideoUrl(rescueMatch.id, rescueMatch.word, type, newPhraseNumber);
                     console.warn(`Alla standard-URL:er misslyckades. Byter till räddnings-URL: ${rescueUrl}`);
                     player.src = rescueUrl;
                     return;
                }
            }
            
            // If we reach here, everything failed.
            console.error(`Kunde inte spela video för "${word}". Testade: ${urlsToTry.join(', ')}`);
            player.classList.add('hidden');
            errorEl.classList.remove('hidden');
            errorEl.textContent = `Video saknas.`;
        }
    };

    // Start playing the first candidate
    delete player.dataset.rescueAttempted; // Clear previous rescue flag
    player.src = urlsToTry[0];
    player.load();
    player.play().catch(e => {
        if (e.name !== 'AbortError') {
            console.warn("Autoplay was prevented:", e);
        }
    });
}
