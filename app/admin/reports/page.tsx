"use client";

import { useEffect, useState, useCallback } from "react";

interface ReportItem {
  menu: string;
  qty: number;
  subtotal: number;
}

interface ReportOrder {
  id: number;
  customerName: string;
  tableNumber: string;
  total: number;
  status: string;
  date: string;
  time: string;
  cashier: string; // ← SUDAH ADA
  items: ReportItem[];
}

interface ReportData {
  type: string;
  totalOrders: number;
  totalIncome: number;
  orders: ReportOrder[];
}

interface BackendReportItem {
  menu: string;
  qty: number;
  subtotal: number;
}

interface BackendReportOrder {
  id: number;
  customerName: string;
  tableNumber: string;
  total: number;
  status: string;
  date: string;
  time: string;
  cashier: string; // ← PASTIKAN BACKEND KIRIM INI
  items: BackendReportItem[];
}

interface BackendReportResponse {
  type: string;
  totalOrders: number;
  totalIncome: number;
  orders: BackendReportOrder[];
}

type ReportType = "daily" | "weekly" | "monthly" | "yearly";

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = "https://restaurantapi-production-1747.up.railway.app";

  const filterButtons: { value: ReportType; label: string }[] = [
    { value: "daily", label: "Hari Ini" },
    { value: "weekly", label: "Minggu Ini" },
    { value: "monthly", label: "Bulan Ini" },
    { value: "yearly", label: "Tahun Ini" },
  ];

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

      const data: BackendReportResponse = await res.json();
      console.log("Data dari API:", data); // CEK APAKAH ADA CASHIER

      const normalized: ReportData = {
        type: data.type,
        totalOrders: data.totalOrders,
        totalIncome: data.totalIncome,
        orders: (data.orders ?? []).map((order: BackendReportOrder) => ({
          id: order.id,
          customerName: order.customerName,
          tableNumber: order.tableNumber,
          total: order.total,
          status: order.status,
          date: order.date,
          time: order.time,
          cashier: order.cashier || "Sistem", // ← TAMPILKAN KASIR
          items: (order.items ?? []).map((item: BackendReportItem) => ({
            menu: item.menu,
            qty: item.qty,
            subtotal: item.subtotal,
          })),
        })),
      };

      setReportData(normalized);
    } catch (err) {
      console.error("Error:", err);
      setError(
        err instanceof Error ? err.message : "Gagal memuat data laporan",
      );
    } finally {
      setLoading(false);
    }
  }, [API_URL, reportType]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReport();
  }, [fetchReport]);

  const getPeriodLabel = (): string => {
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
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-rose-600 text-sm">{error}</p>
        <button
          onClick={fetchReport}
          className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 transition"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-xl font-medium text-stone-700">
            Laporan Penjualan
          </h1>
          <p className="text-stone-400 text-sm mt-0.5">
            Analisis performa bisnis
          </p>
        </div>

        <div className="flex bg-stone-100 rounded-lg p-0.5">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setReportType(btn.value)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-stone-800 rounded-xl p-5 text-stone-100">
          <p className="text-xs text-stone-400 uppercase tracking-wider">
            Total Pendapatan ({getPeriodLabel()})
          </p>
          <p className="text-2xl font-semibold mt-1">
            Rp {reportData?.totalIncome?.toLocaleString() || "0"}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-stone-200">
          <p className="text-xs text-stone-400 uppercase tracking-wider">
            Total Pesanan Selesai
          </p>
          <p className="text-2xl font-semibold text-stone-700 mt-1">
            {reportData?.totalOrders || "0"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100 flex justify-between items-center">
          <h4 className="text-sm font-medium text-stone-700">
            Riwayat Transaksi
          </h4>
          <span className="text-xs text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">
            {reportData?.totalOrders || 0} transaksi
          </span>
        </div>

        <div className="overflow-x-auto">
          {reportData?.orders?.length === 0 ? (
            <div className="text-center py-16 text-stone-400 text-sm">
              Belum ada transaksi untuk periode ini
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-stone-50 text-xs font-medium text-stone-500">
                <tr>
                  <th className="px-5 py-3">ID / Pelanggan</th>
                  <th className="px-5 py-3">Kasir</th>
                  <th className="px-5 py-3">Tanggal</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reportData?.orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-stone-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-stone-700">
                        #{order.id}
                      </p>
                      <p className="text-xs text-stone-400">
                        {order.customerName} (Meja {order.tableNumber})
                      </p>
                    </td>
                    <td className="px-5 py-3 text-sm text-stone-500">
                      {order.cashier}
                    </td>
                    <td className="px-5 py-3 text-sm text-stone-500">
                      {order.date} <span className="text-stone-300">•</span>{" "}
                      {order.time}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-stone-100 px-2 py-0.5 rounded-full text-stone-600"
                          >
                            {item.qty}x {item.menu}
                          </span>
                        ))}
                        {order.items.length > 2 && (
                          <span className="text-xs text-stone-400">
                            +{order.items.length - 2} lagi
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-stone-700">
                      Rp {order.total.toLocaleString()}
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
