import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token");
  const isAdminPage = request.nextUrl.pathname.startsWith("/admin");
  const isCashierPage = request.nextUrl.pathname.startsWith("/cashier");

  // Jika mencoba akses dashboard/cashier tanpa login, tendang ke login
  if ((isAdminPage || isCashierPage) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/cashier/:path*"],
};
