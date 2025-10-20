import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects: async () => {
    return [
      {
        source: "/",
        destination: "/news",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
