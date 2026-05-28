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

type PaymentMethod = "CASH" | "QRIS";

type OrderItemPayload = {
  menuId: number;
  qty: number;
  subtotal: number;
};

type OrderPayload = {
  customerName: string;
  tableNumber: string;
  total: number;
  paymentMethod: PaymentMethod;
  items: OrderItemPayload[];
};

export default function UserMenuPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  const API_URL = "https://restaurantapi-production-1747.up.railway.app";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [catRes, menuRes] = await Promise.all([
          fetch(`${API_URL}/category`),
          fetch(`${API_URL}/menu`),
        ]);

        const categoriesData: unknown = await catRes.json();
        const menusData: unknown = await menuRes.json();

        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setMenus(Array.isArray(menusData) ? menusData : []);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredMenus =
    selectedCategory === null
      ? menus
      : menus.filter((m) => m.categoryId === selectedCategory);

  const addToCart = (menu: MenuItem) => {
    const exist = cart.find((c) => c.menu.id === menu.id);

    if (exist) {
      setCart(
        cart.map((c) => (c.menu.id === menu.id ? { ...c, qty: c.qty + 1 } : c)),
      );
    } else {
      setCart([...cart, { menu, qty: 1 }]);
    }
  };

  const removeFromCart = (id: number) => {
    const exist = cart.find((c) => c.menu.id === id);

    if (exist && exist.qty > 1) {
      setCart(
        cart.map((c) => (c.menu.id === id ? { ...c, qty: c.qty - 1 } : c)),
      );
    } else {
      setCart(cart.filter((c) => c.menu.id !== id));
    }
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.menu.price * item.qty,
    0,
  );

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleCheckout = async () => {
    if (!customerName.trim() || !tableNumber.trim()) {
      alert("Nama & meja wajib diisi");
      return;
    }

    if (cart.length === 0) {
      alert("Keranjang kosong");
      return;
    }

    setCheckoutLoading(true);

    const payload: OrderPayload = {
      customerName: customerName.trim(),
      tableNumber: tableNumber.trim(),
      total: totalPrice,
      paymentMethod,
      items: cart.map((item) => ({
        menuId: item.menu.id,
        qty: item.qty,
        subtotal: item.menu.price * item.qty,
      })),
    };

    try {
      const res = await fetch(`${API_URL}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          typeof data === "object" && data !== null && "message" in data
            ? (data as { message: string }).message
            : "Server error";

        alert(message);
        return;
      }

      alert("Pesanan berhasil dibuat");

      setCart([]);
      setCustomerName("");
      setTableNumber("");
      setIsCartOpen(false);
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-xl font-bold">Menu</h1>

      {/* MENU */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {filteredMenus.map((menu) => (
          <div key={menu.id} className="border p-3 rounded">
            <h2>{menu.name}</h2>
            <p>Rp {menu.price}</p>
            <button
              onClick={() => addToCart(menu)}
              className="bg-blue-500 text-white px-2 py-1 mt-2"
            >
              +
            </button>
          </div>
        ))}
      </div>

      {/* CART */}
      <div className="mt-6">
        <h2>Cart ({totalItems})</h2>

        {cart.map((item) => (
          <div key={item.menu.id} className="flex gap-2">
            <p>{item.menu.name}</p>
            <p>{item.qty}</p>
            <button onClick={() => removeFromCart(item.menu.id)}>-</button>
          </div>
        ))}

        <p>Total: Rp {totalPrice}</p>

        <button
          onClick={handleCheckout}
          disabled={checkoutLoading}
          className="bg-green-600 text-white px-3 py-2 mt-3"
        >
          {checkoutLoading ? "Loading..." : "Checkout"}
        </button>
      </div>
    </div>
  );
}
