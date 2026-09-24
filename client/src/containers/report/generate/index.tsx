"use client";

import { useMemo } from "react";

import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";

import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSetAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { LuArrowLeft } from "react-icons/lu";
import { toast } from "sonner";
import { z } from "zod";

import { getCountryCodes } from "@/lib/country";
import { useGetIndicators } from "@/lib/indicators";
import {
  getIndicatorSubstitutionMap,
  getSubstitutedIndicatorId,
} from "@/lib/indicators/substitution";
import { useSaveReport } from "@/lib/report";
import { useGetDefaultTopics } from "@/lib/topics";
import { cn } from "@/lib/utils";

import { reportPanelAtom, useSyncLocation } from "@/app/(frontend)/store";

import { ReportGenerateButtons } from "@/containers/report/generate/buttons";
import Topics from "@/containers/report/generate/topics";

import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Link } from "@/i18n/navigation";
import { getPathname } from "@/i18n/navigation-client";
import { useCountry } from "@/i18n/use-country";

export type TopicsFormValues = {
  id: number;
  subtopics: number[];
};

export const formSchema = z.object({
  topics: z.array(z.custom<TopicsFormValues>()),
});

export default function ReportGenerate({ heading = "create" }: { heading?: "select" | "create" }) {
  const t = useTranslations();
  const locale = useLocale();
  const country = useCountry();

  const [location] = useSyncLocation();

  const searchParams = useSearchParams();
  const setReportPanel = useSetAtom(reportPanelAtom);

  const { data: topicsData } = useGetDefaultTopics({ locale });
  const { data: indicatorsData } = useGetIndicators(locale, undefined, country);

  const router = useRouter();

  const substitutionMap = useMemo(
    () => getIndicatorSubstitutionMap(indicatorsData ?? []),
    [indicatorsData],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topics: [],
    },
  });

  const saveMutation = useSaveReport();

  const countries = getCountryCodes(country);

  function generateReportData(values: z.infer<typeof formSchema>) {
    const topics = values.topics
      ?.map((t) => ({
        id: `${t.id}-${crypto.randomUUID()}`,
        topic_id: t.id,
        indicators: topicsData
          ?.find((topic) => topic.id === t.id)
          ?.default_visualization.map((indicator) => {
            return {
              ...indicator,
              id: `${indicator.id}-${crypto.randomUUID()}`,
              indicator_id: getSubstitutedIndicatorId(
                indicator.indicator_id,
                indicator.type,
                substitutionMap,
              ),
            };
          }),
      }))
      .filter((t) => t.indicators && t.indicators.length > 0);

    return {
      title: null,
      description: null,
      topics: topics || [],
      location: location,
      country: countries.length > 0 ? countries : null,
    };
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const data = generateReportData(values);

    toast.promise(
      saveMutation.mutateAsync(data, {
        onSuccess: (report) => {
          router.push(getPathname({ href: `/reports/${report.id}`, locale }));
        },
      }),
      {
        loading: "Creating report...",
        success: "Report created successfully!",
        error: "Failed to create the report.",
      },
    );
  }

  const HEADER = {
    select: (
      <div className="flex items-center justify-between">
        <h1 className="text-primary flex items-center gap-2 text-lg font-bold">
          <Link
            href={`/reports${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
            className="flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-2.5 transition-colors duration-400 ease-in-out hover:bg-blue-100"
          >
            <LuArrowLeft className="h-4 w-4" onClick={() => setReportPanel("location")} />
          </Link>
          {t("sidebar-report-location-indicators-title")}
        </h1>
      </div>
    ),
    create: (
      <div className="flex items-baseline justify-between">
        <h1 className="text-primary flex items-center gap-2 text-lg font-bold">
          {t("landing-key-features-grid-buttons-create-report")}
        </h1>
      </div>
    ),
  };

  return (
    <Form {...form}>
      <form
        className={cn(
          "relative flex h-full max-h-[calc(100svh-calc(var(--spacing)*16))] grow flex-col justify-between overflow-hidden rounded-lg py-4 lg:max-h-[calc(100vh-(calc(var(--spacing)*16)+calc(var(--spacing)*20)))]",
          "lg:border lg:border-blue-100",
        )}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex grow flex-col overflow-hidden">
          <header className="shrink-0 space-y-2 lg:px-6">
            {HEADER[heading]}
            <div className="space-y-1">
              <div className="text-muted-foreground text-sm font-medium">
                <ReactMarkdown>{t("sidebar-report-location-indicators-description")}</ReactMarkdown>
              </div>
            </div>
          </header>

          <div className="relative flex grow flex-col overflow-hidden">
            <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-4 bg-linear-to-b from-white to-transparent" />
            <ScrollArea className="flex grow flex-col lg:px-6">
              <div className="py-4">
                <Topics />
              </div>
            </ScrollArea>
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-4 bg-linear-to-t from-white to-transparent" />
          </div>
        </div>

        <div className="shrink-0 lg:px-6">
          <ReportGenerateButtons mutation={saveMutation} />
        </div>
      </form>
    </Form>
  );
}
