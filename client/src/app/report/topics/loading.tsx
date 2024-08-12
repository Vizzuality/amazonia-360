import { Skeleton } from "@/components/ui/skeleton";

export default function ReportTopicsLoading() {
  return (
    <main className="relative flex min-h-[calc(100svh_-_theme(space.40)_+_1px)] flex-col bg-blue-50 py-12">
      <div className="flex flex-col space-y-10">
        <div className="container">
          <Skeleton className="mx-auto h-28 w-full max-w-2xl" />
        </div>

        <div className="container">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full 2xl:h-96" />

            <Skeleton className="mx-auto h-8 w-60" />
          </div>
        </div>
      </div>
    </main>
  );
}
