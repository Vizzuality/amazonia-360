import Image from "next/image";

export default await function AuthLayout({ children }: LayoutProps<"/[locale]/auth">) {
  return (
    <>
      <main className="relative flex min-h-svh">
        <div className="container flex min-h-svh grow flex-col pt-16">
          <div className="grid grow grid-cols-12">
            <div className="flex grow flex-col md:col-span-8">{children}</div>
          </div>
        </div>

        <div className="absolute right-0 top-0 hidden h-full w-1/3 md:block print:hidden">
          <Image
            src="/images/auth/auth.webp"
            alt="Authentication background"
            // width={1055}
            // height={1654}
            fill
            className="object-cover object-center"
            priority
          />
        </div>
      </main>
    </>
  );
};
