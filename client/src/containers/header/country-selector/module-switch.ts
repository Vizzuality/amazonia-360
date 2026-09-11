"use client";

import type { MouseEvent } from "react";

export type ModuleSwitchHandler = (event: MouseEvent<HTMLAnchorElement>) => void;

/**
 * Builds the click handler that swaps the module in place.
 *
 * Choosing a module is a plain left click on a real anchor, and it never navigates:
 * `history.pushState` moves the address bar and the router's canonical URL without asking
 * the server for a new tree, so nothing below `[country]` unmounts. The home page keeps
 * its scroll position and its already-played animations, and the report keeps its map.
 * Everything that shows the module reads it from the pathname (`useCountry`), so the
 * picker, every in-app link and anything else that cares re-renders on its own.
 *
 * The row stays an anchor with a real href because a middle click, a cmd/ctrl click and
 * "copy link address" all need one — those get the full navigation they asked for, which
 * is what a fresh tab has to do anyway.
 *
 * `onSelected` is where the surface closes itself: with no navigation there is nothing to
 * tear the popover or the mobile menu down.
 */
export function moduleSwitchHandler(onSelected: () => void): ModuleSwitchHandler {
  return (event) => {
    // Let the browser have the clicks that mean "somewhere else": a new tab or a new
    // window, or anything a handler upstream already claimed. A real middle click arrives
    // as `auxclick` and never reaches here at all; the button check is for the browsers
    // that have not caught up.
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const href = event.currentTarget.getAttribute("href");
    if (!href) return;

    event.preventDefault();

    // Only the path is the picker's to change. Taking the query and the hash from the live
    // URL rather than from the href keeps whatever the map has written to `bbox` since the
    // row was rendered, and the row for the module you are already in has nothing to do.
    const { pathname } = new URL(href, window.location.href);
    if (pathname !== window.location.pathname) {
      const { search, hash } = window.location;
      window.history.pushState(null, "", `${pathname}${search}${hash}`);
    }

    onSelected();
  };
}
