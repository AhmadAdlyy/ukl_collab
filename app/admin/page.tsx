"use client";

import { useEffect, useState } from "react";

// 1. Definisikan Interface untuk Data Stats Dashboard
interface DashboardStats {
  totalMenu: number;
  totalCategory: number;
  totalOrdersToday: number;
  totalIncomeToday: number;
}

// 2. Definisikan Interface untuk Props StatCard
interface StatCardProps {
  title: string;
  value: number;
  unit: string;
  color: string;
}

export default function AdminDashboardPage() {
  // Fix: Terapkan tipe data interface pada useState
  const [stats, setStats] = useState<DashboardStats>({
    totalMenu: 0,
    totalCategory: 0,
    totalOrdersToday: 0,
    totalIncomeToday: 0,
  });
  const [loading, setLoading] = useState(true);

  const API_URL = "https://restaurantapi-production-1747.up.railway.app";

  useEffect(() => {
    const fetchData = async () => {
      // Fix: Proteksi localStorage dari error SSR di lingkungan server Next.js
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      try {
        // Kita ambil data menu, kategori, dan report harian sekaligus
        const [resMenu, resCat, resReport] = await Promise.all([
          fetch(`${API_URL}/menu`),
          fetch(`${API_URL}/category`),
          fetch(`${API_URL}/order/report/daily`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const menus = await resMenu.json();
        const cats = await resCat.json();
        const report = await resReport.json();

        setStats({
          totalMenu: Array.isArray(menus) ? menus.length : 0,
          totalCategory: Array.isArray(cats) ? cats.length : 0,
          // Mengambil totalOrders dan totalIncome dari response report backend
          totalOrdersToday: report?.totalOrders || 0,
          totalIncomeToday: report?.totalIncome || 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_URL]); // Fix: Tambahkan API_URL ke dalam dependency array

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="animate-pulse font-bold italic text-zinc-400">
          LOADING ANALYTICS...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Dashboard */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">
            Dashboard Overview
          </h2>
          <p className="text-zinc-500 text-sm">
            Ringkasan performa restoran untuk hari ini.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Pendapatan Hari Ini
          </p>
          <p className="text-xl font-black text-green-600 italic">
            Rp {stats.totalIncomeToday.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Grid Statistik Ringkas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Menu"
          value={stats.totalMenu}
          unit="Items"
          color="bg-white"
        />
        <StatCard
          title="Kategori"
          value={stats.totalCategory}
          unit="Types"
          color="bg-white"
        />
        <StatCard
          title="Pesanan Hari Ini"
          value={stats.totalOrdersToday}
          unit="Orders"
          color="bg-black text-white"
        />
      </div>

      {/* Visual Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
        <div className="bg-white p-10 rounded-[40px] border border-zinc-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <p className="font-bold text-sm uppercase tracking-widest">
              Grafik Penjualan
            </p>
            <p className="text-xs text-zinc-400 italic">
              Menghubungkan ke Chart.js...
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 p-10 rounded-[40px] text-white flex flex-col justify-between">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
            Quick Tip
          </p>
          <h3 className="text-xl font-bold leading-tight mt-4">
            &quot;Menu dengan kategori{" "}
            <span className="text-yellow-400">Best Seller</span> memiliki
            konversi 20% lebih tinggi minggu ini.&quot;
          </h3>
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
            <span className="text-[10px] font-bold opacity-50">
              AI INSIGHTS
            </span>
            <button className="text-[10px] font-bold bg-white text-black px-4 py-2 rounded-full">
              CEK DETAIL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fix: Definisikan props secara gamblang dengan interface StatCardProps (bebas dari 'any')
function StatCard({ title, value, unit, color }: StatCardProps) {
  return (
    <div
      className={`${color} p-8 rounded-[40px] border border-zinc-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">
        {title}
      </p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-4xl font-black italic tracking-tighter">{value}</h3>
        <span className="text-xs font-bold opacity-40 uppercase">{unit}</span>
      </div>
    </div>
  );
}
