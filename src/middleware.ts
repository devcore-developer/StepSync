import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ token, req }) {
      const { pathname } = req.nextUrl;

      // Admin routes require ADMIN role
      if (pathname.startsWith("/admin")) {
        return token?.role === "ADMIN";
      }

      // All other matched routes just need authentication
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/analytics",
    "/analytics/:path*",
    "/groups/:path*",
    "/messages/:path*",
    "/notifications",
    "/notifications/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/partners/:path*",
    "/plans/:path*",
    "/profile",
    "/profile/:path*",
    "/settings/:path*",
    "/study-plan",
    "/study-plan/:path*",
  ],
};