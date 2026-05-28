"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  paymentMethod?: string;
  paymentStatus?: string;
}

// Fungsi pembantu untuk membaca Cookie di sisi Client
const getCookieClient = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

export default function CashierPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  // Perubahan tipe ke string | number untuk UX input yang lebih mulus
  const [cashAmount, setCashAmount] = useState<number | "">("");
  const router = useRouter();
  const API_URL = "https://restaurantapi-production-1747.up.railway.app";

  const fetchOrders = useCallback(async () => {
    // PERBAIKAN 1: Membaca token akses dari Cookie, bukan localStorage
    const token = getCookieClient("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/order`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      const allOrders = Array.isArray(data) ? data : [];
      setOrders(allOrders);
    } catch (error) {
      console.error("Gagal mengambil order:", error);
    } finally {
      setLoading(false);
    }
  }, [API_URL, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    const token = getCookieClient("token");

    if (!token) {
      alert("Sesi habis, silakan login kembali.");
      router.push("/login");
      return;
    }

    let confirmMessage = "";
    if (newStatus === "PROCESS") confirmMessage = "Proses pesanan ini?";
    else if (newStatus === "DONE") confirmMessage = "Selesaikan pesanan ini?";
    else if (newStatus === "CANCEL") confirmMessage = "Batalkan pesanan ini?";

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`${API_URL}/order/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        alert(
          `Pesanan ${newStatus === "PROCESS" ? "diproses" : newStatus === "DONE" ? "selesai" : "dibatalkan"}!`,
        );
        fetchOrders();
      } else {
        const error = await res.json().catch(() => ({}));
        alert(`Gagal: ${error.message || "Terjadi kesalahan"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal koneksi.");
    }
  };

  const handlePayment = async (order: Order) => {
    setSelectedOrder(order);
    // PERBAIKAN 2: Memberikan nilai default kosong agar kasir lebih mudah mengetik nominal cash
    setCashAmount("");
    setPaymentMethod("CASH");
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    if (!selectedOrder) return;

    const token = getCookieClient("token");

    if (!token) {
      alert("Sesi habis, silakan login kembali.");
      router.push("/login");
      return;
    }

    const finalAmount = cashAmount === "" ? 0 : cashAmount;

    if (paymentMethod === "CASH" && finalAmount < selectedOrder.total) {
      alert("Jumlah uang tunai yang dimasukkan kurang dari total tagihan.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/order/${selectedOrder.id}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethod: paymentMethod,
          amount: paymentMethod === "QRIS" ? selectedOrder.total : finalAmount,
        }),
      });

      if (res.ok) {
        alert(
          `Pembayaran ${paymentMethod === "CASH" ? "tunai" : "QRIS"} berhasil!`,
        );
        setShowPaymentModal(false);
        fetchOrders();
      } else {
        const error = await res.json().catch(() => ({}));
        alert(`Gagal: ${error.message || "Terjadi kesalahan"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal koneksi.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700">
            Menunggu
          </span>
        );
      case "PROCESS":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs bg-sky-50 text-sky-700">
            Diproses
          </span>
        );
      case "DONE":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700">
            Selesai
          </span>
        );
      case "CANCEL":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs bg-rose-50 text-rose-600">
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

  const getPaymentBadge = (paymentMethod?: string, paymentStatus?: string) => {
    if (!paymentMethod) return null;
    if (paymentStatus === "PAID") {
      return (
        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          Lunas
        </span>
      );
    }
    return (
      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
        Belum bayar
      </span>
    );
  };

  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const processOrders = orders.filter((o) => o.status === "PROCESS").length;
  const completedOrders = orders.filter((o) => o.status === "DONE").length;
  const cancelledOrders = orders.filter((o) => o.status === "CANCEL").length;
  const totalRevenue = orders
    .filter((o) => o.status === "DONE")
    .reduce((sum, order) => sum + order.total, 0);

  // Kalkulasi nilai kembalian uang tunai
  const currentCashNum = cashAmount === "" ? 0 : cashAmount;
  const change = currentCashNum - (selectedOrder?.total || 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-stone-500 text-sm">Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-xl font-medium text-stone-700">Daftar Pesanan</h1>
        <p className="text-stone-400 text-sm mt-1">Kelola pesanan yang masuk</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-stone-400">Menunggu</p>
              <p className="text-2xl font-semibold text-stone-700 mt-1">
                {pendingOrders}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <span className="text-amber-600 text-sm">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-stone-400">Diproses</p>
              <p className="text-2xl font-semibold text-stone-700 mt-1">
                {processOrders}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
              <span className="text-sky-600 text-sm">🍳</span>
            </div>
          </div>
        </div>

        <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-stone-400">Selesai</p>
              <p className="text-2xl font-semibold text-stone-700 mt-1">
                {completedOrders}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-600 text-sm">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-stone-400">Dibatalkan</p>
              <p className="text-2xl font-semibold text-stone-700 mt-1">
                {cancelledOrders}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <span className="text-rose-600 text-sm">❌</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Pendapatan Bar */}
      <div className="bg-stone-100 rounded-lg p-3 flex justify-between items-center">
        <span className="text-sm text-stone-600">
          Total Pendapatan (Selesai)
        </span>
        <span className="text-lg font-semibold text-stone-800">
          Rp {totalRevenue.toLocaleString()}
        </span>
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="text-center py-16 bg-stone-50 rounded-xl border border-stone-100">
          <div className="text-5xl mb-3 opacity-40">🍽️</div>
          <p className="text-stone-400 text-sm">Belum ada pesanan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-xl border shadow-sm transition-all ${
                order.status === "DONE" || order.status === "CANCEL"
                  ? "opacity-75 border-stone-100"
                  : "border-stone-100 hover:shadow"
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b border-stone-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-stone-400">
                        Meja {order.tableNumber}
                      </span>
                    </div>
                    <h3 className="text-base font-medium text-stone-800">
                      {order.customerName}
                    </h3>
                    <span className="text-xs text-stone-400">
                      Order #{order.id}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(order.status)}
                    {getPaymentBadge(order.paymentMethod, order.paymentStatus)}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-4 space-y-2">
                <p className="text-xs text-stone-400">Item pesanan</p>
                {order.orderItems?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400">{item.qty}x</span>
                      <span className="text-stone-600">
                        {item.menu?.name || "Menu"}
                      </span>
                    </div>
                    <span className="text-stone-500">
                      Rp {item.subtotal?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer & Actions */}
              <div className="p-4 border-t border-stone-50">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-xs text-stone-400">Total tagihan</p>
                    <p className="text-base font-semibold text-stone-700">
                      Rp {order.total?.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {order.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(order.id, "PROCESS")}
                        className="flex-1 bg-sky-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-sky-700 transition"
                      >
                        Proses
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order.id, "CANCEL")}
                        className="flex-1 bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-rose-600 transition"
                      >
                        Batalkan
                      </button>
                    </>
                  )}

                  {order.status === "PROCESS" && (
                    <>
                      <button
                        onClick={() => handlePayment(order)}
                        className="flex-1 bg-stone-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-stone-700 transition"
                      >
                        Bayar
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order.id, "CANCEL")}
                        className="flex-1 bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-rose-600 transition"
                      >
                        Batalkan
                      </button>
                    </>
                  )}

                  {(order.status === "DONE" || order.status === "CANCEL") && (
                    <div className="w-full text-center text-xs text-stone-400 py-1.5">
                      {order.status === "DONE"
                        ? "✓ Pesanan selesai"
                        : "✗ Pesanan dibatalkan"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowPaymentModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-stone-800">Pembayaran</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-stone-600">Total Tagihan</p>
                <p className="text-2xl font-semibold text-stone-800">
                  Rp {selectedOrder.total.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-stone-600 mb-2">Metode Pembayaran</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH"
                      checked={paymentMethod === "CASH"}
                      onChange={() => setPaymentMethod("CASH")}
                      className="w-4 h-4 accent-stone-800"
                    />
                    <span className="text-sm text-stone-700">Tunai</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="QRIS"
                      checked={paymentMethod === "QRIS"}
                      onChange={() => setPaymentMethod("QRIS")}
                      className="w-4 h-4 accent-stone-800"
                    />
                    <span className="text-sm text-stone-700">QRIS</span>
                  </label>
                </div>
              </div>

              {paymentMethod === "CASH" && (
                <div>
                  <p className="text-sm text-stone-600 mb-1">Jumlah Tunai</p>
                  <input
                    type="number"
                    placeholder={`Contoh: ${selectedOrder.total}`}
                    className="w-full p-2 rounded-lg border border-stone-200 focus:outline-none focus:border-stone-400 text-sm"
                    value={cashAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCashAmount(val === "" ? "" : parseInt(val) || 0);
                    }}
                  />
                  {change > 0 && (
                    <div className="mt-2 p-2 bg-emerald-50 rounded-lg">
                      <p className="text-sm text-emerald-700">
                        Kembalian: Rp {change.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === "QRIS" && (
                <div className="bg-stone-50 p-4 rounded-lg text-center">
                  <div className="w-32 h-32 mx-auto bg-white border-2 border-stone-200 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-3xl">📱</span>
                  </div>
                  <p className="text-sm text-stone-600">
                    Scan QR Code untuk membayar
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    Total: Rp {selectedOrder.total.toLocaleString()}
                  </p>
                </div>
              )}

              <button
                onClick={confirmPayment}
                className="w-full bg-stone-800 text-white py-2.5 rounded-lg font-medium hover:bg-stone-700 transition text-sm"
              >
                Konfirmasi Pembayaran
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
