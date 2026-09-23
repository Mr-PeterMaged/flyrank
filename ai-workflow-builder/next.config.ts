import type { NextConfig } from "next";

const backend = process.env.BACKEND_ORIGIN;
if (process.env.VERCEL && !backend) {
  throw new Error("Set BACKEND_ORIGIN to the external workflow server HTTPS origin.");
}
if (backend) {
  const url = new URL(backend);
  if (url.protocol !== "https:" || url.origin !== backend || url.username || url.password) {
    throw new Error("BACKEND_ORIGIN must be an HTTPS origin without a trailing slash.");
  }
  if ([process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL].includes(url.host)) {
    throw new Error("BACKEND_ORIGIN must not point back to this Vercel project.");
  }
}
const nextConfig: NextConfig = {
  async rewrites() {
    return { beforeFiles: backend ? [{ source: "/api/:path*", destination: `${backend}/api/:path*` }] : [], afterFiles: [], fallback: [] };
  },
};
export default nextConfig;
