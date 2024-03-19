import ReportLocation from "@/containers/report/location";
import Map from "@/containers/report/map";

export default function ReportPage() {
  return (
    <main className="relative flex flex-col h-[calc(100svh_-_theme(space.20))]">
      <div className="absolute top-1/2 left-0 z-10 w-full pointer-events-none -translate-y-1/2">
        <div className="container">
          <ReportLocation />
        </div>
      </div>

      <Map />
    </main>
  );
}
