"use client";

import { useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
}

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState("");

  const API_URL = "https://restaurantapi-production-1747.up.railway.app";

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/category`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Gagal fetch kategori:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, []);

  const openModal = (cat?: Category) => {
    if (cat) {
      setIsEditing(true);
      setCurrentId(cat.id);
      setCategoryName(cat.name);
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setCategoryName("");
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Anda belum login!");
      return;
    }

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
        alert(
          isEditing
            ? "Kategori berhasil diupdate!"
            : "Kategori berhasil ditambah!",
        );
        setShowModal(false);
        setCategoryName("");
        fetchCategories();
      } else {
        alert("Gagal menyimpan kategori.");
      }
    } catch (error) {
      alert("Terjadi kesalahan.");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus kategori "${name}"?`)) return;

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Anda belum login!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/category/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert("Kategori berhasil dihapus!");
        fetchCategories();
      } else {
        alert("Gagal menghapus kategori.");
      }
    } catch (error) {
      alert("Terjadi kesalahan.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-stone-500 text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-medium text-stone-700">Kategori</h2>
          <p className="text-stone-400 text-sm mt-0.5">Kelola kategori menu</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-stone-800 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors"
        >
          + Tambah Kategori
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-lg">
            <div className="p-6 border-b border-stone-100">
              <h3 className="text-lg font-medium text-stone-800">
                {isEditing ? "Edit Kategori" : "Kategori Baru"}
              </h3>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <input
                  autoFocus
                  type="text"
                  placeholder="Nama kategori"
                  className="w-full px-4 py-2 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-400 focus:bg-white text-stone-700 text-sm"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2 p-6 pt-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">
                Nama Kategori
              </th>
              <th className="px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-6 py-12 text-center text-stone-400 text-sm"
                >
                  Belum ada kategori
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="hover:bg-stone-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm text-stone-700">{cat.name}</span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openModal(cat)}
                      className="text-xs text-stone-500 hover:text-stone-700 px-2 py-1 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="text-xs text-stone-400 hover:text-rose-600 px-2 py-1 transition-colors"
                    >
                      Hapus
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
