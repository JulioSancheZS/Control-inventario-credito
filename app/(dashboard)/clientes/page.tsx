"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, Search, Phone, MapPin } from "lucide-react";
import { DataService } from "@/lib/data-service";
import { Customer, Credit } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal nuevo cliente
  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    const [custs, creds] = await Promise.all([
      DataService.getCustomers(),
      DataService.getCredits(),
    ]);
    setCustomers(custs);
    setCredits(creds);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;
    setSaving(true);
    try {
      await DataService.addCustomer({
        fullName,
        phone,
        address,
        notes,
      });
      setShowModal(false);
      setFullName("");
      setPhone("");
      setAddress("");
      setNotes("");
      await loadData();
    } catch {
      alert("Error al registrar cliente");
    } finally {
      setSaving(false);
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Directorio de Clientes</h1>
          <p className="text-sm text-slate-500">Historial de compras y saldos adeudados</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Buscar por nombre o número de teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
        />
      </div>

      {/* Listado */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando clientes...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-medium text-slate-600">No se encontraron clientes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            // Saldos pendientes del cliente por divisa
            const custCredits = credits.filter((cr) => cr.customerId === c.id && cr.status === "active");
            const dueNIO = custCredits
              .filter((cr) => cr.currency === "NIO")
              .reduce((sum, cr) => sum + cr.balanceDue, 0);
            const dueUSD = custCredits
              .filter((cr) => cr.currency === "USD")
              .reduce((sum, cr) => sum + cr.balanceDue, 0);

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{c.fullName}</h3>
                    {custCredits.length > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {custCredits.length} crédito(s)
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.phone}</span>
                    </div>
                    {c.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Saldos del cliente desglosados */}
                <div className="bg-slate-50 p-3 rounded-xl space-y-1 border border-slate-100 text-xs">
                  <div className="flex justify-between items-center text-slate-500 font-medium">
                    <span>Saldo en Córdobas:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(dueNIO, "NIO")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 font-medium">
                    <span>Saldo en Dólares:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatCurrency(dueUSD, "USD")}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <a
                    href={`https://wa.me/505${c.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-xs text-center hover:bg-emerald-100 transition-colors"
                  >
                    WhatsApp
                  </a>
                  <Link
                    href={`/ventas/nueva?customerId=${c.id}`}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 text-white font-semibold text-xs text-center hover:bg-blue-500 transition-colors"
                  >
                    Nueva Venta
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nuevo Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Registrar Nuevo Cliente</h2>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  placeholder="Ej: Juan Carlos López Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Móvil (WhatsApp) *</label>
                <input
                  type="tel"
                  placeholder="Ej: 8888-1234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección / Ubicación</label>
                <input
                  type="text"
                  placeholder="Ej: Reparto Schick, del tanque 2c al sur"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notas del Acuerdo / Referencias</label>
                <textarea
                  placeholder="Ej: Trabaja en la alcaldía, paga los 15 de cada mes."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  {saving ? "Registrando..." : "Guardar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
