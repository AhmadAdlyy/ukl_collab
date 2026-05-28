import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Fungsi pembantu untuk decode JWT di sisi server (Edge Runtime) secara aman
function decodeJwtRole(token: string): string {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return "";

    // Decode base64 tanpa atob (karena atob kadang bermasalah di Edge Runtime)
    const payloadBuffer = Buffer.from(parts[1], "base64");
    const payload = JSON.parse(payloadBuffer.toString("utf-8"));

    const role = payload.role || payload.Role || payload.status || "";
    return role.toString().toUpperCase().trim();
  } catch {
    return "";
  }
}

export function middleware(request: NextRequest) {
  // 1. PERBAIKAN UTAMA: Ambil .value dari cookie agar mendapatkan string token asli
  const token = request.cookies.get("token")?.value;

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/login");
  const isAdminPage = pathname.startsWith("/admin");
  const isCashierPage = pathname.startsWith("/cashier");

  // 2. PROTEKSI: Jika mencoba akses halaman terproteksi TANPA token
  if ((isAdminPage || isCashierPage) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. BONUS PROTEKSI URL: Jika SUDAH login tapi iseng ngetik /login di URL
  if (isAuthPage && token) {
    const userRole = decodeJwtRole(token);

    if (userRole === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    } else if (["CASHIR", "CASHIER", "KASIR"].includes(userRole)) {
      return NextResponse.redirect(new URL("/cashier", request.url));
    }
  }

  return NextResponse.next();
}

// Hanya jalankan middleware pada halaman admin, cashier, dan login
export const config = {
  matcher: ["/admin/:path*", "/cashier/:path*", "/login"],
};
