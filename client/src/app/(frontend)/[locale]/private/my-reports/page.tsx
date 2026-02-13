import { MyReports } from "@/containers/private/my-reports";

export const dynamic = "force-dynamic";

export default async function MyReportsPage() {
  return (
    <main className="bg-muted relative flex min-h-[calc(100svh_-_calc(var(--spacing)*16))] flex-col">
      <div className="container space-y-5">
        <MyReports />
      </div>
    </main>
  );
}
