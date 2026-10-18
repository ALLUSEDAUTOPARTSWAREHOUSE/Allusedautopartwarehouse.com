import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  images: {
    // The image optimizer endpoint (/_next/image) is unavailable in this
    // environment and returns 404, which breaks every <Image>. Serving the
    // original files directly makes images render reliably on all devices.
    unoptimized: true,
  },
  async redirects() {
    // These pages showed sample products with made-up prices and were
    // removed; old links and search results go to the real catalog.
    return [
      // Keep the storefront homepage unchanged; the admin hostname uses the
      // existing session-aware entry point and the same protected login.
      {
        source: "/",
        has: [{ type: "host", value: "admin.allusedautopartswarehouse.com" }],
        destination: "/admin",
        permanent: false,
      },
      // Unused admin demos (CMS content never shown on the site, a seller
      // marketplace this store doesn't run) were removed.
      { source: "/admin/cms/:path*", destination: "/admin/dashboard", permanent: false },
      { source: "/admin/marketplace/:path*", destination: "/admin/dashboard", permanent: false },
      { source: "/shop", destination: "/brands", permanent: true },
      { source: "/catalog", destination: "/brands", permanent: true },
      { source: "/comparison", destination: "/brands", permanent: true },
      { source: "/product/:id", destination: "/brands", permanent: true },
      { source: "/products/:id", destination: "/brands", permanent: true },
    ];
  },
};

export default withEve(nextConfig);
