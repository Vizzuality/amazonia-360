"use client";

import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  if (session) {
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
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href="/my-area" className="flex cursor-pointer items-center">
              {t("auth-my-area")}
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
            {t("auth-logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Link href="/auth/sign-in" className="text-sm text-foreground hover:text-cyan-500">
      {t("auth-sign-in")}
    </Link>
  );
};

export default AuthHeader;
