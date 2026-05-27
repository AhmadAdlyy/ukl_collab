"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function ManageMenuPage() {
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Modal & Edit
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // State Form
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    categoryId: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const API_URL = "https://restaurantapi-production-1747.up.railway.app";

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/menu`);
      const data = await res.json();
      setMenus(data);
    } catch (error) {
      console.error("Gagal load menu");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const res = await fetch(`${API_URL}/category`);
    const data = await res.json();
    setCategories(data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMenus();
    fetchCategories();
  }, []);

  // FUNGSI MEMBUKA MODAL EDIT
  const handleEditOpen = (menu: any) => {
    setIsEditing(true);
    setSelectedId(menu.id);
    setFormData({
      name: menu.name,
      price: menu.price.toString(),
      description: menu.description,
      categoryId: menu.categoryId.toString(),
    });
    // Set preview ke gambar yang sudah ada di server
    setPreviewUrl(`${API_URL}/uploads/${menu.image}`);
    setShowModal(true);
  };

  // FUNGSI HAPUS MENU (LOGIK BARU)
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus menu "${name}"? Tindakan ini tidak bisa dibatalkan.`))
      return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/menu/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("Menu berhasil dihapus!");
        fetchMenus();
      } else {
        alert("Gagal menghapus. Cek otorisasi Admin Anda.");
      }
    } catch (error) {
      alert("Terjadi kesalahan koneksi.");
    }
  };

  // FUNGSI RESET & CLOSE MODAL
  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedId(null);
    setFormData({ name: "", price: "", description: "", categoryId: "" });
    setImageFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    // Gunakan FormData karena kita mengirim File Gambar
    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", formData.price);
    data.append("description", formData.description);
    data.append("categoryId", formData.categoryId);
    if (imageFile) data.append("image", imageFile);

    const url = isEditing ? `${API_URL}/menu/${selectedId}` : `${API_URL}/menu`;
    const method = isEditing ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { Authorization: `Bearer ${token}` },
        body: data, // Jangan set Content-Type manual jika pakai FormData
      });

      if (res.ok) {
        alert(
          isEditing ? "Menu berhasil diupdate!" : "Menu berhasil ditambah!",
        );
        closeModal();
        fetchMenus();
      } else {
        alert("Gagal memproses data. Cek input atau role Admin Anda.");
      }
    } catch (error) {
      alert("Gagal memproses data.");
    }
  };

  return (
    <div className="space-y-6 p-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-zinc-100">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase">
            Kelola Menu
          </h2>
          <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest mt-1">
            {menus.length} Items Available
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            setShowModal(true);
          }}
          className="bg-black text-white px-8 py-4 rounded-full text-[11px] font-black tracking-[0.2em] hover:scale-105 transition-all shadow-xl active:scale-95"
        >
          + TAMBAH MENU
        </button>
      </div>

      {/* MODAL UI */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-[50px] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-300">
            {/* Sisi Kiri: Upload */}
            <div className="w-full md:w-1/3 bg-zinc-50 p-8 flex flex-col items-center justify-center border-r border-zinc-100">
              <div className="w-32 h-32 bg-white rounded-3xl shadow-inner mb-4 relative overflow-hidden border-2 border-dashed border-zinc-200 flex items-center justify-center">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-[10px] text-zinc-300 font-bold uppercase text-center p-4">
                    No Image Selected
                  </span>
                )}
              </div>
              <label className="cursor-pointer bg-zinc-200 hover:bg-black hover:text-white px-4 py-2 rounded-xl text-[9px] font-black tracking-widest transition-all">
                PILIH FOTO
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>

            {/* Sisi Kanan: Form */}
            <div className="w-full md:w-2/3 p-10 space-y-6">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-black italic tracking-tighter uppercase">
                  {isEditing ? "Update Menu" : "Tambah Menu"}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-zinc-300 hover:text-black transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Nama Menu"
                  required
                  className="w-full p-4 rounded-2xl bg-zinc-100 border-none focus:ring-2 focus:ring-black outline-none text-sm"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Harga (Rp)"
                    required
                    className="w-full p-4 rounded-2xl bg-zinc-100 border-none focus:ring-2 focus:ring-black outline-none text-sm"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                  <select
                    required
                    className="w-full p-4 rounded-2xl bg-zinc-100 border-none focus:ring-2 focus:ring-black outline-none text-sm"
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                  >
                    <option value="">Kategori...</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  placeholder="Deskripsi Menu..."
                  required
                  className="w-full p-4 rounded-2xl bg-zinc-100 border-none focus:ring-2 focus:ring-black outline-none text-sm h-24 resize-none"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
                <button
                  type="submit"
                  className="w-full p-5 bg-black text-white rounded-3xl font-black text-xs tracking-[0.3em] shadow-xl hover:bg-zinc-800 active:scale-95 transition-all"
                >
                  {isEditing ? "SIMPAN PERUBAHAN" : "PUBLIKASIKAN MENU"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* LIST MENU CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <p className="col-span-full text-center py-20 font-black italic text-zinc-300 animate-pulse">
            LOADING MENU...
          </p>
        ) : (
          menus.map((menu: any) => (
            <div
              key={menu.id}
              className="bg-white p-6 rounded-[45px] shadow-sm border border-zinc-100 flex flex-col justify-between hover:shadow-xl transition-all group"
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-[30px] overflow-hidden relative shadow-md bg-zinc-100">
                  <Image
                    src={
                      menu.image?.startsWith("http")
                        ? menu.image
                        : `${API_URL}/uploads/${menu.image}`
                    }
                    alt={menu.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    unoptimized
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/400x400?text=No+Image";
                    }}
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[9px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest">
                    {menu.category?.name || "Uncategorized"}
                  </span>
                  <h3 className="text-xl font-black italic tracking-tighter mt-2 truncate uppercase">
                    {menu.name}
                  </h3>
                  <p className="text-[10px] text-zinc-400 line-clamp-2 mt-1">
                    {menu.description}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-50">
                <p className="text-xl font-black italic tracking-tighter">
                  Rp {Number(menu.price).toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditOpen(menu)}
                    className="w-10 h-10 flex items-center justify-center bg-zinc-100 rounded-full hover:bg-black hover:text-white transition-all text-xs"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDelete(menu.id, menu.name)}
                    className="w-10 h-10 flex items-center justify-center bg-zinc-100 rounded-full hover:bg-red-500 hover:text-white transition-all text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
