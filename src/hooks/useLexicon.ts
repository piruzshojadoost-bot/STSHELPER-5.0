
import { Sign, LearningData, PositiveFeedbackEntry, NegativeFeedbackEntry, FeedbackEntry, LexiconMetadata } from '../types';
import { appState, localLexiconMap, idToWordMap, alphabetSignsMap, searchableLexicon, learnedPreferences, feedbackMap, sentenceFeedbackMap, positiveFeedbackMap, negativeFeedbackMap, homonymMap, latestSignsFromLexicon, localUserSigns, localVideoMap, fullLexiconMap, questionClarifications, aliasMap, inflectionMap, updateLatestFeedbackJson } from '../state';
import { showMessage, updateButtonProgress, isDevMode, ICON_LOADING_SVG } from '../ui';
import { closeModal as closeModalSystem, clearFeedbackData } from '../components/modals';
import { delay } from '../utils';
import { convertSummaryToJsonAI } from './useAI';
import { updateHeaderLexiconProgress } from '../modules/ui/progress';

// ⚠️ ⚠️ ⚠️ VARNING / WARNING ⚠️ ⚠️ ⚠️
// RÖR ALDRIG LEXIKON FILER: ABSOLUT ALDRIG!
// NEVER TOUCH LEXICON FILES: ABSOLUTELY NEVER!
// Modifiering kan skada hela appen / Modification can break the entire app
// ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️ ⚠️

// --- LEXICON CONFIGURATION ---
const MAX_LOCAL_LEXICON_PARTS = 6; // Fast search (del 1-6 offline/snabb)
const MAX_FULL_LEXICON_PARTS = 10;  // Full details + videos (del 1-10 offline/full)

// Paths to local lexicon files for fast search (offline/snabb: del 1-6)
const LOCAL_SEARCH_LEXICON_PATHS = Array.from({ length: MAX_LOCAL_LEXICON_PARTS }, (_, i) => `/data/lexikon/offline/snabb/lexikon_sammanslagen_del_${i + 1}.json`);

// Paths to local full lexicon files (offline/full: del 1-10)
const FULL_LEXICON_LOCAL_PATHS = Array.from({ length: MAX_FULL_LEXICON_PARTS }, (_, i) => `/data/lexikon/offline/full/lexikon_sammanslagen_del_${i + 1}.json`);

// Paths to online lexicon files (fallback for full details + videos)
const FULL_LEXICON_GIST_URLS: string[] = [
    'https://gist.githubusercontent.com/piruzshojadoost-bot/b48b3821120fd6b56e3ee929c0f9fc24/raw/6025b0d401a1d580208849b62bb7030d2e26d211/1',
    'https://gist.githubusercontent.com/piruzshojadoost-bot/d9703e6bc919b14b77f957858f930f15/raw/4c71bedc135998a50e9eaee4a1e9f950b4bf0cb0/2',
    'https://gist.githubusercontent.com/piruzshojadoost-bot/bdfe8a5dad4367b3ea85fd81fce3525b/raw/28b840c1d33a59b8cf516b4962914541babe5a98/3',
    'https://gist.githubusercontent.com/piruzshojadoost-bot/21a9b60e6dcae7b29883d943af025fe0/raw/2df6b65934494a71804954148b4f1cd2d9681fa6/4',
    'https://gist.githubusercontent.com/piruzshojadoost-bot/af515a52e0e98d7cd49f511c78f5f039/raw/1221422e680ea194e16b0f01119584cb4a8ec982/5',
    'https://gist.githubusercontent.com/piruzshojadoost-bot/de746b18123cd668d766998ae4c1c856/raw/771dae32aca37e148e2b16aef0904cd88430e3bc/6',
    'https://gist.githubusercontent.com/piruzshojadoost-bot/cff170b7b45d859dbb2acf92ddcd45b7/raw/bf34e02a8723919784b1dcdb763f51b9f39631fd/7',
    'https://gist.githubusercontent.com/piruzshojadoost-bot/51d3a6137887808633d8de03d044409f/raw/0ffe263b55029b4e3157cf82aefc317ef92b041d/8',
    'https://gist.githubusercontent.com/piruzshojadoost-bot/99cba6e622a31061bea08408d033ac3c/raw/f6180565532e41377bca85fde5ca08ea29ce06eb/9',
    'https://gist.githubusercontent.com/piruzshojadoost-bot/ef70c4798aef4656c02fc3fb36666dac/raw/f3ef150c6bbdfbb8250deea17d1be16c9cf85e1b/10'
];

