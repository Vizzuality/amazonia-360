import { IndicatorView } from "@/app/(frontend)/parsers";

export type Topic = {
  id: number;
  name?: string;
  description?: string;
  image: string;
  default_visualization: IndicatorView[];
};

/**
 * What an Indicator carries of its Topic. The catalogue query populates only these two
 * fields, and they are the only two any caller reads off `indicator.topic`.
 */
export type TopicSummary = Pick<Topic, "id" | "name">;

export type Subtopic = {
  id: number;
  topic_id: number;
  name?: string;
  description?: string;
};
