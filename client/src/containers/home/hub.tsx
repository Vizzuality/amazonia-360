import Link from "next/link";

import { LuArrowRight } from "react-icons/lu";

import { Button } from "@/components/ui/button";

export default function Hub() {
  return (
    <section
      className="bg-center py-20 text-white sm:py-28"
      style={{
        background:
          "linear-gradient(90deg, rgba(0, 0, 0, 0.60) 34.5%, rgba(0, 62, 90, 0.00) 74%), url('/images/home/hub.jpeg') lightgray 50% / cover no-repeat",
      }}
    >
      <div className="container">
        <div className="flex max-w-xl flex-col items-start justify-start space-y-8">
          <h3 className="text-2xl font-bold">GeoKnow</h3>
          <p className="max-w-lg font-normal">
            Access our mapped knowledge library, where georeferenced research and resources from IDB
            and partners guide you straight to information about your area of interest.
          </p>
          <p className="max-w-lg font-normal">
            Remove access to the Hub. Perhaps a shortcut to the GeoKnow (Knowledge products
            section?)
          </p>
          <Link href="/hub">
            <Button size="lg" variant="secondary" className="mt-4 flex space-x-2.5">
              <p>Access hub</p>
              <LuArrowRight size={20} strokeWidth={1} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
