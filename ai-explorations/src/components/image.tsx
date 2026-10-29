import { CSSProperties, useState } from "react";

import { composeRefs } from "@/lib/compose-refs";

export type StaticImageData = {
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
};

type Dimension = number | `${number}`;

export type ImageProps = Omit<
  React.ComponentProps<"img">,
  "src" | "alt" | "width" | "height" | "placeholder" | "loading"
> & {
  src: string | StaticImageData;
  alt: string;
  width?: Dimension;
  height?: Dimension;
  fill?: boolean;
  priority?: boolean;
  loading?: "eager" | "lazy";
  placeholder?: "blur" | "empty" | `data:image/${string}`;
  blurDataURL?: string;
  quality?: Dimension;
  unoptimized?: boolean;
};

const FILL_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
};

function getPlaceholderUrl(
  placeholder: ImageProps["placeholder"],
  blurDataURL: string | undefined,
): string | undefined {
  if (placeholder === "blur") return blurDataURL;
  if (placeholder === "empty") return undefined;
  return placeholder;
}

function getPlaceholderStyle(url: string | undefined, objectFit: CSSProperties["objectFit"]) {
  if (!url) return {};
  return {
    backgroundImage: `url("${url}")`,
    backgroundPosition: "50% 50%",
    backgroundRepeat: "no-repeat",
    backgroundSize: objectFit === "contain" ? "contain" : "cover",
  } satisfies CSSProperties;
}

export default function Image({
  src,
  alt,
  width,
  height,
  fill,
  priority,
  loading,
  placeholder,
  blurDataURL,
  quality: _quality,
  unoptimized: _unoptimized,
  style,
  onLoad,
  ref,
  ...rest
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const staticImage = typeof src === "string" ? undefined : src;
  const placeholderUrl = getPlaceholderUrl(placeholder, blurDataURL ?? staticImage?.blurDataURL);
  const placeholderStyle = loaded ? {} : getPlaceholderStyle(placeholderUrl, style?.objectFit);

  return (
    <img
      {...rest}
      src={staticImage?.src ?? (src as string)}
      alt={alt}
      width={fill ? undefined : (width ?? staticImage?.width)}
      height={fill ? undefined : (height ?? staticImage?.height)}
      decoding="async"
      loading={priority ? "eager" : (loading ?? "lazy")}
      fetchPriority={priority ? "high" : rest.fetchPriority}
      style={{
        color: "transparent",
        ...(fill ? FILL_STYLE : {}),
        ...style,
        ...placeholderStyle,
      }}
      ref={composeRefs(ref, (img: HTMLImageElement | null) => {
        if (img?.complete) setLoaded(true);
      })}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
    />
  );
}
