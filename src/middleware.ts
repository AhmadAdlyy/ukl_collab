import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Fungsi pembantu: Aman dari pembatasan Node.js Buffer di Vercel Edge Runtime
function decodeJwtRole(token: string): string {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return "";

    // Normalisasi base64 url ke standard base64
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    // Decode menggunakan atob bawaan yang aman di Edge Runtime
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const payload = JSON.parse(jsonPayload);
    const role = payload.role || payload.Role || payload.status || "";
    return role.toString().toUpperCase().trim();
  } catch {
    return "";
  }
}

export function middleware(request: NextRequest) {
  // Mengambil string token asli dari Cookie
  const token = request.cookies.get("token")?.value;

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/login");
  const isAdminPage = pathname.startsWith("/admin");
  const isCashierPage = pathname.startsWith("/cashier");

  // 1. Proteksi URL: Jika coba masuk /admin atau /cashier TANPA login
  if ((isAdminPage || isCashierPage) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Proteksi URL balik: Jika SUDAH login tapi iseng ngetik /login di URL
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

export const config = {
  // Jalankan satpam middleware ini hanya pada rute-rute di bawah
  matcher: ["/admin/:path*", "/cashier/:path*", "/login"],
};
