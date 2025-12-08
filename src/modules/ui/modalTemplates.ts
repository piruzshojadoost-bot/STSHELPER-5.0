
export const MODAL_TEMPLATES = `
    <!-- AI Chat Modal with Tab System -->
    <div id="askAiAboutStsModal" class="modal">
        <div class="modal-content" style="max-width: 600px; height: 80vh; display: flex; flex-direction: column;">
            <!-- Header -->
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-2xl font-bold">Fråga AI om STS</h3>
                <button id="aiChatCloseBtn" class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            </div>

            <!-- Tabs Navigation -->
            <div class="flex border-b border-gray-700 mb-4">
                <button id="tabAiChat" class="px-4 py-2 font-semibold border-b-2 border-blue-500 text-blue-400 hover:text-white focus:outline-none transition-colors">
                    💬 Chatt
                </button>
                <button id="tabAiFeedback" class="px-4 py-2 font-semibold border-b-2 border-transparent text-gray-400 hover:text-white focus:outline-none transition-colors flex items-center gap-2">
                    💾 Spara & Inlärning
                    <span id="feedbackTabBadge" class="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full hidden">0</span>
                </button>
            </div>

            <!-- Tab 1: General Chat Content -->
            <div id="aiChatView" class="flex-1 flex flex-col" style="min-height: 0;">
                <div class="flex justify-between items-center mb-2 px-1">
                    <span class="text-xs font-bold text-gray-400">Historik</span>
                    <button id="clearChatHistoryBtn" class="text-xs text-red-400 hover:text-red-300 transition-colors underline">Rensa historik</button>
                </div>
                <div id="aiChatHistory" class="flex-1 overflow-y-auto p-4 bg-gray-900/50 rounded-lg mb-4 space-y-4">
                    <!-- Chat messages will be appended here -->
                </div>
                
                <div id="aiChatFilePreviewContainer" class="mb-2">
                    <!-- File preview will be shown here -->
                </div>

                <div id="aiChatSearchContainer" class="hidden flex-col bg-gray-800 p-3 rounded-lg mb-2 border border-gray-700">
                    <div class="flex justify-between items-center mb-2">
                         <span class="text-xs font-bold text-gray-400">Sök tecken att infoga</span>
                         <button id="aiChatCloseSearchBtn" class="text-gray-400 hover:text-white">&times;</button>
                    </div>
                    <input type="text" id="aiChatSearchInput" class="modal-input mb-2 text-sm" placeholder="Skriv ord...">
                    <div id="aiChatSearchResults" class="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto"></div>
                </div>

                <div class="flex items-end gap-2">
                     <button id="aiChatSearchToggleBtn" class="btn btn-secondary flex-shrink-0 p-2" data-tooltip-text="Sök tecken" aria-label="Sök tecken">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </button>
                    <textarea id="aiChatInput" class="feedback-textarea flex-1" placeholder="Ställ en fråga om teckenspråk..." rows="1" style="resize: none;"></textarea>
                    <input type="file" id="aiChatFileInput" class="hidden" accept=".txt,.pdf,.doc,.docx,image/*">
                    <button id="aiChatFileUploadBtn" class="btn btn-secondary flex-shrink-0 p-2" data-tooltip-text="Ladda upp fil (txt, pdf, doc, bild)" aria-label="Ladda upp fil">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                    </button>
                    <button id="aiChatSendBtn" class="btn btn-primary flex-shrink-0 p-2" data-tooltip-text="Skicka meddelande" aria-label="Skicka meddelande">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    </button>
                </div>
            </div>

            <!-- Tab 2: Feedback Chat Content -->
            <div id="aiFeedbackView" class="flex-1 flex flex-col hidden" style="min-height: 0;">
                <div class="flex-1 overflow-y-auto p-4 bg-gray-900/50 rounded-lg mb-4 space-y-4 relative">
                    <!-- A dedicated placeholder for feedback dialogue -->
                    <div id="aiFeedbackHistory" class="flex flex-col gap-4">
                         <!-- Messages injected by JS -->
                    </div>
                </div>
                <div class="flex items-end gap-2">
                     <button id="showJsonBtn" class="btn btn-secondary flex-shrink-0 px-3 py-2 text-xs" data-tooltip-text="Visa aktuell JSON">
                         <span class="font-mono">JSON</span>
                     </button>
                     <textarea id="aiFeedbackInput" class="feedback-textarea flex-1" placeholder="Svara 'Ja' eller 'Spara'..." rows="1" style="resize: none;"></textarea>
                     <button id="aiFeedbackSendBtn" class="btn btn-primary flex-shrink-0 p-2">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    </button>
                </div>
            </div>

        </div>
    </div>
    
    <!-- Settings Modal -->
    <div id="settingsModal" class="modal">
        <div class="modal-content" style="max-width: 500px;">
            <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            <h3 class="text-2xl font-bold mb-6">Inställningar</h3>
            <div class="flex flex-col gap-6">
                
                <!-- Utseende -->
                <div>
                    <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Utseende & Tillgänglighet</h4>
                    <div class="flex flex-col gap-3">
                        <button id="themeToggleBtn" class="btn btn-secondary w-full p-4 flex items-center gap-4 group justify-start transition-all hover:bg-white/5">
                            <div class="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <svg id="sunIcon" class="h-6 w-6 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M6.343 17.657l-.707.707"></path></svg>
                                <svg id="moonIcon" class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                            </div>
                            <div class="text-left flex-1">
                                <div class="font-bold text-base mb-0.5">Färgtema</div>
                                <div class="text-xs text-gray-400 font-medium leading-tight">Byt mellan ljust och mörkt läge.</div>
                            </div>
                        </button>

                        <button id="accessibilityToggleBtn" class="btn btn-secondary w-full p-4 flex items-center gap-4 group justify-start transition-all hover:bg-white/5">
                            <div class="w-10 h-10 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            </div>
                            <div class="text-left flex-1">
                                <div class="font-bold text-base mb-0.5">Kontrastläge</div>
                                <div class="text-xs text-gray-400 font-medium leading-tight">Öka kontrast för bättre läsbarhet.</div>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Resurser & Hjälp -->
                <div>
                    <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Resurser & Hjälp</h4>
                    <div class="flex flex-col gap-3">
                        <button id="settingsLexiconBtn" class="btn btn-secondary w-full text-left p-4 flex items-center gap-3 group justify-start transition-all hover:bg-white/5">
                            <div class="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path></svg>
                            </div>
                            <div class="text-left flex-1">
                                <div class="font-bold text-base mb-0.5">Öppna Lexikon</div>
                                <div class="text-xs text-gray-400 font-medium leading-tight">Sök manuellt i hela teckenspråkslexikonet.</div>
                            </div>
                        </button>

                        <button id="alphabetBtn" class="btn btn-secondary w-full p-4 flex items-center gap-4 group justify-start transition-all hover:bg-white/5">
                            <div class="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>
                            </div>
                             <div class="text-left flex-1">
                                <div class="font-bold text-base mb-0.5">Handalfabetet</div>
                                <div class="text-xs text-gray-400 font-medium leading-tight">Visa handalfabetet och träna.</div>
                            </div>
                        </button>

                        <button id="appFeedbackBtn" class="btn btn-secondary w-full p-4 flex items-center gap-4 group justify-start transition-all hover:bg-white/5">
                            <div class="w-10 h-10 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                            </div>
                            <div class="text-left flex-1">
                                <div class="font-bold text-base mb-0.5">App-feedback</div>
                                <div class="text-xs text-gray-400 font-medium leading-tight">Rapportera buggar eller ge förslag.</div>
                            </div>
                        </button>
                         <button id="dataManagementBtn" class="btn btn-secondary w-full p-4 flex items-center gap-4 group justify-start transition-all hover:bg-white/5">
                            <div class="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
                            </div>
                            <div class="text-left flex-1">
                                <div class="font-bold text-base mb-0.5">Datahantering</div>
                                <div class="text-xs text-gray-400 font-medium leading-tight">Spara feedback online eller importera.</div>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Avancerat -->
                <div>
                    <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Avancerat</h4>
                    <div class="flex flex-col gap-3">
                        <button id="settingsRobotTestBtn" class="btn btn-secondary w-full p-4 flex items-center gap-4 group justify-start transition-all hover:bg-white/5">
                            <div class="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                 <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3.75H8.25A1.75 1.75 0 006.5 5.5v1.446c-.332.057-.655.126-.976.208a11.954 11.954 0 00-5.42 2.378c-.62.593-1.045 1.373-1.096 2.247-.024.411.133.81.42 1.119.29.313.68.495 1.096.495h.262c.31-.05.614-.117.914-.199a11.954 11.954 0 01-5.42-2.377c-.62-.593-1.045-1.373-1.096-2.247-.024-.411-.133-.81.42-1.119a1.996 1.996 0 00-1.096-.495H9.25V3.75zM15 6.75h.75A1.75 1.75 0 0117.5 8.5v1.446c.332.057.655.126.976.208a11.954 11.954 0 015.42 2.378c.62.593 1.045 1.373 1.096 2.247.024.411-.133.81-.42 1.119-.29.313.68.495 1.096.495h-.262c-.31-.05-.614-.117-.914-.199a11.954 11.954 0 01-5.42-2.377c-.62-.593-1.045-1.373-1.096-2.247-.024-.411-.133-.81.42-1.119a1.996 1.996 0 011.096-.495H14.75V6.75zM9.75 12.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM16.5 12.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"></path>
                                </svg>
                            </div>
                            <div class="text-left flex-1">
                                <div class="font-bold text-base mb-0.5">Systemdiagnostik</div>
                                <div class="text-xs text-gray-400 font-medium leading-tight">Starta en serie tester för att hitta buggar i appen.</div>
                            </div>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- Lexicon Explorer Modal -->
    <div id="lexiconExplorerModal" class="modal">
        <div class="modal-content" style="max-height: 85vh; display: flex; flex-direction: column;">
             <div id="lexiconLoadingOverlay" class="absolute inset-0 bg-[var(--bg-light)] z-20 hidden flex-col items-center justify-center p-4 text-center">
                <div class="loading-indicator"></div>
                <p class="font-semibold text-lg">Laddar ner hela lexikonet...</p>
                <p id="lexiconLoadingMessage" class="text-sm text-gray-400">Detta kan ta en liten stund.</p>
                <div class="w-full max-w-xs bg-gray-700 rounded-full h-2.5 mt-4">
                    <div id="lexiconLoadingProgressBar" class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
                <p id="lexiconLoadingPercentage" class="text-sm mt-2">0%</p>
            </div>
            <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            <h3 class="text-lg font-bold mb-4 flex-shrink-0">Utforska lexikon</h3>
            
            <!-- Search Area -->
            <div class="relative mb-4 flex-shrink-0">
                <input type="text" id="lexiconSearchInput" class="modal-input" placeholder="Sök efter ord...">
                <div id="lexiconSuggestions" class="hidden"></div>
            </div>

            <!-- Results Area (Scrollable) -->
            <div class="flex-1 overflow-y-auto pr-2">
                <div id="lexiconVideoContainer" class="text-center">
                    <h4 id="lexiconVideoTitle" class="font-semibold mb-2"></h4>
                    <video id="lexiconVideoPlayer" autoplay loop muted playsinline class="w-full max-w-sm mx-auto rounded-md bg-black hidden" disablepictureinpicture></video>
                    <p id="lexiconVideoError" class="text-red-400 mt-2 hidden"></p>
                </div>
                <div id="lexiconVideoGrid" class="video-grid-alphabet mt-4 hidden"></div>
            </div>

            <!-- Advanced Tools Area (Collapsible) -->
            <details class="mt-4 border-t border-gray-700 pt-4 flex-shrink-0">
                <summary class="font-semibold cursor-pointer text-gray-400 hover:text-white">Verktyg: Konvertera videolänk till JSON</summary>
                <div id="jsonToolContainer" class="mt-4">
                    <p class="text-sm text-gray-400 mb-3">Klistra in en fullständig videolänk och skriv in ordet för att generera JSON-koden. Du kan sedan kopiera koden och klistra in den manuellt i rätt <code>lexikon_sammanslagen_del_*.json</code>-fil.</p>
                    <div class="space-y-3">
                        <div>
                            <label for="lexiconUrlInput" class="block text-sm font-medium mb-1">Videolänk</label>
                            <input type="text" id="lexiconUrlInput" class="modal-input" placeholder="https://teckensprakslexikon.su.se/movies/...">
                        </div>
                        <div>
                            <label for="lexiconWordInput" class="block text-sm font-medium mb-1">Ord</label>
                            <input type="text" id="lexiconWordInput" class="modal-input" placeholder="t.ex. för">
                        </div>
                        <button id="generateJsonBtn" class="btn btn-primary w-full">Konvertera till JSON</button>
                        <div id="jsonOutputContainer" class="hidden mt-3">
                            <label for="generatedJsonOutput" class="block text-sm font-medium mb-1">Genererad JSON (Kopiera och klistra in)</label>
                            <div class="relative">
                                <textarea id="generatedJsonOutput" readonly class="feedback-textarea font-mono text-sm bg-gray-900" rows="4"></textarea>
                                <button id="copyJsonBtn" class="btn btn-secondary btn-sm absolute top-2 right-2" data-tooltip-text="Kopiera kod">
                                   <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </details>
        </div>
    </div>

    <!-- Alphabet Modal -->
    <div id="alphabetModal" class="modal">
        <div class="modal-content alphabet-modal-content">
             <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-bold">Svenska Handalfabetet</h3>
                <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            </div>
            <div id="alphabetGrid" class="video-grid-alphabet"></div>
            <div class="mt-3 flex justify-center pt-2 border-t border-gray-700/50">
                <button id="playAlphabetSequenceBtn" class="btn btn-secondary btn-sm">▶ Spela i sekvens</button>
            </div>
        </div>
    </div>

    <!-- App Feedback Modal -->
    <div id="appFeedbackModal" class="modal">
        <div class="modal-content">
            <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            <h3 class="text-lg font-bold mb-4">Lämna feedback om appen</h3><p class="text-sm text-gray-400 mb-2">Har du förslag på förbättringar eller hittat en bugg i själva applikationen (inte i teckenresultaten)?</p><textarea id="appFeedbackTextarea" class="modal-input w-full" placeholder="Beskriv din feedback här..." rows="6"></textarea><div class="mt-6 flex justify-end gap-3"><button id="appFeedbackSendBtn" class="btn btn-primary">Skicka</button></div></div>
    </div>

    <!-- Feedback Video Modal -->
    <div id="feedbackVideoModal" class="modal">
        <div class="modal-content text-center">
            <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            <h3 id="feedbackVideoTitle" class="text-lg font-bold mb-4"></h3><video id="feedbackVideoPlayer" controls autoplay loop muted class="w-64 h-64 mx-auto rounded-md bg-black" disablepictureinpicture></video><p id="feedbackVideoError" class="text-red-400 mt-2 hidden"></p></div>
    </div>

    <!-- Sign Details Modal -->
    <div id="signDetailsModal" class="modal">
        <div class="modal-content">
            <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            <div class="flex justify-between items-start">
                <h3 id="signDetailsTitle" class="text-2xl font-bold mb-4">Teckeninformation</h3>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Video and Main Actions -->
                <div>
                    <div class="relative aspect-square bg-black rounded-lg mb-2">
                        <video id="signDetailsVideoPlayer" controls autoplay loop muted playsInline class="w-full h-full rounded-md" disablepictureinpicture></video>
                        <p id="signDetailsVideoError" class="absolute inset-0 flex items-center justify-center text-red-400 hidden p-4 text-center"></p>
                    </div>
                    <div id="signDetailsMainSignInfo" class="text-center mb-4">
                        <p id="signDetailsMainSignWord" class="font-semibold"></p>
                        <p id="signDetailsMainSignId" class="text-sm text-gray-400"></p>
                    </div>
                    <div id="signDetailsActions" class="grid grid-cols-1 gap-2">
                        <a id="signDetailsLexiconLink" href="#" target="_blank" rel="noopener noreferrer" class="btn btn-secondary text-center">Öppna i Lexikonet</a>
                    </div>
                </div>
    
                <!-- Details Section -->
                <div>
                    <div id="signDetailsInfoContainer">
                        <div id="signDetailsGlossContainer" class="hidden mb-4">
                            <h4 class="text-lg font-semibold mb-2">Glosa & Korpus</h4>
                            <div class="p-3 bg-gray-900/50 rounded-lg text-gray-400">
                               <p id="signDetailsGloss" class="mb-2"></p>
                               <a id="signDetailsKorpusLink" href="#" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm hidden">Visa i Korpus</a>
                            </div>
                        </div>

                         <div id="signDetailsExtras" class="mt-4 space-y-4">
                            <!-- Loading indicator and content will be injected here by JS -->
                        </div>
                    </div>
                    
                    <!-- The feedback form can remain -->
                     <div id="signDetailsFeedbackSection" class="mt-6 border-t border-gray-700 pt-4">
                        <h4 class="text-lg font-semibold mb-2">Rapportera fel</h4>
                        <textarea id="signFeedbackTextarea" class="feedback-textarea" placeholder="Beskriv vad som är fel eller vad som kan förbättras..."></textarea>
                        <div class="flex justify-end gap-2 mt-2">
                             <button id="signFeedbackCancelBtn" class="btn btn-secondary btn-sm">Avbryt</button>
                             <button id="signFeedbackSendBtn" class="btn btn-primary btn-sm">Skicka</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Improve Sign Modal -->
    <div id="improveSignModal" class="modal">
        <div class="modal-content" style="max-width: 500px;">
            <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            <div class="flex justify-between items-start">
                <h3 id="improveSignModalTitle" class="text-2xl font-bold mb-4">Förbättra tecken</h3>
            </div>
            <p class="text-sm text-gray-400 mb-4">Vad vill du göra?</p>
            <div class="flex flex-col gap-3">
                <button id="improveActionChangeBtn" class="btn btn-secondary w-full text-left p-4 flex items-center gap-3">
                    <svg class="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 9a9 9 0 0114.65-5.22M20 15a9 9 0 01-14.65 5.22"></path></svg>
                    <div>
                        <span class="font-bold">Ändra till ett annat tecken</span>
                        <span class="text-xs block text-gray-400">Välj ett annat, befintligt tecken från lexikonet.</span>
                    </div>
                </button>
                <button id="improveActionSuggestBtn" class="btn btn-secondary w-full text-left p-4 flex items-center gap-3">
                     <svg class="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    <div>
                        <span class="font-bold">Föreslå ett nytt tecken</span>
                        <span class="text-xs block text-gray-400">Ladda upp eller spela in en video med ett nytt förslag.</span>
                    </div>
                </button>
                <button id="improveActionReportBtn" class="btn btn-secondary w-full text-left p-4 flex items-center gap-3">
                    <svg class="h-6 w-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                    <div>
                        <span class="font-bold">Rapportera fel eller kommentera</span>
                        <span class="text-xs block text-gray-400">Beskriv om något är fel med tecknet eller matchningen.</span>
                    </div>
                </button>
            </div>
             <div class="mt-6">
                <button data-modal-close class="btn btn-secondary w-full">Avbryt</button>
            </div>
        </div>
    </div>

    <!-- Change Sign Modal -->
    <div id="changeSignModal" class="modal">
        <div class="modal-content" style="max-width: 800px;">
            <div class="flex justify-between items-start mb-4">
                <h3 id="changeSignModalTitle" class="text-2xl font-bold">Ändra tecken</h3>
                <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            </div>
            <div class="relative mb-4">
                <input type="text" id="changeSignSearchInput" class="modal-input" placeholder="Sök efter nytt ord eller ID...">
                <div id="changeSignSuggestions" class="suggestions-list hidden"></div>
            </div>
            <div id="changeSignAlternativesGrid" class="video-grid-alphabet">
                <!-- Alternative videos will be populated here -->
            </div>
        </div>
    </div>

    <!-- Thumb Down Reason Modal -->
    <div id="thumbDownReasonModal" class="modal">
        <div class="modal-content" style="max-width: 400px;">
            <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            <h3 id="thumbDownReasonTitle" class="text-lg font-bold mb-4 text-center">Varför tumme ner?</h3>
            <p class="text-sm text-gray-400 mb-4 text-center">Din feedback hjälper till att förbättra algoritmen.</p>
            <div class="flex flex-col gap-3">
                <button id="thumbDownReasonIncorrectBtn" class="btn btn-secondary w-full">Fel tecken</button>
                <button id="thumbDownReasonContextBtn" class="btn btn-secondary w-full">Passar inte i kontexten</button>
                <button id="thumbDownReasonOldBtn" class="btn btn-secondary w-full">Gammalt tecken</button>
                <button id="thumbDownReasonRegionalBtn" class="btn btn-secondary w-full">Regionalt tecken</button>
                <button id="thumbDownReasonOtherBtn" class="btn btn-primary w-full mt-2">Annan anledning...</button>
            </div>
            <div id="thumbDownOtherReasonContainer" class="hidden mt-4">
                <textarea class="feedback-textarea" placeholder="Beskriv anledningen..."></textarea>
                <button id="saveThumbDownReasonBtn" class="btn btn-primary w-full mt-2">Spara anledning</button>
            </div>
        </div>
    </div>
    
    <!-- Good Choice Reason Modal -->
    <div id="goodChoiceReasonModal" class="modal">
        <div class="modal-content" style="max-width: 400px;">
            <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            <h3 id="goodChoiceReasonTitle" class="text-lg font-bold mb-4 text-center"></h3>
            <p class="text-sm text-gray-400 mb-4 text-center">Varför är detta ett bra val? Din feedback lär appen att bli smartare.</p>
            <div class="flex flex-col gap-3">
                <button id="goodChoiceReasonContextBtn" class="btn btn-primary w-full">Bäst i denna kontext</button>
                <button id="goodChoiceReasonPrimaryBtn" class="btn btn-secondary w-full">Sätt som primärval</button>
            </div>
        </div>
    </div>

    <!-- Change Reason Modal -->
    <div id="changeReasonModal" class="modal">
        <div class="modal-content" style="max-width: 400px;">
            <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            <h3 id="changeReasonTitle" class="text-lg font-bold mb-4 text-center"></h3>
            <p class="text-sm text-gray-400 mb-4 text-center">Varför ändrar du tecknet? Detta val sparas bara i utvecklarläge.</p>
            <div class="flex flex-col gap-3">
                <button id="changeReasonContextBtn" class="btn btn-primary w-full">Bättre i denna kontext</button>
                <button id="changeReasonPrimaryBtn" class="btn btn-secondary w-full">Sätt som nytt primärval</button>
            </div>
        </div>
    </div>

    <!-- Sentence Feedback Modal -->
    <div id="sentenceFeedbackModal" class="modal">
        <div class="modal-content">
            <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            <div class="flex justify-between items-start">
                <h3 id="sentenceFeedbackTitle" class="text-2xl font-bold mb-4">Feedback på mening</h3>
            </div>
            <p id="sentenceFeedbackText" class="text-lg italic text-gray-400 mb-4 bg-gray-900/50 p-3 rounded-lg"></p>
            <div class="space-y-4">
                <div>
                    <h4 class="text-lg font-semibold mb-2">Ändra hela meningen till ett tecken</h4>
                    <div class="relative">
                        <input type="text" id="sentenceFeedbackSignInput" class="modal-input" placeholder="Sök ord eller ID...">
                        <div id="sentenceFeedbackSuggestions" class="suggestions-list hidden"></div>
                    </div>
                </div>
                <div>
                    <h4 class="text-lg font-semibold mb-2">Eller lämna en kommentar</h4>
                    <textarea id="sentenceFeedbackCommentTextarea" class="feedback-textarea" placeholder="Beskriv vad som kan förbättras med hela meningen..." rows="3"></textarea>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
                <button id="sentenceFeedbackSaveBtn" class="btn btn-primary">Spara Feedback</button>
            </div>
        </div>
    </div>
    
    <!-- Suggestion Modal -->
    <div id="suggestionModal" class="modal">
        <div class="modal-content" style="max-width: 500px;">
            <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            <h3 id="suggestionModalTitle" class="text-lg font-bold mb-4"></h3>
            <div class="bg-black rounded-md mb-4 aspect-video flex items-center justify-center">
                <video id="suggestionVideoPreview" class="w-full h-full hidden" playsInline muted autoplay disablepictureinpicture></video>
                <p id="suggestionStatusText" class="text-gray-400">Välj inspelning eller ladda upp.</p>
                <span id="timerDisplay" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-4xl font-mono bg-black/50 px-2 rounded-md hidden">00:00</span>
            </div>
            <div id="suggestionControls" class="flex justify-center items-center gap-3">
                <!-- Initial controls -->
                <button id="uploadVideoButton" class="btn btn-secondary">Hämta video</button>
                <input type="file" id="videoUploadInput" accept="video/*" class="hidden">
                <button id="recordVideoButton" class="btn btn-secondary">Filma direkt</button>
                <!-- Recording controls -->
                <button id="stopRecordingButton" class="btn btn-primary hidden">Stoppa inspelning</button>
                <!-- Preview controls -->
                <button id="useVideoButton" class="btn btn-primary hidden">Använd detta klipp</button>
                <button id="retakeVideoButton" class="btn btn-secondary hidden">Gör om</button>
            </div>
        </div>
    </div>

    <!-- Send Suggestion Modal -->
    <div id="sendSuggestionModal" class="modal">
        <div class="modal-content" style="max-width: 500px;">
            <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            <h3 id="sendSuggestionModalTitle" class="text-lg font-bold mb-4"></h3>
            <div class="space-y-6">
                <div>
                    <p class="font-semibold text-lg mb-2">Steg 1: Ladda ner din video</p>
                    <div class="flex items-center gap-4 p-3 bg-gray-900 rounded-lg">
                        <video id="sendSuggestionVideoPreview" class="w-24 h-24 rounded-md bg-black" controls autoplay muted loop disablepictureinpicture></video>
                        <div class="flex-1">
                            <p class="text-sm text-gray-400 mb-2">Klicka här för att spara videofilen på din enhet.</p>
                            <a id="downloadSuggestionBtn" class="btn btn-primary w-full">
                                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V3"></path></svg>
                                <span>Ladda ner video</span>
                            </a>
                        </div>
                    </div>
                </div>
                <div>
                    <p class="font-semibold text-lg mb-2">Steg 2: Kopiera information</p>
                     <div class="relative">
                        <textarea id="sendSuggestionText" class="feedback-textarea" rows="4" readonly></textarea>
                        <button id="copySuggestionTextBtn" class="btn btn-secondary btn-sm absolute top-2 right-2" data-tooltip-text="Kopiera text">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </button>
                    </div>
                </div>
                <div>
                    <p class="font-semibold text-lg mb-2">Steg 3: Skicka ditt förslag</p>
                    <p class="text-sm text-gray-400">Öppna ditt e-postprogram, bifoga videofilen du laddade ner och klistra in texten i ett nytt meddelande till <strong class="text-blue-400">sts-helper@outlook.com</strong>.</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Alphabet Sequence Modal -->
    <div id="alphabetSequenceModal" class="modal">
        <div class="modal-content" style="max-width: 500px;">
            <div class="flex justify-between items-start">
                <h3 id="alphabetSequenceTitle" class="text-2xl font-bold mb-4">Alfabetet i Sekvens</h3>
                <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            </div>
            <div class="text-center">
                <div class="relative bg-black rounded-lg w-full max-w-2xl mx-auto aspect-square">
                    <video id="alphabetSequencePlayer" class="w-full h-full" playsInline muted loop disablepictureinpicture></video>
                    <p id="alphabetSequenceVideoError" class="video-error hidden absolute inset-0 flex items-center justify-center text-red-400 p-4 text-center"></p>
                </div>
                <p id="alphabetSequenceLetter" class="text-6xl font-bold my-4"></p>
                <div class="flex justify-center items-center gap-4 mt-4">
                    <button id="prevAlphabetBtn" class="btn btn-secondary">&lt; Föregående</button>
                    <button id="playPauseAlphabetBtn" class="btn btn-primary w-28">Pausa</button>
                    <button id="nextAlphabetBtn" class="btn btn-secondary">Nästa &gt;</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Data Management Modal -->
    <div id="dataManagementModal" class="modal">
        <div class="modal-content" style="max-width: 500px;">
            <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            <div class="flex justify-between items-start">
                <h3 id="dataManagementModalTitle" class="text-2xl font-bold mb-4">Spara Online</h3>
            </div>
            <p id="dataManagementDescription" class="text-sm text-gray-400 mb-6">
                All din feedback sparas temporärt i appen. För att spara dina ändringar permanent och göra dem tillgängliga för alla, klicka på <strong>"Spara Data Online"</strong>.<br/><br/>
                Detta analyserar din feedback, uppdaterar den centrala kunskapsdatabasen och rensar din lokala feedback. Processen kan ta en liten stund.
            </p>
            <div class="flex flex-col gap-4">
                <button id="saveAndDownloadBtn" class="btn btn-primary">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"></path></svg>
                    <span>Spara Data Online</span>
                </button>
                <div class="border-t border-gray-700 my-2"></div>
                <button id="importMergeDataBtn" class="btn btn-secondary">
                   <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    <span>Importera & Slå Samman Feedback</span>
                </button>
                <input type="file" id="importMergeDataInput" accept=".json" class="hidden">
                 <button id="importDataBtn" class="btn btn-secondary">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <span>Importera & Ersätt All Data</span>
                </button>
                <input type="file" id="importDataInput" accept=".json" class="hidden">
            </div>
        </div>
    </div>
    
    <!-- Create Combination Modal -->
    <div id="createCombinationModal" class="modal">
        <div class="modal-content">
            <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            <h3 class="text-lg font-bold mb-4">Skapa kombinerat tecken</h3>
            <p class="text-sm text-gray-400 mb-4">De valda tecknen kommer att kombineras i denna ordning:</p>
            <div id="combinationPreviewGrid" class="flex gap-2 mb-4"></div>
            <div>
                <label for="newCombinationWordInput" class="block text-sm font-medium mb-1">Nytt ord eller fras</label>
                <input type="text" id="newCombinationWordInput" class="modal-input" placeholder="t.ex. AI">
            </div>
            <div class="mt-4">
                <label for="newCombinationCommentInput" class="block text-sm font-medium mb-1">Kommentar (valfritt)</label>
                <textarea id="newCombinationCommentInput" class="feedback-textarea" placeholder="Varför är detta en bra kombination?..." rows="3"></textarea>
            </div>
            <div class="mt-6 flex justify-end gap-3">
                <button id="saveCombinationBtn" class="btn btn-primary">Spara</button>
            </div>
        </div>
    </div>

    <!-- Group Comment Modal -->
    <div id="groupCommentModal" class="modal">
        <div class="modal-content">
            <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            <h3 id="groupCommentModalTitle" class="text-lg font-bold mb-4"></h3>
            <p class="text-sm text-gray-400 mb-4">Din kommentar kommer att kopplas till alla valda tecken nedan.</p>
            <div id="groupCommentVideoGrid" class="flex gap-2 mb-4 overflow-x-auto pb-2">
                <!-- Selected video previews will be populated here -->
            </div>
             <div class="mt-4">
                <label for="groupCommentTextarea" class="block text-sm font-medium mb-1">Kommentar</label>
                <textarea id="groupCommentTextarea" class="feedback-textarea" placeholder="Beskriv din gemensamma feedback här..." rows="3"></textarea>
            </div>
            <div class="mt-4 border-t border-gray-700 pt-4">
                <h4 class="text-lg font-semibold mb-2">Eller, ersätt valda ord med ett enda tecken</h4>
                <p class="text-sm text-gray-400 mb-2">Sök efter tecknet som ska representera hela den valda frasen (t.ex. sök "skulle vilja" för att hitta det specifika tecknet).</p>
                <div class="relative">
                    <input type="text" id="groupReplaceSignInput" class="modal-input" placeholder="Sök ord eller ID...">
                    <div id="groupReplaceSuggestions" class="suggestions-list hidden"></div>
                </div>
                <div id="groupReplacePreview" class="mt-2 hidden flex items-center gap-2">
                    <!-- Preview of the selected sign will appear here -->
                </div>
            </div>
            <div class="mt-6 flex justify-end gap-3">
                <button id="groupCommentSaveBtn" class="btn btn-primary">Spara Feedback</button>
            </div>
        </div>
    </div>

    <!-- Generate Text Modal -->
    <div id="generateTextModal" class="modal">
        <div class="modal-content" style="max-width: 500px;">
            <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            <h3 class="text-lg font-bold mb-4">Generera meningar</h3>
            <p class="text-sm text-gray-400 mb-4">Välj hur många exempel-meningar du vill träna med.</p>
            <div class="flex items-center gap-4 mb-6">
                <label for="generateSentenceCountSlider" class="font-semibold flex-shrink-0">Antal: <span id="generateSentenceCountValue">3</span></label>
                <input id="generateSentenceCountSlider" type="range" min="1" max="10" value="3" class="w-full">
            </div>
            <div class="mt-6 flex justify-end gap-3 border-t border-gray-700 pt-4">
                <button id="confirmGenerateStaticTextBtn" class="btn btn-primary">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                    <span>Generera</span>
                </button>
                <button id="confirmGenerateAiTextBtn" class="btn btn-secondary dev-only" style="display: none;">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 20.25a4.5 4.5 0 005.657-5.657l-1.414-1.414a.75.75 0 00-1.06 0l-.172.172a.75.75 0 000 1.06l1.414 1.414a2.25 2.25 0 01-3.182 3.182l-1.414-1.414a.75.75 0 00-1.06 0l-.172.172a.75.75 0 000 1.06l1.414 1.414A4.5 4.5 0 0012 20.25z"></path></svg>
                    <span>Generera med AI</span>
                </button>
            </div>
        </div>
    </div>
    
    <!-- Feedback Summary Modal -->
    <div id="feedbackSummaryModal" class="modal">
        <div class="modal-content" style="max-width: 600px; height: 80vh; display: flex; flex-direction: column;">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-2xl font-bold">Sammanfattning av Din Feedback</h3>
                <button id="feedbackSummaryCloseBtn" class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            </div>
            <p id="feedbackSummaryDescription" class="text-sm text-gray-400 mb-4">Här är en sammanfattning av din feedback, genererad av AI. Du kan antingen kopiera texten för manuell granskning, eller direkt tillämpa inlärningen i appen och kopiera den färdiga JSON-koden för att uppdatera din <code>learning-data.json</code>-fil.</p>
            <textarea id="feedbackSummaryText" class="feedback-textarea flex-1" rows="10" readonly></textarea>
            <div class="mt-6 flex justify-end gap-3">
                <button id="feedbackSummaryClearBtn" class="btn btn-secondary">Rensa All Feedback</button>
                <button id="feedbackSummaryCopyBtn" class="btn btn-secondary">Kopiera Endast Text</button>
                <button id="applyAndCopyJsonBtn" class="btn btn-primary">Tillämpa Inlärning & Kopiera JSON</button>
            </div>
        </div>
    </div>
    
    <!-- Robot Test Report Modal -->
    <div id="robotTestReportModal" class="modal">
        <div class="modal-content" style="max-width: 800px; height: 80vh; display: flex; flex-direction: column;">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-2xl font-bold">🤖 Testrapport</h3>
                <button id="closeReportBtn" class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            </div>

            <div id="liveProgressArea" class="mb-4 p-4 card" style="display: none;">
                <h4 class="font-bold text-lg mb-2">Kör automatiska tester...</h4>
                <p id="currentTestStatus" class="text-sm text-gray-300 mb-2">Initierar tester...</p>
                <div class="report-progress-container">
                    <div id="liveProgressBar" class="report-progress-bar progress-bar-success" style="width: 0%;"></div>
                </div>
                <p id="progressPercentage" class="text-xs text-right mt-1 text-gray-400">0%</p>
            </div>

            <div id="finalReportSummary" class="report-summary" style="display: none;">
                <!-- Content will be injected by JS (displayReport function) -->
            </div>

            <div id="finalReportDetails" class="report-details flex-1 overflow-y-auto p-4 bg-gray-900/50 rounded-lg mb-4 text-sm" style="display: none;">
                <!-- Content will be injected by JS (displayReport function) -->
            </div>
            
            <div class="flex justify-end gap-3 mt-auto">
                <button id="copyReportBtn" class="btn btn-primary">Kopiera Rapport</button>
            </div>
        </div>
    </div>

    <!-- Multi-Select Feedback Modal -->
    <div id="multiSelectFeedbackModal" class="modal">
        <div class="modal-content">
            <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            <h3 id="multiSelectFeedbackTitle" class="text-lg font-bold mb-4">Feedback för flera tecken</h3>
            <p class="text-sm text-gray-400 mb-6">Välj vad du vill göra med de valda tecknen:</p>
            <div class="flex flex-col gap-3">
                <button id="multiSelectChangeBtn" class="btn btn-secondary w-full text-left p-4 flex items-center gap-3 hover:bg-white/10">
                    <svg class="h-6 w-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    <div>
                        <div class="font-bold">✎ Byt</div>
                        <div class="text-xs text-gray-400">Byt ut dessa tecken mot andra</div>
                    </div>
                </button>
                <button id="multiSelectSuggestBtn" class="btn btn-secondary w-full text-left p-4 flex items-center gap-3 hover:bg-white/10">
                    <svg class="h-6 w-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    <div>
                        <div class="font-bold">💡 Föreslå</div>
                        <div class="text-xs text-gray-400">Föreslå förbättringar</div>
                    </div>
                </button>
                <button id="multiSelectReportBtn" class="btn btn-secondary w-full text-left p-4 flex items-center gap-3 hover:bg-white/10">
                    <svg class="h-6 w-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <div>
                        <div class="font-bold">📋 Rapportera</div>
                        <div class="text-xs text-gray-400">Rapportera fel eller problem</div>
                    </div>
                </button>
            </div>
        </div>
    </div>

    <!-- Change Group Signs Modal -->
    <div id="changeGroupSignsModal" class="modal">
        <div class="modal-content" style="max-width: 900px; height: 80vh; display: flex; flex-direction: column;">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-2xl font-bold">Ändra tecken - Välj från lexikon</h3>
                <button class="modal-close-btn" data-modal-close aria-label="Stäng">&times;</button>
            </div>
            <p class="text-sm text-gray-400 mb-4">Se alla varianter från lexikon för de ord du har valt. Klicka på videoer för att välja vilka som är rätt:</p>
            <div id="changeGroupSignsContent" class="flex-1 overflow-y-auto p-4 bg-gray-900/50 rounded-lg space-y-6">
                <!-- Group of words with their all variants will be populated here by JS -->
            </div>
            <div class="mt-4 flex justify-end gap-3">
                <button id="changeGroupSignsCancelBtn" class="btn btn-secondary">Avbryt</button>
                <button id="changeGroupSignsSaveBtn" class="btn btn-primary">Spara val</button>
            </div>
        </div>
    </div>
`;

export function injectModals() {
    document.body.insertAdjacentHTML('beforeend', MODAL_TEMPLATES);
}