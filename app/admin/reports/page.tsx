"use client";

import { useEffect, useState, useCallback } from "react";

interface ReportOrder {
  id: number;
  customerName: string;
  tableNumber: string;
  total: number;
  status: string;
  date: string;
  time: string;
  items: {
    menu: string;
    qty: number;
    subtotal: number;
  }[];
}

interface ReportData {
  type: string;
  totalOrders: number;
  totalIncome: number;
  orders: ReportOrder[];
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportType, setReportType] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = "https://restaurantapi-production-1747.up.railway.app";

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/order/report/${reportType}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error("Gagal mengambil laporan:", error);
      setError("Gagal memuat data laporan.");
    } finally {
      setLoading(false);
    }
  }, [API_URL, reportType]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReport();
  }, [fetchReport]);

  const filterButtons = [
    { value: "daily", label: "Hari Ini" },
    { value: "weekly", label: "Minggu Ini" },
    { value: "monthly", label: "Bulan Ini" },
    { value: "yearly", label: "Tahun Ini" },
  ];

  const getPeriodLabel = () => {
    switch (reportType) {
      case "daily":
        return "Hari Ini";
      case "weekly":
        return "Minggu Ini";
      case "monthly":
        return "Bulan Ini";
      case "yearly":
        return "Tahun Ini";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-stone-500 text-sm">Memuat laporan...</p>
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
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-medium text-stone-700">
            Laporan Penjualan
          </h2>
          <p className="text-stone-400 text-sm mt-0.5">
            Analisis performa bisnis
          </p>
        </div>

        {/* Filter */}
        <div className="flex bg-stone-100 p-1 rounded-lg">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setReportType(btn.value)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                reportType === btn.value
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-stone-800 rounded-xl p-6 text-stone-100">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">
            Total Pendapatan ({getPeriodLabel()})
          </p>
          <p className="text-2xl font-semibold">
            Rp {reportData?.totalIncome?.toLocaleString() || "0"}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-stone-200">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">
            Total Pesanan
          </p>
          <p className="text-2xl font-semibold text-stone-700">
            {reportData?.totalOrders || "0"}
          </p>
        </div>
      </div>

      {/* Tabel Transaksi */}
      <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center flex-wrap gap-3">
          <h4 className="text-sm font-medium text-stone-700">
            Riwayat Transaksi
          </h4>
          <span className="text-xs text-stone-400 bg-stone-50 px-2 py-1 rounded-full">
            {reportData?.totalOrders || 0} transaksi
          </span>
        </div>

        <div className="overflow-x-auto">
          {reportData?.orders?.length === 0 ? (
            <div className="px-6 py-16 text-center text-stone-400 text-sm">
              Belum ada transaksi untuk periode ini
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                  <th className="px-6 py-3">ID / Pelanggan</th>
                  <th className="px-6 py-3">Waktu</th>
                  <th className="px-6 py-3">Items</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {reportData?.orders?.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-stone-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-stone-700">
                        #{order.id}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {order.customerName} (Meja {order.tableNumber})
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500">
                      {order.date} <span className="text-stone-300">•</span>{" "}
                      {order.time}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {order.items?.slice(0, 3).map((item, i) => (
                          <span
                            key={i}
                            className="text-xs bg-stone-100 px-2 py-0.5 rounded-full text-stone-600"
                          >
                            {item.qty}x {item.menu}
                          </span>
                        ))}
                        {order.items?.length > 3 && (
                          <span className="text-xs text-stone-400">
                            +{order.items.length - 3} lagi
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-stone-700">
                      Rp {order.total?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
