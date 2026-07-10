# Atlas seed

`atlas.yaml` is the human-readable Milestone 1 seed skeleton. It contains ten visible top-level knowledge areas and the system relation grammar, but intentionally contains no fabricated concept content.

Validate it with:

```bash
pnpm seed:validate
```

The importer validates references, aliases, hierarchy cycles, acyclic relation cycles, and relation-type rules before calling the transactional database import function. Re-importing the same file is idempotent.
