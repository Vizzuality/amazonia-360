"#004466";

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(45)">
      <stop stop-color="#004466" offset="20%" />
      <stop stop-color="#004B6C" offset="50%" />
      <stop stop-color="#004466" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#004466" />
  <rect id="r" width="${w}" height="${3 * h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="3s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

export const PLACEHOLDER = (w: number, h: number): `data:image/${string}` =>
  `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;
