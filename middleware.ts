import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Ambil string token asli dari Cookie
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isCashierPage = pathname.startsWith("/cashier");
  const isAuthPage = pathname.startsWith("/login");

  // 1. Jika coba masuk area dashboard TAPI tidak punya token -> Lempar ke login
  if ((isAdminPage || isCashierPage) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Jika sudah login tapi iseng buka halaman login -> Kembalikan ke halaman asal
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

// Daftarkan rute yang wajib dijaga satpam
export const config = {
  matcher: ["/admin/:path*", "/cashier/:path*", "/login"],
};
