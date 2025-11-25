"use client";

export const ProfileHeader = () => {
  return (
    <header className="flex items-center justify-between pb-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold text-primary">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>
    </header>
  );
};
