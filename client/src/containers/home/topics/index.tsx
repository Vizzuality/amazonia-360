"use client";

import { useInView } from "react-intersection-observer";

import { useGetDefaultTopics } from "@/lib/topics";

import TopicsItem from "@/containers/home/topics/item";

export default function Topics() {
  const { data: topicsData } = useGetDefaultTopics();

  const { ref: imagesRef, inView: isImagesInView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  const row1 =
    topicsData && topicsData?.length > 4
      ? topicsData?.slice(0, Math.ceil(topicsData.length / 2))
      : topicsData;
  const row2 =
    topicsData && topicsData?.length > 4 ? topicsData?.slice(Math.ceil(topicsData.length / 2)) : [];

  return (
    <section className="mt-10 md:mt-16 md:space-y-6" ref={imagesRef}>
      <div className="flex flex-col items-center justify-center">
        <div
          className={`flex flex-col md:flex-row ${isImagesInView ? "overflow-hidden md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-left-40" : "md:opacity-0"}`}
        >
          {!!row1?.length &&
            row1?.map((topic) => {
              return <TopicsItem key={topic?.id} {...topic} />;
            })}
        </div>
        <div
          className={`flex flex-col md:flex-row ${isImagesInView ? "overflow-hidden md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-right-40" : "md:opacity-0"}`}
        >
          {!!row2.length &&
            row2?.map((topic) => {
              return <TopicsItem key={topic?.id} {...topic} />;
            })}
        </div>
      </div>
    </section>
  );
}
