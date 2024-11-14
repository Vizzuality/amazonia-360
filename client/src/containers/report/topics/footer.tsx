"use client";

import Link from "next/link";

import { TooltipPortal } from "@radix-ui/react-tooltip";

import { useSyncTopics, useSyncSearchParams } from "@/app/store";

import { DEFAULT_VISUALIZATION_SIZES, TopicId, TOPICS } from "@/constants/topics";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function TopicsFooter() {
  const searchParams = useSyncSearchParams();
  const [topics, setTopics] = useSyncTopics();

  return (
    <section className="space-y-6">
      <div className="container">
        <Button
          variant="ghost"
          onClick={() => {
            const topicsParsed = TOPICS.map((topic) => ({
              id: topic.id as TopicId,
              indicators:
                topic.default_visualization
                  ?.map((indicator) => {
                    return {
                      id: indicator?.id,
                      type: indicator.type,
                      w: DEFAULT_VISUALIZATION_SIZES[indicator?.type].w,
                      h: DEFAULT_VISUALIZATION_SIZES[indicator?.type].h,
                    };
                  })
                  .filter((ind) => ind.id) || [],
            }));

            setTopics(topicsParsed);
          }}
        >
          Select all topics
        </Button>
      </div>

      <div className="container">
        <div className="flex justify-center space-x-4">
          <Link href={`/report${searchParams}`}>
            <Button variant="outline">Cancel</Button>
          </Link>

          {!topics?.length && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button className="opacity-50">Generate Report</Button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent side="top" align="start">
                  <p className="text-center">Please select at least one topic</p>
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          )}
          {!!topics?.length && (
            <Link href={`/report/results${searchParams}`}>
              <Button>Generate Report</Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
