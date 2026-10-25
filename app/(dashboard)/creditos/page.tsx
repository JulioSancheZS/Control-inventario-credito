"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Search, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { DataService } from "@/lib/data-service";
import { Credit } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CreditosPage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "paid_off">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const cr = await DataService.getCredits();
      setCredits(cr);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = credits.filter((c) => {
    const matchesSearch =
      (c.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      c.creditNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Créditos y Acuerdos</h1>
          <p className="text-sm text-slate-500">Control de cuotas pactadas y saldos por cobrar</p>
        </div>
        <Link
          href="/ventas/nueva"
          className="inline-flex items-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
        >
          <span>+ Nuevo Crédito</span>
        </Link>
      </div>

      {/* Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por cliente o número de crédito..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              filterStatus === "all"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterStatus("active")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              filterStatus === "active"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            Activos con Saldo
          </button>
          <button
            onClick={() => setFilterStatus("paid_off")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              filterStatus === "paid_off"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            Saldados
          </button>
        </div>
      </div>

      {/* Grid de Créditos */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando créditos...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-medium text-slate-600">No se encontraron créditos con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => {
            const isPaidOff = c.status === "paid_off";
            const nextDue = c.nextDueInstallment;

            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors ${
                  isPaidOff ? "border-emerald-200/80 bg-emerald-50/10" : "border-slate-200/80"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{c.customerName}</h3>
                      <p className="text-xs text-slate-500 font-mono">
                        {c.creditNumber} • {c.installmentsCount} cuotas ({c.frequency === "monthly" ? "Mensual" : "Quincenal"})
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        isPaidOff ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {isPaidOff ? "Saldado" : "Activo"}
                    </span>
                  </div>

                  {/* Barra de progreso de amortización */}
                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Abonado: {formatCurrency(c.totalPaid, c.currency)}</span>
                      <span className="text-slate-900">Total: {formatCurrency(c.financedAmount, c.currency)}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPaidOff ? "bg-emerald-500" : "bg-blue-600"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round((c.totalPaid / c.financedAmount) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Próxima cuota y saldo deudor */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block">Saldo Pendiente:</span>
                    <span className="text-base font-bold font-mono text-slate-900">
                      {formatCurrency(c.balanceDue, c.currency)}
                    </span>
                  </div>
                  {nextDue && (
                    <div className="text-right">
                      <span className="text-slate-500 block">Próxima Cuota (#{nextDue.installmentNumber}):</span>
                      <span className="font-bold text-blue-700 font-mono">
                        {formatDate(nextDue.dueDate)} ({formatCurrency(nextDue.expectedAmount - nextDue.paidAmount, c.currency)})
                      </span>
                    </div>
                  )}
                </div>

                {/* Enlace de detalle */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Link
                    href={`/creditos/${c.id}`}
                    className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Ver Tabla de Amortización y Abonos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
