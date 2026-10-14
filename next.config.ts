import type { NextConfig } from "next";

// Headers that cost nothing: no MIME sniffing, no framing of the app by other sites, no referrer sent onward
// (a shared chart link carries its data in the part after #, which is never sent, but a referrer would still
// tell other sites where the app is used), and no camera or location. Screen recording needs display-capture
// and the microphone, so those stay available to the app itself.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), display-capture=(self), microphone=(self)" },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["swisseph-wasm"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
