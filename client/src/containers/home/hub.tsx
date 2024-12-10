import Link from "next/link";

import { LuArrowRight } from "react-icons/lu";

import { Button } from "@/components/ui/button";

export default function Hub() {
  return (
    <section
      className="bg-center py-28 text-white"
      style={{
        background:
          "linear-gradient(90deg, rgba(0, 0, 0, 0.60) 34.5%, rgba(0, 62, 90, 0.00) 74%), url('/images/home/hub.jpeg') lightgray 50% / cover no-repeat",
      }}
    >
      <div className="container">
        <div className="flex max-w-xl flex-col items-start justify-start space-y-8">
          <h3 className="text-2xl font-bold">Access knowledge</h3>
          <p className="font-normal">
            Dive into our repository of comprehensive resources, studies, and data – a central hub
            for all information related to Amazonia&apos;s environment and its communities.
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
