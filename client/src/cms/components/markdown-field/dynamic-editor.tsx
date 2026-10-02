"use client";

import dynamic from "next/dynamic";

// MDXEditor touches `window` while it initialises, and the admin renders fields on the server
// too.
export const DynamicMarkdownEditor = dynamic(() => import("./editor"), { ssr: false });
