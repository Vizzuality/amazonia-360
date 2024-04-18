import Topics from "@/containers/report/topics";

export default function InformationOn() {
  return (
    <section className="bg-blue-700">
      <div className="container flex py-10 md:py-28 flex-col">
        <h3 className="uppercase text-sm font-extrabold text-cyan-500 tracking-wide-lg">
          information on
        </h3>
        <h2 className="text-white text-2xl lg:text-4xl pb-6">
          The things that matter{" "}
        </h2>
        <p className="text-white text-base lg:text-lg font-normal">
          Navigate through a curated selection of topics to uncover the
          Amazonia&apos;s multifaceted story. From environmental to
          socioeconomic dynamics, our platform brings you a comprehensive
          perspective.
        </p>
        <div className="mt-10 w-full">
          <Topics size="lg" clickable={false} />
        </div>
      </div>
    </section>
  );
}
