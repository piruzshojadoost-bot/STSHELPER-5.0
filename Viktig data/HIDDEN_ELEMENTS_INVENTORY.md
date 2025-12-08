# Inventering av Dolda Element (Hidden)

## Dokumentation av alla dolda HTML-element och CSS-gömda komponenter

Datum: 2025-12-02
Projekt: STS-Helper (Svenskt Teckenspråkslexikon med AI)

---

## KATEGORI 1: ELEMENT MED `hidden` CLASS (Gömd via CSS)

### Modal & Dialog Elements

| ID | Namn | Plats | Typ | Syfte | Aktiveras |
|---|---|---|---|---|---|
| `feedbackTabBadge` | Feedback Tab Badge | modalTemplates.ts:19 | `<span>` | Notification badge för feedback | JavaScript togglar vid feedback |
| `aiChatSearchContainer` | AI Chat Search | modalTemplates.ts:37 | `<div>` | Sökfält för AI-chat | Visas när AI-chat öppnas |
| `aiChatFileInput` | AI Chat File Input | modalTemplates.ts:51 | `<input>` | Dold fil-upload för AI | Aktiveras via knapp |
| `aiFeedbackView` | AI Feedback View | modalTemplates.ts:62 | `<div>` | Feedback-chat vy | Togglas mellan tabs |
| `sunIcon` | Sol-ikon (tema) | modalTemplates.ts:96 | `<svg>` | Sol-ikon för ljust läge | Visas när mörkt tema är aktivt |

### Lexicon & Dictionary Elements

| ID | Namn | Plats | Typ | Syfte | Aktiveras |
|---|---|---|---|---|---|
| `lexiconLoadingOverlay` | Lexikon Loading | modalTemplates.ts:198 | `<div>` | Loading-skärm vid lexikon-hämtning | Visas under nedladdning |
| `lexiconSuggestions` | Lexikon Suggestions | modalTemplates.ts:213 | `<div>` | Sök-förslag i lexikon | Visas när användar skriver |
| `lexiconVideoPlayer` | Lexikon Video Player | modalTemplates.ts:220 | `<video>` | Videouppspelare för lexikon | Visas när ord väljs |
| `lexiconVideoError` | Lexikon Video Error | modalTemplates.ts:221 | `<p>` | Felmeddelande för video | Visas vid video-fel |
| `lexiconVideoGrid` | Lexikon Video Grid | modalTemplates.ts:223 | `<div>` | Grid av teckenvideos | Visas vid sök-resultat |
| `jsonOutputContainer` | JSON Output Container | modalTemplates.ts:241 | `<div>` | JSON-kod display | Visas när JSON-knapp klickas |

### Sign Details & Video Elements

| ID | Namn | Plats | Typ | Syfte | Aktiveras |
|---|---|---|---|---|---|
| `feedbackVideoError` | Feedback Video Error | modalTemplates.ts:281 | `<p>` | Felmeddelande för feedback-video | Visas vid video-fel |
| `signDetailsVideoError` | Sign Video Error | modalTemplates.ts:297 | `<p>` | Felmeddelande för teckenvideo | Visas vid video-fel |
| `signDetailsGlossContainer` | Sign Gloss Container | modalTemplates.ts:311 | `<div>` | Gloss-information för tecken | Visas när data finns |
| `signDetailsKorpusLink` | Korpus Link | modalTemplates.ts:315 | `<a>` | Link till KORPUS-databasen | Visas när körpus-data finns |
| `changeSignSuggestions` | Change Sign Suggestions | modalTemplates.ts:384 | `<div>` | Ord-förslag vid ändring | Visas vid användar-input |

### Feedback & Recording Elements

| ID | Namn | Plats | Typ | Syfte | Aktiveras |
|---|---|---|---|---|---|
| `thumbDownOtherReasonContainer` | Feedback Reason Container | modalTemplates.ts:405 | `<div>` | Container för feedback-anledning | Visas när "Annat" väljs |
| `sentenceFeedbackSuggestions` | Sentence Suggestions | modalTemplates.ts:451 | `<div>` | Mening-förslag vid feedback | Visas vid användar-input |
| `suggestionVideoPreview` | Suggestion Video Preview | modalTemplates.ts:471 | `<video>` | Video-preview för förslag | Visas när video valts |
| `timerDisplay` | Recording Timer | modalTemplates.ts:473 | `<span>` | Tidsmätare för video-inspelning | Visas under inspelning |
| `videoUploadInput` | Video Upload Input | modalTemplates.ts:478 | `<input>` | Dold fil-upload för video | Aktiveras via knapp |
| `stopRecordingButton` | Stop Recording Button | modalTemplates.ts:481 | `<button>` | Stoppa inspelning-knapp | Visas under inspelning |
| `useVideoButton` | Use Video Button | modalTemplates.ts:483 | `<button>` | Använd video-knapp | Visas efter inspelning |
| `retakeVideoButton` | Retake Video Button | modalTemplates.ts:484 | `<button>` | Gör om video-knapp | Visas efter inspelning |
| `alphabetSequenceVideoError` | Alphabet Video Error | modalTemplates.ts:535 | `<p>` | Felmeddelande för alfabet-video | Visas vid video-fel |

