import Image from "next/image";

import { Button } from "@/components/ui/button";

export default function Help() {
  return (
    <section className="bg-blue-700 text-white">
      <div className="container flex md:flex-row flex-col justify-between w-full py-4 items-center">
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
    </section>
  );
}
