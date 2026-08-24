import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"],
        disallow: ["/dashboard/*", "/admin/*", "/study-plan/*", "/partners/*", "/groups/*", "/messages/*", "/notifications/*", "/analytics/*", "/profile/*", "/settings/*", "/onboarding/*", "/plans/*"],
      },
    ],
  };
}