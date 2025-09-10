import Header from "@/containers/header";
import { WebshotReportContainer } from "@/containers/webshot/webshot-report-container";

import { SidebarProvider } from "@/components/ui/sidebar";

export default function WebshotReport() {
  return (
    <main className="relative flex w-full flex-col">
      <SidebarProvider>
        <WebshotReportContainer>
          <Header withLanguageSelector={false} />
          <div className="relative">
            <div className="absolute bottom-[60px] z-10 flex w-[551px] flex-col gap-8 bg-blue-700 px-14 py-10">
              <h1 className="text-6xl text-white">Report on Pando Region</h1>
              <p className="font-normal text-white">
                This report includes a geographic context, population and nature insights.
              </p>
              <p className="font-normal text-white">7 July, 2020 | English Version</p>
            </div>
            <img src="/images/report/world-globe.webp" alt="" role="presentation" />
          </div>
        </WebshotReportContainer>
        <WebshotReportContainer>
          <Header withLanguageSelector={false} />
          <div className="flex h-full">
            <div className="flex h-full w-[50%] flex-col justify-center gap-8 bg-blue-50 px-14">
              <h1 className="text-2xl text-primary">Geographic context</h1>
              <p className="font-medium">
                The selected area intersects 1 state, 4 municipalities and 5 capital cities
              </p>
              <div className="flex flex-col">
                <div className="flex flex-row items-center justify-between border-b border-gray-300 py-4">
                  <p className="font-medium text-blue-600">Total area</p>
                  <p className="font-bold text-blue-600">45,900 km2</p>
                </div>
                <div className="flex flex-row items-center justify-between border-b border-gray-300 py-4">
                  <p className="font-medium text-blue-600">Population</p>
                  <p className="font-bold text-blue-600">265,000</p>
                </div>
                <div className="flex flex-row items-center justify-between border-b border-gray-300 py-4">
                  <p className="font-medium text-blue-600">Protected areas</p>
                  <p className="font-bold text-blue-600">10</p>
                </div>
                <div className="flex flex-row items-center justify-between border-b border-gray-300 py-4">
                  <p className="font-medium text-blue-600">Indigenous territories</p>
                  <p className="font-bold text-blue-600">2</p>
                </div>
                <div className="flex flex-row items-center justify-between border-b border-gray-300 py-4">
                  <p className="font-medium text-blue-600">Countries</p>
                  <p className="font-bold text-blue-600">2</p>
                </div>
                <div className="flex flex-row items-center justify-between border-b border-gray-300 py-4">
                  <p className="font-medium text-blue-600">States</p>
                  <p className="font-bold text-blue-600">9</p>
                </div>
                <div className="flex flex-row items-center justify-between border-b border-gray-300 py-4">
                  <p className="font-medium text-blue-600">Administrative capitals</p>
                  <p className="font-bold text-blue-600">2</p>
                </div>
              </div>
            </div>
            <div className="h-full w-[50%] bg-gray-400"></div>
          </div>
        </WebshotReportContainer>
      </SidebarProvider>
    </main>
  );
}
