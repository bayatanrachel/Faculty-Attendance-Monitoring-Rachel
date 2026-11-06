
import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function middleware(request) {
  const isLoggedIn = await verifySession();

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/history/:path*",
    "/summary/:path*",
    "/scan/:path*",
  ],
};

