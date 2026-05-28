"use client";

import { useEffect, useState } from "react";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: number;
}

interface Category {
  id: number;
  name: string;
}

interface CartItem {
  menu: MenuItem;
  qty: number;
}

export default function UserMenuPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false); // Dipertahankan untuk mencegah double checkout
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");

  const API_URL = "https://restaurantapi-production-1747.up.railway.app";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [catRes, menuRes] = await Promise.all([
          fetch(`${API_URL}/category`),
          fetch(`${API_URL}/menu`),
        ]);

        const categoriesData = await catRes.json();
        const menusData = await menuRes.json();

        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setMenus(Array.isArray(menusData) ? menusData : []);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
        setError("Gagal memuat data. Coba lagi nanti.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_URL]);

  const filteredMenus =
    selectedCategory === null
      ? menus
      : menus.filter((menu) => menu.categoryId === selectedCategory);

  const addToCart = (menu: MenuItem) => {
    const existing = cart.find((item) => item.menu.id === menu.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.menu.id === menu.id ? { ...item, qty: item.qty + 1 } : item,
        ),
      );
    } else {
      setCart([...cart, { menu, qty: 1 }]);
    }
  };

  const removeFromCart = (id: number) => {
    const existing = cart.find((item) => item.menu.id === id);
    if (existing && existing.qty > 1) {
      setCart(
        cart.map((item) =>
          item.menu.id === id ? { ...item, qty: item.qty - 1 } : item,
        ),
      );
    } else {
      setCart(cart.filter((item) => item.menu.id !== id));
    }
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.menu.price * item.qty,
    0,
  );
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleCheckout = async () => {
    if (customerName.trim() === "" || tableNumber.trim() === "") {
      alert("Nama dan Nomor Meja wajib diisi!");
      return;
    }
    if (cart.length === 0) {
      alert("Keranjang masih kosong!");
      return;
    }

    setCheckoutLoading(true);

    const orderData = {
      customerName: customerName.trim(),
      tableNumber: tableNumber.trim(),
      paymentMethod,
      items: cart.map((item) => ({
        menuId: item.menu.id,
        qty: item.qty,
        price: item.menu.price,
      })),
    };

    try {
      const res = await fetch(`${API_URL}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        if (paymentMethod === "QRIS") {
          alert(
            "Silakan scan QR Code di kasir / monitor untuk menyelesaikan pembayaran",
          );
        } else {
          alert(
            "Pesanan berhasil dibuat! Silakan lakukan pembayaran ke kasir.",
          );
        }
        setCart([]);
        setIsCartOpen(false);
        setCustomerName("");
        setTableNumber("");
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(
          `Gagal memproses pesanan: ${errorData.message || "Terjadi kesalahan server"}`,
        );
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengirim pesanan, periksa koneksi internet Anda.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "https://placehold.co/400x300?text=No+Image";

    if (
      imagePath.startsWith("data:") ||
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    return `${API_URL}/uploads/${imagePath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <span className="absolute inset-0 flex items-center justify-center text-2xl">
              🍜
            </span>
          </div>
          <p className="text-stone-600 font-medium">Menghidangkan menu...</p>
          <p className="text-stone-400 text-sm mt-1">Sebentar lagi siap!</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-stone-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">😢</div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/30 to-stone-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-orange-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">🍜</span>
              </div>
              <div>
                <span className="font-bold text-xl bg-gradient-to-r from-stone-800 to-stone-600 bg-clip-text text-transparent">
                  savory.
                </span>
                <p className="text-xs text-stone-400 -mt-1">restaurant</p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative group"
            >
              <div className="flex items-center gap-2 bg-gradient-to-r from-stone-800 to-stone-700 hover:from-stone-700 hover:to-stone-600 px-4 py-2 rounded-full text-white transition-all duration-300 shadow-md hover:shadow-lg">
                <span className="text-lg">🛒</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                    {totalItems}
                  </span>
                )}
                <span className="hidden sm:inline text-sm font-medium">
                  Rp {totalPrice.toLocaleString()}
                </span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl">🍜</div>
          <div className="absolute bottom-10 right-10 text-8xl">🥢</div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center relative">
          <h1 className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
            savory.
          </h1>
          <p className="text-stone-300 text-lg max-w-md mx-auto">
            Nikmati hidangan lezat langsung dari meja Anda
          </p>
          <div className="flex justify-center gap-2 mt-6">
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs">
              ✨ Cepat
            </span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs">
              🍽️ Mudah
            </span>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs">
              😋 Enak
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Kategori */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wider">
              Kategori Menu
            </h2>
            {selectedCategory !== null && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                Lihat Semua →
              </button>
            )}
          </div>
          <div className="overflow-x-auto pb-3">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === null
                    ? "bg-gradient-to-r from-stone-800 to-stone-700 text-white shadow-lg transform scale-105"
                    : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 hover:border-stone-300 hover:shadow-sm"
                }`}
              >
                🍽️ Semua
              </button>
              {categories.map((category) => {
                const icons: Record<string, string> = {
                  Makanan: "🍛",
                  Minuman: "🥤",
                  Snack: "🍿",
                };
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      selectedCategory === category.id
                        ? "bg-gradient-to-r from-stone-800 to-stone-700 text-white shadow-lg transform scale-105"
                        : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 hover:border-stone-300 hover:shadow-sm"
                    }`}
                  >
                    {icons[category.name] || "🍽️"} {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        {filteredMenus.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-dashed border-stone-300">
            <span className="text-7xl mb-4 block opacity-40">🍽️</span>
            <p className="text-stone-500 font-medium">
              Belum ada menu di kategori ini
            </p>
            <p className="text-stone-400 text-sm mt-1">
              Coba pilih kategori lain
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMenus.map((menu) => (
                <div
                  key={menu.id}
                  className="group bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100">
                      <img
                        src={getImageUrl(menu.image)}
                        alt={menu.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/400x300?text=No+Image";
                        }}
                      />
                      <div className="absolute top-3 right-3">
                        <span className="bg-white/90 backdrop-blur-sm text-stone-700 text-[11px] px-2.5 py-1 rounded-full font-semibold shadow-sm">
                          {categories.find((c) => c.id === menu.categoryId)
                            ?.name || "Menu"}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-stone-800 text-base mb-1 group-hover:text-orange-600 transition-colors">
                        {menu.name}
                      </h3>
                      <p className="text-stone-400 text-xs line-clamp-2 leading-relaxed">
                        {menu.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex justify-between items-center mt-auto">
                    <span className="font-extrabold text-stone-800 text-base sm:text-lg">
                      Rp {menu.price.toLocaleString()}
                    </span>
                    <button
                      onClick={() => addToCart(menu)}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 text-white w-9 h-9 rounded-full text-xl hover:from-orange-600 hover:to-amber-600 transition shadow-md active:scale-95 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <p className="text-xs text-stone-400">
                Menampilkan {filteredMenus.length} menu pilihan
              </p>
            </div>
          </>
        )}
      </main>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-[90vw] sm:max-w-md bg-white shadow-2xl z-50 flex flex-col justify-between">
            <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-4 flex justify-between items-center shrink-0 shadow-md">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛒</span>
                <h2 className="font-semibold text-lg">Pesanan Saya</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-white/70 hover:text-white text-xl p-2 rounded-full hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-5">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4 opacity-30">🛒</div>
                  <p className="text-stone-400 font-medium">
                    Keranjang belanja Anda kosong
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.menu.id}
                        className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100 shadow-sm"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-stone-800 text-sm">
                            {item.menu.name}
                          </h3>
                          <p className="text-stone-500 text-xs mt-0.5">
                            Rp {item.menu.price.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => removeFromCart(item.menu.id)}
                              className="bg-white border border-stone-200 w-7 h-7 rounded-full text-xs flex items-center justify-center font-bold shadow-sm active:bg-stone-100 text-stone-600"
                            >
                              -
                            </button>
                            <span className="text-sm text-stone-800 font-semibold min-w-[20px] text-center">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => addToCart(item.menu)}
                              className="bg-gradient-to-r from-stone-800 to-stone-700 text-white w-7 h-7 rounded-full text-xs flex items-center justify-center font-bold shadow-sm active:from-stone-700 text-center"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <span className="font-bold text-stone-700 text-sm ml-2">
                          Rp {(item.menu.price * item.qty).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 border-t border-stone-100 pt-4">
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">
                      Informasi Meja
                    </label>
                    <input
                      type="text"
                      placeholder="Nama Lengkap Anda"
                      className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-orange-400 focus:bg-white transition text-sm shadow-inner"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Nomor / Kode Meja (Contoh: 05 atau VIP-1)"
                      className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-orange-400 focus:bg-white transition text-sm shadow-inner"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                    />
                  </div>

                  <div className="border-t border-stone-100 pt-4">
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                      Metode Pembayaran
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer select-none transition-all ${paymentMethod === "CASH" ? "border-orange-500 bg-orange-50/50 text-orange-700 font-semibold" : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="CASH"
                          checked={paymentMethod === "CASH"}
                          onChange={() => setPaymentMethod("CASH")}
                          className="sr-only"
                        />
                        <span>💵 Kasir / Tunai</span>
                      </label>
                      <label
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer select-none transition-all ${paymentMethod === "QRIS" ? "border-orange-500 bg-orange-50/50 text-orange-700 font-semibold" : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="QRIS"
                          checked={paymentMethod === "QRIS"}
                          onChange={() => setPaymentMethod("QRIS")}
                          className="sr-only"
                        />
                        <span>📱 QRIS Dinamis</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-stone-100 bg-stone-50/50 shrink-0">
                <div className="bg-white border border-stone-200 rounded-xl p-4 mb-4 flex justify-between items-center shadow-sm">
                  <span className="text-stone-500 text-sm font-medium">
                    Total Pembayaran
                  </span>
                  <span className="font-black text-stone-900 text-lg">
                    Rp {totalPrice.toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3.5 rounded-xl font-bold hover:from-orange-600 hover:to-amber-600 transition text-sm shadow-md disabled:from-stone-400 disabled:to-stone-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {checkoutLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-stone-200 border-t-white rounded-full animate-spin"></div>
                      <span>Memproses Pesanan...</span>
                    </>
                  ) : (
                    <span>Konfirmasi & Pesan Sekarang</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
