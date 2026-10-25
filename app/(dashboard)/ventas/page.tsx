"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Plus, Calendar, Tag, ArrowRight } from "lucide-react";
import { DataService } from "@/lib/data-service";
import { Sale } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function VentasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const s = await DataService.getSales();
      setSales(s);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Historial de Ventas</h1>
          <p className="text-sm text-slate-500">Registro de operaciones al contado y crédito</p>
        </div>
        <Link
          href="/ventas/nueva"
          className="inline-flex items-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Venta</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando ventas...</div>
      ) : sales.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-medium text-slate-600">No hay ventas registradas aún.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Nº Venta</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Modalidad</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                      {s.saleNumber}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatDate(s.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {s.customerName || "Cliente General"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {s.items?.[0]?.productName || "Producto"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                          s.saleType === "credit"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {s.saleType === "credit" ? "Crédito" : "Contado"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatCurrency(s.totalAmount, s.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {s.creditId ? (
                        <Link
                          href={`/creditos/${s.creditId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold py-1.5 px-2.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          <span>Ver Crédito</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">Cancelado</span>
                      )}
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
