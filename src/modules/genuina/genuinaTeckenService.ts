// Genuina Tecken (Idiomatiska uttryck) service
// Laddar och matchar genuina tecken i svensk text

export interface GenuintTecken {
    tecken: string;
    id: string;
    synonymer: string[];
}

export interface PhraseMatch {
    phrase: string;
    startIndex: number;
    endIndex: number;
    teckenId: string;
    synonymer: string[];
}

class GenuinaTeckenService {
    private genuinaTecken: GenuintTecken[] = [];
    private loaded = false;
    private loading = false;

    async load(): Promise<void> {
        if (this.loaded || this.loading) return;
        
        this.loading = true;
        
        try {
            const response = await fetch('/data/genuina_tecken.json');
            if (!response.ok) {
                throw new Error(`Failed to load genuina tecken: ${response.status}`);
            }
            
            this.genuinaTecken = await response.json();
            
            // Sortera från längst till kortast för korrekt multi-word matching
            this.genuinaTecken.sort((a, b) => {
                const aWords = a.tecken.split(' ').length;
                const bWords = b.tecken.split(' ').length;
                if (aWords !== bWords) {
                    return bWords - aWords; // Längst först
                }
                return b.tecken.length - a.tecken.length;
            });
            
            this.loaded = true;
            console.log(`✨ Genuina tecken laddade: ${this.genuinaTecken.length} fraser`);
        } catch (error) {
            console.error('Fel vid laddning av genuina tecken:', error);
        } finally {
            this.loading = false;
        }
    }

    /**
     * Hitta alla genuina tecken i en text
     * Returnerar matches med position och metadata
     */
    findMatches(text: string): PhraseMatch[] {
        if (!this.loaded || !text) return [];

        const matches: PhraseMatch[] = [];
        const lowerText = text.toLowerCase();
        const usedRanges: Array<[number, number]> = [];

        // Kolla varje genuint tecken (sorterade från längst till kortast)
        for (const tecken of this.genuinaTecken) {
            const phrase = tecken.tecken.toLowerCase();
            let startIndex = 0;

            // Hitta alla förekomster av frasen
            while ((startIndex = lowerText.indexOf(phrase, startIndex)) !== -1) {
                const endIndex = startIndex + phrase.length;

                // Kontrollera att matchningen är ett helt ord/fras
                const isValidMatch = this.isWholePhrase(text, startIndex, endIndex);
                
                // Kontrollera att det inte överlappar med tidigare match
                const overlaps = usedRanges.some(([usedStart, usedEnd]) => {
                    return !(endIndex <= usedStart || startIndex >= usedEnd);
                });

                if (isValidMatch && !overlaps) {
                    matches.push({
                        phrase: text.substring(startIndex, endIndex),
                        startIndex,
                        endIndex,
                        teckenId: tecken.id,
                        synonymer: tecken.synonymer
                    });
                    usedRanges.push([startIndex, endIndex]);
                }

                startIndex = endIndex;
            }
        }

        // Sortera efter position i texten
        matches.sort((a, b) => a.startIndex - b.startIndex);
        
        return matches;
    }

    /**
     * Kontrollera att matchningen är en hel fras (inte del av annat ord)
     */
    private isWholePhrase(text: string, start: number, end: number): boolean {
        // Kontrollera början
        if (start > 0) {
            const charBefore = text[start - 1];
            if (/[a-zåäöA-ZÅÄÖ0-9]/.test(charBefore)) {
                return false; // Del av ett längre ord
            }
        }

        // Kontrollera slutet
        if (end < text.length) {
            const charAfter = text[end];
            if (/[a-zåäöA-ZÅÄÖ0-9]/.test(charAfter)) {
                return false; // Del av ett längre ord
            }
        }

        return true;
    }

    /**
     * Hitta genuint tecken från ID
     */
    findById(id: string): GenuintTecken | undefined {
        return this.genuinaTecken.find(t => t.id === id);
    }

    /**
     * Hitta genuint tecken från fras/text (exakt match, case-insensitive)
     */
    find(phrase: string): GenuintTecken | undefined {
        const lowerPhrase = phrase.toLowerCase().trim();
        return this.genuinaTecken.find(t => t.tecken.toLowerCase() === lowerPhrase);
    }

    /**
     * Sök genuina tecken (för modal)
     */
    search(query: string): GenuintTecken[] {
        if (!query.trim()) return this.genuinaTecken;

        const lowerQuery = query.toLowerCase();
        return this.genuinaTecken.filter(t => {
            // Matcha på tecken eller synonymer
            if (t.tecken.toLowerCase().includes(lowerQuery)) return true;
            return t.synonymer.some(syn => syn.toLowerCase().includes(lowerQuery));
        });
    }

    /**
     * Returnera alla genuina tecken
     */
    getAll(): GenuintTecken[] {
        return this.genuinaTecken;
    }

    isLoaded(): boolean {
        return this.loaded;
    }
}

// Singleton instance
export const genuinaTeckenService = new GenuinaTeckenService();
