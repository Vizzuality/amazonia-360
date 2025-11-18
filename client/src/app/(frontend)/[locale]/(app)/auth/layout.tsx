import Image from "next/image";

export default await function AuthLayout({ children }: LayoutProps<"/[locale]/auth">) {
  return (
    <>
      <main className="relative flex lg:min-h-svh">
        <div className="container flex grow flex-col pt-20 lg:min-h-svh lg:pt-16">
          <div className="grid grow grid-cols-12">
            <div className="col-span-12 flex grow flex-col lg:col-span-8">{children}</div>
          </div>
        </div>

        <div className="absolute right-0 top-0 hidden h-full w-1/3 lg:block print:hidden">
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
