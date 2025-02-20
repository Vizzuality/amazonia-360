"use client";

import { useGetOverviewTopics } from "@/lib/topics";

export const WidgetsOverview = () => {
  const { data } = useGetOverviewTopics();

  console.log(data);

  return "Overview";
};
