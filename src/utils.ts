
import { searchableLexicon } from './state';

export async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}

/**
 * Calculates the Levenshtein distance between two strings.
 * @param a The first string.
 * @param b The second string.
 * @returns The Levenshtein distance.
 */
export function levenshtein(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

/**
 * Calculates Levenshtein distance but heavily penalizes substitutions between Swedish and non-accented vowels
 * to prevent incorrect fuzzy matches like "göra" -> "gora".
 * @param a The first string.
 * @param b The second string.
 * @returns The "safe" Levenshtein distance, or 99 if a forbidden substitution is likely.
 */
export function safeDistance(a: string, b: string): number {
    // Om å/ä/ö ändras → returnera stort värde (förbjudet)
    const forbidden: [string, string][] = [
        ["å","a"], ["a","å"],
        ["ä","a"], ["a","ä"],
        ["ö","o"], ["o","ö"],
        ["ä","e"], ["e","ä"],
        ["ö","e"], ["e","ö"]
    ];

    const getCharCounts = (str: string, char: string) => (str.match(new RegExp(char, 'g')) || []).length;
    
    for (const [x, y] of forbidden) {
        const countX_a = getCharCounts(a, x);
        const countY_a = getCharCounts(a, y);
        const countX_b = getCharCounts(b, x);
        const countY_b = getCharCounts(b, y);

        if ((countX_a > countX_b && countY_b > countY_a) || (countX_b > countX_a && countY_a > countY_b)) {
            return 99;
        }
    }

    return levenshtein(a, b);
}


/**
 * Gets sorted search results for lexicon autocomplete.
 * Uses a simple, case-insensitive prefix search.
 * @param query The search query.
 * @param maxResults The maximum number of results to return.
 * @returns A sorted array of matching words.
 */
export function getSortedSearchResults(query: string, maxResults: number = 20): string[] {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) {
        return [];
    }
    const results = searchableLexicon.filter(word => word.startsWith(lowerQuery));
    return results.slice(0, maxResults);
}
