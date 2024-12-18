import { Button } from "@/components/ui/button";

export default function Help() {
  return (
    <section className="bg-blue-700 text-white">
      <div className="container">
        <div className="py-16 flex flex-col md:flex-row justify-between items-center">
          <p className="font-normal md:w-8/12">
            AmazoniaForever360+ goes beyond simply presenting data, it&apos;s
            making sense of it. Our goal is to become a focal point that unifies
            and amplifies the potential of geospatial data and information
            produced by partners and initiatives dedicated to the region. By
            achieving this, we aim to cultivate a collective intelligence to
            support the Amazonia Forever program and its collaboration and
            coordination objectives.
          </p>
          <div className="flex flex-col items-center pt-16 md:py-0">
            <h3 className="text-lg font-bold">Help us improve!</h3>
            <a
              href="https://survey123.arcgis.com/share/fadbaa4e81f04f068f5ed0abd99e4789"
              target="_blank"
              rel="noreferrer"
            >
              <Button size="lg" variant="secondary" className="mt-4">
                Give feedback
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
