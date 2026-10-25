"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Receipt, Plus, Search, Calendar } from "lucide-react";
import { DataService } from "@/lib/data-service";
import { Payment } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PagosPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const p = await DataService.getPayments();
      setPayments(p);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = payments.filter((p) =>
    p.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    p.paymentNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cobros y Recibos</h1>
          <p className="text-sm text-slate-500">Historial de abonos, primas y pagos recibidos</p>
        </div>
        <Link
          href="/pagos/nuevo"
          className="inline-flex items-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Abono</span>
        </Link>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Buscar por cliente o número de recibo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-emerald-500 shadow-xs"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando recibos...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-medium text-slate-600">No se encontraron cobros registrados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Recibo</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Forma de Pago</th>
                  <th className="py-3.5 px-4">Concepto</th>
                  <th className="py-3.5 px-4 text-right">Monto Recibido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                      {p.paymentNumber}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatDate(p.paidAt)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {p.customerName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium uppercase">
                        {p.paymentMethod === "cash" ? "Efectivo" : "Transferencia"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[200px] truncate">
                      {p.notes || "Abono"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      +{formatCurrency(p.amount, p.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
