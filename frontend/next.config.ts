import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    let backendUrl =
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.BACKEND_URL ||
      "";

    // In production on Vercel or any cloud host, never proxy to localhost/127.0.0.1
    const isCloudEnv = Boolean(process.env.VERCEL || process.env.NODE_ENV === "production");
    if (!backendUrl || (isCloudEnv && (backendUrl.includes("localhost") || backendUrl.includes("127.0.0.1")))) {
      backendUrl = isCloudEnv
        ? "https://backend-production-426c301a.up.railway.app"
        : "http://127.0.0.1:8000";
    }

    const cleanBackendUrl = backendUrl
      .replace(/\/api\/v1\/?$/, "")
      .replace(/\/$/, "");

    return [
      {
        source: "/api/v1/:path*",
        destination: `${cleanBackendUrl}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${cleanBackendUrl}/uploads/:path*`,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
