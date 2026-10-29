import { ComponentType, createElement, lazy, ReactNode, Suspense } from "react";

import { ClientOnly } from "@tanstack/react-router";

type Loaded<P> = ComponentType<P> | { default: ComponentType<P> };

export type DynamicOptions = {
  ssr?: boolean;
  loading?: () => ReactNode;
};

function getComponent<P>(loaded: Loaded<P>): ComponentType<P> {
  return "default" in loaded ? loaded.default : loaded;
}

export default function dynamic<P extends object>(
  loader: () => Promise<Loaded<P>>,
  options: DynamicOptions = {},
): ComponentType<P> {
  const LazyComponent = lazy(async () => ({ default: getComponent(await loader()) }));

  function DynamicComponent(props: P) {
    const fallback = options.loading?.() ?? null;
    const content = <Suspense fallback={fallback}>{createElement(LazyComponent, props)}</Suspense>;

    if (options.ssr === false) return <ClientOnly fallback={fallback}>{content}</ClientOnly>;
    return content;
  }

  return DynamicComponent;
}
