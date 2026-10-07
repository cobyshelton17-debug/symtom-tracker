import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = new Set(["/login"]);

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const loggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const isPublic = PUBLIC_PATHS.has(pathname);

      if (!isPublic && !loggedIn) {
        const login = new URL("/login", nextUrl);
        if (pathname !== "/") {
          login.searchParams.set("next", pathname + nextUrl.search);
        }
        return Response.redirect(login);
      }

      if (isPublic && loggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
