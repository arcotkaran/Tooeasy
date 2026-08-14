import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Netlify's zip-deploy path can't run the Next SSR runtime on this account,
  // so the site ships as a static export and the API lives in
  // netlify/functions. The SSR version is preserved on the `ssr-full` branch.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
