import type { CollectionConfig } from "payload";

import { catalogueAccess } from "@/cms/access/catalogue";
import { DefaultVisualizationField } from "@/cms/fields/default-visualization";
import { sourceIdField } from "@/cms/fields/source-id";
import { autoIncrementSourceId } from "@/cms/hooks/auto-increment-source-id";

export const Topics: CollectionConfig = {
  slug: "topics",
  admin: {
    group: "Catalogue",
    useAsTitle: "name",
    defaultColumns: ["id", "name", "_status"],
  },
  access: catalogueAccess,
  versions: { drafts: true },
  hooks: {
    beforeValidate: [autoIncrementSourceId],
  },
  fields: [
    sourceIdField,
    { name: "name", type: "text", localized: true, required: true },
    {
      name: "description",
      type: "textarea",
      localized: true,
      admin: { description: "Markdown. Rendered with react-markdown." },
    },
    {
      name: "image",
      type: "text",
      admin: { description: "Path under client/public, e.g. /images/topics/territory.webp" },
    },
    DefaultVisualizationField,
    /**
     * Virtual: the relationship lives on `subtopics.topic` and is stored only there. This
     * adds no column and no migration — it reads the existing `subtopics_topic_idx`.
     *
     * `defaultLimit` is a real ceiling, not decoration: the join defaults to 10 and the
     * source data already puts 7 subtopics under one topic. 50 leaves room for the whole
     * catalogue to land under a single topic before an editor loses a row off the table.
     *
     * Sorted by `createdAt`, not by `name`: sorting a join on a localized field makes the
     * Postgres adapter emit a reference to `subtopics` that its own alias has replaced, and
     * every read of this collection 500s (Payload 3.87). Not by `id` either — that column is
     * text, so subtopic 34 filed under a topic holding 4..8 would sort to the top. Creation
     * order matches the source catalogue and puts new rows at the end.
     */
    {
      name: "subtopics",
      type: "join",
      collection: "subtopics",
      on: "topic",
      defaultSort: "createdAt",
      defaultLimit: 50,
      admin: {
        defaultColumns: ["id", "name", "_status"],
        description: "Subtopics filed under this topic. Edited on the subtopic itself.",
      },
    },
  ],
};
