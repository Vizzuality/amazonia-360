import { Button } from "@/components/ui/button";

export default function Help() {
  return (
    <section className="bg-blue-700 text-white">
      <div className="container">
        <div className="py-16 flex flex-col md:flex-row justify-between items-center">
          <p className="font-normal md:w-8/12">
            Amazonia360 is not just presenting data; it&apos;s making sense of
            it. Our goal is to become a focal point that unifies and amplifies
            the assets from various initiatives dedicated to this region,
            fostering a shared, profound engagement with Amazonia.
          </p>
          <div className="flex flex-col items-center pt-16 md:py-0">
            <h3 className="text-lg font-bold">Help us improve!</h3>
            <Button size="lg" variant="secondary" className="mt-4">
              Give feedback
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
