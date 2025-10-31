import Image from "next/image";

import { Link } from "@/i18n/navigation";

export default function Logo() {
  return (
    <div className="z-[120] flex items-center space-x-2">
      <Link href="/">
        <h1 className="flex items-center space-x-2 lg:space-x-4">
          <Image src="/IDB-logo.svg" alt="IDB" width={65} height={24} priority />
          <div className="space-x-2">
            <span className="text-xs font-medium text-blue-500 lg:text-sm">
              AmazoniaForever360+
            </span>
          </div>
        </h1>
      </Link>
    </div>
  );
}
