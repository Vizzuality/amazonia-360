# Content seed

Applies the reviewed content dataset to the CMS (AM-669).

```bash
pnpm seed            # empty database only
pnpm seed --force    # overwrite whatever is already there
pnpm seed:verify     # read-only checks, no writes
```

`pnpm seed` runs the verify checks itself straight after seeding and exits
non-zero on any problem, so a bad seed cannot pass quietly.

## Files

| File | Purpose |
| --- | --- |
| `types.ts` | The dataset contract — the shape the seed accepts |
| `content.ts` | `seedContent`, the three-phase upsert |
| `guard.ts` | Refuses to overwrite a populated database |
| `verify.ts` | Post-seed checks, returning problems rather than exiting |
| `data/content.json` | The dataset — reviewed output, applied verbatim |

## Where the dataset came from

`data/content.json` was produced offline by **prepare-seed**, a one-off job over
the static JSON in `datum/`. It converted markdown descriptions to rich text and
emitted a fidelity report naming every field whose appearance changed, for a
person to sign off.

That tooling is deliberately **not** in the repo. It ran once, the report was
read, and the reviewed output is what ships — so staging and production get
identical content, and a real content change shows up as a diff to this file
rather than as a surprise at deploy time.

If the dataset ever needs regenerating, it is in the history of branch
`feat/am-535-cms-content-migration`, under its original name
`content-transform`:

```bash
git show 6167f1d7 --stat                                    # as added
git checkout 6167f1d7 -- client/src/lib/content-transform   # to restore
```

Restoring also needs `scripts/transform-content.ts` from the same commit and a
`prepare-seed` entry in `package.json`. Nothing in `src/cms/seed/` depends on it,
so it stays out until there is a reason.

## Running it per environment

The scripts talk to whatever database the environment points at, so the same two
commands serve local, develop, staging and production. Schema comes first and is
already automatic — `entrypoint.sh` runs `pnpm payload migrate` on container
start in production, and the collections migration is
`20260730_182416_am535_content_collections`.

Content is **not** automatic. Someone runs `pnpm seed` once per environment.
Two ways to do that:

- **From a workstation or CI runner**, with the environment's database URL in the
  environment. Needs network reach to the RDS instance.
- **Inside the deployed container**, which is why the runtime image copies
  `scripts/` and why the dataset lives under `src/` — `src/` ships, `datum/` does
  not.

## Why not a Payload migration

It would run automatically on deploy and be recorded as applied, which is
genuinely nicer for the initial load. It was not chosen because re-seeding then
means authoring a new migration every time the dataset changes, and during the
migration window the dataset is still moving. A script that a person runs
deliberately, with a guard, fits that better.

The trade-off is real: nothing verifies the seed has happened in a given
environment. `pnpm seed:verify` is how you check.

## The guard, and why idempotent is not enough

`seedContent` upserts by original id, so re-running is safe *during* the
migration. It stops being safe the moment editors start working in the admin:
upserting by id restores the dataset over the top of their edits, silently.

So `assertSafeToSeed` refuses any database that already holds content, and says
what it found. `--force` is the deliberate override. It also refuses a
*partially* seeded database, because a seed that died half way and a database an
editor has been working in are indistinguishable from here — only a person can
tell them apart.

## What verify covers

The failure modes that report success and leave the site quietly wrong:

- a short count, from the dataset's own totals rather than a hardcoded number
- a Subtopic or Indicator orphaned from its parent
- a layout tile pointing at an Indicator that does not exist
- the overview Topic (id 0) losing its deliberate cross-Topic references
- a locale resolving to a blank name — the sparse-translation failure mode
- records left as drafts, or with non-numeric ids, both invisible to the public site
- an anonymous reader not seeing the whole catalogue

## Ids

Records keep their original numeric ids, including Topic 0. Renumbering would
break every saved report and every shared report URL. Topic 0's id being falsy is
also why `content.ts` selects by `where` rather than passing `id` — Payload's
update treats a falsy `id` as "no id given" and then rejects the call.
