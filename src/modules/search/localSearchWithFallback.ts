
// src/modules/search/localSearchWithFallback.ts
// Lokal sökmodul med säker lemma, suffix, compounds och AI-fallback.
// - Lokal sökning följer strikt prioritet: exact → inflections → alias → suffix → compound → fuzzy
// - Fuzzy är skyddad: samma första bokstav krävs + max 1-2 distance + förhindrar "ord-i-ord"-träffar
// - Renderar och returnerar kandidat(er) men ändrar aldrig originaltext automatiskt
// - Exporterar: doLocalSearch(text), findCandidatesForToken(token), initLocalSearch(opts)

import { WordMapEntry, Sign } from '../../types';
import {
  localLexiconMap,    // Map<string, Sign[]>
  aliasMap,           // Map<string, string>
  searchableLexicon,  // string[] (sorted list of keys)
  inflectionMap,      // Map<string, string> (ordform -> lemma)
  signInflectionMap,  // Map<string, string> (gloss variations -> base gloss)
  localUserSigns,     // Map<string, Sign[]> (Användarens egna/inlärda tecken)
  learnedPreferences  // Map<string, Map<string, number>> (Användarens preferenser för tecken)
} from '../../state';

import { safeDistance } from '../../utils'; // valfri, men vi inkluderar fallback implementation nedan

type Candidate = {
  signs: Sign[] | null;
  base: string;                // the base word we matched (lemma or key)
  method: string;              // rationale
  isCompound?: boolean;
  parts?: string[];            // if compound, parts
};

type InitOptions = {
  // Optionally provide an AI fallback function: async (token: string, context: string) => Candidate | null
  aiFallback?: (token: string, context: string) => Promise<Candidate | null>;
  // Optionally disable fuzzy
  enableFuzzy?: boolean;
  // Minimal fuzzy length
  fuzzyMinLength?: number;
};

let AI_FALLBACK: InitOptions['aiFallback'] | null = null;
let ENABLE_FUZZY = true;
let FUZZY_MIN_LENGTH = 4;

// Lokal sökcache för att undvika upprepade beräkningar (LRU strategy)
const localSearchCache = new Map<string, Candidate | null>();
const cacheAccessOrder: string[] = []; // Track access order for LRU
const MAX_CACHE_SIZE = 500; // Begränsa cache-storlek

// Export function to clear cache when lexicon/inflection map updates
export function clearLocalSearchCache() {
    localSearchCache.clear();
    cacheAccessOrder.length = 0;
    console.log('🗑️ Local search cache cleared');
}

// ---------- Configuration / safe lists ----------
const SAFE_SUFFIXES = [
  // order matters: longer suffixes first
  'ningen', 'andet', 'elsen', // längsta först
  'ande', 'ende', 'arna', 'erna', 'orna', // plurals / participles
  'aste', 'are', 'ers', 'ens',
  'else', 'het', 'ade', 'ade', // NYTT: vanliga svenska suffix
  // common short suffixes (be conservative)
  'ar', 'er', 'or', 'en', 'et', 'na', 't', 'n', 's', 'a', 'as', 'es', 'ad', 'at', 'dd'
].sort((a, b) => b.length - a.length); // ensure longer tried first

// Prevent stripping if root would be too short
const MIN_ROOT_LENGTH = 2;

// ---------- Normalization (preserve åäö) ----------
function normalizeForLookup(s: string) {
  // Lowercase using locale (sv) to preserve åäö properly
  return s.trim().toLowerCase();
}

// ---------- Levenshtein (fallback safeDistance) ----------
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array(n + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return dp[n];
}

// safeDistance wrapper: prefer safeDistance util if available
function _safeDistance(a: string, b: string): number {
  try {
    // if project provides safeDistance that respects diacritics, use it
    // @ts-ignore
    if (typeof safeDistance === 'function') return safeDistance(a, b);
  } catch (e) { /* ignore */ }
  return levenshtein(a, b);
}

// ---------- Fuzzy rules to avoid bad matches ----------
function fuzzyAllowed(candidate: string, token: string, distance: number): boolean {
  if (!candidate || !token) return false;
  // Must share first letter exactly (diacritics included)
  if (candidate[0] !== token[0]) return false;
  // FÖRBÄTTRAD LOGIK: För ord >= 4 tecken, om andra bokstaven skiljer sig, kräv exakt match (distance = 0)
  if (token.length >= 4 && candidate.length >= 2) {
    if (candidate[1] !== token[1]) {
      return distance === 0; // Tillåt om perfekt match trots andra bokstav-skillnad
    }
  }
  // prevent substring traps: do not accept candidate if candidate contains token or token contains candidate
  // unless they are highly similar (distance 0 or 1) and lengths are similar
  if ((candidate.includes(token) || token.includes(candidate)) && Math.abs(candidate.length - token.length) > 1) {
    return false;
  }
  return true;
}

