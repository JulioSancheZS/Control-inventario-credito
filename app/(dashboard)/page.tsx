"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  HandCoins, 
  CreditCard, 
  AlertTriangle, 
  Clock, 
  Package, 
  PlusCircle, 
  PhoneCall, 
  MessageSquare,
  CheckCircle2, 
  ArrowRight 
} from "lucide-react";
import { DataService } from "@/lib/data-service";
import { DashboardMetrics, Credit, Payment } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TourGuideButton } from "@/components/shared/TourGuideButton";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activeCredits, setActiveCredits] = useState<Credit[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [m, credits, payments] = await Promise.all([
          DataService.getDashboardMetrics(),
          DataService.getCredits(),
          DataService.getPayments(),
        ]);
        setMetrics(m);
        setActiveCredits(credits.filter((c) => c.status === "active"));
        setRecentPayments(payments.slice(0, 5));
      } catch (err) {
        console.error("Error al cargar dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Próximos cobros para llamar a clientes
  const upcomingToCollect = activeCredits
    .filter((c) => c.nextDueInstallment)
    .sort((a, b) => new Date(a.nextDueInstallment!.dueDate).getTime() - new Date(b.nextDueInstallment!.dueDate).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Saludo y Acciones Directas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panel Principal</h1>
            <TourGuideButton />
          </div>
          <p className="text-sm text-slate-500">Resumen financiero y compromisos del negocio</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            id="tour-boton-venta"
            href="/ventas/nueva"
            className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Venta</span>
          </Link>
          <Link
            id="tour-boton-abono"
            href="/pagos/nuevo"
            className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <HandCoins className="w-4 h-4" />
            <span>Registrar Abono</span>
          </Link>
        </div>
      </div>

      {/* TARJETAS KPI DE ALTO IMPACTO (Con desglose estricto NIO / USD) */}
      <div id="tour-resumen-dinero" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Cobrado Hoy */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cobrado Hoy</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <HandCoins className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1 mt-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-slate-500">Córdobas:</span>
              <span className="text-lg font-bold font-mono text-slate-900">
                {formatCurrency(metrics.collectedToday.nio, "NIO")}
              </span>
            </div>
            <div className="flex items-baseline justify-between border-t border-slate-100 pt-1">
              <span className="text-xs font-medium text-slate-500">Dólares:</span>
              <span className="text-lg font-bold font-mono text-emerald-700">
                {formatCurrency(metrics.collectedToday.usd, "USD")}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Cartera Total por Cobrar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cartera por Cobrar</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1 mt-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-slate-500">Córdobas:</span>
              <span className="text-lg font-bold font-mono text-slate-900">
                {formatCurrency(metrics.totalReceivable.nio, "NIO")}
              </span>
            </div>
            <div className="flex items-baseline justify-between border-t border-slate-100 pt-1">
              <span className="text-xs font-medium text-slate-500">Dólares:</span>
              <span className="text-lg font-bold font-mono text-blue-700">
                {formatCurrency(metrics.totalReceivable.usd, "USD")}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Ventas del Mes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ventas del Mes</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1 mt-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-slate-500">Córdobas:</span>
              <span className="text-lg font-bold font-mono text-slate-900">
                {formatCurrency(metrics.salesMonth.nio, "NIO")}
              </span>
            </div>
            <div className="flex items-baseline justify-between border-t border-slate-100 pt-1">
              <span className="text-xs font-medium text-slate-500">Dólares:</span>
              <span className="text-lg font-bold font-mono text-indigo-700">
                {formatCurrency(metrics.salesMonth.usd, "USD")}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Alertas de Operación (Moras y Stock) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Alertas Activas</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-2 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Cuotas vencidas:</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                metrics.overdueInstallmentsCount > 0 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
              }`}>
                {metrics.overdueInstallmentsCount}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-1">
              <span className="text-xs font-medium text-slate-600">Stock bajo (≤ 2 unids):</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                metrics.lowStockProductsCount > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
              }`}>
                {metrics.lowStockProductsCount} prod.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN PRINCIPAL: 2 Columnas (Próximos Cobros vs Últimos Pagos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Columna 1: Próximos Cobros / Gestión Rápida */}
        <div id="tour-proximos-cobros" className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Compromisos de Cobro Próximos</h2>
            </div>
            <Link href="/creditos" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold">
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {upcomingToCollect.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No hay cuotas pendientes para los próximos días.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingToCollect.map((cred) => {
                const inst = cred.nextDueInstallment!;
                const isOverdue = new Date(inst.dueDate) < new Date();
                return (
                  <div
                    key={cred.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-900 text-sm">{cred.customerName}</p>
                      <p className="text-xs text-slate-500">
                        {cred.creditNumber} • Cuota #{inst.installmentNumber}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          isOverdue ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          Vence: {formatDate(inst.dueDate)} {isOverdue && "(Vencida)"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="text-sm font-bold font-mono text-slate-900">
                        {formatCurrency(inst.expectedAmount - inst.paidAmount, cred.currency)}
                      </p>
                      <div className="flex items-center justify-end gap-1.5">
                        {cred.customerPhone && (
                          <a
                            href={`https://wa.me/505${cred.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                              isOverdue
                                ? `Hola ${cred.customerName}, le saluda CrediVentas. Le escribimos cordialmente para consultarle sobre su cuota #${inst.installmentNumber} (${formatCurrency(inst.expectedAmount - inst.paidAmount, cred.currency)}) que venció el ${formatDate(inst.dueDate)}. Por favor nos confirma cuándo podemos coordinar su abono. ¡Muchas gracias!`
                                : `Hola ${cred.customerName}, le saluda CrediVentas. Le recordamos amablemente que su cuota #${inst.installmentNumber} de ${formatCurrency(inst.expectedAmount - inst.paidAmount, cred.currency)} por su crédito ${cred.creditNumber} vence el ${formatDate(inst.dueDate)}. ¡Quedamos a su orden!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors"
                            title="Enviar recordatorio listo a su WhatsApp (Gratis)"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Avisar WhatsApp</span>
                          </a>
                        )}
                        <Link
                          href={`/creditos/${cred.id}`}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500"
                        >
                          Abonar
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna 2: Recibos y Abonos Recientes */}
        <div id="tour-abonos-recientes" className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Abonos y Cobros Recientes</h2>
            </div>
            <Link href="/pagos" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold">
              <span>Historial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No hay pagos registrados aún.
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((pay) => (
                <div
                  key={pay.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900 text-sm">{pay.customerName}</p>
                    <p className="text-xs text-slate-500">
                      Recibo: {pay.paymentNumber} • {formatDate(pay.paidAt)}
                    </p>
                    <p className="text-xs text-slate-400 truncate max-w-[200px]">
                      {pay.notes || "Abono"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-emerald-700 block">
                      +{formatCurrency(pay.amount, pay.currency)}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 uppercase">
                      {pay.paymentMethod === "cash" ? "Efectivo" : "Transferencia"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
