"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="h-20 flex flex-col justify-center bg-white backdrop-blur">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <h1 className="flex items-center space-x-4">
            <Image src="/IDB-logo.svg" alt="IDB" width={65} height={24} />
            <div className="space-x-2">
              <span className="font-medium text-sm">AmazoniaForever360+</span>
              <Badge variant="secondary">Prototype</Badge>
            </div>
          </h1>
        </Link>

        <nav className="flex space-x-8 print:hidden">
          <Link
            className={cn({
              "hover:text-cyan-500 text-sm": true,
              "text-cyan-500": pathname === "/",
            })}
            href="/"
          >
            Home
          </Link>

          <Link
            className={cn({
              "hover:text-cyan-500 text-sm": true,
              "text-cyan-500": pathname.includes("/report"),
            })}
            href="/report"
          >
            Report Tool
          </Link>
          <Link
            className={cn({
              "hover:text-cyan-500 text-sm": true,
              "text-cyan-500": pathname.includes("/hub"),
            })}
            href="/hub"
          >
            Hub
          </Link>
          {/* <Link className="text-blue-600 hover:text-blue-700" href="#">
            Amazonia Forever
          </Link> */}
        </nav>
      </div>
    </header>
  );
}