### Data Management Elements

| ID | Namn | Plats | Typ | Syfte | Aktiveras |
|---|---|---|---|---|---|
| `importMergeDataInput` | Import Merge Data Input | modalTemplates.ts:568 | `<input>` | Dold fil-upload för data-merge | Aktiveras via knapp |
| `importDataInput` | Import Data Input | modalTemplates.ts:573 | `<input>` | Dold fil-upload för data-import | Aktiveras via knapp |
| `groupReplaceSuggestions` | Group Replace Suggestions | modalTemplates.ts:617 | `<div>` | Förslag för grupp-ersättning | Visas vid användar-input |
| `groupReplacePreview` | Group Replace Preview | modalTemplates.ts:619 | `<div>` | Preview av grupp-ersättning | Visas vid användar-input |

---

## KATEGORI 2: ELEMENT MED `display: none` (Gömd via Inline CSS)

### Diagnostic & Report Elements

| ID | Namn | Plats | Typ | Syfte | Aktiveras |
|---|---|---|---|---|---|
| `liveProgressArea` | Live Progress Area | modalTemplates.ts:677 | `<div>` | Live progress under diagnostik | Visas under test-körning |
| `finalReportSummary` | Final Report Summary | modalTemplates.ts:686 | `<div>` | Sammanfattning av test-resultat | Visas när test är klart |
| `finalReportDetails` | Final Report Details | modalTemplates.ts:690 | `<div>` | Detaljerade test-resultat | Visas när test är klart |

---

## KATEGORI 3: KODADE MEN INTE SYNLIGA ELEMENT

### Missing UI Elements (refererade i kod men inte i HTML)

| ID | Namn | Refererad i | Status | Typ | Syfte |
|---|---|---|---|---|---|
| `glosaToggle` | GLOSA Beta Toggle | init.ts:87 | ❌ MISSING | `<input>` checkbox | Beta-toggle för GLOSA-funktioner |
| `devModeToggle` | Developer Mode Toggle | init.ts:122 | ❌ MISSING | `<input>` checkbox | Utvecklar-läge (inte för användare) |
| `betaFeaturesMenu` | Beta Features Menu | init.ts:86 | ❌ MISSING | `<div>` | Meny för beta-funktioner |

---

## KATEGORI 4: DYNAMISK DOLNING VIA JAVASCRIPT

### Visibility Toggles i Handlers

| Använd | Fil | Rad | Handling | Element |
|---|---|---|---|---|
| `classList.toggle('hidden')` | inputHandlers.ts | 348 | Togglar meny synlighet | `menuDiv` |
| `classList.add('hidden')` | inputHandlers.ts | 244 | Gömmer modal | `glosaFeedbackModal` |
| `classList.add('hidden')` | inputHandlers.ts | 356-392 | Gömmer dropdown-menyer | Flera menyer |
| `classList.remove('hidden')` | navHandlers.ts | 101-102 | Visar video-container | `videoDisplayContainer`, `toolsAndActionsContainer` |
| `classList.add('hidden')` | reset.ts | 28-30 | Gömmer UI vid reset | Video-controls, containers |
| `classList.remove('hidden')` | init.ts | 68 | Visar quota-modal | `quotaModal` |
| `classList.add('hidden')` | init.ts | 74, 80 | Gömmer quota-modal | `quotaModal` |
| `classList.toggle('hidden')` | init.ts | 93, 108, 114 | Togglar UI-element | `betaMenu`, `glosaBtn` |

---

## KATEGORI 5: TILLFÄLLIGA ELEMENT (Avsiktligt dolda, visas vid behov)

Dessa är **normalt dolda** och aktiveras dynamiskt:
- ✅ File input elements (behöver dolda för att fungera)
- ✅ Error message containers (visas vid fel)
- ✅ Loading overlays (visas under hämtning)
- ✅ Suggestion dropdowns (visas vid användar-input)
- ✅ Recording controls (visas under video-inspelning)
- ✅ Report elements (visas när diagnostik är klart)

---

## SAMMANFATTNING

### Totalt antal dolda element: **40+**

**Uppdelning:**
- Med `hidden` class: **26 element**
- Med `display: none`: **3 element**
- Kodade men saknas i HTML: **3 element**
- Dynamiska JavaScript toggles: **8+ references**
- Tillfälliga/avsiktligt dolda: **Många**

### Kritiska Problem:
1. ❌ `glosaToggle` - Refererad i init.ts men INTE i HTML
2. ❌ `devModeToggle` - Refererad i init.ts men INTE i HTML  
3. ❌ `betaFeaturesMenu` - Refererad i init.ts men INTE i HTML

### Rekommendationer:
- `glosaToggle` och `devModeToggle` bör antingen:
  - Läggas till i HTML (som AI-toggle gjordes)
  - ELLER tas bort från JavaScript-koden om de inte behövs

---

## Uppdateringshistorik

| Datum | Ändringar |
|---|---|
| 2025-12-02 | Första inventering - 40+ dolda element dokumenterade |
| 2025-12-02 | AI-toggle gjord synlig i Inställningar/Avancerat |
