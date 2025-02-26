import { Topic } from "@/app/local-api/topics/route";

export interface ReportResultsSummaryProps {
  topic?: Topic;
}

export const ReportResultsSummary = ({ topic }: ReportResultsSummaryProps) => {
  console.log(topic);

  return (
    <div>
      <h1>Summary {topic?.id}</h1>
      <div>
        Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tempore voluptates, reprehenderit
        dignissimos quam asperiores temporibus eaque aperiam? Unde dignissimos in nostrum
        perferendis, aliquid harum nulla, aut exercitationem totam inventore deleniti.
      </div>
    </div>
  );
};
