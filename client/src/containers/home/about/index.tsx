"use client";

import React, { useState } from "react";

import { Element } from "react-scroll";

import { useMediaQuery } from "usehooks-ts";

import AboutHeroHome from "./about";

const HeroHome = () => {
  const isDesktop = useMediaQuery("(min-width: 768px)", { defaultValue: false });
  const isMobile = useMediaQuery("(max-width: 768px)", { defaultValue: false });
  const [imageInView, setImageInView] = useState(false);
  const [textVisible, setTextVisible] = useState(false);

  const handleMouseEnter = () => {
    setImageInView(true);
    setTextVisible(true);

    setTimeout(() => {
      setImageInView(false);
    }, 1500);
  };

  return (
    <Element name="moreInfo" className="-mt-2 w-screen md:mt-0">
      <section
        className="relative h-full w-screen overflow-hidden bg-green-800 bg-center text-white md:h-[calc(100svh_-_theme(space.80)_+_1px)]"
        onMouseEnter={handleMouseEnter}
      >
        <div
          className={`relative h-80 max-h-[250px] w-screen overflow-hidden md:h-[calc(100svh_-_theme(space.80)_+_1px)] md:max-h-none md:max-w-none`}
        >
          <div
            className={`relative h-full ${
              imageInView ? "animate-zoom-out overflow-hidden" : "opacity-100"
            }`}
            style={{
              background:
                "linear-gradient(90deg, rgba(0, 0, 0, 0.60) 34.5%, rgba(0, 62, 90, 0.00) 74%), url('/images/home/globe-image.avif') lightgray 50% / cover no-repeat",
            }}
          />

          {isDesktop && <AboutHeroHome textVisible={textVisible} />}
        </div>
      </section>

      {isMobile && <AboutHeroHome textVisible={true} isMobile={isMobile} />}
    </Element>
  );
};

export default HeroHome;
