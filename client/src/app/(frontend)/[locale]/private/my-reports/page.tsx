import { MyReports } from "@/containers/private/my-reports";

export default async function MyReportsPage() {
  return (
    <main className="relative top-16 flex min-h-[calc(100svh_-_theme(space.16))] flex-col bg-muted">
      <div className="container space-y-5">
        <MyReports />
      </div>
    </main>
  );
}
