import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Hub() {
  return (
    <section className="text-white bg-[url('/images/home/hub.jpeg')] bg-center py-10">
      <div className="container">
        <div className="flex flex-col space-y-8 max-w-xl justify-start items-start">
          <h3 className="text-2xl font-bold">Access knowledge</h3>
          <p className="font-light">
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
