"use client";

import { useEffect, useState, useCallback } from "react";

interface Category {
  id: number;
  name: string;
}

interface Menu {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string; // Menyimpan string Base64 yang panjang
  categoryId: number;
  category?: {
    name: string;
  };
}

export default function ManageMenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    categoryId: "",
    image: "", // Menampung string data Base64
  });

  const API_URL = "https://restaurantapi-production-1747.up.railway.app";

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_URL}/menu`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMenus(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal load menu:", error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/category`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal load kategori:", error);
    }
  }, [API_URL]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMenus();
    fetchCategories();
  }, [fetchMenus, fetchCategories]);

  // Fungsi konversi File Gambar lokal menjadi teks Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // PERBAIKAN: Proteksi ukuran gambar diubah dari 2MB menjadi 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran gambar terlalu besar! Maksimal 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditOpen = (menu: Menu) => {
    setIsEditing(true);
    setSelectedId(menu.id);
    setFormData({
      name: menu.name,
      price: menu.price.toString(),
      description: menu.description,
      categoryId: menu.categoryId.toString(),
      image: menu.image || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus menu "${name}"?`)) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Anda belum login sebagai admin!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/menu/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert("Menu berhasil dihapus!");
        fetchMenus();
      } else {
        alert("Gagal menghapus menu.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Terjadi kesalahan koneksi.");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedId(null);
    setFormData({
      name: "",
      price: "",
      description: "",
      categoryId: "",
      image: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Anda belum login sebagai admin!");
      return;
    }

    const url = isEditing ? `${API_URL}/menu/${selectedId}` : `${API_URL}/menu`;
    const method = isEditing ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          price: Number(formData.price),
          description: formData.description,
          categoryId: Number(formData.categoryId),
          image: formData.image,
        }),
      });

      if (res.ok) {
        alert(
          isEditing ? "Menu berhasil diupdate!" : "Menu berhasil ditambah!",
        );
        closeModal();
        fetchMenus();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(
          `Gagal: ${errorData.message || "Cek input atau struktur field database Anda"}`,
        );
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Terjadi kesalahan koneksi.");
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "https://placehold.co/100x100?text=No+Image";
    return imagePath;
  };

  const getCategoryName = (categoryId: number) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || "Uncategorized";
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-medium text-stone-700">Kelola Menu</h2>
          <p className="text-stone-400 text-sm mt-0.5">
            {menus.length} menu tersedia
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            setFormData({
              name: "",
              price: "",
              description: "",
              categoryId: "",
              image: "",
            });
            setShowModal(true);
          }}
          className="bg-stone-800 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors"
        >
          + Tambah Menu
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex justify-between items-center">
              <h3 className="text-lg font-medium text-stone-800">
                {isEditing ? "Update Menu" : "Tambah Menu"}
              </h3>
              <button
                onClick={closeModal}
                className="text-stone-400 hover:text-stone-600 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* File Upload Box */}
                <div className="bg-stone-50 rounded-lg p-5 text-center border border-stone-200 flex flex-col justify-between gap-3">
                  <div className="w-32 h-32 mx-auto bg-white rounded-lg overflow-hidden border border-stone-200 flex items-center justify-center">
                    {formData.image && formData.image.trim() !== "" ? (
                      <img
                        src={getImageUrl(formData.image)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/100x100?text=Format+Error";
                        }}
                      />
                    ) : (
                      <span className="text-stone-300 text-xs text-center p-3">
                        Preview file gambar otomatis muncul di sini
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block w-full px-4 py-2 rounded-lg bg-white border border-stone-200 text-stone-600 text-xs font-medium cursor-pointer hover:bg-stone-50 transition-colors text-center">
                      {formData.image
                        ? "Ganti File Gambar"
                        : "Pilih File Gambar"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="text-[10px] text-stone-400 mt-1 text-left">
                      *Gambar diubah otomatis ke teks Base64 agar aman dari
                      hilangnya server storage. Max 5MB.
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nama Menu"
                    required
                    className="w-full px-4 py-2 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 focus:bg-white text-stone-700 text-sm"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    placeholder="Harga (Rp)"
                    required
                    className="w-full px-4 py-2 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 focus:bg-white text-stone-700 text-sm"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                  <select
                    required
                    className="w-full px-4 py-2 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 focus:bg-white text-stone-700 text-sm"
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <textarea
                    placeholder="Deskripsi Menu"
                    required
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 focus:bg-white text-stone-700 text-sm resize-none"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="p-5 border-t border-stone-100 flex gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 rounded-lg border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 transition-colors"
                >
                  {isEditing ? "Simpan Perubahan" : "Publikasikan Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menus.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-stone-50 rounded-lg border border-stone-200">
            <p className="text-stone-400 text-sm">Belum ada menu</p>
          </div>
        ) : (
          menus.map((menu) => (
            <div
              key={menu.id}
              className="bg-white rounded-lg border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex gap-4 p-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                  <img
                    src={getImageUrl(menu.image)}
                    alt={menu.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/100x100?text=No+Image";
                    }}
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">
                    {getCategoryName(menu.categoryId)}
                  </span>
                  <h3 className="text-base font-medium text-stone-800 mt-1">
                    {menu.name}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1 line-clamp-2">
                    {menu.description}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 pt-0 border-t border-stone-100 mt-2">
                <p className="text-base font-semibold text-stone-700">
                  Rp {Number(menu.price).toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditOpen(menu)}
                    className="px-3 py-1 rounded-lg text-xs text-stone-500 hover:bg-stone-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(menu.id, menu.name)}
                    className="px-3 py-1 rounded-lg text-xs text-stone-400 hover:text-rose-600 transition-colors"
                  >
                    Hapus
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
