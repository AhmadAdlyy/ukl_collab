"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    // Proteksi: Jika tidak ada token, tendang ke login
    if (!token) {
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="animate-pulse font-bold italic">
          Checking Admin Session...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans">
      {/* Sidebar Statis untuk semua halaman Admin */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-black text-white p-8 flex flex-col justify-between z-20">
        <div>
          <h1 className="text-2xl font-bold italic mb-12 tracking-tighter">
            MixBowls.
          </h1>

          <nav className="space-y-2">
            <AdminNavLink
              href="/admin"
              active={pathname === "/admin"}
              label="DASHBOARD"
            />
            <AdminNavLink
              href="/admin/menu"
              active={pathname === "/admin/menu"}
              label="KELOLA MENU"
            />
            <AdminNavLink
              href="/admin/category"
              active={pathname === "/admin/category"}
              label="KATEGORI"
            />
            <AdminNavLink
              href="/admin/reports"
              active={pathname === "/admin/reports"}
              label="LAPORAN"
            />
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="text-left text-xs font-bold text-red-400 hover:text-red-300 tracking-[0.2em] transition-colors"
        >
          LOGOUT
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64">
        <header className="h-20 bg-white border-b flex items-center justify-end px-10 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-400">
              ADMINISTRATOR
            </span>
            <div className="w-8 h-8 rounded-full bg-zinc-200 border"></div>
          </div>
        </header>

        <main className="p-10">{children}</main>
      </div>
    </div>
  );
}

// Komponen Kecil untuk Link Navigasi agar kode lebih bersih
function AdminNavLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <a
      href={href}
      className={`block px-4 py-3 rounded-xl text-[10px] font-bold tracking-[0.2em] transition-all ${
        active
          ? "bg-zinc-800 text-white shadow-lg"
          : "text-zinc-500 hover:text-white hover:bg-zinc-900"
      }`}
    >
      {label}
    </a>
  );
}
