"use client";

import { cn } from "@/lib/utils";

const AboutHeroHome = ({ textVisible }: { textVisible: boolean }) => {
  return (
    <div className="relative md:absolute md:bottom-0 md:left-0 md:right-0">
      <div className="md:container">
        <div className="grid grid-cols-12">
          <div
            className={cn({
              "relative col-span-12 bg-blue-700 opacity-100 md:col-span-7 md:-ml-10 md:p-10": true,
              "delay-50 duration-700 animate-in fade-in-0": textVisible,
              "opacity-0": !textVisible,
            })}
          >
            <div className="container md:px-0">
              <div className="flex flex-col items-start justify-start space-y-6 py-8 text-white">
                <h3 className="text-sm font-bold uppercase tracking-[0.7px]">
                  About AmazoniaForever360+
                </h3>
                <p className="text-lg font-normal md:text-xl">
                  AmazoniaForever360+ is not just presenting data; it’s making sense of it. Our goal
                  is to become a focal point that unifies and amplifies the assets from various
                  initiatives dedicated to this region, fostering a shared, profound engagement with
                  Amazonia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutHeroHome;
