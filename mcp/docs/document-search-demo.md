# Document search demo

A script for showing document search to the IDB team: five questions asked in Claude
Desktop, an upload done live, and one figure review. Everything runs on the owner's
machine (design, section 7.0).

## Setup

From `mcp/`, with `OPENAI_API_KEY` set in the shell:

1. `docker compose -f docker-compose.docs.yml up -d` (Postgres on `localhost:5433`,
   Qdrant on `localhost:6343`).
2. `uv sync --extra ingest`.
3. Export the two settings, then create the tables:

   ```sh
   export DOCS_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/amazonia360_docs
   export DOCS_QDRANT_URL=http://localhost:6343
   uv run amazonia360-docs migrate
   ```

4. `uv run amazonia360-docs seed` adds the eight topics. Yasuní is tied to the place
   `protected_area:Yasuní`.
5. `uv run amazonia360-docs load-demo ../discovery/deliverables/doc-search/sources`
   adds the four PDFs and the two MAAP reports with their titles, authors and topics,
   then runs every job: extraction, embeddings, figure descriptions and summaries. A
   source that is already loaded is left alone; one whose ingest failed is queued
   again. Run it from `mcp/` so the files land in the `var/documents/` that `serve`
   reads.
6. `uv run amazonia360-docs serve`, then open `http://127.0.0.1:8770`.
7. Review before the demo, in the back office: approve each document's summary (fix it
   where it is wrong), and go through each document's figures. Until then no figure is
   searchable and no document shows up as related.
8. In Claude Desktop, give the `amazonia360` server's entry the `env` of the README
   (Document search): `DOCS_DATABASE_URL`, `DOCS_QDRANT_URL`,
   `DOCS_PUBLIC_URL=http://127.0.0.1:8770` and `OPENAI_API_KEY`. Restart Claude
   Desktop and check that `list_topics` is among the tools.
9. Before the demo, delete MAAP #221 in the back office, so that it can be added live.

To measure retrieval on the loaded corpus:
`uv run amazonia360-docs eval tests/documents/fixtures/questions.yaml`.

### What the load left (27 October 2026)

| Document | Passages | Figures | Figures to review | Summary |
|---|---|---|---|---|
| Finer et al. (2008) | 34 | 5 | 5 | pending review |
| Bass et al. (2010) | 105 | 4 | 4 | pending review |
| García-Romero et al. (2026) | 23 | 2 | 2 | pending review |
| Paredes et al. (2026) | 45 | 22 | 16 | pending review |
| MAAP #82 (2018) | 2 | 2 | 1 | pending review |
| MAAP #221 (2024) | 6 | 9 | 6 | pending review |

GPT-6 Luna marked 10 figures as decorative (logos, journal badges), which go straight to
the discarded bucket. Nothing is approved yet: that is the owner's review.

## The questions

Ask them in Spanish, as the platform's users would. After each answer, open one link.

The results under each question were rehearsed through the search
(`DocumentSearch.search`, what `search_documents` returns), not yet in Claude Desktop,
and before any review. They show which passages Claude gets to work with.

### 1. Deforestation in Yasuní

> ¿Cuánta deforestación hay en el Parque Nacional Yasuní y qué la causa?

Must show: Claude finds the park, answers with the module's layers (forest cover and its
loss over the park) and, separately, quotes MAAP #82: "The total direct and indirect
deforestation due to oil extraction is 417 hectares", with the link to the report. The
two figures are given apart, each with its source and year, never added up or compared
as one measure.

Rehearsed through the search, not yet in Claude Desktop: 8 passages, the same with and
without `place_id=protected_area:Yasuní`. Second is MAAP #82's summary paragraph with
the 417 hectares (169 direct, 248 indirect) and the 300-hectare referendum limit, link
`https://www.maapprogram.org/yasuni-eng/`. Before it, a passage that is only the
report's date. The rest are Bass et al. (2010): its introduction on oil concessions
over the northern half of the park (page 2) and the threats section on the Napo region
as a deforestation front (page 15); two of the eight are reference-list entries.
No related documents: no summary is approved yet.

### 2. Oil blocks in the western Amazon

> ¿Cuántos bloques de petróleo y gas hay en la Amazonía occidental?

