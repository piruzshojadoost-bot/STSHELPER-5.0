
export const LEXICON_ORD_URL = "https://teckensprakslexikon.su.se/ord/";
export const LEXICON_SEARCH_URL = "https://teckensprakslexikon.su.se/?q=";

export function getLexiconUrl(type: 'ord' | 'search', value: string): string {
    if (type === 'ord') {
        let cleanId = value;
        // Pad ID to 5 digits if it is numeric to match lexicon URL structure
        if (/^\d+$/.test(cleanId)) {
            cleanId = cleanId.padStart(5, '0');
        }
        return `${LEXICON_ORD_URL}${cleanId}/`;
    }
    if (type === 'search') {
        return `${LEXICON_SEARCH_URL}${encodeURIComponent(value)}`;
    }
    return '';
}
