import Topics from "@/containers/report/topics";

export default function InformationOn() {
  return (
    <section className="bg-blue-700">
      <div className="container flex flex-col py-10 md:py-28">
        <h3 className="text-sm font-extrabold uppercase tracking-wide-lg text-cyan-500">
          information on
        </h3>
        <h2 className="pb-6 text-2xl text-white lg:text-4xl">The things that matter </h2>
        <p className="text-base font-normal text-white lg:text-lg">
          Navigate through a curated selection of topics to uncover the Amazonia&apos;s multifaceted
          story. From environmental to socioeconomic dynamics, our platform brings you a
          comprehensive perspective.
        </p>
        <div className="mt-10 w-full">
          <Topics size="lg" interactive={false} />
        </div>
      </div>
    </section>
  );
}