// ---------- Utility: sort signs by user preferences (tumme upp) ----------
function sortSignsByPreference(signs: Sign[], lookupKey: string): Sign[] {
  if (!learnedPreferences.has(lookupKey)) {
    return signs; // Ingen preferens, returnera som de är
  }
  
  const preferences = learnedPreferences.get(lookupKey)!;
  const sorted = [...signs].sort((a, b) => {
    const weightA = preferences.get(a.id) || 0;
    const weightB = preferences.get(b.id) || 0;
    return weightB - weightA; // Högre weight först
  });
  
  return sorted;
}

// ---------- Utility: look in local lexicon map safely ----------
function getSignsForKey(key: string): { signs: Sign[], isCompound?: boolean } | null {
  const k = normalizeForLookup(key);
  
  // 1. Check user-defined/learned signs FIRST (This fixes the issue with "det" -> "den")
  if (localUserSigns.has(k)) return localUserSigns.get(k)!;

  // 2. Check standard lexicon
  if (localLexiconMap.has(k)) return { signs: localLexiconMap.get(k)!, isCompound: false };
  
  return null;
}

// ---------- Main candidate finder for a single token ----------
export async function findCandidatesForToken(tokenRaw: string): Promise<Candidate | null> {
  const token = normalizeForLookup(tokenRaw);
  if (!token) return null;

  // 0. If token is punctuation / whitespace: return null (handled by caller)
  if (/^[\s,."!?;:+\-–—()]+$/.test(tokenRaw)) return null;
  
  // 0.5. Check cache first (with LRU update)
  if (localSearchCache.has(token)) {
    const cached = localSearchCache.get(token)!;
    // Update access order for LRU
    const idx = cacheAccessOrder.indexOf(token);
    if (idx > -1) cacheAccessOrder.splice(idx, 1);
    cacheAccessOrder.push(token);
    return cached;
  }

  // 1️⃣ Exact match (highest priority)
  const exactMatch = getSignsForKey(token);
  if (exactMatch) {
    // Sortera tecken baserat på användarens preferenser (tumme upp)
    const sortedSigns = sortSignsByPreference(exactMatch.signs, token);
    const result = { signs: sortedSigns, base: token, method: 'Exakt match', isCompound: exactMatch.isCompound };
    localSearchCache.set(token, result);
    return result;
  }

  // 2️⃣ Lemma via inflectionMap (Swedish inflections)
  if (inflectionMap) {
    // Testa BÅDE token och lowercase version
    const tokensToCheck = [token, token.toLowerCase()];
    for (const checkToken of tokensToCheck) {
      if (inflectionMap.has(checkToken)) {
        const lemma = inflectionMap.get(checkToken)!;
        const lemmaMatch = getSignsForKey(lemma);
        if (lemmaMatch) {
          // Sortera tecken baserat på användarens preferenser
          const sortedSigns = sortSignsByPreference(lemmaMatch.signs, lemma);
          const result = { signs: sortedSigns, base: lemma, method: `Lemma (inflections) ${checkToken}→${lemma}`, isCompound: lemmaMatch.isCompound };
          localSearchCache.set(token, result);
          return result;
        }
        // NYTT: Om lemma finns men inget tecken hittades, returnera ändå lemma (förhindrar felaktig orddelning)
        // T.ex. "förstår" → "förstå" även om "förstå" inte finns i lexikon ännu
        const result = { signs: null, base: lemma, method: `Lemma (inflections, inget tecken) ${checkToken}→${lemma}`, isCompound: false };
        localSearchCache.set(token, result);
        return result;
      }
    }
  }

  // 2.5️⃣ Sign language gloss variations (teckenspråks-varianter)
  if (signInflectionMap && signInflectionMap.has(token)) {
    const baseGloss = signInflectionMap.get(token)!;
    const glossMatch = getSignsForKey(baseGloss);
    if (glossMatch) {
      const sortedSigns = sortSignsByPreference(glossMatch.signs, baseGloss);
      const result = { signs: sortedSigns, base: baseGloss, method: `Gloss variant (teckenspråk) ${token}→${baseGloss}`, isCompound: glossMatch.isCompound };
      localSearchCache.set(token, result);
      return result;
    }
  }

  // 3️⃣ Alias / forkortning (local aliasMap contains mapping token -> targetKey)
  if (aliasMap && aliasMap.has(token)) {
    const aliasTarget = aliasMap.get(token)!;
    const aliasMatch = getSignsForKey(aliasTarget);
    if (aliasMatch) {
      const sortedSigns = sortSignsByPreference(aliasMatch.signs, aliasTarget);
      return { signs: sortedSigns, base: aliasTarget, method: `Alias (${token}→${aliasTarget})`, isCompound: aliasMatch.isCompound };
    }
  }

  // 4️⃣ Suffix-strippning (try safe list)
  for (const suf of SAFE_SUFFIXES) {
    if (token.endsWith(suf) && token.length > suf.length + MIN_ROOT_LENGTH) {
      const root = token.slice(0, -suf.length);
      // ensure root fairly short? we already check MIN_ROOT_LENGTH
      const rootMatch = getSignsForKey(root);
      if (rootMatch) {
        const sortedSigns = sortSignsByPreference(rootMatch.signs, root);
        return { signs: sortedSigns, base: root, method: `Suffix-avklipp (-${suf})`, isCompound: rootMatch.isCompound };
      }
    }
  }

  // 5️⃣ Sammansatta ord (split heuristics) — try longest left part first
  // VIKTIGT: Hoppa över orddelning om ordet finns i inflectionMap (t.ex. "förstår" ska INTE bli "först+år")
  const hasInflection = inflectionMap && (inflectionMap.has(token) || inflectionMap.has(token.toLowerCase()));
  if (!hasInflection) {
    // We'll try split positions from longest left to shortest left but keep both parts >=2
    for (let i = token.length - 2; i >= 2; i--) {
      const left = token.slice(0, i);
      const right = token.slice(i);
      if (left.length < 2 || right.length < 2) continue;

      // Check if both parts exist as keys
      const leftMatch = getSignsForKey(left);
      const rightMatch = getSignsForKey(right);
      
      if (leftMatch && rightMatch) {
          // Sortera båda delarna baserat på preferenser
          const sortedLeft = sortSignsByPreference(leftMatch.signs, left);
          const sortedRight = sortSignsByPreference(rightMatch.signs, right);
          // Return combination (both parts)
          return { 
              signs: [...sortedLeft, ...sortedRight], 
              base: `${left}+${right}`, 
              method: 'Sammansatt ord', 
              isCompound: true, 
              parts: [left, right] 
          };
      }
    }
  }


  // 6️⃣ Fuzzy DISABLED - Testing without fuzzy matching for performance
  // If fuzzy is needed, can be re-enabled by setting ENABLE_FUZZY = true
  // This improves search performance significantly for correctly spelled words

  // 7️⃣ Ingen lokal kandidat
  localSearchCache.set(token, null);
  cacheAccessOrder.push(token);
  
  // Begränsa cache-storlek (LRU - ta bort minst nyligen använd)
  if (localSearchCache.size > MAX_CACHE_SIZE && cacheAccessOrder.length > 0) {
    const lruKey = cacheAccessOrder.shift();
    if (lruKey) localSearchCache.delete(lruKey);
  }
  
  return null;
}

// ---------- Top-level search: process text, keep whitespace & punctuation ----------
export async function doLocalSearch(text: string): Promise<WordMapEntry[]> {
    if (text == null) text = '';
    
    // FÖRBÄTTRAD NORMALISERING:
    // 1. Ta bort extra whitespace
    text = text.replace(/\s+/g, ' ').trim();
    // 2. Normalisera skiljetecken (mellanslag före/efter)
    text = text.replace(/\s*([.,!?;:])\s*/g, '$1 ').trim();
    
    // Importera genuina tecken service
    const { genuinaTeckenService } = await import('../genuina/genuinaTeckenService');
    
    const out: WordMapEntry[] = [];
    const tokensAndDelimiters = text.split(/(\s+|[.,!?;:"()]+)/g).filter(Boolean);
    const MAX_PHRASE_LENGTH = 4; // Max number of words to check for a phrase

    let i = 0;
    while (i < tokensAndDelimiters.length) {
        const currentToken = tokensAndDelimiters[i];

        // If it's a delimiter, just add it and move on.
        if (/^[\s\.,!?:;"()]+$/.test(currentToken)) {
            out.push({ original: currentToken, base: currentToken, isWord: false, pos: 'PUNCT', signs: null });
            i++;
            continue;
        }

        let matchFound = false;
        // Start checking for the longest possible multi-word phrase from the current position.
        for (let phraseLen = MAX_PHRASE_LENGTH; phraseLen > 1; phraseLen--) {
            const requiredTokensCount = (phraseLen * 2) - 1;
            if (i + requiredTokensCount > tokensAndDelimiters.length) {
                continue; // Not enough tokens to form this phrase length
            }

            const phraseTokens: string[] = [];
            for (let j = 0; j < phraseLen; j++) {
                phraseTokens.push(tokensAndDelimiters[i + j * 2]);
            }
            
            const phraseKey = normalizeForLookup(phraseTokens.join(' '));
            
            // 🌟 NYTT: Kolla först om det är ett genuint tecken
            const genuintTecken = genuinaTeckenService.find(phraseTokens.join(' '));
            if (genuintTecken && genuinaTeckenService.isLoaded()) {
                const originalPhrase = tokensAndDelimiters.slice(i, i + requiredTokensCount).join('');
                
                // Använd tecken-ID från genuint tecken
                out.push({
                    original: originalPhrase,
                    base: phraseKey,
                    isWord: true,
                    pos: '',
                    signs: [{ id: genuintTecken.id, word: genuintTecken.tecken }],
                    isCompound: false,
                    rationale: `Genuint tecken: ${genuintTecken.tecken}`,
                    isGenuine: true, // Flagga för att visa badge
                    genuineTeckenId: genuintTecken.id
                });

                i += requiredTokensCount;
                matchFound = true;
                break;
            }
            
            // Annars kolla vanlig lexikon-match
            const signs = getSignsForKey(phraseKey);
            
            if (signs) {
                const originalPhrase = tokensAndDelimiters.slice(i, i + requiredTokensCount).join('');
                
                out.push({
                    original: originalPhrase,
                    base: phraseKey,
                    isWord: true,
                    pos: '',
                    signs: signs.signs,
                    isCompound: signs.isCompound || false,
                    rationale: `Frasmatch (${phraseKey})`
                });

                i += requiredTokensCount;
                matchFound = true;
                break;
            }
        }

        // If no multi-word phrase was found, process the current single token.
        if (!matchFound) {
            const cand = await findCandidatesForToken(currentToken);
            if (cand) {
                out.push({
                    original: currentToken,
                    base: cand.base,
                    isWord: true,
                    pos: '',
                    signs: cand.signs,
                    isCompound: !!cand.isCompound,
                    rationale: cand.method
                });
            } else {
                 // Kontrollera om AI är aktiverat innan vi använder fallback
                 const { appState } = await import('../../state');
                 if (AI_FALLBACK && appState.aiEnabled) {
                    try {
                      const aiCand = await AI_FALLBACK(currentToken, text);
                      if (aiCand) {
                        out.push({
                          original: currentToken, base: aiCand.base, isWord: true, pos: '',
                          signs: aiCand.signs, isCompound: !!aiCand.isCompound, rationale: `AI-fallback: ${aiCand.method}`
                        });
                        i++; 
                        continue;
                      }
                    } catch (e) { console.warn('AI fallback error', e); }
                 }
                 out.push({ original: currentToken, base: normalizeForLookup(currentToken), isWord: true, pos: '', signs: null, isCompound: false, rationale: 'Ingen träff' });
            }
            i++;
        }
    }

    return out;
}


// ---------- Initialization helper ----------
export function initLocalSearch(options?: InitOptions) {
  if (!options) options = {};
  AI_FALLBACK = options.aiFallback ?? null;
  ENABLE_FUZZY = options.enableFuzzy ?? true;
  FUZZY_MIN_LENGTH = options.fuzzyMinLength ?? 4;
}

// ---------- Small test helper (local quick test) ----------
export async function quickTestSample() {
  const sample = 'Hur mår du? Fåglarna sjunger. Jag älskar att lära ut böcker.';
  const res = await doLocalSearch(sample);
  console.table(res.map(r => ({ original: r.original, base: r.base, rationale: r.rationale })));
  return res;
}

// Export types (for consumer)
export type { Candidate };
