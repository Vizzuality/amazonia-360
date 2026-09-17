import { CmsMeta } from "@/types/cms";

import { IndicatorView } from "@/app/(frontend)/parsers";

import { Subtopic as CmsSubtopic, Topic as CmsTopic } from "@/payload-types";

/**
 * Derived from the generated types rather than declared alongside them, so a field added to
 * the collection arrives here on the next `payload generate:types` instead of silently not
 * existing. Only two things are restated: the numeric `id`, and the default layout, which the
 * app holds in the same shape a saved report and a shared URL do.
 *
 * The id is numeric here and varchar in the CMS on purpose. Payload's admin resolves a
 * numeric document id through `!!id`, so Content Code 0 — the Overview Topic — would open
 * the Create view instead of the record.
 */
export type Topic = Omit<CmsTopic, "default_visualization" | "id" | CmsMeta> & {
  id: number;
  default_visualization: IndicatorView[];
};

/**
 * What an Indicator carries of its Topic. The catalogue query populates only these two
 * fields, and they are the only two any caller reads off `indicator.topic`.
 */
export type TopicSummary = Pick<Topic, "id" | "name">;

/**
 * Payload nests the Topic under the Subtopic; the app holds the two as siblings, so the
 * relationship is flattened back to a `topic_id`.
 */
export type Subtopic = Omit<CmsSubtopic, "id" | "topic" | CmsMeta> & {
  id: number;
  topic_id: number;
};
