"use client";

import { useEffect, useState, useCallback } from "react";

interface Order {
  id: number;
  tableNumber: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
}

interface DailyStats {
  totalRevenue: number;
  totalOrders: number;
  todayRevenue: number;
  todayOrders: number;
  averageOrderValue: number;
}

interface ChartData {
  date: string;
  revenue: number;
  orders: number;
}

// Fungsi pembantu untuk membaca Cookie di sisi Client
const getCookieClient = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

export default function ReportPage() {
  const [stats, setStats] = useState<DailyStats>({
    totalRevenue: 0,
    totalOrders: 0,
    todayRevenue: 0,
    todayOrders: 0,
    averageOrderValue: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"all" | "today">("all");
  const API_URL = "https://restaurantapi-production-1747.up.railway.app";

  const fetchStats = useCallback(async () => {
    // PERBAIKAN 1: Mengambil token dari Cookie, bukan localStorage
    const token = getCookieClient("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/order`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (Array.isArray(data)) {
        const doneOrders = data.filter(
          (o) =>
            o.status === "DONE" ||
            o.status === "COMPLETED" ||
            o.status === "PAID" ||
            o.status === "PROCESSING",
        );
        const totalRevenue = doneOrders.reduce(
          (sum, o) => sum + (o.total || 0),
          0,
        );
        const totalOrders = doneOrders.length;

        // PERBAIKAN 2: Menggunakan toDateString() untuk komparasi tanggal hari ini yang lebih akurat
        const todayStr = new Date().toDateString();

        const todayOrdersData = doneOrders.filter((order) => {
          const orderDate = new Date(order.createdAt);
          return orderDate.toDateString() === todayStr;
        });

        const todayRevenue = todayOrdersData.reduce(
          (sum, o) => sum + (o.total || 0),
          0,
        );
        const todayOrders = todayOrdersData.length;
        const averageOrderValue =
          totalOrders > 0 ? totalRevenue / totalOrders : 0;

        setStats({
          totalRevenue,
          totalOrders,
          todayRevenue,
          todayOrders,
          averageOrderValue,
        });

        // Buat data chart per hari (7 hari terakhir)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const targetDateStr = date.toDateString();

          const dayOrders = doneOrders.filter((order) => {
            const orderDate = new Date(order.createdAt);
            return orderDate.toDateString() === targetDateStr;
          });

          const dayRevenue = dayOrders.reduce(
            (sum, o) => sum + (o.total || 0),
            0,
          );

          last7Days.push({
            date: date.toLocaleDateString("id-ID", {
              weekday: "short",
              day: "numeric",
            }),
            revenue: dayRevenue,
            orders: dayOrders.length,
          });
        }
        setChartData(last7Days);
      }
    } catch (error) {
      console.error("Gagal memuat ringkasan laporan:", error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, [fetchStats]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID").format(value);
  };

  const getDisplayData = () => {
    if (selectedPeriod === "today") {
      return {
        revenue: stats.todayRevenue,
        orders: stats.todayOrders,
        average:
          stats.todayOrders > 0 ? stats.todayRevenue / stats.todayOrders : 0,
      };
    }
    return {
      revenue: stats.totalRevenue,
      orders: stats.totalOrders,
      average: stats.averageOrderValue,
    };
  };

  const displayData = getDisplayData();
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-stone-500 text-sm">Memuat ringkasan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-xl font-medium text-stone-700">
            Ringkasan Penjualan
          </h1>
          <p className="text-stone-400 text-sm mt-0.5">Performa penjualan</p>
        </div>

        <div className="flex bg-stone-100 rounded-lg p-0.5">
          <button
            onClick={() => setSelectedPeriod("all")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              selectedPeriod === "all"
                ? "bg-white text-stone-800 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Semua Waktu
          </button>
          <button
            onClick={() => setSelectedPeriod("today")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              selectedPeriod === "today"
                ? "bg-white text-stone-800 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Hari Ini
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-stone-800 rounded-xl p-5 text-stone-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wider">
                Total Pendapatan
              </p>
              <p className="text-2xl font-semibold mt-1">
                Rp {formatCurrency(displayData.revenue)}
              </p>
            </div>
            <div className="w-10 h-10 bg-stone-700 rounded-lg flex items-center justify-center">
              <span className="text-stone-300 text-lg">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-stone-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wider">
                Jumlah Pesanan
              </p>
              <p className="text-2xl font-semibold text-stone-700 mt-1">
                {displayData.orders}
              </p>
            </div>
            <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
              <span className="text-stone-500 text-lg">📋</span>
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-3">Pesanan selesai</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-stone-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wider">
                Rata-rata Pesanan
              </p>
              <p className="text-2xl font-semibold text-stone-700 mt-1">
                Rp {formatCurrency(displayData.average)}
              </p>
            </div>
            <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
              <span className="text-stone-500 text-lg">📊</span>
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-3">Per transaksi</p>
        </div>
      </div>

      {/* Grafik Penjualan */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-stone-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                Grafik Penjualan
              </p>
              <p className="text-sm text-stone-600 mt-0.5">7 Hari Terakhir</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                <span className="text-stone-500">Pendapatan</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-sky-500"></div>
                <span className="text-stone-500">Pesanan</span>
              </div>
            </div>
          </div>

          {/* Chart Bars */}
          <div className="flex items-end justify-between gap-2 h-48">
            {chartData.map((item, idx) => (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div className="w-full flex flex-col items-center gap-1">
                  {/* Revenue Bar */}
                  <div
                    className="w-full bg-emerald-100 rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${(item.revenue / maxRevenue) * 120}px`,
                      maxHeight: "120px",
                      minHeight: "4px",
                    }}
                  >
                    <div
                      className="w-full bg-emerald-600 rounded-t-sm h-full"
                      style={{
                        height: "100%",
                      }}
                    ></div>
                  </div>
                  {/* Orders Bar (smaller) */}
                  <div
                    className="w-full bg-sky-100 rounded-t-sm"
                    style={{
                      height: `${(item.orders / Math.max(...chartData.map((d) => d.orders), 1)) * 60}px`,
                      maxHeight: "60px",
                      minHeight: "4px",
                    }}
                  >
                    <div
                      className="w-full bg-sky-500 rounded-t-sm h-full"
                      style={{
                        height: "100%",
                      }}
                    ></div>
                  </div>
                </div>
                <span className="text-[10px] text-stone-400 rotate-0 whitespace-nowrap">
                  {item.date}
                </span>
              </div>
            ))}
          </div>

          {/* Legend nilai */}
          <div className="flex justify-between text-[10px] text-stone-400 mt-4 pt-2 border-t border-stone-100">
            <span>Rp 0</span>
            <span>Rp {formatCurrency(Math.round(maxRevenue / 2))}</span>
            <span>Rp {formatCurrency(maxRevenue)}</span>
          </div>
        </div>
      )}

      {/* Empty States */}
      {selectedPeriod === "today" && stats.todayOrders === 0 && (
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center gap-3">
            <span className="text-amber-600 text-lg">ℹ️</span>
            <div>
              <p className="text-amber-800 text-sm font-medium">
                Belum ada transaksi hari ini
              </p>
              <p className="text-amber-600 text-xs mt-0.5">
                Transaksi akan muncul setelah pesanan selesai
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedPeriod === "all" && stats.totalOrders === 0 && (
        <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
          <div className="flex items-center gap-3">
            <span className="text-stone-500 text-lg">📊</span>
            <div>
              <p className="text-stone-700 text-sm font-medium">
                Belum ada data penjualan
              </p>
              <p className="text-stone-400 text-xs mt-0.5">
                Data akan muncul setelah ada pesanan selesai
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
