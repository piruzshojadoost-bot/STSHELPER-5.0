
import { WordMapEntry } from '../../types';

/**
 * Delar upp en lista av ordanalyser i meningar baserat på interpunktion.
 * @param wordMap Den platta listan av ordanalyser.
 * @returns En array av meningar (där varje mening är en array av ord).
 */
export function splitTextIntoSentences(wordMap: WordMapEntry[]): WordMapEntry[][] {
    const sentences: WordMapEntry[][] = [];
    if (wordMap.length === 0) return sentences;
    
    let currentSentence: WordMapEntry[] = [];
    const SENTENCE_ENDERS = ['.', '!', '?', '...', '–', '—'];
    
    wordMap.forEach((wordData, index) => {
        // Skip line breaks - don't add them to sentences, just create breaks
        const trimmed = wordData.original.trim();
        if (trimmed === '' && wordData.original.includes('\n')) {
            // This is a line break, push current sentence if it has content
            if (currentSentence.length > 0 && currentSentence.some(token => token.isWord)) {
                sentences.push(currentSentence);
            }
            currentSentence = [];
            return;
        }
        
        currentSentence.push(wordData);
        
        // Check if this ends a sentence
        const isSentenceEnd = SENTENCE_ENDERS.some(ender => trimmed.endsWith(ender));
        
        if (isSentenceEnd) {
            // Only push if sentence contains actual words
            if (currentSentence.length > 0 && currentSentence.some(token => token.isWord)) {
                sentences.push(currentSentence);
            }
            currentSentence = [];
        }
    });
    
    // Add final sentence if it contains words
    if (currentSentence.length > 0 && currentSentence.some(token => token.isWord)) {
        sentences.push(currentSentence);
    }
    
    return sentences;
}
