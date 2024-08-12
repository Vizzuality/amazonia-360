import Image from "next/image";

import { Button } from "@/components/ui/button";

export default function Help() {
  return (
    <section className="bg-blue-700 text-white print:hidden">
      <div className="container flex w-full flex-col items-center justify-between py-4 md:flex-row">
        <div className="flex flex-col items-center space-y-10 pb-16 md:flex-row md:space-x-10 md:space-y-0 md:pb-0">
          <Image
            src={"/images/home/idb_logo.png"}
            alt="IDB Logo"
            width={65}
            height={24}
            className="text-white"
          />
          <Image
            src={"/images/home/amazonia_forever_logo.png"}
            alt="KF Logo"
            width={65}
            height={48}
            className="text-white"
          />
        </div>
        <div className="flex flex-col text-sm font-light md:flex-row">
          <Button variant="link" className="leading-1 text-white">
            <a href="https://www.iadb.org/en/home/terms-and-conditions" target="_blank">
              Terms & conditions
            </a>
          </Button>
          <Button variant="link" className="leading-1 text-white">
            <a href="https://www.iadb.org/en/home/privacy-notice" target="_blank">
              Privacy Policy
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