const ALIAS_PATH = '/data/user/aliases.json';
const INFLECTIONS_PATH = '/data/user/inflections.json';
const LEARNING_DATA_PATH = '/data/user/learning-data.json';


const DB_NAME = 'TeckensprakslexikonDB';
const DB_VERSION = 6; 
const LEXICON_STORE_NAME = 'lexicon';
const USER_DATA_STORE_NAME = 'userData'; 

let db: IDBDatabase | null = null;
let lexiconWorker: Worker | null = null;

const WORKER_SCRIPT = `
const DB_NAME = 'TeckensprakslexikonDB';
const DB_VERSION = 6;
const LEXICON_STORE_NAME = 'lexicon';
const USER_DATA_STORE_NAME = 'userData';

let db;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const dbInstance = event.target.result;
            if (!dbInstance.objectStoreNames.contains(LEXICON_STORE_NAME)) {
                dbInstance.createObjectStore(LEXICON_STORE_NAME, { keyPath: 'key' });
            }
            if (!dbInstance.objectStoreNames.contains(USER_DATA_STORE_NAME)) {
                dbInstance.createObjectStore(USER_DATA_STORE_NAME, { keyPath: 'key' });
            }
        };
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
        request.onerror = (event) => reject('Worker DB Error');
    });
}

function mapToEntries(map) {
    if (!map) return [];
    // Handle Maps (which have entries() method)
    if (typeof map.entries === 'function') {
        return Array.from(map.entries());
    }
    // Handle plain objects (which might result from structured cloning or JSON parsing)
    return Object.entries(map);
}

function entriesToMap(entries) {
    return new Map(entries);
}

self.onmessage = async (event) => {
    const { action, data } = event.data;
    
    try {
        if (!db) await openDB();
        
        if (action === 'processInitialSearchData') {
            const { lexiconParts, aliasData, inflectionsData } = data;
            
            postMessage({ status: 'progress', type: 'local', message: 'Bygger sökindex...' });

            const newLocalLexiconMap = new Map();
            const newIdToWordMap = new Map();
            const newAlphabetSignsMap = new Map();
            const newAliasMap = new Map();
            const newInflectionMap = new Map();

            lexiconParts.forEach(part => {
                const actualLexiconData = part.lexicon && Array.isArray(part.lexicon) ? part.lexicon : part;
                if (actualLexiconData && Array.isArray(actualLexiconData)) {
                    actualLexiconData.forEach(entry => {
                        const word = entry.word || entry.o; 
                        if (!word || !entry.id || !Array.isArray(entry.id) && !entry.id) return;

                        const entryIds = Array.isArray(entry.id) ? entry.id : [entry.id]; 
                        
                        entryIds.forEach(rawId => {
                            let id = String(rawId).trim();
                            if (/^\\d+$/.test(id)) { 
                                id = id.padStart(5, '0');
                            }
                            
                            const key = word.toLowerCase();
                            if (!newLocalLexiconMap.has(key)) {
                                newLocalLexiconMap.set(key, []);
                            }

                            const signEntry = { id, word: word }; 
                            
                            if (!newLocalLexiconMap.get(key).some(s => s.id === id)) {
                                newLocalLexiconMap.get(key).push(signEntry);
                            }

                            if (!newIdToWordMap.has(id)) {
                                newIdToWordMap.set(id, word);
                            }

                            if (word.length === 1 && /^[a-zA-ZåäöÅÄÖ]$/.test(word)) {
                                const letter = word.toLowerCase();
                                if (!newAlphabetSignsMap.has(letter)) {
                                    newAlphabetSignsMap.set(letter, []);
                                }
                                if (!newAlphabetSignsMap.get(letter).some(s => s.id === id)) {
                                    newAlphabetSignsMap.get(letter).push(signEntry);
                                }
                            }
                        });
                    });
                }
            });

            if (aliasData) {
                for (const key in aliasData) {
                    newAliasMap.set(key, aliasData[key]);
                }
            }

            if (inflectionsData && inflectionsData.inflections) {
                for (const key in inflectionsData.inflections) {
                    newInflectionMap.set(key, inflectionsData.inflections[key]);
                }
            }

            const transaction = db.transaction(LEXICON_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(LEXICON_STORE_NAME);

            const initialItems = [
                { key: 'localLexiconMap', value: mapToEntries(newLocalLexiconMap) },
                { key: 'idToWordMap', value: mapToEntries(newIdToWordMap) },
                { key: 'alphabetSignsMap', value: mapToEntries(newAlphabetSignsMap) },
                { key: 'aliasMap', value: mapToEntries(newAliasMap) },
                { key: 'inflectionMap', value: mapToEntries(newInflectionMap) }
            ];

            await Promise.all(initialItems.map(item => new Promise( (res, rej) => {
                const req = store.put(item);
                req.onsuccess = res;
                req.onerror = rej;
            })));

            postMessage({ status: 'initialSearchDataDone', type: 'local', data: {
                localLexiconMap: mapToEntries(newLocalLexiconMap),
                idToWordMap: mapToEntries(newIdToWordMap),
                alphabetSignsMap: mapToEntries(newAlphabetSignsMap),
                aliasMap: mapToEntries(newAliasMap),
                inflectionMap: mapToEntries(newInflectionMap),
            }});
        } else if (action === 'processFullLexiconData') {
            const { fullLexiconParts, totalParts } = data;
            
            postMessage({ status: 'progress', type: 'online', message: 'Bearbetar detaljer (' + totalParts + ' delar)...' });

            const newFullLexiconMap = new Map();
            
            fullLexiconParts.forEach(part => {
                const actualLexiconData = part.lexicon && Array.isArray(part.lexicon) ? part.lexicon : part;
                if (actualLexiconData && Array.isArray(actualLexiconData)) {
                    actualLexiconData.forEach(entry => {
                        const word = entry.o; 
                        if (!word || !entry.v || !Array.isArray(entry.v)) return;

                        const key = word.toLowerCase();

                        if (!newFullLexiconMap.has(key)) {
                            newFullLexiconMap.set(key, []);
                        }

                        entry.v.forEach(variant => {
                            const rawId = variant.i; 
                            if (!rawId) return;

                            let id = String(rawId).trim();
                            if (/^\\d+$/.test(id)) { 
                                id = id.padStart(5, '0');
                            }
                            
                            if (!newFullLexiconMap.get(key).some(e => e.id === id)) {
                                const rawGloss = entry.g || "";
                                const rawExamples = variant.e || [];
                                const rawRelated = variant.r || [];
                                
                                const normalizedEntry = {
                                    id: id,
                                    word: word,
                                    gloss: rawGloss,
                                    examples: rawExamples.map(ex => ({
                                        sentence: ex.m, 
                                        phraseNumber: ex.f, 
                                        id: id, 
                                        word: word
                                    })),
                                    related: rawRelated.map(rel => ({
                                        sentence: rel.m,
                                        relatedId: rel.ri,
                                        phraseNumber: rel.f,
                                        originalId: id,
                                        originalWord: word,
                                        relatedWord: rel.rw || ''
                                    }))
                                };
                                newFullLexiconMap.get(key).push(normalizedEntry);
                            }
                        });
                    });
                }
            });
            
            const transaction = db.transaction(LEXICON_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(LEXICON_STORE_NAME);

            await new Promise( (res, rej) => {
                const req = store.put({ key: 'fullLexiconMap', value: mapToEntries(newFullLexiconMap) });
                req.onsuccess = res;
                req.onerror = rej;
            });
            postMessage({ status: 'fullLexiconDataDone', type: 'online', data: {
                fullLexiconMap: mapToEntries(newFullLexiconMap)
            }});

        } else if (action === 'saveUserData') {
            const transaction = db.transaction(USER_DATA_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(USER_DATA_STORE_NAME);
            const userState = data.userState;

            const itemsToSave = [
                { key: 'learnedPreferences', value: mapToEntries(userState.learnedPreferences) },
                { key: 'localUserSigns', value: mapToEntries(userState.localUserSigns) },
                { key: 'homonymMap', value: mapToEntries(userState.homonymMap) },
                { key: 'feedbackMap', value: mapToEntries(userState.feedbackMap) },
                { key: 'sentenceFeedbackMap', value: mapToEntries(userState.sentenceFeedbackMap) },
                { key: 'positiveFeedbackMap', value: mapToEntries(userState.positiveFeedbackMap).map(([key, innerMap]) => [key, mapToEntries(innerMap)]) },
                { key: 'negativeFeedbackMap', value: mapToEntries(userState.negativeFeedbackMap).map(([key, innerMap]) => [key, mapToEntries(innerMap)]) },
                { key: 'questionClarifications', value: mapToEntries(userState.questionClarifications) },
                { key: 'appStateOnlineLearningData', value: userState.appStateOnlineLearningData }
            ];
            await Promise.all(itemsToSave.map(item => new Promise( (res, rej) => {
                const req = store.put(item);
                req.onsuccess = res;
                req.onerror = rej;
            })));
            postMessage({ status: 'userDataSaved' });

        } else if (action === 'loadUserData') {
            const transaction = db.transaction(USER_DATA_STORE_NAME, 'readonly');
            const store = transaction.objectStore(USER_DATA_STORE_NAME);
            const loadedData = {};

            const keys = [
                'learnedPreferences', 'localUserSigns', 'homonymMap', 'feedbackMap', 
                'sentenceFeedbackMap', 'positiveFeedbackMap', 'negativeFeedbackMap', 'questionClarifications', 'appStateOnlineLearningData'
            ];
            
            await Promise.all(keys.map(key => new Promise( (res, rej) => {
                const req = store.get(key);
                req.onsuccess = () => {
                    if (req.result) {
                         // Return raw value (Array of entries for Maps, Object for appStateOnlineLearningData)
                        loadedData[key] = req.result.value;
                    } else {
                        loadedData[key] = null;
                    }
                    res();
                };
                req.onerror = rej;
            })));
            postMessage({ status: 'userDataLoaded', data: loadedData });
        }

    } catch (error) {
        console.error('Worker Error:', error);
        postMessage({ status: 'error', error: error.message });
    }
};
`;

