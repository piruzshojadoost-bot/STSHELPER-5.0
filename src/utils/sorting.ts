
import { Sign } from '../types';
import { learnedPreferences } from '../state';

export function reorderSignsWithPreferences(signs: Sign[], lookupKey: string): Sign[] {
    if (!signs || signs.length <= 1) return signs;
    const preferences = learnedPreferences.get(lookupKey);
    if (!preferences) return signs;
    
    return [...signs].sort((a, b) => {
        const scoreA = preferences.get(a.id) || 0;
        const scoreB = preferences.get(b.id) || 0;
        return scoreB - scoreA;
    });
}
