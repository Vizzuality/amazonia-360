"use client";

import { cloneElement, HTMLAttributes, isValidElement, ReactElement } from "react";

import { useSession } from "next-auth/react";

import { SignInForm } from "@/containers/auth/sign-in";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import { usePathname } from "@/i18n/navigation";

export const AuthWrapper = (props: { children: ReactElement<HTMLAttributes<HTMLElement>> }) => {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (
    (!session || !session.user || session.user.collection !== "users") &&
    isValidElement(props.children)
  ) {
    // clone element and prevent pointer events on children
    const C = cloneElement(props.children, {
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
      },
    });

    return (
      <Dialog>
        <DialogTrigger asChild>{C}</DialogTrigger>

        <DialogContent>
          <SignInForm redirectUrl={pathname} />
        </DialogContent>
      </Dialog>
    );
  }

  return props.children;
};
