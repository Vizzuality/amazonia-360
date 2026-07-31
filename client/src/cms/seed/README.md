# Content seed

Applies the reviewed content dataset to the CMS (AM-669).

```bash
pnpm seed          # empty database only
pnpm seed:force    # clear whatever is already there, then reload
pnpm seed:verify   # read-only checks, no writes
```

> `seed:force` is a separate script, not a flag. `payload run` discards every
> argument after the script path, so `pnpm seed --force` arrives with an empty
> `process.argv` and would seed _without_ forcing — the override has to be its
> own entry point.

`pnpm seed` runs the verify checks itself straight after seeding and exits
non-zero on any problem, so a bad seed cannot pass quietly.

## Files

| File                | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `types.ts`          | The dataset contract — the shape the seed accepts         |
| `content.ts`        | `seedContent`, the three-phase load                       |
| `guard.ts`          | Refuses to overwrite a populated database                 |
| `clear.ts`          | Empties the collections, for the forced path              |
| `verify.ts`         | Post-seed checks, returning problems rather than exiting  |
| `run.ts`            | `runSeed` — guard, clear, seed, verify, in order          |
| `cli.ts`            | Shared body of the two seed scripts; returns an exit code |
| `data/content.json` | The dataset — reviewed output, applied verbatim           |

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
`20260731_095538_am535_content_collections`.

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

## The guard

`seedContent` creates records and lets Payload mint their uuids, so it cannot
recognise anything an earlier run wrote. Re-running it over a populated database
would duplicate the whole catalogue, which is why the forced path clears the three
collections first and reloads them. That discards editorial work irrecoverably.

So `assertSafeToSeed` refuses any database that already holds content, and says
what it found. `pnpm seed:force` is the deliberate override. It also refuses a
_partially_ seeded database, because a seed that died half way and a database an
editor has been working in are indistinguishable from here — only a person can
tell them apart.

## What verify covers

The failure modes that report success and leave the site quietly wrong:

- a short count, from the dataset's own totals rather than a hardcoded number
- a Subtopic or Indicator orphaned from its parent
- a layout tile pointing at an Indicator that does not exist
- every Topic layout flattened to a single Topic, losing the curated cross-Topic
  references in _Geographic context_
- a locale resolving to a blank name — the sparse-translation failure mode
- records left as drafts, invisible to the public site
- a record not keyed by a uuid
- an anonymous reader not seeing the whole catalogue

## Ids

The CMS keys these collections by uuid, like every other collection. Numeric
primary keys are not an option: Payload decides whether you are editing or
creating from whether the record id is truthy, so _Geographic context_ — number 0
in the static catalogue — always opened in the admin as a blank create form, and
22 files in Payload's UI package branch on that.

The numbers in `data/content.json` are the dataset's own references. The seeder
uses them to wire a Subtopic to its Topic and a layout tile to its Indicator, and
never stores them; a number it cannot resolve stops the seed.

Saved reports still carry `topic_id` and `indicator_id` as plain numbers, and
nothing in the CMS matches those any more. Giving them a real reference is
AM-675.
