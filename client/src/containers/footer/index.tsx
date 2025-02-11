import Image from "next/image";

import { Button } from "@/components/ui/button";

export default function Help() {
  return (
    <section className="bg-blue-900 text-white print:hidden">
      <div className="container">
        <div className="flex w-full flex-col items-center justify-between py-4 md:container md:flex-row md:items-center">
          <div className="flex h-full w-full items-start space-y-10 pb-6 md:flex-col md:items-center md:space-x-10 md:space-y-0 md:pb-0">
            <div className="flex w-full items-center justify-start space-x-10">
              <div className="flex items-center justify-center">
                <Image
                  src={"/images/home/idb_logo.png"}
                  alt="IDB Logo"
                  width={65}
                  height={24}
                  className="text-white"
                />
              </div>

              <div className="flex items-center justify-center">
                <Image
                  src={"/images/home/amazonia_forever_logo.png"}
                  alt="KF Logo"
                  width={65}
                  height={48}
                  className="text-white"
                />
              </div>
            </div>
          </div>
          <div className="flex w-full items-start space-x-6 text-sm font-light">
            <Button variant="link" className="leading-1 p-0 text-white">
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
      </div>
    </section>
  );
}
