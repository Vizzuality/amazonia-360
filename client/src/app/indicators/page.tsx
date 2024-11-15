import { Metadata } from "next";

import PageProviders from "@/app/report/page-providers";

import { Indicators } from "@/containers/indicators";

export const metadata: Metadata = {
  title: "Indicators",
  description: "Coming soon...",
};

export default function IndicatorsPage() {
  return (
    <PageProviders>
      <Indicators />
    </PageProviders>
  );
}
