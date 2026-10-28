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
and before any review. Questions 1 to 4 were rehearsed on 27 October 2026 with MAAP
#221 deleted, as on the day; the live upload and question 5 with it loaded. They show
which passages Claude gets to work with. The scores are cosine similarities; a passage
needs 0.35 to be returned.

Questions 1 to 4 were asked again in Claude Desktop on 28 October 2026, with the MAAP #82
satellite image approved. Each question ends with what Claude answered there.

## Questions 1 to 4

### 1. Deforestation in Yasuní

> ¿Cuánta deforestación hay en el Parque Nacional Yasuní y qué la causa?

Must show: Claude finds the park, answers with the module's layers (forest cover and its
loss over the park) and, separately, quotes MAAP #82: "The total direct and indirect
deforestation due to oil extraction is 417 hectares", with the link to the report. The
two figures are given apart, each with its source and year, never added up or compared
as one measure.

Rehearsed through the search, MAAP #221 deleted, not yet in Claude Desktop: 8
passages, the same with and without `place_id=protected_area:Yasuní`. First is a
passage that is only the report's date (0.68). Second is MAAP #82's summary paragraph
with the 417 hectares (169 direct, 248 indirect) and the 300-hectare referendum limit
(0.66), link `https://www.maapprogram.org/yasuni-eng/`. The other six are Bass et al.
(2010), 0.56 to 0.59: its introduction on oil concessions and access roads in the
northern half of the park (page 2, three passages), the threats section on the Napo
region as a deforestation front and on the Via Maxus (page 15, two), and the park's
other conservation values (page 13). No related documents: no summary is approved yet.

In Claude Desktop: the layer's 472.4 ha of gross loss in 2020-2022 by transition, then,
under causes from the indexed documents, MAAP #82's 417 ha (169 direct, 248 along the
access road) quoted with its link, and Bass et al. (2010) on the Vía Maxus, pages 2 and
15. It says the document figures come from other years and methods and are not
comparable with the layer. Its closing line reads the layer's pasture next to the
documents' colonisation story. If asked: the layer says what the forest became, the
documents say why.

### 2. Oil blocks in the western Amazon

> ¿Cuántos bloques de petróleo y gas hay en la Amazonía occidental?

