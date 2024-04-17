import { CalendarClock, Proportions, Sparkles } from "lucide-react";

export default function Vision() {
  return (
    <section className="bg-blue-50">
      <div className="container text-white py-10 md:py-28 flex flex-col space-y-10">
        <div className="flex flex-col w-full">
          <h3 className="uppercase text-sm font-extrabold text-cyan-500 tracking-wide-lg">
            amazonia360 vision{" "}
          </h3>
          <h2 className="text-blue-400 text-2xl lg:text-4xl pb-6">
            AI-Powered on the horizon{" "}
          </h2>
          <p className="text-blue-900 text-base lg:text-lg font-normal md:max-w-4xl">
            As Amazonia360 grows beyond its beta launch, we are committed to
            enhancing your experience. The next chapter will see a suite of AI
            features that will elevate your research and understanding:
          </p>
        </div>

        <ul className="flex md:flex-row flex-col space-y-10 md:space-y-0 space-x-0 md:space-x-10 mt-20 md:mt-10">
          <li className="flex flex-col w-full space-y-6">
            <div className="h-20 w-20 flex items-center justify-center rounded-full bg-white">
              <Sparkles size={32} strokeWidth={1} className="text-cyan-600" />
            </div>
            <div className="flex flex-col space-y-6">
              <h4 className="text-blue-500 text-lg font-bold">
                Smart Search Capabilities
              </h4>
              <p className="text-base text-blue-900 font-normal max-w-sm">
                Navigate through vast datasets with an intelligent search
                function tailored to deliver precise results.
              </p>
            </div>
          </li>
          <li className="flex flex-col w-full space-y-6">
            <div className="h-20 w-20 flex items-center justify-center rounded-full bg-white">
              <CalendarClock
                size={32}
                strokeWidth={1}
                className="text-cyan-600"
              />
            </div>
            <div className="flex flex-col space-y-6">
              <h4 className="text-blue-500 text-lg font-bold">
                Instant Data Summaries{" "}
              </h4>
              <p className="text-base text-blue-900 font-normal max-w-sm">
                Gain immediate insights with AI-generated summaries that distill
                complex data into clear, actionable information.{" "}
              </p>
            </div>
          </li>
          <li className="flex flex-col w-full space-y-6">
            <div className="h-20 w-20 flex items-center justify-center rounded-full bg-white">
              <Proportions
                size={32}
                strokeWidth={1}
                className="text-cyan-600"
              />
            </div>
            <div className="flex flex-col space-y-6">
              <h4 className="text-blue-500 text-lg font-bold">
                Customized Reports
              </h4>
              <p className="text-base text-blue-900 font-normal max-w-sm">
                Receive AI-crafted reports that align with your specific
                environmental interests, enhancing your strategic impact.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
