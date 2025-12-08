
export function markdownToHtml(text: string): string {
    let safeText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&quot;").replace(/'/g, "&#039;");
    
    // Handle Bold
    safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle Code Blocks with Copy Button
    safeText = safeText.replace(/```(json)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
        return `
        <div class="code-block-wrapper">
            <div class="code-block-header">
                <button class="code-copy-btn" onclick="/* Event listener handled globally */">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Kopiera
                </button>
            </div>
            <code class="chat-code-block">${code}</code>
        </div>`;
    });
    
    // Handle Inline Code
    safeText = safeText.replace(/`([^`]+)`/g, '<code class="bg-gray-700 text-purple-300 px-1 py-0.5 rounded">$1</code>');

    // Handle Newlines
    safeText = safeText.replace(/\n/g, '<br>');

    return safeText;
}
