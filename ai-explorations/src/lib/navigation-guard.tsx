import { ReactNode, useEffect, useRef, useState } from "react";

import { RegisteredRouter, useBlocker, useRouter } from "@tanstack/react-router";

export type NavigationGuardParams = {
  to: string;
  type: "push" | "replace" | "refresh" | "popstate" | "beforeunload";
};

export type NavigationGuardOptions = {
  enabled?: boolean | ((params: NavigationGuardParams) => boolean);
};

type LinkNavigation = {
  to: string;
  type: "push" | "replace";
};

const GUARD_TYPES: Record<string, NavigationGuardParams["type"]> = {
  PUSH: "push",
  REPLACE: "replace",
};

const EXTERNAL_HREF = /^(https?:)?\/\//;

function isGuardEnabled(
  enabled: NavigationGuardOptions["enabled"],
  params: NavigationGuardParams,
): boolean {
  if (typeof enabled === "function") return enabled(params);
  return enabled ?? true;
}

function hasModifier(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

// Same eligibility rules as next-navigation-guard's `useInterceptLinkClicks`.
function getLinkNavigation(event: MouseEvent): LinkNavigation | null {
  if (!(event.target instanceof Element) || hasModifier(event)) return null;

  const link = event.target.closest("a[href]");
  const href = link?.getAttribute("href");
  if (!(link instanceof HTMLAnchorElement) || !href) return null;
  if (EXTERNAL_HREF.test(href) || href.startsWith("#")) return null;
  if ((link.target && link.target !== "_self") || link.hasAttribute("download")) return null;

  return { to: href, type: link.dataset.replace === "true" ? "replace" : "push" };
}

export function useNavigationGuard({ enabled }: NavigationGuardOptions) {
  const router = useRouter();
  const enabledRef = useRef(enabled);
  const [pendingLink, setPendingLink] = useState<LinkNavigation | null>(null);

  const blocker = useBlocker({
    shouldBlockFn: ({ action, next }) =>
      isGuardEnabled(enabled, { to: next.pathname, type: GUARD_TYPES[action] ?? "popstate" }),
    enableBeforeUnload: () => isGuardEnabled(enabled, { to: "", type: "beforeunload" }),
    withResolver: true,
  });

  const accept = () => {
    if (!pendingLink) {
      blocker.proceed?.();
      return;
    }

    setPendingLink(null);
    void router.navigate<RegisteredRouter, string>({
      href: pendingLink.to,
      replace: pendingLink.type === "replace",
      ignoreBlocker: true,
    });
  };

  const reject = () => {
    setPendingLink(null);
    blocker.reset?.();
  };

  useEffect(() => {
    enabledRef.current = enabled;
  });

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const navigation = getLinkNavigation(event);
      if (!navigation || !isGuardEnabled(enabledRef.current, navigation)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setPendingLink(navigation);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return {
    active: blocker.status === "blocked" || pendingLink !== null,
    accept,
    reject,
  };
}

export function NavigationGuardProvider({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
