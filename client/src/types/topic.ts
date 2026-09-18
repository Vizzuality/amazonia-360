import { CmsMeta } from "@/types/cms";

import { IndicatorView } from "@/app/(frontend)/parsers";

import { Subtopic as CmsSubtopic, Topic as CmsTopic } from "@/payload-types";

/**
 * Derived from the generated types, so a field added to the collection arrives here on the next
 * `payload generate:types`. The id stays varchar in the CMS because Payload's admin resolves a
 * numeric document id through `!!id`: Content Code 0, the Overview Topic, would open the Create
 * view instead of the record.
 */
export type Topic = Omit<
  CmsTopic,
  "default_visualization" | "description" | "id" | "image" | CmsMeta
> & {
  id: number;
  description?: string;
  image: string;
  default_visualization: IndicatorView[];
};

/** What an Indicator carries of its Topic, and all the catalogue query populates of it. */
export type TopicSummary = Pick<Topic, "id" | "name">;

/** Payload nests the Topic under the Subtopic; the app holds the two as siblings. */
export type Subtopic = Omit<CmsSubtopic, "description" | "id" | "topic" | CmsMeta> & {
  id: number;
  topic_id: number;
  description?: string;
};
