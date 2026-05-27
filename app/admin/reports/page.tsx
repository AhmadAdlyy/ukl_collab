"use client";

import { useEffect, useState } from "react";

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [reportType, setReportType] = useState("daily"); // default harian
  const [loading, setLoading] = useState(true);

  const API_URL = "https://restaurantapi-production-1747.up.railway.app";

  const fetchReport = async (type: string) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/order/report/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error("Gagal mengambil laporan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReport(reportType);
  }, [reportType]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">
            Laporan Penjualan
          </h2>
          <p className="text-zinc-500 text-sm">
            Analisis performa bisnis Anda.
          </p>
        </div>

        {/* Filter Tipe Laporan */}
        <div className="flex bg-zinc-100 p-1 rounded-full border">
          {["daily", "weekly", "monthly", "yearly"].map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                reportType === type
                  ? "bg-black text-white shadow-md"
                  : "text-zinc-400 hover:text-zinc-900"
              }`}
            >
              {type === "daily"
                ? "Hari Ini"
                : type === "weekly"
                  ? "Minggu"
                  : type === "monthly"
                    ? "Bulan"
                    : "Tahun"}
            </button>
          ))}
        </div>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] mb-2 uppercase">
              Total Pendapatan ({reportType})
            </p>
            <h3 className="text-5xl font-black italic tracking-tighter">
              Rp {reportData?.totalIncome?.toLocaleString() || "0"}
            </h3>
          </div>
          <div className="absolute -right-4 -bottom-4 text-white/5 text-9xl font-black italic group-hover:scale-110 transition-transform">
            $
          </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-zinc-100 shadow-sm">
          <p className="text-[10px] font-bold text-zinc-400 tracking-[0.2em] mb-2 uppercase">
            Total Pesanan Berhasil
          </p>
          <h3 className="text-5xl font-black italic tracking-tighter text-zinc-900">
            {reportData?.totalOrders || "0"}
          </h3>
        </div>
      </div>

      {/* Tabel Riwayat Transaksi */}
      <div className="bg-white rounded-[40px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b flex justify-between items-center">
          <h4 className="font-bold text-sm uppercase tracking-widest">
            Riwayat Transaksi
          </h4>
          <span className="text-[10px] bg-zinc-100 px-3 py-1 rounded-full font-bold text-zinc-500 uppercase">
            {reportData?.orders?.length || 0} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center animate-pulse font-bold text-zinc-300 italic">
              GENERATING REPORT...
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-5">ID / Pelanggan</th>
                  <th className="px-8 py-5">Waktu</th>
                  <th className="px-8 py-5">Items</th>
                  <th className="px-8 py-5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {reportData?.orders?.map((order: any) => (
                  <tr
                    key={order.id}
                    className="hover:bg-zinc-50 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <p className="font-bold text-zinc-900">#{order.id}</p>
                      <p className="text-xs text-zinc-400">
                        {order.customerName} (Meja {order.tableNumber})
                      </p>
                    </td>
                    <td className="px-8 py-6 text-xs text-zinc-500">
                      {order.date} <br /> {order.time}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-1">
                        {order.items.map((item: any, i: number) => (
                          <span
                            key={i}
                            className="text-[9px] bg-zinc-100 px-2 py-1 rounded-md font-bold text-zinc-600"
                          >
                            {item.qty}x {item.menu}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right font-black italic text-zinc-900">
                      Rp {order.total?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && reportData?.orders?.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-zinc-400 font-bold italic">
                Tidak ada transaksi untuk periode ini.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
