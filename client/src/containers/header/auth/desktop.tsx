"use client";

import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { LuFilePlus2, LuFiles, LuLogOut, LuSettings2 } from "react-icons/lu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";

import { Link } from "@/i18n/navigation";

const AuthHeader = () => {
  const t = useTranslations();
  const { data: session } = useSession();

  if (session && session.user.collection === "users") {
    // Get user initials for fallback
    const getInitials = (name?: string | null, email?: string | null) => {
      if (name) {
        return name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
      }
      if (email) {
        return email.slice(0, 2).toUpperCase();
      }
      return "U";
    };

    const userInitials = getInitials(session.user?.name, session.user?.email);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2">
            <Avatar>
              {session.user?.image && (
                <AvatarImage src={session.user.image} alt={session.user?.name || "User avatar"} />
              )}
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Header */}
          <header className="flex items-center">
            <Avatar>
              {session.user?.image && (
                <AvatarImage src={session.user.image} alt={session.user?.name || "User avatar"} />
              )}
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="px-2 pt-2 text-sm font-semibold text-foreground">
                {session.user?.name}
              </p>
              <p className="px-2 pb-2 text-2xs text-muted-foreground">{session.user?.email}</p>
            </div>
          </header>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/private/my-reports" className="flex cursor-pointer items-center">
              <LuFiles className="mr-2 h-4 w-4" />
              {t("auth-my-reports")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/reports" className="flex cursor-pointer items-center">
              <LuFilePlus2 className="mr-2 h-4 w-4" />
              {t("new-report")}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/private/profile" className="flex cursor-pointer items-center">
              <LuSettings2 className="mr-2 h-4 w-4" />
              Profile settings
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              signOut({
                redirect: true,
                redirectTo: "/auth/sign-in",
              });
            }}
            className="cursor-pointer"
          >
            <LuLogOut className="mr-2 h-4 w-4" />
            {t("auth-logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Link href="/auth/sign-in">
      <Button variant="outline">{t("auth-sign-in")}</Button>
    </Link>
  );
};

export default AuthHeader;
