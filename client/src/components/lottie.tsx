import { Suspense, lazy } from "react";

import { useQuery } from "@tanstack/react-query";
import { type LottieComponentProps } from "lottie-react";

import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";

const LazyLottieComponent = lazy(() => import("lottie-react"));

interface LottieProps<T extends Record<string, unknown>> {
  getAnimationData: () => Promise<T>;
  id: string;
  className?: string;
}

export function LazyLottie<T extends Record<string, unknown>>({
  getAnimationData,
  id,
  className,
  ...props
}: LottieProps<T> & Omit<LottieComponentProps, "animationData" | "ref">) {
  const { data } = useQuery({
    queryKey: [id],
    queryFn: async () => {
      void import("lottie-react");
      return getAnimationData();
    },
    enabled: typeof window !== "undefined",
  });

  if (!data) return <Skeleton className={cn(className)} />;

  return (
    <Suspense fallback={<Skeleton className={cn(className)} />}>
      <LazyLottieComponent animationData={data} {...props} />
    </Suspense>
  );
}
