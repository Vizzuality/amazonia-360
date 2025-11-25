// import { ChangePasswordForm } from "@/containers/my-reports/change-password";

export default async function MyProfilePage() {
  return (
    <main className="relative top-16 flex min-h-[calc(100svh_-_theme(space.40)_+_1px)] flex-col">
      <div className="container space-y-5">
        <h1 className="mb-8 mt-4 text-3xl font-semibold">Profile</h1>

        <div className="max-w-md">{/* <ChangePasswordForm /> */}</div>
      </div>
    </main>
  );
}
