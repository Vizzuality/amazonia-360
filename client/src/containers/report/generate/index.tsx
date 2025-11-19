"use client";

import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";

import { useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSetAtom } from "jotai";
import { signIn, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { LuArrowLeft } from "react-icons/lu";
import { z } from "zod";

import { parseTopicViews } from "@/lib/report";
import { useGetDefaultTopics } from "@/lib/topics";
import { cn } from "@/lib/utils";

import { reportPanelAtom, useSyncLocation } from "@/app/(frontend)/store";

import { ReportGenerateButtons } from "@/containers/report/generate/buttons";
import Topics from "@/containers/report/generate/topics";

import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Link, useRouter } from "@/i18n/navigation";

import { sdk } from "@/services/sdk";

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

  const { data: session } = useSession();

  const [location] = useSyncLocation();
  const searchParams = useSearchParams();
  const setReportPanel = useSetAtom(reportPanelAtom);

  const { data: topicsData } = useGetDefaultTopics({ locale });

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topics: [],
    },
  });

  async function generateReport(values: z.infer<typeof formSchema>) {
    const topics = values.topics
      ?.map((t) => ({
        id: `${t.id}-${crypto.randomUUID()}`,
        topic_id: t.id,
        indicators: topicsData
          ?.find((topic) => topic.id === t.id)
          ?.default_visualization.map((indicator) => {
            return {
              ...indicator,
              id: `${indicator.id}-${indicator.type}-${crypto.randomUUID()}`,
              indicator_id: Number(indicator.id),
            };
          }),
      }))
      .filter((t) => t.indicators && t.indicators.length > 0);

    if (location) {
      return sdk.create({
        collection: "reports",
        data: {
          location,
          topics: parseTopicViews(topics) ?? [],
        },
      });
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!session) {
      const res = await signIn("anonymous-users", { redirect: false });

      if (res.ok) {
        const report = await generateReport(values);

        if (report) {
          return router.push(`/report/${report.id}`);
        }
      }
    }

    const report = await generateReport(values);

    if (report) {
      return router.push(`/report/${report.id}`);
    }
  }

  const HEADER = {
    select: (
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
          <Link
            href={`/report${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
            className="duration-400 flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-2.5 transition-colors ease-in-out hover:bg-blue-100"
          >
            <LuArrowLeft className="h-4 w-4" onClick={() => setReportPanel("location")} />
          </Link>
          {t("sidebar-report-location-indicators-title")}
        </h1>
      </div>
    ),
    create: (
      <div className="flex items-baseline justify-between">
        <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
          {t("landing-key-features-grid-buttons-create-report")}
        </h1>
      </div>
    ),
  };

  return (
    <Form {...form}>
      <form
        className={cn(
          "relative flex h-full max-h-[calc(100svh_-_theme(spacing.16))] grow flex-col justify-between overflow-hidden rounded-lg py-4 lg:max-h-[calc(100vh_-_(theme(spacing.16)_+_theme(spacing.20)))]",
          "lg:border lg:border-blue-100",
        )}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex grow flex-col overflow-hidden">
          <header className="shrink-0 space-y-2 lg:px-6">
            {HEADER[heading]}
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                <ReactMarkdown>{t("sidebar-report-location-indicators-description")}</ReactMarkdown>
              </div>
            </div>
          </header>

          <div className="relative flex grow flex-col overflow-hidden">
            <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-4 bg-gradient-to-b from-white to-transparent" />
            <ScrollArea className="flex grow flex-col lg:px-6">
              <div className="py-4">
                <Topics />
              </div>
            </ScrollArea>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-4 bg-gradient-to-t from-white to-transparent" />
          </div>
        </div>

        <div className="shrink-0 lg:px-6">
          <ReportGenerateButtons />
        </div>
      </form>
    </Form>
  );
}
