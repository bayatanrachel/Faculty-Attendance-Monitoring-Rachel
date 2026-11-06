
import { NextResponse } from "next/server";

export default function middleware(request) {
  const session = request.cookies.get("faculty_session")?.value;

  if (!session) {
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
