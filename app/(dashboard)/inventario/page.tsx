"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Plus, Search, Layers, AlertCircle } from "lucide-react";
import { DataService } from "@/lib/data-service";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function InventarioPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Formulario rápido de nuevo producto
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [stock, setStock] = useState(1);
  const [costPrice, setCostPrice] = useState("");
  const [cashPrice, setCashPrice] = useState("");
  const [creditPrice, setCreditPrice] = useState("");
  const [currency, setCurrency] = useState<"USD" | "NIO">("USD");
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    const prods = await DataService.getProducts();
    setProducts(prods);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await DataService.addProduct({
        name,
        categoryId: "cat-1",
        categoryName: "General",
        stock: Number(stock) || 0,
        costPrice: Number(costPrice) || 0,
        costCurrency: currency,
        cashPrice: Number(cashPrice) || 0,
        creditPrice: Number(creditPrice) || 0,
        saleCurrency: currency,
        active: true,
      });
      setShowModal(false);
      setName("");
      setCostPrice("");
      setCashPrice("");
      setCreditPrice("");
      await loadProducts();
    } catch (err) {
      alert("Error al agregar producto");
    } finally {
      setSaving(false);
    }
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventario de Productos</h1>
          <p className="text-sm text-slate-500">Control ágil de existencias y precios</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Buscar electrodoméstico, celular, consola..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
        />
      </div>

      {/* Listado en Tarjetas (Mobile) y Tabla (Desktop) */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando inventario...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-medium text-slate-600">No se encontraron productos en el inventario.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Producto</th>
                  <th className="py-3.5 px-4">Existencia</th>
                  <th className="py-3.5 px-4">Precio Contado</th>
                  <th className="py-3.5 px-4">Precio Crédito</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const isLow = p.stock <= 2;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.categoryName || "Electrodomésticos"}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            p.stock === 0
                              ? "bg-red-100 text-red-700"
                              : isLow
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {p.stock} unids
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {formatCurrency(p.cashPrice, p.saleCurrency)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {formatCurrency(p.creditPrice, p.saleCurrency)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/ventas/nueva?productId=${p.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold py-1.5 px-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <span>Vender</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Rápido de Nuevo Producto */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Agregar Nuevo Producto</h2>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre / Modelo</label>
                <input
                  type="text"
                  placeholder="Ej: Smart TV Samsung 50 pulgadas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad Inicial</label>
                  <input
                    type="number"
                    min="1"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Moneda</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="USD">Dólares ($ USD)</option>
                    <option value="NIO">Córdobas (C$ NIO)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Precio Contado</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cashPrice}
                    onChange={(e) => setCashPrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Precio Crédito</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={creditPrice}
                    onChange={(e) => setCreditPrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
