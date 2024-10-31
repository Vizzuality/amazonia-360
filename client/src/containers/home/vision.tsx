import { CalendarClock, Proportions, Sparkles } from "lucide-react";

export default function Vision() {
  return (
    <section className="bg-blue-50">
      <div className="container flex flex-col space-y-10 py-10 text-white md:py-28">
        <div className="flex w-full flex-col">
          <h3 className="text-sm font-extrabold uppercase tracking-wide-lg text-cyan-500">
            amazoniaForever360+ vision{" "}
          </h3>
          <h2 className="pb-6 text-2xl text-blue-400 lg:text-4xl">AI-Powered on the horizon </h2>
          <p className="text-base font-normal text-blue-900 md:max-w-4xl lg:text-lg">
            As AmazoniaForever360+ grows beyond this prototype, we are committed to enhancing your
            experience. The next chapter will see a suite of AI features that will elevate your
            search experience and understanding:
          </p>
        </div>

        <ul className="mt-20 flex flex-col space-x-0 space-y-10 md:mt-10 md:flex-row md:space-x-10 md:space-y-0">
          <li className="flex w-full flex-col space-y-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white">
              <Sparkles size={32} strokeWidth={1} className="text-cyan-600" />
            </div>
            <div className="flex flex-col space-y-6">
              <h4 className="text-lg font-bold text-blue-500">Smart Search Capabilities</h4>
              <p className="max-w-sm text-base font-normal text-blue-900">
                Navigate through vast datasets with an intelligent search function tailored to
                deliver precise results.
              </p>
            </div>
          </li>
          <li className="flex w-full flex-col space-y-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white">
              <CalendarClock size={32} strokeWidth={1} className="text-cyan-600" />
            </div>
            <div className="flex flex-col space-y-6">
              <h4 className="text-lg font-bold text-blue-500">Instant Data Summaries </h4>
              <p className="max-w-sm text-base font-normal text-blue-900">
                Gain immediate insights with AI-generated summaries that distill complex data into
                clear, actionable information.{" "}
              </p>
            </div>
          </li>
          <li className="flex w-full flex-col space-y-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white">
              <Proportions size={32} strokeWidth={1} className="text-cyan-600" />
            </div>
            <div className="flex flex-col space-y-6">
              <h4 className="text-lg font-bold text-blue-500">Customized Reports</h4>
              <p className="max-w-sm text-base font-normal text-blue-900">
                Receive AI-crafted reports that align with your specific environmental interests,
                enhancing your strategic impact.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
