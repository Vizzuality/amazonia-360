"use client";

import { useState, useEffect } from "react";

import { useInView } from "react-intersection-observer";
import { Element } from "react-scroll";

const HeroSection = () => {
  const [imageInView, setImageInView] = useState(false);
  const [textInView, setTextInView] = useState(false);

  const { ref: imageRef, inView: isImageInView } = useInView({
    triggerOnce: false,
    threshold: 0.5,
  });

  const { ref: textRef, inView: isTextInView } = useInView({
    triggerOnce: false,
    threshold: 0.5,
  });

  useEffect(() => {
    if (isImageInView) setImageInView(true);
    if (isTextInView) setTextInView(true);
  }, [isImageInView, isTextInView]);

  return (
    <Element name="moreInfo">
      <section className="relative overflow-hidden bg-center text-white md:h-[calc(100svh_-_theme(space.80)_+_1px)]">
        <div
          ref={imageRef}
          className={`relative h-full ${imageInView ? "animate-zoom-out overflow-hidden" : "opacity-0"}`}
          style={{
            background:
              "linear-gradient(90deg, rgba(0, 0, 0, 0.60) 34.5%, rgba(0, 62, 90, 0.00) 74%), url('/images/home/globe-image.avif') lightgray 50% / cover no-repeat",
          }}
        >
          <div className="container relative z-10 h-full w-full">
            <div
              ref={textRef}
              className={`container absolute bottom-0 left-0 max-w-[820px] bg-blue-700 p-10 ${
                textInView ? "delay-50 animate-slide-up" : "opacity-0"
              }`}
            >
              <div className="flex flex-col items-start justify-start space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.7px]">
                  About AmazoniaForever360+
                </h3>
                <p className="text-xl font-normal">
                  AmazoniaForever360+ is not just presenting data; it’s making sense of it. Our goal
                  is to become a focal point that unifies and amplifies the assets from various
                  initiatives dedicated to this region, fostering a shared, profound engagement with
                  Amazonia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Element>
  );
};

export default HeroSection;
