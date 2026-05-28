"use client";

import { useEffect, useState } from "react";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string; // Menampung data string Base64 atau URL murni
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

    const orderData = {
      customerName,
      tableNumber,
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
          alert("Silakan scan QR Code untuk menyelesaikan pembayaran");
        } else {
          alert("Pesanan berhasil! Silakan bayar ke kasir.");
        }
        setCart([]);
        setIsCartOpen(false);
        setCustomerName("");
        setTableNumber("");
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Gagal memproses pesanan: ${errorData.message || "Coba lagi"}`);
      }
    } catch {
      alert("Gagal kirim pesanan, periksa koneksi internet.");
    }
  };

  // Fungsi getImageUrl yang aman untuk Base64 hasil upload dari halaman admin
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
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-stone-500 text-sm">Memuat menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center text-rose-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-stone-800 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">🍜</span>
            </div>
            <span className="font-medium text-stone-700">savory.</span>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-lg text-white text-sm transition"
          >
            <span>🛒</span>
            <span className="text-xs">{totalItems}</span>
            <span className="w-px h-3 bg-white/30"></span>
            <span className="text-xs">Rp {totalPrice.toLocaleString()}</span>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-stone-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-medium mb-1">savory.</h1>
          <p className="text-stone-400 text-sm">
            Pesanan langsung dari meja kamu
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Kategori */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm transition ${
                selectedCategory === null
                  ? "bg-stone-800 text-white"
                  : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              Semua
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-1.5 rounded-full text-sm transition ${
                  selectedCategory === category.id
                    ? "bg-stone-800 text-white"
                    : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        {filteredMenus.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-stone-200">
            <span className="text-5xl mb-3 block opacity-50">🍽️</span>
            <p className="text-stone-400 text-sm">Belum ada menu</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredMenus.map((menu) => (
                <div
                  key={menu.id}
                  className="bg-white rounded-lg border border-stone-200 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="h-40 w-full bg-stone-100 rounded-t-lg overflow-hidden">
                      <img
                        src={getImageUrl(menu.image)}
                        alt={menu.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/400x300?text=No+Image";
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <span className="text-[10px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">
                        {categories.find((c) => c.id === menu.categoryId)
                          ?.name || "Menu"}
                      </span>
                      <h3 className="font-medium text-stone-800 mt-1">
                        {menu.name}
                      </h3>
                      <p className="text-stone-400 text-xs mt-1 line-clamp-2">
                        {menu.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex justify-between items-center mt-auto">
                    <span className="font-semibold text-stone-700">
                      Rp {menu.price.toLocaleString()}
                    </span>
                    <button
                      onClick={() => addToCart(menu)}
                      className="bg-stone-800 text-white w-8 h-8 rounded-full text-lg hover:bg-stone-700 transition flex items-center justify-center select-none"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <p className="text-xs text-stone-400">
                Menampilkan {filteredMenus.length} menu
              </p>
            </div>
          </>
        )}
      </main>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-[90vw] sm:max-w-md bg-white shadow-xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-stone-800 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>🛒</span>
                <h2 className="font-medium">Pesanan Saya</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-white/70 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3 opacity-50">🛒</div>
                  <p className="text-stone-400 text-sm">
                    Keranjang masih kosong
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-5 max-h-80 overflow-y-auto">
                    {cart.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-stone-50 p-3 rounded-lg"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-stone-800 text-sm">
                            {item.menu.name}
                          </h3>
                          <p className="text-stone-500 text-xs">
                            Rp {item.menu.price.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => removeFromCart(item.menu.id)}
                              className="bg-white border border-stone-300 w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <span className="text-sm text-stone-700 font-medium">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => addToCart(item.menu)}
                              className="bg-stone-800 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <span className="font-medium text-stone-700 text-sm">
                          Rp {(item.menu.price * item.qty).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 mb-4">
                    <input
                      type="text"
                      placeholder="Nama Anda"
                      className="w-full p-2.5 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 text-sm"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Nomor Meja"
                      className="w-full p-2.5 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 text-sm"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                    />
                  </div>

                  {/* Pilihan Metode Pembayaran */}
                  <div className="mb-4">
                    <p className="text-sm text-stone-600 mb-2 font-medium">
                      Metode Bayar
                    </p>
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

                  <div className="bg-stone-100 rounded-lg p-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-stone-600 text-sm">Total</span>
                      <span className="font-semibold text-stone-800">
                        Rp {totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full bg-stone-800 text-white py-3 rounded-lg font-medium hover:bg-stone-700 transition text-sm shadow-sm"
                  >
                    Konfirmasi Pesanan
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
