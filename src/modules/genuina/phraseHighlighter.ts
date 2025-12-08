// Real-time phrase highlighting för genuina tecken

import { genuinaTeckenService, type PhraseMatch } from './genuinaTeckenService';

export class PhraseHighlighter {
    private container: HTMLElement;
    private lastText: string = '';
    private highlightTimeout: number | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    /**
     * Applicera highlights på text (debounced för prestanda)
     */
    highlight(immediate = false) {
        if (this.highlightTimeout) {
            clearTimeout(this.highlightTimeout);
        }

        const delay = immediate ? 0 : 300; // 300ms debounce
        this.highlightTimeout = window.setTimeout(() => {
            this.applyHighlights();
        }, delay);
    }

    /**
     * Applicera highlights direkt
     */
    private applyHighlights() {
        const text = this.container.textContent || '';
        
        // Ingen ändring = skippa
        if (text === this.lastText) return;
        this.lastText = text;

        // Inga genuina tecken laddade än
        if (!genuinaTeckenService.isLoaded()) return;

        // Hitta alla matches
        const matches = genuinaTeckenService.findMatches(text);
        
        if (matches.length === 0) {
            // Ta bort alla highlights om inga matches
            this.removeAllHighlights();
            return;
        }

        // Spara cursor position
        const selection = window.getSelection();
        const cursorOffset = this.getCursorOffset();

        // Applicera highlights genom att wrappa matchade fraser
        const highlightedHTML = this.wrapMatches(text, matches);
        this.container.innerHTML = highlightedHTML;

        // Återställ cursor position
        if (cursorOffset !== null) {
            this.restoreCursorOffset(cursorOffset);
        }
    }

    /**
     * Wrap matchade fraser med highlight markup
     */
    private wrapMatches(text: string, matches: PhraseMatch[]): string {
        let result = '';
        let lastIndex = 0;

        for (const match of matches) {
            // Lägg till text före matchen
            result += this.escapeHTML(text.substring(lastIndex, match.startIndex));
            
            // Lägg till highlightad fras
            const phraseText = this.escapeHTML(match.phrase);
            const synonymsText = match.synonymer.length > 0 ? 
                match.synonymer.join(', ') : 'Genuint tecken';
            
            result += `<mark class="genuine-phrase" data-tecken-id="${match.teckenId}" data-phrase="${this.escapeHTML(match.phrase)}" title="${this.escapeHTML(synonymsText)}">${phraseText}</mark>`;
            
            lastIndex = match.endIndex;
        }

        // Lägg till resten av texten
        result += this.escapeHTML(text.substring(lastIndex));

        return result;
    }

    /**
     * Ta bort alla highlights
     */
    private removeAllHighlights() {
        const marks = this.container.querySelectorAll('mark.genuine-phrase');
        marks.forEach(mark => {
            const text = document.createTextNode(mark.textContent || '');
            mark.parentNode?.replaceChild(text, mark);
        });
        
        // Normalisera text nodes
        this.container.normalize();
    }

    /**
     * Hämta cursor offset i text (för att återställa senare)
     */
    private getCursorOffset(): number | null {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(this.container);
        preCaretRange.setEnd(range.endContainer, range.endOffset);

        return preCaretRange.toString().length;
    }

    /**
     * Återställ cursor position från offset
     */
    private restoreCursorOffset(offset: number) {
        const selection = window.getSelection();
        if (!selection) return;

        const range = document.createRange();
        let currentOffset = 0;
        let found = false;

        const walk = (node: Node): boolean => {
            if (node.nodeType === Node.TEXT_NODE) {
                const textLength = node.textContent?.length || 0;
                if (currentOffset + textLength >= offset) {
                    range.setStart(node, offset - currentOffset);
                    range.collapse(true);
                    found = true;
                    return true;
                }
                currentOffset += textLength;
            } else {
                for (let i = 0; i < node.childNodes.length; i++) {
                    if (walk(node.childNodes[i])) return true;
                }
            }
            return false;
        };

        walk(this.container);

        if (found) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    /**
     * Escape HTML för säkerhet
     */
    private escapeHTML(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.highlightTimeout) {
            clearTimeout(this.highlightTimeout);
        }
    }
}
