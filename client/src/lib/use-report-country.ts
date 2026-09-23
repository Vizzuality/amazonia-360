"use client";

import { useParams } from "next/navigation";

import { useReport } from "@/lib/report";

import { Report } from "@/payload-types";

// Reads the report's own stored module rather than the URL's: a report can be opened
// unscoped (viewer, webshot) yet must still resolve indicators from the module it was saved in.
export const useReportCountry = (): Report["country"] => {
  const { id } = useParams();
  const { data } = useReport({ id: `${id}` });
  return data?.country ?? null;
};
