"use client";

import { useState, useEffect } from "react";

import { useInView } from "react-intersection-observer";

import { useGetTopics } from "@/lib/topics";

import TopicsItem from "@/containers/home/topics/item";

export default function Topics() {
  const { data: topicsData } = useGetTopics();

  const [imagesInView, setImagesInView] = useState(false);

  const { ref: imagesRef, inView: isImagesInView } = useInView({
    triggerOnce: false,
    threshold: 0.5,
  });

  useEffect(() => {
    if (isImagesInView) setImagesInView(true);
  }, [isImagesInView]);

  const row1 =
    topicsData.length > 4 ? topicsData.slice(0, Math.ceil(topicsData.length / 2)) : topicsData;
  const row2 = topicsData.length > 4 ? topicsData.slice(Math.ceil(topicsData.length / 2)) : [];

  return (
    <section className="mt-10 md:mt-16 md:space-y-6" ref={imagesRef}>
      <div className="flex flex-col items-center justify-center">
        <div
          className={`flex flex-col md:flex-row ${imagesInView ? "animate-left-to-right overflow-hidden" : "opacity-0"}`}
        >
          {!!row1?.length &&
            row1?.map((topic) => {
              return <TopicsItem key={topic?.id} {...topic} />;
            })}
        </div>
        <div
          className={`flex flex-col md:flex-row ${imagesInView ? "animate-right-to-left overflow-hidden" : "opacity-0"}`}
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
