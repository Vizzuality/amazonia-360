"use client";

import { ChangePasswordForm } from "@/containers/private/profile/change-password";
import { DeleteAccount } from "@/containers/private/profile/delete-account";
import { ProfileHeader } from "@/containers/private/profile/header";
import { UpdateNameForm } from "@/containers/private/profile/update-name";

export const Profile = () => {
  return (
    <div className="grid grid-cols-12 gap-6 pt-14">
      <div className="col-span-12 lg:col-span-4">
        <ProfileHeader />
      </div>

      <div className="border-border bg-card col-span-12 space-y-8 rounded-2xl border p-8 lg:col-span-8">
        <UpdateNameForm />

        <div className="border-border border-t pt-8">
          <ChangePasswordForm />
        </div>

        <div className="border-border border-t pt-8">
          <DeleteAccount />
        </div>
      </div>
    </div>
  );
};
