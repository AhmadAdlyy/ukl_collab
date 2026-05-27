"use client";

import { useEffect, useState, useCallback } from "react";

// 1. Definisikan interface untuk Kategori
interface Category {
  id: number;
  name: string;
}

export default function CategoryPage() {
  // Fix: Berikan tipe data <Category[]> agar tidak dianggap <never[]>
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState("");

  const API_URL = "https://restaurantapi-production-1747.up.railway.app";

  // Fix: Bungkus dengan useCallback agar aman dimasukkan ke dependency array useEffect
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/category`);
      const data = await res.json();
      // TypeScript sekarang tahu bahwa data yang dimasukkan harus cocok dengan struktur Category[]
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal memuat kategori");
    }
    {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, [fetchCategories]);

  // Buka Modal (Tambah atau Edit)
  // Fix: Ganti 'any' dengan tipe data 'Category' yang sudah dibuat
  const openModal = (cat?: Category) => {
    if (cat) {
      setIsEditing(true);
      setCurrentId(cat.id);
      setCategoryName(cat.name);
    } else {
      setIsEditing(false);
      setCategoryName("");
    }
    setShowModal(true);
  };

  // Submit Form (POST atau PATCH)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const method = isEditing ? "PATCH" : "POST";
    const url = isEditing
      ? `${API_URL}/category/${currentId}`
      : `${API_URL}/category`;

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: categoryName }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchCategories();
      } else {
        alert("Gagal memproses kategori. Cek otorisasi Anda.");
      }
    } catch (error) {
      alert("Terjadi kesalahan koneksi.");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus kategori "${name}"?`)) return;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      const res = await fetch(`${API_URL}/category/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchCategories();
    } catch (error) {
      alert("Gagal menghapus.");
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-zinc-100">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">
            Kategori
          </h2>
          <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1">
            Management System
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-black text-white px-8 py-4 rounded-full text-[10px] font-black tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          + TAMBAH KATEGORI
        </button>
      </div>

      {/* CUSTOM MODAL UI */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[50px] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-300">
            <div className="text-center">
              <h3 className="text-2xl font-black italic tracking-tighter uppercase">
                {isEditing ? "Edit Kategori" : "Kategori Baru"}
              </h3>
              <p className="text-zinc-400 text-[9px] font-bold tracking-widest uppercase mt-1">
                Isi nama kategori di bawah
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                autoFocus
                type="text"
                placeholder="Misal: MAIN COURSE"
                className="w-full p-5 rounded-3xl bg-zinc-100 border-none outline-none focus:ring-2 focus:ring-black font-black text-center text-sm uppercase tracking-widest"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 p-4 rounded-full font-black text-[10px] tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="flex-1 p-4 bg-black text-white rounded-full font-black text-[10px] tracking-widest shadow-lg active:scale-95 transition-transform"
                >
                  SIMPAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List Table */}
      <div className="bg-white rounded-[45px] border border-zinc-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50/50 border-b border-zinc-100">
            <tr>
              <th className="px-10 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                Nama Kategori
              </th>
              <th className="px-10 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {loading ? (
              <tr>
                <td
                  colSpan={2}
                  className="p-20 text-center font-bold italic text-zinc-300 animate-pulse"
                >
                  LOADING...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="p-20 text-center text-zinc-400 font-bold italic"
                >
                  Belum ada kategori.
                </td>
              </tr>
            ) : (
              // Fix: 'cat' otomatis bertipe 'Category' karena state 'categories' sudah diketik dengan benar
              categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="group hover:bg-zinc-50/50 transition-all"
                >
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-1.5 bg-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="font-black italic text-lg tracking-tight text-zinc-800 uppercase">
                        {cat.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right space-x-2">
                    <button
                      onClick={() => openModal(cat)}
                      className="text-[10px] font-black tracking-widest text-zinc-300 hover:text-blue-600 px-3 py-2 transition-colors"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="text-[10px] font-black tracking-widest text-red-200 hover:text-red-600 px-3 py-2 transition-colors"
                    >
                      HAPUS
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
