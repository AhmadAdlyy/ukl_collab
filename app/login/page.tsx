"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

        const rawRole = data.role || data.user?.role || data.user?.Role || "";
        const userRole = rawRole.toString().toUpperCase().trim();

        if (userRole === "ADMIN") {
          router.push("/admin");
        } else if (
          userRole === "CASHIR" ||
          userRole === "CASHIER" ||
          userRole === "KASIR"
        ) {
          router.push("/cashier");
        } else {
          try {
            const payloadBase64 = data.access_token.split(".")[1];
            const decodedPayload = JSON.parse(atob(payloadBase64));
            const tokenRole = (decodedPayload.role || decodedPayload.Role || "")
              .toString()
              .toUpperCase()
              .trim();

            if (tokenRole === "ADMIN") {
              router.push("/admin");
            } else {
              router.push("/cashier");
            }
          } catch {
            router.push("/cashier");
          }
        }
      } else {
        setError(data.message || "Username atau password salah");
      }
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-stone-800 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🍜</span>
            </div>
            <div>
              <h1 className="text-lg font-medium text-stone-800">savory.</h1>
              <p className="text-[10px] text-stone-400">Login Panel</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-6 pt-4 space-y-4">
          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-stone-500 mb-1">
              Username
            </label>
            <input
              type="text"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 focus:bg-white text-stone-700 text-sm transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-stone-500 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 focus:bg-white text-stone-700 text-sm transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 px-4 py-2.5 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <div className="p-6 pt-0">
          <p className="text-[10px] text-stone-400 text-center">
            © {new Date().getFullYear()} savory.
          </p>
        </div>
      </div>
    </div>
  );
}
