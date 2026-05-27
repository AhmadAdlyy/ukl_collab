"use client";

import { useState } from "react";

export default function ManageCashierPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const API_URL = "https://restaurantapi-production-1747.up.railway.app";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
      const res = await fetch(`${API_URL}/auth/create-cashier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Akun Kasir "${username}" berhasil didaftarkan!`);
        setUsername("");
        setPassword("");
      } else {
        // Menangkap error BadRequestException / UnauthorizedException dari NestJS
        alert(
          data.message || "Gagal membuat akun kasir. Cek otorisasi Admin Anda.",
        );
      }
    } catch (error) {
      alert("Terjadi kesalahan koneksi ke server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black italic tracking-tighter uppercase">
          Kelola Kasir
        </h2>
        <p className="text-zinc-500 text-sm">
          Daftarkan akun kasir baru untuk mengoperasikan sistem POS restoran.
        </p>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-zinc-100 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-6">
          Tambah Akun Kasir
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Username Kasir
            </label>
            <input
              type="text"
              placeholder="Masukkan username baru..."
              required
              className="w-full p-4 rounded-2xl bg-zinc-100 border-none focus:ring-2 focus:ring-black outline-none text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Masukkan password..."
              required
              className="w-full p-4 rounded-2xl bg-zinc-100 border-none focus:ring-2 focus:ring-black outline-none text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full p-5 mt-4 bg-black text-white rounded-3xl font-black text-xs tracking-[0.3em] shadow-xl hover:bg-zinc-800 active:scale-95 transition-all disabled:bg-zinc-300 disabled:scale-100"
          >
            {submitting ? "MEMPROSES..." : "DAFTARKAN KASIR"}
          </button>
        </form>
      </div>
    </div>
  );
}
