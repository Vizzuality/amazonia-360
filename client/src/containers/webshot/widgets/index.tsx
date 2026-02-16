"use client";

// Extend the globalThis type to include the READY property
declare global {
  var READY: boolean;
}

import { PropsWithChildren } from "react";

import { FormProvider, useForm } from "react-hook-form";

import { useParams } from "next/navigation";

import { useReport } from "@/lib/report";

import { Indicator, VisualizationTypes } from "@/types/indicator";

import { LoadProvider } from "@/containers/indicators/load-provider";
import { ReportFormData } from "@/containers/results";

import { Report } from "@/payload-types";

export const Screenshot = ({ children }: PropsWithChildren) => {
  const params = useParams<{
    id: `${Report["id"]}`;
    indicatorId: `${Indicator["id"]}`;
    type: VisualizationTypes;
  }>();
  const { id, indicatorId, type } = params;

  const { data: reportData } = useReport({ id: `${id}` });

  const handleLoad = () => {
    globalThis.READY = true;
  };

  const methods = useForm<ReportFormData>({
    values: {
      title: reportData?.title,
      description: reportData?.description,
      topics: reportData?.topics,
      location: reportData?.location,
    },
  });

  return (
    <FormProvider {...methods}>
      <LoadProvider onLoad={handleLoad} indicator={{ id: +indicatorId, type }}>
        {children}
      </LoadProvider>
    </FormProvider>
  );
};

export default Screenshot;
