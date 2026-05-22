import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");
  const isPublicPage = req.nextUrl.pathname === "/";

  // Allow public pages and auth pages
  if (isPublicPage || isAuthPage) {
    return NextResponse.next();
  }

  // Allow API routes (they handle their own auth)
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Redirect to signin if not logged in
  if (!isLoggedIn) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
