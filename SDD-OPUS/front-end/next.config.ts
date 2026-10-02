import type { NextConfig } from "next";

// The browser only talks to this origin. Every /api/* call is forwarded to the back-end,
// so the session cookie is first-party and no CORS is involved (plan §2.1).
const API_URL = (process.env.API_URL ?? "http://localhost:3333").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
