# Content baseline

A golden baseline for the Topic, Subtopic and Indicator lookups, captured before
the CMS migration (AM-535 / AM-665).

Roughly 70 files read this content, and all of them go through
`getTopics`, `getSubtopics` and `getIndicators`. Pinning those three lookups
therefore protects every one of those files with a single test. Its job is to
prove the migration changes *where* content comes from without changing *what
users see*.

## Files

| File | Purpose |
| --- | --- |
| `digest.ts` | Reduces lookup output to a compact, reviewable digest |
| `build.ts` | Runs the live lookups across all locales and assembles the digest |
| `baseline.fixture.json` | The committed before-picture |
| `content-baseline.test.ts` | Asserts the live lookups still match the fixture |

## Why a hand-checked fixture and not a snapshot

`baseline.fixture.json` is committed data, deliberately **not** a Vitest
snapshot. There is no `-u` that can quietly rewrite it, so a change to this
content cannot pass review unnoticed — updating it is a conscious act and the
diff has to be read.

## What it stores, and what it does not

Stored literally, because these are the values worth eyeballing: ids, the
returned ordering per locale, the Topic→Subtopic→Indicator hierarchy, resource
type/name/url/layer id/column, visualization types, names and units.

Long free text (descriptions and short descriptions) is stored as a truncated
SHA-256 rather than embedded. The three source JSON files total 1.6 MB and a
fixture that size is not reviewable. The hash still fails on any edit.

Two marker values keep meaningful states distinguishable in review instead of
hiding behind a hash:

- `<absent>` — the field was missing entirely
- `<empty>` — the field was present but empty

These matter: several Indicators genuinely have no English description today,
and that should be visible in the fixture rather than invisible.

## Failure modes it catches

Verified by mutating the source data and confirming each one fails with a
message naming the culprit:

- an Indicator disappearing — reported as a missing id
- an Indicator being reordered — reported as same ids, changed order
- an Indicator's Resource changing — reported per indicator id
- description or unit text changing — reported per indicator id and locale
- any locale failing to resolve a name — the sparse-translation failure mode

## Regenerating

Only when a content change is genuinely intended. Call `buildContentBaseline()`
from a throwaway test, write the result to `baseline.fixture.json` with
`JSON.stringify(baseline, null, 2)`, then **read the diff** and explain it in
review.
