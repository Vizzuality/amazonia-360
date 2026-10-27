import { createFileRoute } from "@tanstack/react-router";

import { MyReports } from "@/containers/private/my-reports";

export const Route = createFileRoute("/$locale/{-$country}/private/my-reports")({
  component: MyReportsPage,
});

function MyReportsPage() {
  return (
    <main className="relative flex min-h-[calc(100svh-calc(var(--spacing)*16))] flex-col bg-muted">
      <div className="container space-y-5">
        <MyReports />
      </div>
    </main>
  );
}
