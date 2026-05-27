"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// 1. Definisi Interface untuk Item di Dalam Pesanan
interface OrderItem {
  qty: number;
  subtotal: number;
  menu?: {
    name: string;
  };
}

// 2. Definisi Interface Utama Objek Order dari Backend
interface Order {
  id: number;
  tableNumber: string | number;
  customerName: string;
  status: "PENDING" | "PAID" | string; // Sesuai enum backend kamu
  total: number;
  orderItems?: OrderItem[];
}

export default function CashierPage() {
  // Fix: Terapkan tipe Order[] pada useState untuk menghindari perangkap 'never[]'
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const API_URL = "https://restaurantapi-production-1747.up.railway.app";

  // Fix: Bungkus fetchOrders dengan useCallback agar aman dimasukkan ke dependency array useEffect
  const fetchOrders = useCallback(async () => {
    // Fix: Proteksi localStorage dari engine Server-Side Pre-rendering Next.js
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/order`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal mengambil order:", error);
    } finally {
      setLoading(false);
    }
  }, [router, API_URL]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: number) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      const res = await fetch(`${API_URL}/order/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "PAID" }),
      });

      if (res.ok) {
        alert("Pesanan berhasil diselesaikan!");
        fetchOrders(); // Refresh data
      } else {
        alert("Gagal mengupdate status.");
      }
    } catch (error) {
      alert("Terjadi kesalahan server.");
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-8 font-sans">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter">
            CASHIER PANEL
          </h1>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
            Manajemen Pesanan Masuk
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-[10px] font-bold bg-white px-4 py-2 rounded-full shadow-sm hover:bg-red-50 hover:text-red-600 transition-all"
        >
          LOGOUT
        </button>
      </header>

      {loading ? (
        <div className="text-center py-20 font-bold animate-pulse">
          Memuat Pesanan...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-[40px] p-8 shadow-sm border border-zinc-100 flex flex-col justify-between space-y-6"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                      Meja {order.tableNumber}
                    </p>
                    <h3 className="text-xl font-bold">
                      #{order.id} - {order.customerName}
                    </h3>
                  </div>
                  <span
                    className={`px-4 py-1 rounded-full text-[10px] font-black tracking-widest ${
                      order.status === "PAID"
                        ? "bg-green-100 text-green-600"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Daftar Items */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest border-b pb-2">
                    Pesanan:
                  </p>
                  {order.orderItems?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-sm italic"
                    >
                      <span className="text-zinc-600">
                        {item.qty}x{" "}
                        <span className="font-bold not-italic">
                          {item.menu?.name}
                        </span>
                      </span>
                      <span className="font-medium">
                        Rp {item.subtotal?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Total Tagihan
                  </p>
                  <p className="font-black text-2xl tracking-tighter italic">
                    Rp {order.total?.toLocaleString()}
                  </p>
                </div>

                {order.status !== "PAID" && (
                  <button
                    onClick={() => handleUpdateStatus(order.id)}
                    className="bg-black text-white px-6 py-3 rounded-full text-[10px] font-black tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                    SELESAIKAN
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {orders.length === 0 && !loading && (
        <div className="text-center py-20 bg-zinc-100 rounded-[40px] border-2 border-dashed">
          <p className="text-zinc-400 font-bold uppercase tracking-widest">
            Tidak ada pesanan aktif
          </p>
        </div>
      )}
    </div>
  );
}
