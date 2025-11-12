export default await function AuthLayout({ children }: LayoutProps<"/[locale]/auth">) {
  return (
    <>
      <main className="relative flex min-h-svh flex-col pt-16">{children}</main>
    </>
  );
};
