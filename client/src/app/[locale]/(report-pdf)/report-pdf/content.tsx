"use client";

import React from "react";

import { cn } from "@/lib/utils";

import type { Topic } from "@/app/local-api/topics/route";

const pageSeparationClass =
  "border border-gray-300 shadow-lg print:border-none print:shadow-none print:m-0 print:p-0";

// Landscape dimensions
const PAGE_WIDTH_IN = 11;
const PAGE_HEIGHT_IN = 8.5;
const getRandomNumber = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const RANDOM_TOPICS: Topic[] = [
  {
    id: 1,
    name: "Topic 1",
    name_es: "Tema 1",
    name_en: "Topic 1",
    name_pt: "Tópico 1",
    image: "",
    description: "Description 1",
    description_es: "Descripción 1",
    description_en: "Description 1",
    description_pt: "Descrição 1",
    default_visualization: Array.from({ length: getRandomNumber(1, 40) }, (_, i) => ({
      id: i + 1,
      type: "table",
    })),
  },
  {
    id: 2,
    name: "Topic 2",
    name_es: "Tema 2",
    name_en: "Topic 2",
    name_pt: "Tópico 2",
    image: "",
    description: "Description 2",
    description_es: "Descripción 2",
    description_en: "Description 2",
    description_pt: "Descrição 2",
    default_visualization: Array.from({ length: getRandomNumber(1, 40) }, (_, j) => ({
      id: j + 1,
      type: "chart",
    })),
  },
  {
    id: 3,
    name: "Topic 3",
    name_es: "Tema 3",
    name_en: "Topic 3",
    name_pt: "Tópico 3",
    image: "",
    description: "Description 3",
    description_es: "Descripción 3",
    description_en: "Description 3",
    description_pt: "Descrição 3",
    default_visualization: Array.from({ length: getRandomNumber(1, 40) }, (_, j) => ({
      id: j + 1,
      type: "numeric",
    })),
  },
];

const PAGE_CLASS =
  "relative overflow-hidden mx-auto my-auto w-[11in] h-[8.26in] flex flex-col justify-between p-0 box-border";

const PAGE_PADDING_IN = 0;
const PRINT_MARGIN_IN = 0;
const INDICATOR_HEIGHT_IN = 2;
const INDICATOR_WIDTH_IN = 3;
const GAP_IN = 0.222; // 8px ≈ 0.222in

const availableHeight = PAGE_HEIGHT_IN - 2 * PRINT_MARGIN_IN - 2 * PAGE_PADDING_IN;
const availableWidth = PAGE_WIDTH_IN - 2 * PRINT_MARGIN_IN - 2 * PAGE_PADDING_IN;

function PageContainer({
  children,
  bg = "bg-white",
  extra = "",
}: {
  children: React.ReactNode;
  bg?: string;
  extra?: string;
}) {
  return (
    <div
      className={cn(
        PAGE_CLASS,
        bg,
        bg === "bg-blue-50"
          ? "border border-blue-200 shadow-lg print:m-0 print:border-none print:p-0 print:shadow-none"
          : pageSeparationClass,
        extra,
      )}
    >
      {children}
    </div>
  );
}

