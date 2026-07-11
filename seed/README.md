# Atlas seed

`atlas.yaml` contains the ten visible top-level knowledge areas, the system relation grammar, and the deliberately curated first learning route. Its 15 route concepts are honest drafts: their concise definitions orient the route, but they are not presented as reviewed source-backed synthesis.

Validate it with:

```bash
pnpm seed:validate
```

The importer validates references, aliases, hierarchy cycles, acyclic relation cycles, relation-type rules, path references, duplicate steps, and prerequisite ordering before calling the transactional database import functions. Re-importing the same file is idempotent and does not overwrite curator edits.
