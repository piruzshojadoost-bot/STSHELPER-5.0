// src/modules/features/glossingEngine.ts

const QUESTION_WORDS = ["vad", "hur", "vem", "var", "när", "varför", "vilken", "vilket", "vilka"];
const STOPWORDS = ["att", "och", "en", "ett", "den", "det", "som", "på", "i", "av", "till", "för", "med", "om", "från"];
const LEMMA_MAP: Record<string, string> = {
    "heter": "HETA",
    "är": "VARA",
    "gick": "GÅ",
    "barnen": "BARN",
    "vill": "VILL",
    "ska": "SKA",
    "har": "HA",
    "gjorde": "GÖRA",
    "kommer": "KOMMA",
    "mår": "MÅ",
    "bor": "BO",
    "åker": "ÅKA",
    "säger": "SÄGA",
    "finns": "FINNAS"
    // ...lägg till fler vid behov
};
const NUMBER_WORDS: Record<string, string> = {
    "ett": "1", "två": "2", "tre": "3", "fyra": "4", "fem": "5", "sex": "6", "sju": "7", "åtta": "8", "nio": "9", "tio": "10"
};

function glossBasic(svenska: string): { standard: string, alternative: string } {
    let words = svenska.trim().replace(/[?!.]/g, "").split(/\s+/);

    // Lemmatisera, hantera siffror, filtrera småord
    let glossWords = words
        .filter(w => !STOPWORDS.includes(w.toLowerCase()))
        .map(w => {
            if (NUMBER_WORDS[w.toLowerCase()]) return NUMBER_WORDS[w.toLowerCase()];
            if (LEMMA_MAP[w.toLowerCase()]) return LEMMA_MAP[w.toLowerCase()];
            return w.toUpperCase();
        });

    // Hitta frågeord
    const qIndex = glossWords.findIndex(w => QUESTION_WORDS.includes(w.toLowerCase()));
    let standard, alternative;
    if (qIndex !== -1) {
        const qWord = glossWords.splice(qIndex, 1)[0];
        glossWords.push(qWord); // Frågeord sist
        standard = glossWords.join(" ");
        alternative = [qWord, ...glossWords.slice(0, -1)].join(" ");
    } else {
        standard = glossWords.join(" ");
        alternative = standard;
    }

    return { standard, alternative };
}

export { glossBasic };
