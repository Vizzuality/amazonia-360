"use client";

import dynamic from "next/dynamic";

const IndicatorList = dynamic(() => import("@/containers/indicators/list"), {
  ssr: false,
});

export const Indicators = () => {
  return (
    <section className="py-10">
      <div className="container">
        <IndicatorList />
      </div>
    </section>
  );
};

export default Indicators;
