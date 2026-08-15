import type { MetadataRoute } from "next";

/** Public marketplace is indexable; founder and admin areas are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/founder", "/admin", "/api", "/login", "/signup"],
      },
    ],
  };
}
