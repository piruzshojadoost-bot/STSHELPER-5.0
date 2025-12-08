// Grammar Rules Hook - Använder teckenspråks-grammatik för bessre överättning

interface FilterRules {
  ignoreWords: {
    stopwords: string[];
    articles: string[];
    copula: string[];
    prepositions: string[];
    conjunctions: string[];
  };
  priorityWords: {
    categories: {
      nouns: boolean;
      verbs: boolean;
      adjectives: boolean;
      adverbs: boolean;
      questionWords: string[];
    };
  };
  contextWords: {
    timeWords: string[];
    locationWords: string[];
    negationWords: string[];
    quantifiers: string[];
  };
  addWords: {
    facial_markers: string[];
    emphasizers: string[];
    clarifiers: string[];
  };
}

interface GrammarRules {
  wordOrder: {
    rules: Array<{
      id: string;
      name: string;
      priority: number;
    }>;
  };
  wordRemoval: {
    categories: {
      articles: string[];
      copula: string[];
      prepositions_optional: string[];
      conjunctions_optional: string[];
      pronouns_implied: string[];
    };
  };
}

let filterRules: FilterRules | null = null;
let grammarRules: GrammarRules | null = null;

export async function loadGrammarRules() {
  try {
    if (!filterRules) {
      const res = await fetch('/data/word-filters.json');
      const data = await res.json();
      filterRules = data.filterRules;
    }
    if (!grammarRules) {
      const res = await fetch('/data/glosa/god_glossing.json');
      const data = await res.json();
      grammarRules = data.grammarRules;
    }
  } catch (error) {
    console.warn('Kunde inte ladda grammar-regler:', error);
  }
}

export function filterWordsForSignLanguage(words: string[]): string[] {
  if (!filterRules) return words;

  const ignoreSet = new Set<string>(
    filterRules.ignoreWords.stopwords.map(w => w.toLowerCase())
  );
  const contextWords = new Set<string>(
    [
      ...filterRules.contextWords.timeWords,
      ...filterRules.contextWords.locationWords,
      ...filterRules.contextWords.negationWords,
      ...filterRules.contextWords.quantifiers
    ].map(w => w.toLowerCase())
  );

  return words.filter(word => {
    const lowerWord = word.toLowerCase();
    // Behåll kontext-ord och frågeord
    if (contextWords.has(lowerWord)) return true;
    if (filterRules!.priorityWords.categories.questionWords.includes(lowerWord))
      return true;
    // Filtrera bort stopwords
    if (ignoreSet.has(lowerWord)) return false;
    // Behåll allt annat
    return true;
  });
}

export function reorderForSignLanguage(words: string[]): string[] {
  // Enkelt exempel: Placera tidsord först
  if (!filterRules) return words;

  const timeWords: string[] = [];
  const contextWords: string[] = [];
  const otherWords: string[] = [];

  const timeSet = new Set(
    filterRules.contextWords.timeWords.map(w => w.toLowerCase())
  );
  const contextSet = new Set(
    filterRules.contextWords.locationWords.map(w => w.toLowerCase())
  );

  words.forEach(word => {
    const lowerWord = word.toLowerCase();
    if (timeSet.has(lowerWord)) timeWords.push(word);
    else if (contextSet.has(lowerWord)) contextWords.push(word);
    else otherWords.push(word);
  });

  // Ordföljd för teckenspråk: TIDSORD -> KONTEXT -> ÖVRIGA
  return [...timeWords, ...contextWords, ...otherWords];
}

export function applySignLanguageTransformation(
  swedishText: string
): { filtered: string[]; reordered: string[] } {
  const words = swedishText.split(/\s+/).filter(w => w.length > 0);
  const filtered = filterWordsForSignLanguage(words);
  const reordered = reorderForSignLanguage(filtered);

  return {
    filtered: words.filter(w =>
      filtered.some(f => f.toLowerCase() === w.toLowerCase())
    ),
    reordered
  };
}

export type { FilterRules, GrammarRules };
