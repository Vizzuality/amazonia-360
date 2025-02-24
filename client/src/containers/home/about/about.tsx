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
                  AmazoniaForever360+ is a free tool initiated by the IDB as part of its Amazonia
                  Forever program to help all those involved in the development and conservation of
                  the Amazon to better understand this immense and complex territory. Starting from
                  this first beta version, we will continue to develop this platform in
                  collaboration with key actors in the region and beyond. Stay tuned.
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
