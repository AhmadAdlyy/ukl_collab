"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        "https://restaurantapi-production-1747.up.railway.app/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.access_token);
        router.push("/admin");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4] p-4 font-sans">
      {/* Container Utama */}
      <div className="flex h-[550px] w-full max-w-4xl overflow-hidden rounded-[40px] bg-white shadow-2xl">
        {/* Sisi Kiri: Form Login */}
        <div className="flex flex-1 flex-col justify-between p-12">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 fill-current text-black"
              >
                <path d="M11 9H9V2H7V9H5V2H3V9C3 11.12 4.66 12.84 6.75 12.97V22H9.25V12.97C11.34 12.84 13 11.12 13 9V2H11V9ZM16 6V14H18.5V22H21V2C18.24 2 16 4.24 16 6Z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">MixBowls</span>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="relative space-y-4">
            {error && (
              <p className="text-xs text-red-500 absolute -top-6">{error}</p>
            )}

            <div className="relative">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-full bg-[#F9F9F9] py-4 pl-8 pr-4 text-sm outline-none transition-all focus:ring-1 focus:ring-black/10 italic text-zinc-500 shadow-inner"
              />
            </div>

            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-full bg-[#F9F9F9] py-4 pl-8 pr-4 text-sm outline-none transition-all focus:ring-1 focus:ring-black/10 italic text-zinc-500 shadow-inner"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-[#2D3339] px-10 py-3 text-xs font-bold tracking-[0.2em] text-white transition-transform active:scale-95 disabled:bg-zinc-400"
              >
                {loading ? "WAIT..." : "LOGIN"}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-[10px] text-zinc-400">©2026 MixBowls LLd.</div>
        </div>

        {/* Sisi Kanan: Gambar Makanan */}
        <div className="relative hidden w-[55%] md:block">
          <Image
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1000"
            alt="Healthy Bowl"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay untuk memperhalus transisi jika perlu */}
          <div className="absolute inset-0 bg-black/5"></div>
        </div>
      </div>
    </div>
  );
}
