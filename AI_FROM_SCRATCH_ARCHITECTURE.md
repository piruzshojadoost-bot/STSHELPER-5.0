# AI_FROM_SCRATCH_ARCHITECTURE.md

## Designfilosofi

- Separation av ansvar: UI, logik och datahantering ska vara tydligt åtskilda.
- Modulär och underhållbar kodbas.
- Tydliga lager: presentation, domänlogik, datalager.
- Lätt att testa, utöka och AI-integrera.

## Ny arkitektur

- **Presentation/UI-lager:** Endast React-komponenter och hooks för visning och interaktion.
- **Domänlogik-lager:** All affärslogik (glossing, korpus-sök, genuina tecken, video) i separata tjänster/moduler.
- **Datalager:** All dataåtkomst (fetch, parsing, caching) i dedikerade data-tjänster.
- **Konfigurationslager:** Centralt för konstanter, URL-mönster, etc.

## Ny mapp- och filstruktur

```
/src/
  app/                  # App.tsx, entrypoint
  components/           # Endast UI-komponenter (rena, stateless)
  hooks/                # Endast UI-relaterade hooks
  features/
    korpus/             # Korpus-modal, sök, video, tests
    genuina/            # Genuina tecken-modal, logik, tests
    glossing/           # Glossing-funktionalitet, tests
  services/
    data/               # Data-tjänster (fetch, parse, cache)
    domain/             # Affärslogik-tjänster (korpus, genuina, glossing)
    ui/                 # UI-tjänster (notifiering, modals, feedback)
  config/               # Konstanter, URL-mönster, settings
  styles/               # CSS
  utils/                # Hjälpfunktioner
  tests/                # Centrala tester
public/
  data/                 # Endast JSON/datafiler
```

## Separation av språklogik, glossing, korpus, video
- Varje feature (korpus, genuina, glossing) har egen mapp med UI, logik och tester.
- Video-URL och rendering hanteras av dedikerad service.
- Data-tjänster ansvarar för all dataåtkomst och parsing.

## Underhållbarhet och AI-vänlighet
- Tydliga gränssnitt mellan lager.
- All logik testbar och isolerad.
- Lätt att byta ut eller utöka features.
- AI kan enkelt interagera med domänlogik och data via tjänster.

## Jämförelse mot CURRENT_ARCHITECTURE_BLUEPRINT.md
- Nuvarande kod har hårda kopplingar mellan UI, logik och data – nya arkitekturen separerar dessa lager.
- Features är nu isolerade och modulära, inte utspridda över flera mappar.
- Datahantering är centraliserad, inte direkt i UI eller moduler.
- Testbarhet och utbyggbarhet är förbättrad.
- Samma funktionalitet, men mycket tydligare struktur och ansvar.
