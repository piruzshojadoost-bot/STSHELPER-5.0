# MIGRATION_PLAN.md

Syfte: Stegvis migrera STSHELPER-5.0 från nuvarande arkitektur (se CURRENT_ARCHITECTURE_BLUEPRINT.md) till den nya, modulära strukturen (se AI_FROM_SCRATCH_ARCHITECTURE.md) utan stora omskrivningar i ett steg.

---

## Steg 1: Förberedelse och inventering (Lågrisk)
- Skapa nya mappar enligt nya strukturen: `features/`, `services/data/`, `services/domain/`, `config/`, `tests/`.
- Lämna all befintlig kod orörd.

## Steg 2: Flytta och isolera datahantering (Lågrisk)
- Flytta all data-fetch och parsing från UI/moduler till nya `services/data/`.
- Exempel: Bryt ut fetch-logik för Korpus.json, genuina_tecken.json till egna data-tjänster.
- Filer som påverkas: kod i `src/modules/korpus/`, `src/modules/genuina/`, `src/components/GlosaSearch.tsx`.

## Steg 3: Isolera domänlogik (Mellanrisk)
- Flytta affärslogik (sökning, glossing, video-URL-generering) till `services/domain/`.
- Exempel: Bryt ut glossing-funktioner från `modules/features/glossingEngine.ts` till domänservice.
- Filer som påverkas: `modules/features/`, `modules/korpus/`, `modules/genuina/`.

## Steg 4: Refaktorera UI-komponenter (Högrisk)
- Gör UI-komponenter (i `components/`) stateless och flytta all logik till hooks eller services.
- Använd endast props och hooks för data och actions.
- Filer som påverkas: `components/GlosaSearch.tsx`, `components/VideoGrid.tsx`, modalkomponenter.

## Steg 5: Inför nya hooks och feature-mappar (Lågrisk)
- Skapa hooks i `hooks/` som endast anropar services/data/domain.
- Skapa feature-mappar (t.ex. `features/korpus/`) och flytta relaterade UI, logik och tester dit.
- Filer som påverkas: hooks, moduler, komponenter.

## Steg 6: Centralisera konfiguration (Lågrisk)
- Flytta konstanter, URL-mönster och settings till `config/`.
- Filer som påverkas: alla som använder hårdkodade strängar/URL:er.

## Steg 7: Sammanfoga och rensa (Högrisk)
- Ta bort gamla mappar och filer när all funktionalitet är migrerad och testad.
- Säkerställ att alla beroenden är uppdaterade och att inga cirkulära beroenden finns kvar.

---

## Riskbedömning
- **Lågrisk:** Skapa mappar, flytta isolerad datahantering, införa hooks, centralisera konfiguration.
- **Mellanrisk:** Flytta domänlogik, bryta ut logik från moduler.
- **Högrisk:** Refaktorera UI-komponenter, ta bort gamla mappar, säkerställa att hela appen fungerar efter större flyttar.

---

## Noteringar
- Migrera modul för modul, testa varje steg.
- Lämna orörda filer tills deras ansvar flyttats.
- Dokumentera varje steg och verifiera funktionalitet innan nästa steg.
