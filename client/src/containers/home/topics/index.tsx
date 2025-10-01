"use client";

import { useInView } from "react-intersection-observer";

import { useLocale } from "next-intl";

import { useGetDefaultTopics } from "@/lib/topics";

import TopicsItem from "@/containers/home/topics/item";

export default function Topics() {
  const locale = useLocale();
  const { data: topicsData } = useGetDefaultTopics({ locale });

  const { ref: imagesRef, inView: isImagesInView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  return (
    <section className="mt-10 md:mt-28 md:space-y-6" ref={imagesRef}>
      <div
        className={`grid grid-cols-12 gap-0 ${isImagesInView ? "overflow-hidden md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-left-40" : "md:opacity-0"}`}
      >
        {!!topicsData?.length &&
          topicsData?.map((topic) => {
            return <TopicsItem key={topic?.id} {...topic} />;
          })}
      </div>
    </section>
  );
}
