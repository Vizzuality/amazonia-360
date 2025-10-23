import ReportMap from "@/containers/report/map";

import { MapContainerProvider } from "@/components/map/container-provider";

export default await function ReportNewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MapContainerProvider>
        {children}
        <ReportMap />
      </MapContainerProvider>
    </>
  );
};