export default function ReportPDFContent() {
  const [renderTime, setRenderTime] = React.useState<number | null>(null);
  const renderStart = React.useRef(performance.now());
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  React.useEffect(() => {
    setRenderTime(performance.now() - renderStart.current);
  }, []);

  // Track page numbers for all pages
  let currentPage = 1;
  const pages: React.ReactNode[] = [];
  const summaryPageNumbers: { topic: string; page: number }[] = [];

  // Title Page
  pages.push(
    <PageContainer key="title-page" bg="bg-red-100">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <h1 className="mb-[0.5in] text-center text-[0.5in] font-bold">PDF TEST</h1>
        {renderTime !== null && hasMounted && (
          <div className="mt-4 text-[0.2in] text-gray-600">
            Render time: {(renderTime / 1000).toFixed(2)}s
          </div>
        )}
      </div>
    </PageContainer>,
  );
  currentPage++;

  // Index Page (placeholder, will be replaced after collecting summaryPageNumbers)
  pages.push(
    <PageContainer key="index-page" bg="bg-blue-100">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <h2 className="mb-[0.3in] text-[0.5in]">Index</h2>
        <div className="text-[0.3in]">INDEX_PLACEHOLDER</div>
      </div>
    </PageContainer>,
  );
  currentPage++;

  // Topic Pages
  RANDOM_TOPICS.forEach((topic) => {
    function fitCount(total: number, size: number, gap: number) {
      return Math.max(1, Math.floor((total + gap) / (size + gap)));
    }
    const indicatorsPerRow = fitCount(availableWidth, INDICATOR_WIDTH_IN, GAP_IN);
    const indicatorsPerCol = fitCount(availableHeight, INDICATOR_HEIGHT_IN, GAP_IN);
    const indicatorsPerPage = indicatorsPerRow * indicatorsPerCol;

    // Prepare indicators and summary
    const indicators = Array.isArray(topic.default_visualization)
      ? topic.default_visualization
      : [];
    const indicatorChunks = [];
    for (let i = 0; i < indicators.length; i += indicatorsPerPage) {
      indicatorChunks.push(indicators.slice(i, i + indicatorsPerPage));
    }

    // Summary page (first page for each topic)
    summaryPageNumbers.push({ topic: topic.name || String(topic.id), page: currentPage });
    pages.push(
      <PageContainer
        key={`${topic.id || topic.name}-summary`}
        bg="bg-blue-50"
        extra="!border-none !shadow-none"
      >
        <div className="flex h-full w-full flex-col items-center justify-center">
          <h2 className="mb-[0.3in] text-[0.5in] font-bold text-blue-900">
            {topic.name || topic.id}
          </h2>
          <div className="mb-4 text-[0.3in] text-blue-800">
            {indicators.length} indicator{indicators.length !== 1 ? "s" : ""}
          </div>
        </div>
      </PageContainer>,
    );
    currentPage++;

    // Indicator pages (subsequent pages)
    indicatorChunks.forEach((chunk, pageIdx) => {
      const pageNumber = currentPage;
      pages.push(
        <PageContainer
          key={`topic-${topic.id || topic.name}-${pageIdx}-indicators`}
          bg="bg-white"
          extra="!border-none !shadow-none"
        >
          <div className="flex h-full w-full flex-wrap items-center justify-center gap-8">
            {chunk.length > 0 ? (
              chunk.map((indicator: { id: number; type: string }) => (
                <div
                  key={indicator.id}
                  className="flex h-[2in] w-[3in] flex-col items-center justify-center rounded-lg border-2 border-blue-400 bg-blue-50 p-8"
                >
                  <div className="mb-2 text-[0.3in] font-bold">Type: {indicator.type}</div>
                  <div className="text-[0.3in]">ID: {indicator.id}</div>
                </div>
              ))
            ) : (
              <div className="text-[0.3in]">No indicators found</div>
            )}
          </div>
          <div className="absolute bottom-[2.3in] right-[0.6in] text-[0.2in]">{pageNumber}</div>
        </PageContainer>,
      );
      currentPage++;
    });
  });

  // Replace index page with correct index
  pages[1] = (
    <PageContainer key="index-page" bg="bg-blue-100">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <h2 className="mb-[0.3in] text-[0.5in]">Index</h2>
        <ul className="text-[0.3in]">
          {summaryPageNumbers.map((item) => (
            <li key={String(item.topic)} className="mb-[0.1in]">
              {item.topic} — Page {String(item.page)}
            </li>
          ))}
        </ul>
      </div>
    </PageContainer>
  );

  // (Title and index page logic moved above)

  return <div>{pages}</div>;
}
