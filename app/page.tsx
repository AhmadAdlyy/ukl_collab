"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function UserMenuPage() {
  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState<{ menu: any; qty: number }[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");

  const API_URL = "https://restaurantapi-production-1747.up.railway.app";

  useEffect(() => {
    fetch(`${API_URL}/menu`)
      .then((res) => res.json())
      .then(setMenus);
  }, []);

  const addToCart = (menu: any) => {
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

  const handleCheckout = async () => {
    if (!customerName || !tableNumber)
      return alert("Nama dan Nomor Meja wajib diisi!");
    if (cart.length === 0) return alert("Keranjang masih kosong!");

    const orderData = {
      customerName,
      tableNumber,
      items: cart.map((item) => ({
        menuId: item.menu.id,
        quantity: item.qty,
      })),
      totalPrice,
    };

    try {
      const res = await fetch(`${API_URL}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        alert("Pesanan JOSS! Sedang disiapkan.");
        setCart([]);
        setShowCheckout(false);
      }
    } catch (e) {
      alert("Gagal kirim pesanan");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-black font-sans pb-20 md:pb-0">
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase">
              MixBowls.
            </h1>
            <p className="text-[10px] font-bold text-zinc-400 tracking-[0.3em] uppercase">
              Premium Self-Order
            </p>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">
                Status Meja
              </p>
              <p className="text-sm font-black italic">Tersedia</p>
            </div>
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-bold">
              🛒
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* MENU GRID SECTION */}
        <div className="lg:col-span-8 space-y-8">
          <div className="relative h-48 md:h-64 rounded-[40px] overflow-hidden shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
              alt="Hero"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
              <span className="text-white/60 text-xs font-bold tracking-[0.4em] mb-2 uppercase">
                Promo Hari Ini
              </span>
              <h2 className="text-white text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
                Diskon 20% <br /> Semua Bowls
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menus.map((menu: any) => (
              <div
                key={menu.id}
                className="bg-white p-5 rounded-[35px] border border-zinc-100 flex items-center gap-5 hover:shadow-xl transition-all group"
              >
                <div className="w-24 h-24 relative rounded-3xl overflow-hidden shadow-md shrink-0">
                  <Image
                    src={`${API_URL}/uploads/${menu.image}`}
                    alt={menu.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    unoptimized
                    onError={(e) => {
                      (e.target as any).src =
                        "https://placehold.co/400x400?text=Food";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black italic text-lg uppercase truncate">
                    {menu.name}
                  </h3>
                  <p className="text-zinc-400 text-[10px] line-clamp-1 mb-2">
                    {menu.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm italic">
                      Rp {menu.price.toLocaleString()}
                    </span>
                    <button
                      onClick={() => addToCart(menu)}
                      className="bg-black text-white w-8 h-8 rounded-full font-black hover:scale-110 transition-all shadow-lg active:scale-90"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CART SIDEBAR (DESKTOP) */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-24 h-fit">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-zinc-100 space-y-6">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">
              Ringkasan Pesanan
            </h2>
            {cart.length === 0 ? (
              <p className="text-zinc-300 italic text-sm text-center py-10">
                Keranjang masih kosong...
              </p>
            ) : (
              <div className="space-y-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm uppercase">
                        {item.menu.name}
                      </span>
                      <div className="flex items-center gap-3 mt-1">
                        <button
                          onClick={() => removeFromCart(item.menu.id)}
                          className="text-xs bg-zinc-100 w-5 h-5 rounded-md"
                        >
                          -
                        </button>
                        <span className="text-xs font-black italic">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => addToCart(item.menu)}
                          className="text-xs bg-zinc-100 w-5 h-5 rounded-md"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <span className="font-black text-sm italic">
                      Rp {(item.menu.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
                <hr className="border-zinc-50" />
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="NAMA ANDA"
                    className="w-full p-4 rounded-2xl bg-zinc-50 border-none outline-none font-bold text-xs"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="MEJA NOMOR"
                    className="w-full p-4 rounded-2xl bg-zinc-50 border-none outline-none font-bold text-xs"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                  />
                </div>
                <div className="flex justify-between text-xl font-black italic pt-4">
                  <span>TOTAL</span>
                  <span>Rp {totalPrice.toLocaleString()}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-black text-white p-5 rounded-3xl font-black tracking-widest text-xs hover:bg-zinc-800 transition-all shadow-xl"
                >
                  PESAN SEKARANG
                </button>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* MOBILE FLOATING BAR */}
      <div className="lg:hidden fixed bottom-6 left-0 right-0 px-6 z-40">
        <button
          onClick={() => setShowCheckout(true)}
          className={`w-full bg-black text-white p-5 rounded-[30px] shadow-2xl flex justify-between items-center transition-all duration-500 ${cart.length > 0 ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"}`}
        >
          <div className="flex gap-4 items-center">
            <span className="bg-white text-black w-8 h-8 rounded-xl flex items-center justify-center font-black italic text-xs">
              {cart.length}
            </span>
            <span className="font-black text-xs tracking-widest italic">
              LIHAT KERANJANG
            </span>
          </div>
          <span className="font-black text-lg italic">
            Rp {totalPrice.toLocaleString()}
          </span>
        </button>
      </div>

      {/* MOBILE BOTTOM SHEET MODAL */}
      {showCheckout && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-white w-full rounded-t-[50px] p-10 space-y-6 animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                Konfirmasi Order
              </h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-zinc-300 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 py-4">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="font-bold text-sm uppercase">
                    {item.qty}x {item.menu.name}
                  </span>
                  <span className="font-black text-sm">
                    Rp {(item.menu.price * item.qty).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="NAMA"
                className="w-full p-4 rounded-2xl bg-zinc-100 border-none outline-none font-black text-xs uppercase"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <input
                type="number"
                placeholder="MEJA"
                className="w-full p-4 rounded-2xl bg-zinc-100 border-none outline-none font-black text-xs uppercase"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              />
            </div>
            <div className="flex justify-between items-end pt-4">
              <span className="text-zinc-400 font-bold text-[10px] uppercase">
                Total Pembayaran
              </span>
              <span className="text-3xl font-black italic leading-none">
                Rp {totalPrice.toLocaleString()}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-black text-white p-6 rounded-[30px] font-black italic tracking-[0.2em] text-sm"
            >
              KONFIRMASI PESANAN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
