import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The app is server-rendered: logins, roles and a Postgres database.
  //
  // `pg` must stay external. It uses dynamic requires and an optional native
  // binding (pg-native), which the server-bundle tracer can't follow — that
  // breaks the Netlify Next.js runtime while packaging the SSR function.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
