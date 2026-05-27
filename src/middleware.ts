import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token"); // Atau cek dari header
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isAdminPage = request.nextUrl.pathname.startsWith("/admin");
  const isCashierPage = request.nextUrl.pathname.startsWith("/cashier");

  // Jika mencoba akses dashboard/cashier tanpa login
  if ((isAdminPage || isCashierPage) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Hanya proteksi halaman admin dan kasir
export const config = {
  matcher: ['/admin/:path*', '/cashier/:path*'],
}
