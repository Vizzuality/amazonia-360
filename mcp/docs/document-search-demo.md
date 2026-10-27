# Document search demo

A script for showing document search to the IDB team: questions asked in Claude
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
9. Just before the demo, delete MAAP #221 in the back office. It is added again live,
   after question 4 and before question 5.

To measure retrieval on the loaded corpus:
`uv run amazonia360-docs eval tests/documents/fixtures/questions.yaml`.

### What the load left (27 October 2026)

Reference lists are left out of the passages: sections under a references heading, and
runs of citations under any other heading.

| Document | Passages | Figures | Figures to review | Summary |
|---|---|---|---|---|
| Finer et al. (2008) | 24 | 5 | 5 | pending review |
| Bass et al. (2010) | 74 | 4 | 4 | pending review |
| García-Romero et al. (2026) | 17 | 2 | 2 | pending review |
| Paredes et al. (2026) | 35 | 22 | 16 | pending review |
| MAAP #82 (2018) | 2 | 2 | 1 | pending review |
| MAAP #221 (2024) | 6 | 9 | 6 | pending review |

GPT-6 Luna marked 10 figures as decorative (logos, journal badges), which go straight to
the discarded bucket. Nothing is approved yet: that is the owner's review.

## Running order

1. Questions 1 to 4, on the loaded corpus.
2. The live upload of MAAP #221, and its question.
3. One figure review, on MAAP #221's figures.
4. Question 5, which needs MAAP #221 back in the index.

Ask the questions in Spanish, as the platform's users would. After each answer, open
one link.

The results under each question were rehearsed through the search
(`DocumentSearch.search`, what `search_documents` returns), not yet in Claude Desktop,
and before any review, with MAAP #221 loaded. They show which passages Claude gets to
work with.

## Questions 1 to 4

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
report's date. The other six are Bass et al. (2010): its introduction on oil concessions
over the northern half of the park (page 2), the threats section on the Napo region as a
deforestation front (page 15), and the park's other conservation values (page 13). No
related documents: no summary is approved yet.

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
line and summary paragraph, and six from Bass et al. (2010) (introduction, abstract,
species richness, conservation values). None describes the image. Run this again after
the review: the figure passage should come first, with `origin: figure`.

### 4. Related documents, no answer

> ¿Cómo afecta la actividad petrolera a la calidad del agua en Sucumbíos?

Must show: no passage answers it. Claude says that the indexed documents on oil in the
region (Finer et al. 2008, García-Romero et al. 2026) exist, names them with their
links, and says that they do not measure water quality in Sucumbíos. It may quote the
general statement it finds, saying it is general, and it does not answer from a summary.

Rehearsed through the search, not yet in Claude Desktop, before review: 8 passages from
Finer et al. (2008), García-Romero et al. (2026) and Bass et al. (2010), the same with
`place_id=province:Sucumbios` (with the note that no topic is tied to the place and every
document was searched). The nearest to the question is Finer et al. (2008), Introduction,
page 1: "Direct impacts include ... contamination from oil spills and wastewater
discharges. The technologies of the 1970s-era oil operations caused widespread
contamination in the northern Ecuadorian [...] Amazon". That is a general statement,
not a measurement of water quality in Sucumbíos. Among the eight, one is a table of
oil block ids and one is the García-Romero author list. No related documents. After
review, related documents may still not appear: the García-Romero and Finer summaries
score 0.39 and 0.31 against this question, under `SUMMARY_MIN_SCORE` (0.50). The related list then has to
come from a topic: a search with `topic="oil and gas"` lists every document of that
topic with an approved summary. Whether Claude passes the topic when the question names
the theme ("en los documentos sobre petróleo, ...") is to be checked in Claude Desktop.

## The live upload

Add MAAP #221 in the back office: web report URL
`https://www.maapprogram.org/mining-protected-areas-ecuador/`, title "Illegal mining in
protected areas of the Ecuadorian Amazon", authors and year "MAAP #221 (2024)", topics
Illegal mining and Protected areas. The row moves from queued to indexed (6 passages),
then its 9 figures are described. Use this upload, not a paper: a paper with dozens of
figures takes minutes (design, section 9). Its passages are searchable as soon as the
row says indexed, before any review.

Then ask in Claude:

> ¿Qué áreas protegidas de la Amazonía ecuatoriana están amenazadas por la minería
> ilegal?

Must show: the answer quotes the new report: "the four protected areas in the
Ecuadorian Amazon that are currently threatened by mining activities: Podocarpus and
Sumaco Napo-Galeras National Parks, Cofán Bermejo Ecological Reserve, and El Zarza
Wildlife Refuge", with its link.

Rehearsed through the search, not yet in Claude Desktop: the first six passages are
MAAP #221's: the opening, then one per protected area and the acknowledgements. The
last two are García-Romero et al. (2026).

## One figure review

On MAAP #221's figures page, open the review queue. Show that the decorative images went
to the discarded bucket on their own. Approve one description as it is, correct one where
GPT-6 Luna misread a label or a date (the test found errors in 3 of 21), and approve it.
The approved descriptions become searchable when the indexing job finishes.

## Question 5

### 5. Not covered

> ¿Cuánto mercurio se ha medido en los ríos de Podocarpus?

Must show: Claude says that the indexed documents do not cover mercury. It may say that
MAAP #221 reports illegal mining along the Loyola River in Podocarpus, but it gives no
mercury figure.

Rehearsed through the search, not yet in Claude Desktop, with MAAP #221 loaded: 1
passage, MAAP #221 on the mining along the Loyola River in Podocarpus National Park
(22 hectares in July 2023, 50 by September 2024). It says nothing about mercury. With
`place_id=protected_area:Podocarpus` the result is the same, with the note that no
topic is tied to the place. Without MAAP #221 (if the live upload has not finished), no
passage clears the threshold (the nearest scores 0.32) and the answer is that the
documents do not cover it.

## Known limits

For the presenter:

- Near passages clear the threshold on questions the documents do not answer. In the
  eval, Galápagos deforestation, mercury in Podocarpus and rainfall in Sangay each got
  passages scoring 0.49 to 0.55, above the weakest passage that does answer a question
  (0.37). No threshold separates them. The guard is the server instructions: answer only
  from a passage that answers. Questions 4 and 5 show it.
- Figures and related documents depend on the review. A figure is searchable only once
  its description is approved, and a document is listed as related only once its
  summary is approved. Question 3 shows nothing from the figure until then.
- A related document comes from its summary only when the question is close to what the
  document is about (score 0.50 or more). A question on a place a document covers but
  on a theme it does not (water in Sucumbíos) gets no related document unless a topic is
  used.
- Retrieval finds the expected passage for 32 of the 33 questions the documents answer
  (97%). The miss is a question on the size of Yasuní's Zona Intangible, asked in
  English.
- Passages from web reports have no page; their link opens the report, at the section
  when the page has an anchor for it. One MAAP #82 passage is only the report's date.
- Extraction keeps some passages that answer nothing, such as a table of oil block ids
  and an author list. They take places in the eight results.
