"use client";

import { useState } from "react";

// Fungsi pembantu untuk membaca Cookie di sisi Client
const getCookieClient = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

export default function ManageCashierPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const API_URL = "https://restaurantapi-production-1747.up.railway.app";
  const OUTLET_ID = "975d46b0-fb2e-43ca-a8f1-445ba97dbf03";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // PERBAIKAN 1: Mengambil token dari Cookie, bukan localStorage
    const token = getCookieClient("token");

    if (!token) {
      alert("Anda belum login sebagai admin!");
      window.location.href = "/login";
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/create-cashier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          password,
          outletId: OUTLET_ID,
          role: "CASHIER", // PERBAIKAN 2: Typo dari "CASHIR" menjadi "CASHIER"
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Akun Kasir "${username}" berhasil didaftarkan!`);
        setUsername("");
        setPassword("");
      } else {
        alert(`Gagal: ${data.message || "Cek otorisasi Admin Anda."}`);
      }
    } catch (error) {
      console.error("Error create cashier:", error);
      alert("Terjadi kesalahan koneksi ke server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="border-b border-stone-200 pb-3">
        <h2 className="text-xl font-medium text-stone-700">Kelola Kasir</h2>
        <p className="text-stone-400 text-sm mt-0.5">
          Daftarkan akun kasir baru untuk sistem POS
        </p>
      </div>

      <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm">
        <h3 className="text-sm font-medium text-stone-600 mb-5">
          Tambah Akun Kasir
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-stone-500 mb-1.5">
              Username Kasir
            </label>
            <input
              type="text"
              placeholder="Masukkan username"
              required
              className="w-full px-4 py-2 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 focus:bg-white text-stone-700 text-sm transition-colors"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-stone-500 mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="Masukkan password"
              required
              className="w-full px-4 py-2 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 focus:bg-white text-stone-700 text-sm transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 px-4 py-2.5 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
          >
            {submitting ? "Memproses..." : "Daftarkan Kasir"}
          </button>
        </form>
      </div>

      <div className="bg-stone-50 rounded-lg p-5 border border-stone-200">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
          Informasi
        </p>
        <p className="text-sm text-stone-600 leading-relaxed">
          Kasir memiliki akses ke outlet yang sama. Dapat mengelola pesanan
          tetapi tidak dapat mengubah menu atau kategori.
        </p>
      </div>
    </div>
  );
}
