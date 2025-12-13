# CURRENT_ARCHITECTURE_BLUEPRINT.md

## Arkitekturöversikt

STSHELPER-5.0 är en frontend-baserad applikation byggd i TypeScript och React, med Vite som byggverktyg. All logik och datahantering sker i frontend. Ingen backend eller databas används – all data ligger i statiska JSON-filer. Appen är en SPA (Single Page Application) utan routing.

## Ansvarsfördelning

- **components/**: React-komponenter för UI och interaktion (t.ex. GlosaSearch, Loader, VideoGrid, modaler).
- **hooks/**: Custom React hooks för datahantering, AI, grammatik, lexikon och taligenkänning.
- **modules/**: Funktionella moduler för features och affärslogik (genuina tecken, korpus, glossning, feedback, modals, UI-helpers).
- **services/**: Hjälptjänster för UI, media, data, system och notifikationer.
- **styles/**: CSS-filer för olika delar av appen.
- **utils/**: Hjälpfunktioner (t.ex. sortering, textutils).

## Mapp- och filstruktur (med ansvar)

```
/ai_prompts/         # AI-agentens promptfiler
/data/               # Datafiler (korpus, glosa, användardata)
/minne/              # Kopior/backuper av komponenter
/public/             # Publika JSON-filer (genuina_tecken, lexikon, user)
/src/
  components/        # React-komponenter (UI, modaler, video, loader)
  hooks/             # Custom hooks (AI, data, grammatik, taligenkänning)
  modules/           # Funktionella moduler (features, logik, modals, glossing, korpus)
  services/          # Hjälptjänster (UI, media, data, system)
  styles/            # CSS-filer
  utils/             # Hjälpfunktioner
  ui.ts              # Central UI-export och initiering
index.html           # Huvud-HTML, knappar, modaler, root
index.tsx            # React entrypoint
```

## Data (JSON) som "databas"
- Alla datafiler (t.ex. Korpus.json, genuina_tecken.json) ligger i /data/ eller /public/data/.
- Data laddas via fetch och används direkt i frontend.
- Ingen relationshantering eller databas – endast statiska JSON-filer.

## UI, modaler och features
- Knappar i index.html är kopplade till modaler via id:n.
- Modaler (t.ex. genuina tecken, korpus) renderas och styrs av moduler i src/modules/.
- Sökning, glossning och video är hårt kopplade till respektive JSON-fil och UI-komponent.

## Hårda kopplingar
- UI-knappar är direkt kopplade till modallogik via id:n.
- Sökfunktioner är direkt kopplade till specifika JSON-filer.
- Video-URL:er genereras enligt fast mönster utifrån data i Korpus.json.
- Ingen lös koppling mellan data, logik och UI – allt är integrerat i frontend.
