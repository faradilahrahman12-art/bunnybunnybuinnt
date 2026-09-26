import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://www.bunnyticket.store/sitemap.xml",
    host: "https://www.bunnyticket.store",
  };
}
