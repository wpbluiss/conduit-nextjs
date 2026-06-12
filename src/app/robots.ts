import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app/", "/api/", "/auth/", "/finance/", "/rebrand-preview/"],
      },
    ],
    sitemap: "https://conduitai.io/sitemap.xml",
  };
}
