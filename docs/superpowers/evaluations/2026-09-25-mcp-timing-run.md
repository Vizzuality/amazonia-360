# MCP timing run, 24–25 September 2026

The same queries sent every hour for 24 hours, to size change 5 of the
[first Desktop trial](2026-09-24-mcp-desktop-trial.md): what to do when ArcGIS Online takes a
minute on a query that normally takes seconds. The trials could not answer it: about twenty area
queries, one slow.

Status: run finished, change 5 decided and made (`1c853de8`).

## Setup

- `uv run amazonia360-mcp-timing run` from `mcp/`, 24 rounds one hour apart, first round at
  19:14 UTC on 24 September, last at 18:14 UTC on 25 September.
- Three fixed 20 × 20 km boxes from `mcp/examples/areas.geojson`: Puyo, Tena and Nuevo Rocafuerte.
- Every tool against every layer it applies to: `categories_in_area` and `area_by_category` on the
  12 area layers, `count_in_area` on 202. 75 calls a round, 1,800 in all.
- The handlers are called directly, without an MCP client or a model, with a 120 s client timeout
  so that nothing is cut on our side.
- Log in `mcp/var/timing.jsonl` (not committed), one line per call with its timing breakdown.
  `uv run amazonia360-mcp-timing summary` gives the per-layer table.

## Conclusions

- **ArcGIS Online cuts a query at about 59 s.** All three failures in 1,800 calls were
  `504 Gateway Timeout`, at 59.1 s each. Our own timeout, 60 s in the server, was racing it.
- **Slow calls come in spells.** 28 of the 36 calls over 10 s (layer 203's area queries aside)
  fell in seven consecutive rounds, 08:14 to 14:14 UTC on 25 September. In that spell, calls
  that take 0.2 s the rest of the day took 17 to 43 s. The cause is on the service side; our
  geometry was the same every hour.
- **Outside the spell, the slow calls are structural.** They are all on the Nuevo Rocafuerte box
  with layers 210 and 211, which receive many vertices there. They are slow every hour, by the
  same amount.
- **Layer 203 is at the edge of failing.** Its area queries on Puyo and Tena take 29 to 59 s every
  hour, and its worst call was one second short of the 59 s cut. In a busy hour it will fail.
- **The fast tools are fast.** `categories_in_area` and `count_in_area`: median 0.23 s, 99th
  percentile 3.0 s, over 936 calls.

> Correction to the first trial. Its time section called the minute-long call on layer 210 an
> outlier and suggested a cold start of the hosted service. The run does not support a cold start:
> the first call of every round was the 202 count, and it never took more than 1.3 s. The minute
> fits the slow spells instead. That trial also said a minute is "enough to hit the 60 s timeout";
> the cut that matters is ArcGIS Online's, at 59 s.

## Change 5, decided

| Option from the first trial | Decision | Why |
|---|---|---|
| One retry on timeout | No | A 504 arrives after 59 s of waiting; a retry doubles that to two minutes, inside a slow spell that lasts hours. No fast failure, where a retry would pay, was seen. |
| A longer timeout for `area_by_category` | No | ArcGIS gives up at 59 s whatever we allow. |
| A result that says the source was slow | Yes | Both a 504 and our own timeout now reach the model as "ArcGIS Online gave up after about 60 s. This usually means the service is busy, which comes and goes by the hour; trying again later may work." The model got a URL and a link to MDN before. |

Our timeout moved from 60 to 65 s, so that ArcGIS's 504 arrives first. The data problem behind 203
and 210 is AM-725, with the run's figures added as a comment on 28 September.

## Per layer

Area queries, all three boxes, 72 calls per layer. Times are the tool's total, ArcGIS plus clip.

| Layer | Median | Max | Over 10 s | 504 |
|---|---|---|---|---|
| 203 Restoration priority areas | 31.9 s | 58.6 s | 48 | 0 |
| 204 Bioclimates | 0.55 s | 7.5 s | 0 | 0 |
| 206 Carbon by forest stratum | 5.5 s | 10.5 s | 1 | 0 |
| 208 Deforestation 2020–2022 | 5.1 s | 6.9 s | 0 | 0 |
| 209 Hydrographic demarcations | 0.41 s | 1.8 s | 0 | 0 |
| 210 Ecosystems | 3.4 s | 59.1 s | 17 | 2 |
| 211 Geomorphology | 3.0 s | 35.0 s | 10 | 0 |
| 214 Flooding regime | 0.21 s | 6.0 s | 0 | 0 |
| 217 Thermotypes | 0.60 s | 41.2 s | 4 | 0 |
| 218 Climate types | 0.26 s | 0.94 s | 0 | 0 |
| 219 Biogeographic units | 1.6 s | 7.8 s | 0 | 0 |
| 222 Water recharge zones | 0.16 s | 3.2 s | 0 | 0 |

The third 504 was a `categories_in_area` on 208, in the same spell.

**203 on Puyo and Tena** (48 calls): min 28.9 s, median 34.2 s, 90th percentile 46.2 s, max 58.6 s.
It receives 1,996,225 vertices on every call, whatever the box: the layer is four features, one
per priority class, so any box that touches a class receives the whole class. On Nuevo Rocafuerte,
where no class falls, it takes 0.3 to 0.7 s.

**210 on Nuevo Rocafuerte** (24 calls): min 8.7 s, median 11.0 s, max 59.1 s, and two of the three
504s. About 2.2 s of every call is the local clip; the rest is ArcGIS.

**Area queries outside the spell**, 203 aside (561 calls): median 1.0 s, 90th percentile 5.2 s.

## Rounds

A round normally took 140 to 170 s. Rounds 14 to 20 took 193 to 467 s; round 19 (13:14 UTC), the
slowest, had nine calls over 10 s, one of them a 504. By round 21 it was back to 179 s.

| Rounds | UTC, 25 Sep | Calls over 10 s, 203 area aside | 504 |
|---|---|---|---|
| 1–13 | 19:14 on the 24th to 07:14 | 7, all 210 or 211 on Nuevo Rocafuerte | 0 |
| 14–20 | 08:14 to 14:14 | 28 | 3 |
| 21–24 | 15:14 to 18:14 | 1, 210 on Nuevo Rocafuerte | 0 |

## Not measured

- Whether the spells recur at the same hours on other days. One day shows one spell; a week of
  runs would say whether it is a daily pattern.
- The accuracy cost of the 0.001 degree simplification beyond layer 214, where it was up to 2 %.
- Whether ArcGIS read time changes with `maxAllowableOffset`.
- Time through a real MCP client. The run calls the handlers directly, so it leaves out transport
  and the model, which add little next to ArcGIS in the Desktop trials.
