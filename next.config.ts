import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The HTTP integration runner owns this dedicated directory, never the live dev build.
  distDir: process.env.PTM_TEST_BUILD === "1" ? ".next-smoke" : ".next",
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
          },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      ...["/app/:path*", "/auth/:path*", "/login", "/api/:path*"].map(
        (source) => ({
          source,
          headers: [
            { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          ],
        }),
      ),
    ];
  },
};

export default nextConfig;
