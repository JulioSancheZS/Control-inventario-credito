"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download, RefreshCw, Layers } from "lucide-react";
import { DataService } from "@/lib/data-service";
import { DashboardMetrics, Sale, Payment, Credit } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ReportesPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const [m, s, p, c] = await Promise.all([
      DataService.getDashboardMetrics(),
      DataService.getSales(),
      DataService.getPayments(),
      DataService.getCredits(),
    ]);
    setMetrics(m);
    setSales(s);
    setPayments(p);
    setCredits(c);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function exportSalesCSV() {
    const headers = ["Numero_Venta", "Fecha", "Cliente", "Tipo", "Moneda", "Total"];
    const rows = sales.map((s) => [
      s.saleNumber,
      s.createdAt.slice(0, 10),
      `"${s.customerName || "General"}"`,
      s.saleType,
      s.currency,
      s.totalAmount,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_ventas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleResetDemo() {
    if (confirm("¿Estás seguro de reiniciar los datos a la demostración inicial?")) {
      DataService.resetToInitialDemo();
      window.location.reload();
    }
  }

  if (loading || !metrics) {
    return <div className="text-center py-12 text-slate-400">Generando reportes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reportes Financieros</h1>
          <p className="text-sm text-slate-500">Separación estricta de totales por moneda (Córdobas y Dólares)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportSalesCSV}
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Ventas CSV</span>
          </button>
          <button
            onClick={handleResetDemo}
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-red-50 text-red-700 border border-red-200 font-semibold text-sm rounded-xl hover:bg-red-100"
            title="Reiniciar a la semilla demo"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Reporte Consolidado por Moneda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card Dólares */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              Operaciones en Dólares ($ USD)
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              USD
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-600">Total Cobrado Hoy:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(metrics.collectedToday.usd, "USD")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-600">Total Cobrado en el Mes:</span>
              <span className="font-mono font-bold text-emerald-700">
                {formatCurrency(metrics.collectedMonth.usd, "USD")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-600">Ventas Totales en el Mes:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(metrics.salesMonth.usd, "USD")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 bg-emerald-50/50 p-3 rounded-xl">
              <span className="font-semibold text-emerald-900">Cartera Activa por Cobrar:</span>
              <span className="font-mono font-bold text-lg text-emerald-700">
                {formatCurrency(metrics.totalReceivable.usd, "USD")}
              </span>
            </div>
          </div>
        </div>

        {/* Card Córdobas */}
        <div className="bg-white rounded-2xl border border-blue-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              Operaciones en Córdobas (C$ NIO)
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              NIO
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-600">Total Cobrado Hoy:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(metrics.collectedToday.nio, "NIO")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-600">Total Cobrado en el Mes:</span>
              <span className="font-mono font-bold text-blue-700">
                {formatCurrency(metrics.collectedMonth.nio, "NIO")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-600">Ventas Totales en el Mes:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(metrics.salesMonth.nio, "NIO")}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 bg-blue-50/50 p-3 rounded-xl">
              <span className="font-semibold text-blue-900">Cartera Activa por Cobrar:</span>
              <span className="font-mono font-bold text-lg text-blue-700">
                {formatCurrency(metrics.totalReceivable.nio, "NIO")}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