if (typeof Worker !== 'undefined') {
    const workerBlob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
    lexiconWorker = new Worker(URL.createObjectURL(workerBlob));
} else {
    console.warn("Web Workers are not supported in this environment.");
}

let isFullLexiconLoading = false;
let fullLexiconLoadPromise: Promise<boolean> | null = null;

function entriesToMap<K, V>(entries: [K, V][] | undefined): Map<K, V> {
    return new Map(entries || []);
}

export async function initializeLexicon(
    onLocalLexiconReady: () => void,
    onLocalProgress: (progress: number) => void,
    onOnlineProgress: (progress: number) => void
) {
    if (!lexiconWorker) {
        showMessage('Web Workers stöds inte, lexikonladdning är begränsad.', 'error');
        return;
    }

    lexiconWorker.onmessage = (event) => {
        const { status, type, message, data, error } = event.data;
        if (error) {
            console.error('Lexicon Worker Error:', error);
            // Suppress "map.entries is not a function" error from user view as it's internal
            if (!String(error).includes('map.entries is not a function')) {
                showMessage(`Fel vid lexikonladdning: ${String(error)}`, 'error');
            }
            return;
        }

        if (status === 'progress') {
            // Progress handled silently - just waiting for lexicon to load
        } else if (status === 'initialSearchDataDone') {

            localLexiconMap.clear();
            entriesToMap(data.localLexiconMap).forEach((val, key) => localLexiconMap.set(key as string, val as any));

            idToWordMap.clear();
            entriesToMap(data.idToWordMap).forEach((val, key) => idToWordMap.set(key as string, val as any));

            alphabetSignsMap.clear();
            entriesToMap(data.alphabetSignsMap).forEach((val, key) => alphabetSignsMap.set(key as string, val as any));

            aliasMap.clear();
            entriesToMap(data.aliasMap).forEach((val, key) => aliasMap.set(key as string, val as any));

            inflectionMap.clear();
            entriesToMap(data.inflectionMap).forEach((val, key) => inflectionMap.set(key as string, val as any));

            searchableLexicon.length = 0;
            searchableLexicon.push(...Array.from(localLexiconMap.keys()).sort());
            
            // Also add user signs to searchable lexicon for fuzzy matching
            if (localUserSigns.size > 0) {
                localUserSigns.forEach((_, key) => {
                    if (!searchableLexicon.includes(key)) {
                        searchableLexicon.push(key);
                    }
                });
                searchableLexicon.sort();
            }

            appState.localLexiconReady = true;
            onLocalLexiconReady();
            appState.localLexiconProgress = 100;
            updateHeaderLexiconProgress();
            window.dispatchEvent(new CustomEvent('lexicon-progress', { detail: { local: 100 } }));

            loadUserData(); 
            
            if (!appState.fullLexiconLoaded && !isFullLexiconLoading) {
                 ensureFullLexiconLoaded(onOnlineProgress).then(success => {
                    if (success) {
                        console.log('Full lexicon loaded in background.');
                    } else {
                        console.warn('Failed to load full lexicon in background.');
                    }
                });
            }

        } else if (status === 'fullLexiconDataDone') {
            fullLexiconMap.clear();
            entriesToMap(data.fullLexiconMap).forEach((val, key) => fullLexiconMap.set(key as string, val as any));

            appState.fullLexiconLoaded = true;
            isFullLexiconLoading = false;
            appState.onlineLexiconProgress = 100;
            updateHeaderLexiconProgress();
            window.dispatchEvent(new CustomEvent('lexicon-progress', { detail: { online: 100 } }));
            if (fullLexiconLoadPromise) {
                const resolve = (fullLexiconLoadPromise as any)._resolve;
                if (resolve) resolve(true);
            }
        } else if (status === 'userDataLoaded') {
            // MERGE learnedPreferences instead of clearing
            if (data.learnedPreferences) {
                entriesToMap(data.learnedPreferences).forEach((val, key) => {
                    const currentMap = learnedPreferences.get(key as string) || new Map<string, number>();
                    // The inner value 'val' is typically an array of entries when coming from indexedDB/worker serialization
                    const entries = val as any; 
                    if (Array.isArray(entries)) {
                        entries.forEach(([signId, score]) => currentMap.set(signId, score));
                    } else if (val instanceof Map) {
                         val.forEach((score, signId) => currentMap.set(signId, score));
                    }
                    learnedPreferences.set(key as string, currentMap);
                });
            }

            // MERGE localUserSigns instead of clearing
            if (data.localUserSigns) {
                entriesToMap(data.localUserSigns).forEach((val, key) => {
                    localUserSigns.set(key as string, val as any);
                });
            }

            // MERGE homonymMap
            if (data.homonymMap) {
                entriesToMap(data.homonymMap).forEach((val, key) => homonymMap.set(key as string, val as any));
            }

            // Feedback maps - OK to replace as they represent session/stored feedback state
            feedbackMap.clear();
            entriesToMap(data.feedbackMap).forEach((val, key) => feedbackMap.set(key as string, val as any));

            sentenceFeedbackMap.clear();
            entriesToMap(data.sentenceFeedbackMap).forEach((val, key) => sentenceFeedbackMap.set(key as string, val as any));

            positiveFeedbackMap.clear();
            if (data.positiveFeedbackMap) {
                if (Array.isArray(data.positiveFeedbackMap)) {
                    entriesToMap(data.positiveFeedbackMap.map(([k, v]: [string, [string, PositiveFeedbackEntry][]]) => [k, entriesToMap(v)]))
                        .forEach((val, key) => positiveFeedbackMap.set(key as string, val as any));
                }
            }

            negativeFeedbackMap.clear();
            if (data.negativeFeedbackMap) {
                 if (Array.isArray(data.negativeFeedbackMap)) {
                    entriesToMap(data.negativeFeedbackMap.map(([k, v]: [string, [string, NegativeFeedbackEntry][]]) => [k, entriesToMap(v)]))
                        .forEach((val, key) => negativeFeedbackMap.set(key as string, val as any));
                 }
            }

            questionClarifications.clear();
            entriesToMap(data.questionClarifications).forEach((val, key) => questionClarifications.set(key as string, val as any));

            if (data.appStateOnlineLearningData) appState.onlineLearningData = data.appStateOnlineLearningData;
            
            updateLatestFeedbackJson();

            console.log("User data loaded and merged from IndexedDB.");
        }
    };

    lexiconWorker.onerror = (error) => {
        console.error('Lexicon Worker Failed:', error);
        showMessage('Kritiskt fel i lexikonprocessorn. Försök ladda om sidan.', 'error', 10000);
        appState.localLexiconReady = false;
        appState.fullLexiconLoaded = false;
        onLocalProgress(0);
        onOnlineProgress(0);
    };

    const fetchWithRetry = async (path: string, retries = 3): Promise<Response> => {
        for (let i = 0; i < retries; i++) {
            try {
                const res = await fetch(path);
                if (!res.ok && i < retries - 1) {
                    throw new Error(`HTTP ${res.status}`);
                }
                return res;
            } catch (e) {
                if (i === retries - 1) throw e;
                const delayMs = 1000 * Math.pow(2, i); // Exponential backoff: 1s, 2s, 4s
                console.warn(`Retry ${i + 1}/${retries} för ${path} efter ${delayMs}ms...`);
                await delay(delayMs);
            }
        }
        throw new Error('Max retries reached');
    };

    const fetchAndParseJson = (path: string, defaultOnError: any, isGist = false) => {
        return fetchWithRetry(path)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to fetch ${path} with status ${res.status}`);
                return res.text();
            })
            .then(text => {
                try {
                    let cleanText = text.trim();
                    if (cleanText.charCodeAt(0) === 0xFEFF) {
                        cleanText = cleanText.substring(1);
                    }
                    const firstChar = isGist ? '[' : '{';
                    const startIndex = cleanText.indexOf(firstChar);
                    if (startIndex > 0) {
                        console.warn(`Trimming ${startIndex} leading characters from ${path}`);
                        cleanText = cleanText.substring(startIndex);
                    }
                    return JSON.parse(cleanText);
                } catch (jsonError) {
                    console.error(`JSON parsing error in ${path}:`, jsonError);
                    return defaultOnError;
                }
            })
            .catch(e => {
                console.error(`Failed to load or parse ${path}`, e);
                return defaultOnError;
            });
    };

    const localLexiconPromises = LOCAL_SEARCH_LEXICON_PATHS.map(path =>
        fetchAndParseJson(path, { lexicon: [] })
    );
    const aliasPromise = fetchAndParseJson(ALIAS_PATH, {});
    const inflectionsPromise = fetchAndParseJson(INFLECTIONS_PATH, {});
    const learningDataPromise = fetchAndParseJson(LEARNING_DATA_PATH, {});

    let loadedPartsCount = 0;
    const totalLocalParts = LOCAL_SEARCH_LEXICON_PATHS.length + 3; // Added learning data

    const allLocalDataPromises = Promise.all([
        Promise.all(localLexiconPromises.map(p => p.then(data => {
            loadedPartsCount++;
            onLocalProgress(Math.round((loadedPartsCount / totalLocalParts) * 100));
            return data;
        }))),
        aliasPromise.then(data => {
            loadedPartsCount++;
            onLocalProgress(Math.round((loadedPartsCount / totalLocalParts) * 100));
            return data;
        }),
        inflectionsPromise.then(data => {
            loadedPartsCount++;
            onLocalProgress(Math.round((loadedPartsCount / totalLocalParts) * 100));
            return data;
        }),
        learningDataPromise.then(data => {
            loadedPartsCount++;
            onLocalProgress(Math.round((loadedPartsCount / totalLocalParts) * 100));
            return data;
        })
    ]);

    const [lexiconParts, aliasData, inflectionsData, learningData] = await allLocalDataPromises;

    // Populate main thread state directly from learningData before sending to worker
    if (learningData) {
        if (learningData.newWords) {
             learningData.newWords.forEach((entry: any) => {
                 if(entry.lookupKey && entry.signs) {
                     localUserSigns.set(entry.lookupKey.toLowerCase(), { 
                         signs: entry.signs, 
                         isCompound: entry.isCompound || false 
                     });
                 }
             });
        }
        if (learningData.learnedPreferences) {
             for (const key in learningData.learnedPreferences) {
                 const prefs = learningData.learnedPreferences[key];
                 const map = new Map<string, number>();
                 for (const signId in prefs) {
                     map.set(signId, prefs[signId]);
                 }
                 learnedPreferences.set(key, map);
             }
        }
        appState.onlineLearningData = learningData;
    }
    
    lexiconWorker.postMessage({
        action: 'processInitialSearchData',
        data: { lexiconParts, aliasData, inflectionsData }
    });
}

export async function ensureLexiconPartsLoaded(queries: string[]): Promise<boolean> {
    if (!lexiconWorker) return false;
    if (!appState.localLexiconReady) {
        console.warn('Local lexicon not ready, cannot ensure parts loaded.');
        return false;
    }
    return true;
}

export async function ensureFullLexiconLoaded(progressCallback: (progress: number) => void): Promise<boolean> {
    if (appState.fullLexiconLoaded) {
        progressCallback(100);
        return true;
    }
    if (isFullLexiconLoading) {
        return fullLexiconLoadPromise!;
    }

    isFullLexiconLoading = true;
    let resolvePromise: (value: boolean | PromiseLike<boolean>) => void;
    let rejectPromise: (reason?: any) => void;

    fullLexiconLoadPromise = new Promise<boolean>((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
    });
    (fullLexiconLoadPromise as any)._resolve = resolvePromise;
    (fullLexiconLoadPromise as any)._reject = rejectPromise;

    if (!lexiconWorker) {
        isFullLexiconLoading = false;
        rejectPromise(new Error('Web Workers not supported.'));
        return false;
    }

    const fetchWithRetry = async (path: string, retries = 3): Promise<Response> => {
        for (let i = 0; i < retries; i++) {
            try {
                const res = await fetch(path, { cache: "no-store" });
                if (!res.ok && i < retries - 1) {
                    throw new Error(`HTTP ${res.status}`);
                }
                return res;
            } catch (e) {
                if (i === retries - 1) throw e;
                const delayMs = 1000 * Math.pow(2, i);
                console.warn(`Retry ${i + 1}/${retries} för ${path} efter ${delayMs}ms...`);
                await delay(delayMs);
            }
        }
        throw new Error('Max retries reached');
    };

    const fetchAndParseJson = (path: string, defaultOnError: any, isGist = false) => {
        let fetchUrl = path;
        // Add cache busting only for HTTP URLs, not local paths
        if (path.startsWith('http://') || path.startsWith('https://')) {
            const url = new URL(path);
            url.searchParams.set('cache-bust', new Date().getTime().toString());
            fetchUrl = url.toString();
        } else {
            // Local path: add cache-bust as query param
            fetchUrl = path + (path.includes('?') ? '&' : '?') + 'cache-bust=' + new Date().getTime();
        }
        
        return fetchWithRetry(fetchUrl) 
            .then(res => {
                if (!res.ok) throw new Error(`Failed to fetch ${path} with status ${res.status}`);
                return res.text();
            })
            .then(text => {
                try {
                    let cleanText = text.trim();
                    if (cleanText.charCodeAt(0) === 0xFEFF) {
                        cleanText = cleanText.substring(1);
                    }
                    const firstChar = isGist ? '[' : '{';
                    const startIndex = cleanText.indexOf(firstChar);
                    if (startIndex > 0) {
                        console.warn(`Trimming ${startIndex} leading characters from ${path}`);
                        cleanText = cleanText.substring(startIndex);
                    }
                    return JSON.parse(cleanText);
                } catch (jsonError) {
                    console.error(`JSON parsing error in ${path}:`, jsonError);
                    return defaultOnError;
                }
            })
            .catch(e => {
                console.error(`Failed to load or parse ${path}`, e);
                return defaultOnError;
            });
    };

    try {
        // Try local first, fallback to online
        const fullLexiconPromises = FULL_LEXICON_LOCAL_PATHS.map((path, index) => 
            fetchAndParseJson(path, null, true).then(data => 
                data === null ? fetchAndParseJson(FULL_LEXICON_GIST_URLS[index], [], true) : data
            )
        );

        let loadedPartsCount = 0;
        const totalFullParts = FULL_LEXICON_LOCAL_PATHS.length;

        const allFullLexiconData = await Promise.all(fullLexiconPromises.map(p => p.then(data => {
            loadedPartsCount++;
            const progress = Math.round((loadedPartsCount / totalFullParts) * 100);
            progressCallback(progress);
            window.dispatchEvent(new CustomEvent('lexicon-progress', { detail: { online: progress } }));
            return data;
        })));
        
        lexiconWorker.postMessage({
            action: 'processFullLexiconData',
            data: { fullLexiconParts: allFullLexiconData, totalParts: totalFullParts }
        });

        return await fullLexiconLoadPromise;
    } catch (e) {
        console.error('Failed to initiate full lexicon loading:', e);
        showMessage('Kunde inte hämta fullständiga lexikondata. Kontrollera din internetanslutning.', 'error');
        isFullLexiconLoading = false;
        rejectPromise(false);
        return false;
    }
}

export function processFeaturesRequiringFullLexicon() {
    appState.fullLexiconLoaded = true;
}

async function loadUserData() {
    if (!lexiconWorker) return;
    lexiconWorker.postMessage({ action: 'loadUserData' });
}

export async function saveUserData() {
    if (!lexiconWorker) return;

    const userState = {
        learnedPreferences,
        localUserSigns,
        homonymMap,
        feedbackMap,
        sentenceFeedbackMap,
        positiveFeedbackMap,
        negativeFeedbackMap,
        questionClarifications,
        appStateOnlineLearningData: appState.onlineLearningData,
    };

    lexiconWorker.postMessage({
        action: 'saveUserData',
        data: { userState }
    });
}

export async function handleImportData(file: File, merge: boolean) {
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            if (typeof event.target?.result !== 'string') {
                throw new Error("File could not be read as text.");
            }
            const data = JSON.parse(event.target.result) as LearningData;
            
            // VALIDERING: Kontrollera schema
            if (!data.schemaVersion || typeof data.schemaVersion !== 'string') {
                throw new Error('Ogiltig datafil: schemaVersion saknas.');
            }
            if (data.newWords && !Array.isArray(data.newWords)) {
                throw new Error('Ogiltig datafil: newWords måste vara en array.');
            }
            if (data.learnedPreferences && typeof data.learnedPreferences !== 'object') {
                throw new Error('Ogiltig datafil: learnedPreferences måste vara ett objekt.');
            }
            console.log('✅ Data-validering lyckades');

            if (merge) {
                data.newWords?.forEach(entry => {
                    localUserSigns.set(entry.lookupKey, { signs: entry.signs, isCompound: entry.isCompound || false });
                });
                if (data.learnedPreferences) {
                    for (const lookupKey in data.learnedPreferences) {
                        if (Object.prototype.hasOwnProperty.call(data.learnedPreferences, lookupKey)) {
                            const currentPrefs = learnedPreferences.get(lookupKey) || new Map<string, number>();
                            const prefData = data.learnedPreferences[lookupKey];
                            if (prefData) {
                                for (const signId in prefData) {
                                    if (Object.prototype.hasOwnProperty.call(prefData, signId)) {
                                        currentPrefs.set(signId, (currentPrefs.get(signId) || 0) + prefData[signId]);
                                    }
                                }
                            }
                            learnedPreferences.set(lookupKey, currentPrefs);
                        }
                    }
                }
                showMessage('Data har sammanfogats.', 'success');
            } else {
                 localUserSigns.clear();
                data.newWords?.forEach(entry => localUserSigns.set(entry.lookupKey, { signs: entry.signs, isCompound: entry.isCompound || false }));
                showMessage('Data har ersatts.', 'success');
            }
            await saveUserData();
        } catch (error) {
            console.error('Error importing data:', error);
            showMessage('Kunde inte importera filen. Kontrollera formatet.', 'error');
        }
    };
    reader.readAsText(file);
}

export async function submitFeedbackData() {
    await performExport(true);
    showMessage('Dina data har sparats och laddats ner för inskick.', 'success');
}

export async function handleExportBackup() {
    await performExport(false);
    showMessage('Säkerhetskopia sparad.', 'success');
}

export const handleSaveOnline = submitFeedbackData;

async function performExport(shouldClearData: boolean) {
    const exportData: LearningData = {
        schemaVersion: "1.0",
        lastUpdated: new Date().toISOString(),
        description: "User feedback export",
        newWords: Array.from(localUserSigns.entries()).map(([key, data]) => ({ 
            lookupKey: key, 
            signs: data.signs,
            ...(data.isCompound && { isCompound: true })
        })),
        modifications: {}, 
        learnedPreferences: {},
        feedbackReports: {
            signFeedback: Array.from(feedbackMap.entries()).map(([cardId, entry]) => ({ cardId, ...entry })),
            sentenceFeedback: Array.from(sentenceFeedbackMap.entries()).map(([sentence, comment]) => ({ sentence, comment })),
            negativeFeedback: Array.from(negativeFeedbackMap.entries()).flatMap(([cardId, map]) => Array.from(map.entries()).map(([signId, entry]) => ({ cardId, signId, ...entry }))),
            positiveFeedback: Array.from(positiveFeedbackMap.entries()).flatMap(([cardId, map]) => Array.from(map.entries()).map(([signId, entry]) => ({ cardId, signId, ...entry })))
        },
        homonymResolutions: {} 
    };

    for (const [key, map] of learnedPreferences) {
        exportData.learnedPreferences[key] = Object.fromEntries(map);
    }
    
    const homonymObj: any = {};
    for (const [key, map] of homonymMap) {
         homonymObj[key] = Array.from(map.entries()).map(([pos, sign]) => ({ pos, sign }));
    }
    exportData.homonymResolutions = homonymObj;

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sts_feedback_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (shouldClearData) {
        clearFeedbackData();
        updateLatestFeedbackJson();
        
        if (isDevMode()) {
            await saveUserData();
        }
        
        const feedbackTabBadge = document.getElementById('feedbackTabBadge');
        if(feedbackTabBadge) feedbackTabBadge.classList.add('hidden');
        
        const aiBtn = document.getElementById('askAiAboutStsBtn');
        if(aiBtn) aiBtn.classList.remove('glow-attention');
    }
}
