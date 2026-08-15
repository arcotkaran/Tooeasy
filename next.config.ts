import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The app now has logins, roles and a database, so it runs as a server app
  // rather than a static export.
};

export default nextConfig;