Must show: the Finer et al. (2008) passage with the number, quoted ("There are now
~180 oil and gas blocks covering ~688,000 km² of forest in the western Amazon"), and
the link to page 2 of the PDF. The MCP's layers have nothing on this outside Ecuador,
and Claude says so rather than reaching for one.

Rehearsed through the search, MAAP #221 deleted, not yet in Claude Desktop: 8
passages, all Finer et al. (2008), 0.61 to 0.71. The first is the Results passage with
"180 oil and gas blocks covering 688,000 km²" (the PDF's text layer prints "~" as ","),
link
`http://127.0.0.1:8770/files/uploads/finer-2008-western-amazon-oil-gas-plosone.pdf#page=2`.
The Discussion passage on page 5, last of the eight, repeats "more than 180 oil and gas
blocks".

In Claude Desktop: the 180 blocks and 688,000 km² quoted from the abstract (page 1), the
breakdown by country from pages 2 and 5, and García-Romero et al. (2026) for the 65
blocks in Ecuador, which it attributes to Lessmann et al. (2016). It says the module's
data cover Ecuador only.

### 3. An answer only a figure holds

> ¿Qué muestra la imagen satelital del Parque Nacional Yasuní de febrero de 2018?

Must show: once its description is approved, the MAAP #82 satellite image (dated
10 February 2018, the clearings and the access road corridor) answers, and Claude says
that the answer comes from a description of a figure, with the link to the figure crop.
The report's text does not describe the image.

Rehearsed through the search, MAAP #221 deleted, not yet in Claude Desktop, before
review: the figure is pending review, so it is not searchable yet. 8 text passages come
back, 0.50 to 0.61: MAAP #82's date line and summary paragraph, and six from Bass et al.
(2010) (introduction, citation block, species richness, conservation values). None
describes the image. Run this again after the review: the figure passage should come
first, with `origin: figure`. If Claude then reads the section around it with
`get_document_section`, it gets the report's text only: figure descriptions are never
part of a section, and the section's link is the report's, not the crop's.

In Claude Desktop, after the image was approved: MAAP #82's figure dated 10 February 2018,
said to come from the figure's description, not the image, with the link to the crop. It
describes the clearings and the winding corridor and says the description does not
identify them. An approved description that names the access road would let Claude say
so: worth showing as the reason for the review.

### 4. Related documents, no answer

> ¿Cómo afecta la actividad petrolera a la calidad del agua en la provincia de Sucumbíos?

Must show: no passage answers it. Claude says that the indexed documents on oil in the
region (Finer et al. 2008, García-Romero et al. 2026) exist, names them with their
links, and says that they do not measure water quality in Sucumbíos. It may quote the
general statement it finds, saying it is general, and it does not answer from a summary.

Rehearsed through the search, MAAP #221 deleted, not yet in Claude Desktop, before
review: 8 passages from Bass et al. (2010), Finer et al. (2008) and García-Romero et al.
(2026), 0.36 to 0.40, the same with `place_id=province:Sucumbios` (with the note that no
topic is tied to the place and every document was searched). The nearest is Bass et al.
(2010), page 16: oil impacts "cannot be fully controlled", and Santa Cecilia, north of
Yasuní, "now completely deforested due to oil-related disturbance". Second is Finer et
al. (2008), Introduction, page 1: "Direct impacts include ... contamination from oil
spills and wastewater discharges. The technologies of the 1970s-era oil operations
caused widespread contamination in the northern Ecuadorian [...] Amazon". Both are
general statements, not a measurement of water quality in Sucumbíos. Among the eight,
one is a García-Romero table of oil block ids and one is its author list. No related
documents.

The documents on oil are named here through these passages, not through
`related_documents`: that list only holds documents none of whose passages came back,
and Finer and García-Romero both yield passages. After review, the related list stays
short. The García-Romero and Finer summaries scored 0.39 and 0.31 against this question,
under `SUMMARY_MIN_SCORE` (0.50), and even if they cleared it they would be left out for
having passages. A search with `topic="oil and gas"` returns 7 passages from Finer and
García-Romero (MAAP #82's two score under 0.35), so its related list can hold MAAP #82
alone, once its summary is approved. So the guard for this question is the instruction
"answer about documents only from passages" (and say when they do not answer), not the
related list. Check in Claude Desktop that Claude names Finer and García-Romero as
covering oil in the region without measuring water quality, and does not answer from
them as if they did.

In Claude Desktop, asked without "provincia": Sucumbíos is both a province and a canton,
and Claude does not always ask which one. Once it asked (the canton was chosen), once it
took the province without asking. Name the province in the question so the run does not
depend on that. Both answers said the same: the module has no water quality or oil
layer (it lists its water layers), no indexed document covers Sucumbíos itself, and
Finer et al. (2008) and García-Romero et al. (2026) are quoted as general statements on
the northern Ecuadorian Amazon, with no measurements.

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

In Claude Desktop on 28 October 2026, with the report uploaded as a PDF without authors
and year: the four areas, each with its figures, dates and page link (Podocarpus 22 to
50 ha, "an illegal expansion of 125% within the park"; Punino 142 ha in Sumaco
Napo-Galeras' buffer zone, 0.32 ha inside; 337 ha along the Bermejo, 1.05 ha inside
Cofán Bermejo; 33 ha in El Zarza's buffer zone). It says the report is the only indexed
document on it and that its figures are the report's, from 2024, not the module's. It
took "MAAP #221 (11 October 2024)" from the text itself; upload from the URL with
"MAAP #221 (2024)" so the citation does not depend on that.

Before the upload, the same question went to web search: MAAP #243 (2026) and press
coverage, none of it from the corpus. Showing the two answers side by side is the point
of the upload.

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

In Claude Desktop on 28 October 2026, with MAAP #221 loaded: no mercury data in the
module (it lists the water layers) and no relevant passage in the documents. It did not
mention the Loyola River passage, which it judged off topic. This is the case Known limits
describes: the passage clears the threshold, and the server instructions are what keep
Claude from answering from it. Its closing line names Nambija and the Nangaritza River
as where mercury studies usually come from; that is Claude's own knowledge, said to be
outside the platform, not a source. If asked, say so.

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
  document is about (score 0.50 or more), and only when none of its passages came back.
  A question on a place a document covers but on a theme it does not (water in
  Sucumbíos) gets no related document; with a topic, only the topic's documents that
  yielded no passage are listed.
- Retrieval finds the expected passage for 32 of the 33 questions the documents answer
  (97%). The miss is a question on the size of Yasuní's Zona Intangible, asked in
  English.
- Passages from web reports have no page; their link opens the report, at the section
  when the page has an anchor for it. One MAAP #82 passage is only the report's date.
- Extraction keeps some passages that answer nothing, such as a table of oil block ids
  and an author list. They take places in the eight results.
