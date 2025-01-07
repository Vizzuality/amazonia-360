export default function About() {
  return (
    <section
      className="relative bg-center text-white md:h-[calc(100svh_-_theme(space.20)_+_1px)]"
      style={{
        background:
          "linear-gradient(90deg, rgba(0, 0, 0, 0.60) 34.5%, rgba(0, 62, 90, 0.00) 74%), url('/images/home/hero.jpg') lightgray 50% / cover no-repeat",
      }}
    >
      <div className="container relative h-full">
        <div className="absolute bottom-0 left-0 max-w-xl bg-blue-700 p-10">
          <div className="flex flex-col items-start justify-start space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.7px]">
              About AmazoniaForever360+
            </h3>
            <p className="text-xl font-normal">
              AmazoniaForever360+ is not just presenting data; it’s making sense of it. Our goal is
              to become a focal point that unifies and amplifies the assets from various initiatives
              dedicated to this region, fostering a shared, profound engagement with Amazonia.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
