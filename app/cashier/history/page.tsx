"use client";

import { useEffect, useState, useCallback } from "react";

interface OrderItem {
  id: number;
  qty: number;
  subtotal: number;
  menu: {
    id: number;
    name: string;
    price: number;
  };
}

interface Order {
  id: number;
  tableNumber: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
  orderItems: OrderItem[];
}

// Fungsi pembantu untuk membaca Cookie di sisi Client
const getCookieClient = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

export default function HistoryPage() {
  const [history, setHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const API_URL = "https://restaurantapi-production-1747.up.railway.app";

  const fetchHistory = useCallback(async () => {
    // PERBAIKAN 1: Membaca token dari Cookie, bukan localStorage
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

      const completedOrders = Array.isArray(data)
        ? data.filter((o) => o.status === "DONE" || o.status === "CANCEL")
        : [];
      setHistory(completedOrders);
    } catch (error) {
      console.error("Gagal mengambil data riwayat:", error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory();
  }, [fetchHistory]);

  const filteredHistory = history.filter(
    (order) =>
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm),
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DONE":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700">
            Selesai
          </span>
        );
      case "CANCEL":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-600">
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-600">
            {status}
          </span>
        );
    }
  };

  const totalRevenue = history
    .filter((o) => o.status === "DONE")
    .reduce((sum, order) => sum + (order.total || 0), 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-stone-500 text-sm">Memuat riwayat...</p>
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
            Riwayat Transaksi
          </h1>
          <p className="text-stone-400 text-sm mt-0.5">
            Daftar transaksi selesai
          </p>
        </div>

        {/* Total Pendapatan */}
        <div className="bg-stone-100 rounded-lg px-5 py-3">
          <p className="text-xs text-stone-500 uppercase tracking-wider">
            Total Pendapatan
          </p>
          <p className="text-xl font-semibold text-stone-800">
            {/* PERBAIKAN 2: Mengunci format mata uang lokal Indonesia */}
            Rp {totalRevenue.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
          🔍
        </span>
        <input
          type="text"
          placeholder="Cari nama pelanggan atau ID order..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
        />
      </div>

      {/* Table */}
      {filteredHistory.length > 0 ? (
        <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                  <th className="px-5 py-3">ID Order</th>
                  <th className="px-5 py-3">Pelanggan</th>
                  <th className="px-5 py-3">Meja</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredHistory.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-stone-50/50 transition-colors"
                  >
                    <td className="px-5 py-3 text-sm font-medium text-stone-600">
                      #{order.id}
                    </td>
                    <td className="px-5 py-3 text-sm text-stone-700">
                      {order.customerName}
                    </td>
                    <td className="px-5 py-3 text-sm text-stone-500">
                      Meja {order.tableNumber}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-stone-700">
                      {/* PERBAIKAN 3: Mengunci format mata uang pada baris data */}
                      Rp {(order.total || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-5 py-3 text-xs text-stone-400">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-stone-50 rounded-lg border border-stone-200">
          <div className="text-5xl mb-3 opacity-50">📋</div>
          <p className="text-stone-400 text-sm">
            {searchTerm
              ? "Tidak ada transaksi yang cocok"
              : "Belum ada transaksi selesai"}
          </p>
        </div>
      )}
    </div>
  );
}
