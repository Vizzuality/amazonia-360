import { LayoutDashboard, MapPinned, Share2 } from "lucide-react";

export default function KeyFeatures() {
  return (
    <section className="container flex flex-col py-10 md:py-28 lg:flex-row lg:space-x-28">
      <div className="flex w-full flex-col lg:w-1/2">
        <h3 className="text-sm font-extrabold uppercase tracking-wide-lg text-cyan-500">
          key features
        </h3>
        <h2 className="pb-6 text-2xl text-blue-400 lg:text-4xl">
          Knowledge for a thriving Amazonia
        </h2>
        <p className="text-base font-normal text-blue-900 lg:text-lg">
          Personalize your experience with reports that adapt to your focus areas, providing you
          with the targeted insights you need to understand the region complexity and challenges.
        </p>
      </div>
      <div className="w-full lg:w-1/2">
        <ul className="mt-20 flex flex-col space-y-10 lg:mt-6">
          <li className="flex w-full space-x-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
              <MapPinned size={32} strokeWidth={1} className="text-cyan-600" />
            </div>
            <div className="w-3/4">
              <h4 className="text-lg font-bold text-blue-500">Custom areas of interest</h4>
              <p className="text-base font-normal text-blue-900">
                Select or search for a territory of interest on the map by drawing or searching for
                geographic locations.
              </p>
            </div>
          </li>
          <li className="flex w-full space-x-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
              <LayoutDashboard size={32} strokeWidth={1} className="text-cyan-600" />
            </div>
            <div className="w-3/4">
              <h4 className="text-lg font-bold text-blue-500">Customizable search</h4>
              <p className="text-base font-normal text-blue-900">
                Customize your search with the data that matters most to you.
              </p>
            </div>
          </li>
          <li className="flex w-full space-x-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
              <Share2 size={32} strokeWidth={1} className="text-cyan-600" />
            </div>
            <div className="w-3/4">
              <h4 className="text-lg font-bold text-blue-500">Shareable reports</h4>
              <p className="text-base font-normal text-blue-900">
                Share your reports with your team or stakeholders to keep everyone informed.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
