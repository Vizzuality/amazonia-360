import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Hub() {
  return (
    <section
      className="text-white bg-center py-20"
      style={{
        background:
          "linear-gradient(90deg, rgba(0, 0, 0, 0.60) 34.5%, rgba(0, 62, 90, 0.00) 74%), url('/images/home/hub.jpeg') lightgray 50% / cover no-repeat",
      }}
    >
      <div className="container">
        <div className="flex flex-col space-y-8 max-w-xl justify-start items-start">
          <h3 className="text-2xl font-bold">Access knowledge</h3>
          <p className="font-normal">
            Dive into our repository of comprehensive resources, studies, and
            data – a central hub for all information related to Amazonia&apos;s
            environment and its communities.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-4 space-x-2.5 flex"
          >
            <p>Access hub</p>
            <ArrowRight size={20} strokeWidth={1} />
          </Button>
        </div>
      </div>
    </section>
  );
}
