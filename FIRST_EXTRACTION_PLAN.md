# FIRST_EXTRACTION_PLAN.md

Syfte: Identifiera och planera den första konkreta extraktionen med minimal risk enligt MIGRATION_PLAN.md.

---

## Vald extraktion: Data-fetch och parsing för Korpus.json

### Motivering
- Fetch och parsing av Korpus.json är isolerad logik som används för att ladda korpusdata till modalen.
- Ingen affärslogik eller UI påverkas direkt av denna extraktion.
- Kan flyttas till en dedikerad data-service utan att ändra appens beteende.

---

## Berörda filer
- `src/modules/korpus/korpusModal.ts` (eller motsvarande modul där fetch sker)

---

## Vad som flyttas
- All kod som ansvarar för att hämta och parsa Korpus.json extraheras till en ny fil:
  - Ny fil: `src/services/data/korpusDataService.ts`
- Denna service ska endast ansvara för att hämta, parsa och returnera korpusdata.
- Övrig logik (sökning, rendering, UI) lämnas orörd.

---

## Plan
1. Skapa filen `src/services/data/korpusDataService.ts`.
2. Flytta fetch- och parsinglogik för Korpus.json från `korpusModal.ts` till den nya service-filen.
3. Uppdatera import/anrop i `korpusModal.ts` så att den använder data-servicen.
4. Testa att UI och beteende är oförändrat.

---

## Notering
- Ingen annan logik, UI eller data påverkas.
- Endast fetch/parsing för Korpus.json flyttas.
- Minimal risk för regression.
