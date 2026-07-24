import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sem `output: "standalone"` — incompatível com o runtime Next.js do Netlify.
  experimental: {
    optimizePackageImports: ["lucide-react"],
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