Must show: the Finer et al. (2008) passage with the number, quoted ("There are now
~180 oil and gas blocks covering ~688,000 km² of forest in the western Amazon"), and
the link to page 2 of the PDF. The MCP's layers have nothing on this outside Ecuador,
and Claude says so rather than reaching for one.

Rehearsed through the search, not yet in Claude Desktop: 8 passages, all Finer et al.
(2008). The first is the Results passage with "180 oil and gas blocks covering 688,000
km²" (the PDF's text layer prints "~" as ","), link
`http://127.0.0.1:8770/files/uploads/finer-2008-western-amazon-oil-gas-plosone.pdf#page=2`.
The Discussion passage on page 5 repeats "more than 180 oil and gas blocks".

### 3. An answer only a figure holds

> ¿Qué muestra la imagen satelital del Parque Nacional Yasuní de febrero de 2018?

Must show: once its description is approved, the MAAP #82 satellite image (dated
10 February 2018, the clearings and the access road corridor) answers, and Claude says
that the answer comes from a description of a figure, with the link to the figure crop.
The report's text does not describe the image.

Rehearsed through the search, not yet in Claude Desktop, before review: the figure is
pending review, so it is not searchable yet. 8 text passages come back: MAAP #82's date
line and summary paragraph, five from Bass et al. (2010) and one reference-list entry
of García-Romero et al. (2026). None describes the image. Run this again after the
review: the figure passage should come first, with `origin: figure`.

### 4. Related documents, no answer

> ¿Cómo afecta la actividad petrolera a la calidad del agua en Sucumbíos?

Must show: no passage answers it. Claude says that the indexed documents on oil in the
region (Finer et al. 2008, García-Romero et al. 2026) exist, names them with their
links, and says that they do not measure water quality. It does not answer from a
summary.

Rehearsed through the search, not yet in Claude Desktop, before review: 3 passages, two
of them reference-list entries (Finer 2008, García-Romero 2026) and one from Bass et al.
(2010) on oil impacts that "cannot be fully controlled"; none is about water. No related
documents. With `place_id=province:Sucumbios` the note says that no topic is tied to the
place and every document was searched. After review, related documents may still not
appear: the García-Romero and Finer summaries scored 0.37 and 0.33 against this
question, under `SUMMARY_MIN_SCORE` (0.50). The related list then has to come from a
topic: a search with `topic="oil and gas"` lists every document of that topic with an
approved summary. Whether Claude passes the topic when the question names the theme
("en los documentos sobre petróleo, ...") is to be checked in Claude Desktop.

### 5. Not covered

> ¿Cuánto mercurio se ha medido en los ríos de Podocarpus?

Must show: Claude says that the indexed documents do not cover mercury. It may say that
MAAP #221 reports illegal mining along the Loyola River in Podocarpus, but it gives no
mercury figure.

Rehearsed through the search, not yet in Claude Desktop: 1 passage, MAAP #221 on the
mining along the Loyola River in Podocarpus National Park (22 hectares in July 2023,
50 by September 2024). It says nothing about mercury, so the answer depends on the
instruction to answer only from a passage that answers. With
`place_id=protected_area:Podocarpus` the result is the same, with the note that no
topic is tied to the place.

## The live upload

Add MAAP #221 in the back office: web report URL
`https://www.maapprogram.org/mining-protected-areas-ecuador/`, title "Illegal mining in
protected areas of the Ecuadorian Amazon", authors and year "MAAP #221 (2024)", topics
Illegal mining and Protected areas. The row moves from queued to indexed (6 passages),
then its 9 figures are described. Use this upload, not a paper: a paper with dozens of
figures takes minutes (design, section 9).

Then ask in Claude:

> ¿Qué áreas protegidas de la Amazonía ecuatoriana están amenazadas por la minería
> ilegal?

The answer quotes the new report: Podocarpus and Sumaco Napo-Galeras National Parks.

## One figure review

On MAAP #221's figures page, open the review queue. Show that the decorative images went
to the discarded bucket on their own. Approve one description as it is, correct one where
GPT-6 Luna misread a label or a date (the test found errors in 3 of 21), and approve it.
The approved descriptions become searchable when the indexing job finishes.
