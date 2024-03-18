import Map from "@/containers/map";
import Sidebar from "@/containers/sidebar";

export default function ReportPage() {
  return (
    <main className="flex justify-between">
      <Sidebar />

      <Map />
    </main>
  );
}
