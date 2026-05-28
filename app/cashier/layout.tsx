"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

// Fungsi pembantu untuk membaca Cookie di sisi Client
const getCookieClient = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

// Fungsi pembantu untuk menghapus Cookie di sisi Client
const deleteCookieClient = (name: string) => {
  if (typeof document !== "undefined") {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict;`;
  }
};

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // PERBAIKAN 1: Membaca token akses dari Cookie, bukan localStorage
    const token = getCookieClient("token");

    if (!token) {
      router.push("/login");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    // PERBAIKAN 2: Menghapus token dari Cookie secara bersih
    deleteCookieClient("token");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-stone-500 text-sm">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/cashier", label: "Orders Aktif", icon: "📥" },
    { href: "/cashier/history", label: "Riwayat Transaksi", icon: "📜" },
    { href: "/cashier/report", label: "Ringkasan Harian", icon: "📊" },
  ];

  return (
    <div className="flex min-h-screen bg-stone-100">
      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-stone-200 shadow-sm z-30 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-stone-800 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🍜</span>
            </div>
            <div>
              <h1 className="text-lg font-medium text-stone-800">savory.</h1>
              <p className="text-[9px] text-stone-400">Kasir Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-stone-100 text-stone-900"
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-700"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-sm font-normal">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-stone-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-stone-500 hover:text-rose-600 rounded-lg transition-colors text-sm"
          >
            <span>🚪</span>
            Keluar
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
          <div className="px-6 py-3 flex items-center justify-end">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                <p className="text-xs text-stone-500">Terhubung</p>
              </div>
              <div className="w-px h-5 bg-stone-200"></div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
                  <span className="text-stone-500 text-xs">👤</span>
                </div>
                <span className="text-sm text-stone-600">Kasir</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
