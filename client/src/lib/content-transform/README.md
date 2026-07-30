# Content transform

Turns the three static JSON files in `datum/` into one CMS-ready dataset, plus a
fidelity report naming every description whose appearance changes (AM-667).

```bash
pnpm transform-content
```

Outputs, both committed:

| Path | What it is |
| --- | --- |
| `datum/cms/content.json` | The dataset AM-669 loads, unchanged |
| `datum/cms/fidelity-report.md` | The sign-off document |

The command exits non-zero if any description would lose a hyperlink.

## Why it runs offline

This is partly a content-cleanup job, not a pure data move — some source
descriptions are malformed and do not survive conversion untouched. If the
conversion ran during deployment nobody would ever see what it did. Instead it
runs once, a person reads the report, and the loader then applies the reviewed
result verbatim so staging and production get identical content.

## The rule that is not optional

The app renders descriptions with react-markdown and **no remark-gfm**, so the
effective grammar is plain CommonMark. Payload's markdown converter does not
implement CommonMark autolinks — `<https://example.com>` becomes plain text.

**220 description fields contain hyperlinks. 192 of them would lose every
hyperlink** if converted without rewriting autolinks to `[url](url)` first. This
is verified by a test, and `pnpm transform-content` fails rather than emit a
dataset with a lost link.

Bare URLs are deliberately *not* linkified: without remark-gfm they are not
hyperlinks today either, so making them links would be a change, not a fix.

## Hard line breaks

44 fields use the CommonMark trailing-backslash hard break. No line break
survives conversion in any spelling — backslash, two trailing spaces, or a bare
newline all collapse into a single text run. The backslash is therefore removed
and the continuation folded into running text, rather than left to render as a
literal `\`. Every affected field is listed in the report.

## What each step does

| Module | Responsibility |
| --- | --- |
| `markdown.ts` | Autolink rewrite, line-break normalisation, markdown → rich text |
| `localize.ts` | Sparse translations — a locale is written only when non-empty and different from English |
| `data-source.ts` | Reduces a resource to exactly one kind, carrying only that kind's attributes |
| `layout.ts` | Default layouts: drops duplicated entry ids and entries pointing at missing Indicators |
| `dataset.ts` | Assembles the three collections |
| `fidelity.ts` | Compares before and after, renders the report |
| `audit.ts` | Finds content problems this transform deliberately leaves for AM-671 |

Every step is a pure function with unit tests.

## Determinism

The converter assigns link nodes a random id, so converting the same markdown
twice produced different JSON. Ids are replaced with values derived from the
field and position, so re-running produces byte-identical output — which is what
lets AM-669 be re-runnable and makes a real content change visible.

## Deliberate omissions

Modelling by kind drops attributes that never belonged: Indicator 12's raster
setting on a feature layer disappears here rather than needing to be found later.

Editorial problems are **not** fixed — untrimmed names, the Spanish-hardcoded
popup title, `{ECOSYNAM }` substituting nothing, the two legend labels differing
by a hyphen. Those are judgement calls for a content owner in the CMS (AM-671),
and the report lists them as a worklist.

## Note for AM-672

`dataset.test.ts` reads `datum/*.json`. When those files are deleted, this test
and the transform command go with them — by then the CMS is the source of truth
and there is nothing left to transform.
