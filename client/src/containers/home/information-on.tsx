import Topics from "@/containers/home/topics";

export default function InformationOn() {
  return (
    <section className="bg-blue-700">
      <div className="container flex flex-col space-y-2 pt-20 md:space-y-0 md:pt-28">
        <h3 className="text-sm font-extrabold uppercase tracking-wide-lg text-cyan-500">
          information on
        </h3>
        <div className="flex w-full flex-col justify-between md:grid md:grid-cols-2 md:gap-14">
          <h2 className="text-2xl text-white lg:text-4xl">
            More than 60 indicators <br /> from different topics
          </h2>
          <p className="text-base font-normal text-white lg:text-lg">
            Navigate through a curated selection of topics to uncover the Amazonia&apos;s
            multifaceted story. From environmental to socioeconomic dynamics, our platform brings
            you a comprehensive perspective.
          </p>
        </div>
        <div className="w-full">
          <Topics />
        </div>
      </div>
    </section>
  );
}
