import Image from "next/image";

import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <section className="bg-blue-700 text-white">
      <div className="container">
        <div className="py-16 flex flex-col md:flex-row justify-between items-center">
          <p className="font-light md:w-8/12">
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
        <div className="flex md:flex-row flex-col justify-between w-full py-4">
          <div className="pb-16 md:pb-0 flex md:space-x-10 flex-col space-y-10 md:space-y-0 items-center md:flex-row">
            <Image
              src={"/images/home/IDB-logo.png"}
              alt="IDB Logo"
              width={65}
              height={24}
              className="text-white"
            />
            <Image
              src={"/images/home/KF-logo.png"}
              alt="KF Logo"
              width={65}
              height={24}
              className="text-white"
            />
          </div>
          <div className="text-sm font-light flex md:flex-row flex-col">
            {/* //!TODO: Add hrefs */}
            <Button variant="link" className="text-white leading-1">
              Terms & conditions
            </Button>
            <Button variant="link" className="text-white leading-1">
              Privacy Policy
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
