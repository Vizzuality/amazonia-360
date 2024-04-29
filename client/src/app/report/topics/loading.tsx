import { Skeleton } from "@/components/ui/skeleton";

export default function ReportTopicsLoading() {
  return (
    <main className="relative flex flex-col bg-blue-50 py-12 min-h-[calc(100svh_-_theme(space.40)_+_1px)]">
      <div className="flex flex-col space-y-10">
        <div className="container">
          <Skeleton className="h-28 w-full max-w-2xl mx-auto" />
        </div>

        <div className="container">
          <div className="space-y-6">
            <Skeleton className="2xl:h-96 h-64 w-full" />

            <Skeleton className="h-8 w-60 mx-auto" />
          </div>
        </div>
      </div>
    </main>
  );
}
