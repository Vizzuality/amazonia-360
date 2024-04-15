import { LayoutDashboard, MapPinned, Share2 } from "lucide-react";

export default function KeyFeatures() {
  return (
    <section className="container flex md:space-x-28 py-10 md:py-28 md:flex-row flex-col">
      <div className="flex flex-col w-full md:w-1/2">
        <h3 className="uppercase text-sm font-extrabold text-cyan-500">
          key features
        </h3>
        <h2 className="text-blue-400 text-2xl lg:text-4xl pb-6">
          Knowledge for a thriving Amazonia
        </h2>
        <p className="text-blue-900 text-base lg:text-lg font-light">
          Personalize your experience with reports that adapt to your focus
          areas, providing you with the targeted insights you need to make
          informed decisions.
        </p>
      </div>
      <div className="w-full md:w-1/2">
        <ul className="flex flex-col space-y-10 mt-20 md:mt-6">
          <li className="flex space-x-6 w-full">
            <div className="h-20 w-20 flex items-center justify-center rounded-full bg-blue-50">
              <MapPinned size={32} strokeWidth={1} className="text-cyan-600" />
            </div>
            <div className="w-3/4">
              <h4 className="text-blue-500 text-lg font-semibold">
                Custom areas of interest
              </h4>
              <p className="text-base text-blue-900 font-light">
                Select or search for a territory of interest on the map by
                drawing or searching for geographic locations.
              </p>
            </div>
          </li>
          <li className="flex space-x-6 w-full">
            <div className="h-20 w-20 flex items-center justify-center rounded-full bg-blue-50">
              <LayoutDashboard
                size={32}
                strokeWidth={1}
                className="text-cyan-600"
              />
            </div>
            <div className="w-3/4">
              <h4 className="text-blue-500 text-lg font-semibold">
                Customizable dashboards
              </h4>
              <p className="text-base text-blue-900 font-light">
                Customize your dashboard with the data that matters most to you.
              </p>
            </div>
          </li>
          <li className="flex space-x-6 w-full">
            <div className="h-20 w-20 flex items-center justify-center rounded-full bg-blue-50">
              <Share2 size={32} strokeWidth={1} className="text-cyan-600" />
            </div>
            <div className="w-3/4">
              <h4 className="text-blue-500 text-lg font-semibold">
                Shareable reports
              </h4>
              <p className="text-base text-blue-900 font-light">
                Share your reports with your team or stakeholders to keep
                everyone informed.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}