
import { WordMapEntry } from '../types';
import { fullLexiconMap } from '../state';

export async function ensureWordDataEnriched(wordData: WordMapEntry): Promise<void> {
    // If already enriched, or not a word, or no signs, we consider it "done" for display purposes.
    // BUT, if we have signs and fullLexiconMap is EMPTY, we should NOT mark it as enriched.
    // This allows the modal to retry enrichment later when the map is populated.
    
    if (wordData.isEnriched) return;
    
    if (!wordData.isWord || !wordData.signs || wordData.signs.length === 0) {
        wordData.isEnriched = true;
        return;
    }
    
    if (fullLexiconMap.size === 0) {
        // Database not loaded yet. Do not mark as enriched.
        // Return early to allow retry.
        return;
    }
    
    const baseWord = wordData.base.toLowerCase();
    const fullLexiconEntries = fullLexiconMap.get(baseWord);
    
    if (fullLexiconEntries) {
        const primarySignId = String(wordData.signs[0].id);
        
        // Försök hitta exakt matchning, eller matchning där vi ignorerar ledande nollor
        const fullEntry = fullLexiconEntries.find(entry => {
             const entryId = String(entry.id);
             
             // 1. Exakt strängmatchning
             if (entryId === primarySignId) {
                 return true;
             }
             
             // 2. Numerisk matchning
             const numEntry = Number(entryId);
             const numPrimary = Number(primarySignId);
             
             if (!isNaN(numEntry) && !isNaN(numPrimary)) {
                 return numEntry === numPrimary;
             }
             
             return false;
        });
        
        if (fullEntry) {
            wordData.examples = fullEntry.examples;
            wordData.related = fullEntry.related;
            wordData.gloss = fullEntry.gloss;
        }
    }
    wordData.isEnriched = true;
}

export async function enrichWordMapDataInBackground(wordMap: WordMapEntry[]) {
    // This runs without being awaited to not block the UI
    if (fullLexiconMap.size === 0) {
        // Can't enrich yet.
        return;
    }

    for (const wordData of wordMap) {
        if(wordData.isWord && wordData.signs && wordData.signs.length > 0) {
           await ensureWordDataEnriched(wordData);
        }
    }
}
