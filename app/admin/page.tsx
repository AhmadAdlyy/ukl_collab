"use client";

import { useEffect, useState } from "react";

interface MenuItem {
  id: number;
  name: string;
  price: number;
}

interface Category {
  id: number;
  name: string;
}

interface OrderItem {
  id: number;
  qty: number;
  subtotal: number;
  menuId: number;
}

interface Order {
  id: number;
  customerName: string;
  tableNumber: string;
  status: string;
  total: number;
  createdAt: string;
  orderItems: OrderItem[];
}

interface DashboardStats {
  totalMenu: number;
  totalCategory: number;
  totalOrdersToday: number;
  totalIncomeToday: number;
  averageOrderValue: number;
}

interface ChartData {
  date: string;
  revenue: number;
  orders: number;
}

interface StatCardProps {
  title: string;
  value: number;
  unit: string;
  icon?: string;
}

// Fungsi pembantu untuk membaca Cookie di sisi Client (Client-Side Cookie Reader)
const getCookieClient = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMenu: 0,
    totalCategory: 0,
    totalOrdersToday: 0,
    totalIncomeToday: 0,
    averageOrderValue: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [greeting, setGreeting] = useState("");

  const API_URL = "https://restaurantapi-production-1747.up.railway.app";

  useEffect(() => {
    const hour = new Date().getHours();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hour < 12) setGreeting("Selamat Pagi");
    else if (hour < 18) setGreeting("Selamat Siang");
    else setGreeting("Selamat Malam");
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // PERBAIKAN: Membaca token dari Cookie, bukan lagi LocalStorage
      const token = getCookieClient("token");

      if (!token) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        setLoading(false);
        // Proteksi tambahan: jika token kosong, oper langsung ke login
        window.location.href = "/login";
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [resMenu, resCat, resOrder] = await Promise.all([
          fetch(`${API_URL}/menu`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/category`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/order`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // Validasi jika status token di-reject/expired oleh backend (401/403)
        if (
          resMenu.status === 401 ||
          resCat.status === 401 ||
          resOrder.status === 401
        ) {
          document.cookie =
            "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict; Secure";
          window.location.href = "/login";
          return;
        }

        const menus: MenuItem[] = await resMenu.json();
        const cats: Category[] = await resCat.json();
        const orders: Order[] = await resOrder.json();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders: Order[] = Array.isArray(orders)
          ? orders.filter((order: Order) => {
              const orderDate = new Date(order.createdAt);
              return orderDate >= today;
            })
          : [];

        const todayIncome: number = todayOrders.reduce(
          (sum: number, order: Order) => sum + (order.total || 0),
          0,
        );
        const todayCount: number = todayOrders.length;
        const avgValue: number = todayCount > 0 ? todayIncome / todayCount : 0;

        setStats({
          totalMenu: Array.isArray(menus) ? menus.length : 0,
          totalCategory: Array.isArray(cats) ? cats.length : 0,
          totalOrdersToday: todayCount,
          totalIncomeToday: todayIncome,
          averageOrderValue: avgValue,
        });

        // Buat data chart per hari (7 hari terakhir)
        const doneOrders = Array.isArray(orders)
          ? orders.filter((order: Order) => order.status === "DONE")
          : [];

        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);

          const dayOrders = doneOrders.filter((order: Order) => {
            const orderDate = new Date(order.createdAt);
            return (
              orderDate >= date &&
              orderDate < new Date(date.getTime() + 86400000)
            );
          });

          const dayRevenue = dayOrders.reduce(
            (sum: number, order: Order) => sum + (order.total || 0),
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
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError("Gagal memuat data dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);
  const maxOrders = Math.max(...chartData.map((d) => d.orders), 1);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-stone-500 text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-rose-600 mb-3 text-sm">⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-stone-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-800 transition"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-stone-200 pb-5">
        <h2 className="text-xl font-medium text-stone-700">
          {greeting}, Administrator
        </h2>
        <p className="text-stone-400 text-sm mt-0.5">
          Ringkasan performa restoran
        </p>
      </div>

      {/* 4 Kartu Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Menu"
          value={stats.totalMenu}
          unit="item"
          icon="🍽️"
        />
        <StatCard
          title="Kategori"
          value={stats.totalCategory}
          unit="kategori"
          icon="📁"
        />
        <StatCard
          title="Pesanan Hari Ini"
          value={stats.totalOrdersToday}
          unit="pesanan"
          icon="📋"
        />
        <StatCard
          title="Rata-rata Pesanan"
          value={stats.averageOrderValue}
          unit="Rp"
          icon="💰"
        />
      </div>

      {/* Grafik Penjualan */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
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
                      height: `${(item.revenue / maxRevenue) * 100}px`,
                      maxHeight: "120px",
                      minHeight: "4px",
                    }}
                  >
                    <div
                      className="w-full bg-emerald-600 rounded-t-sm h-full"
                      style={{
                        height: `${(item.revenue / maxRevenue) * 100}%`,
                        maxHeight: "120px",
                      }}
                    ></div>
                  </div>
                  {/* Orders Bar */}
                  <div
                    className="w-full bg-sky-100 rounded-t-sm"
                    style={{
                      height: `${(item.orders / maxOrders) * 50}px`,
                      minHeight: "4px",
                    }}
                  >
                    <div
                      className="w-full bg-sky-500 rounded-t-sm h-full"
                      style={{ height: `${(item.orders / maxOrders) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-[10px] text-stone-400 whitespace-nowrap">
                  {item.date}
                </span>
              </div>
            ))}
          </div>

          {/* Legend nilai pendapatan */}
          <div className="flex justify-between text-[10px] text-stone-400 mt-4 pt-2 border-t border-stone-100">
            <span>Rp 0</span>
            <span>Rp {formatCurrency(Math.round(maxRevenue / 2))}</span>
            <span>Rp {formatCurrency(maxRevenue)}</span>
          </div>
        </div>
      )}

      {/* Dua Kartu Bawah */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-3">
        {/* Info Menu */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-stone-100 rounded-lg flex items-center justify-center">
              <span className="text-stone-500 text-lg">📋</span>
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wider">
                Informasi
              </p>
              <p className="text-sm font-medium text-stone-700">Data Menu</p>
            </div>
          </div>
          <p className="text-stone-600 text-sm leading-relaxed">
            Total{" "}
            <span className="font-semibold text-stone-800">
              {stats.totalMenu}
            </span>{" "}
            menu tersedia dalam{" "}
            <span className="font-semibold text-stone-800">
              {stats.totalCategory}
            </span>{" "}
            kategori.
          </p>
          <div className="mt-3 pt-3 border-t border-stone-100">
            <p className="text-xs text-stone-400">
              Data terakhir: {new Date().toLocaleDateString("id-ID")}
            </p>
          </div>
        </div>

        {/* Performance */}
        <div className="bg-stone-800 rounded-xl p-5 text-stone-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-stone-700 rounded-lg flex items-center justify-center">
              <span className="text-stone-300 text-lg">📊</span>
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wider">
                Ringkasan
              </p>
              <p className="text-sm font-medium">Hari Ini</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-2xl font-semibold">{stats.totalOrdersToday}</p>
              <p className="text-xs text-stone-400">Pesanan selesai</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {formatCurrency(Math.round(stats.averageOrderValue))}
              </p>
              <p className="text-xs text-stone-400">Rata-rata pesanan</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-700">
            <p className="text-xs text-stone-400">
              {stats.totalOrdersToday === 0
                ? "Belum ada transaksi hari ini"
                : `Pendapatan: Rp ${formatCurrency(stats.totalIncomeToday)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Pendapatan Hari Ini - Bar tambahan */}
      {stats.totalOrdersToday > 0 && (
        <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
          <div className="flex justify-between items-center">
            <span className="text-sm text-stone-600">
              Total Pendapatan Hari Ini
            </span>
            <span className="text-xl font-semibold text-stone-800">
              Rp {formatCurrency(stats.totalIncomeToday)}
            </span>
          </div>
          <div className="mt-2 w-full bg-stone-200 rounded-full h-1.5">
            <div
              className="bg-stone-600 h-1.5 rounded-full"
              style={{
                width: `${Math.min((stats.totalIncomeToday / 2000000) * 100, 100)}%`,
              }}
            ></div>
          </div>
          <p className="text-xs text-stone-400 mt-2">Target: Rp 2.000.000</p>
        </div>
      )}
    </div>
  );
}

// StatCard Component
function StatCard({ title, value, unit, icon }: StatCardProps) {
  const displayValue = unit === "Rp" ? formatCurrency(value) : value;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100 hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-semibold text-stone-700 mt-1">
            {typeof displayValue === "number"
              ? displayValue.toLocaleString()
              : displayValue}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">{unit}</p>
        </div>
        {icon && (
          <div className="w-8 h-8 bg-stone-50 rounded-lg flex items-center justify-center border border-stone-100">
            <span className="text-stone-500 text-base">{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID").format(Math.round(value));
}
