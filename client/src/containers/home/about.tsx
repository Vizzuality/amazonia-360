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
      <section className="relative h-full overflow-hidden bg-center text-white md:h-[calc(100svh_-_theme(space.80)_+_1px)]">
        <div
          ref={imageRef}
          className={`relative h-80 max-h-[250px] max-w-[250px] overflow-hidden md:h-[calc(100svh_-_theme(space.80)_+_1px)]`}
        >
          <div
            className={`absolute inset-0 bg-cover bg-center ${
              imageInView ? "md:animate-zoom-out" : "md:scale-150"
            }`}
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(0, 0, 0, 0.60) 34.5%, rgba(0, 62, 90, 0.00) 74%), url('/images/home/globe-image.avif')",
            }}
          />

          <div className="relative z-10 h-full w-full px-4 md:px-0">
            <div
              ref={textRef}
              className={`absolute bottom-0 left-0 mx-auto w-full max-w-screen-lg bg-blue-700 p-4 md:p-10 ${
                textInView ? "md:delay-50 animate-slide-up" : "md:opacity-0"
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
