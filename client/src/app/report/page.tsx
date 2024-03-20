import ReportLocation from "@/containers/report/location";
import Map from "@/containers/report/map";

export default function ReportPage() {
  return (
    <main className="relative flex flex-col h-[calc(100svh_-_theme(space.20))]">
      {/* <div className="absolute z-10 w-1/2 h-full left-0 top-0 bg-gradient-to-r from-slate-500/20 to-slate-500/0 pointer-events-none"></div> */}
      <div className="absolute top-1/2 left-0 z-10 w-full pointer-events-none -translate-y-1/2">
        <div className="container">
          <ReportLocation />
        </div>
      </div>

      <Map />
    </main>
  );
}
