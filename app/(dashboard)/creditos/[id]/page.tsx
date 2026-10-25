"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  HandCoins, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Phone,
  Receipt,
  Share2
} from "lucide-react";
import { DataService } from "@/lib/data-service";
import { Credit, Payment, AmortizationInstallment, Currency } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ComprobanteModal } from "@/components/shared/ComprobanteModal";

function DetalleCreditoContent({ creditId }: { creditId: string }) {
  const [credit, setCredit] = useState<Credit | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal para abonar
  const [showPayModal, setShowPayModal] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("cash");
  const [notes, setNotes] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Modal de Comprobante / Recibo tras abonar
  const [comprobanteData, setComprobanteData] = useState<any>(null);

  async function loadData() {
    const [c, allPayments] = await Promise.all([
      DataService.getCreditById(creditId),
      DataService.getPayments(),
    ]);
    setCredit(c);
    setPayments(allPayments.filter((p) => p.creditId === creditId));
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [creditId]);

  async function handleAbonar(e: React.FormEvent) {
    e.preventDefault();
    if (!credit) return;
    setPayError(null);
    setPaying(true);

    try {
      const res = await DataService.registrarAbono({
        creditId: credit.id,
        amount: Number(amount),
        currency: credit.currency,
        paymentMethod,
        notes,
      });

      // Obtener nuevo saldo
      const updatedCredit = await DataService.getCreditById(credit.id);

      // Abrir comprobante
      setComprobanteData({
        paymentNumber: res.paymentId.replace("pay-", "REC-"),
        customerName: credit.customerName || "Cliente",
        customerPhone: credit.customerPhone,
        amount: Number(amount),
        currency: credit.currency,
        paidAt: new Date().toISOString(),
        paymentMethod,
        concept: notes || `Abono a crédito ${credit.creditNumber}`,
        creditNumber: credit.creditNumber,
        balanceRemaining: updatedCredit?.balanceDue,
        isPaidOff: res.isPaidOff,
      });

      setShowPayModal(false);
      setAmount("");
      setNotes("");
      await loadData();
    } catch (err: any) {
      setPayError(err.message || "Error al registrar el abono.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Cargando crédito...</div>;
  }

  if (!credit) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-slate-600">No se encontró el crédito solicitado.</p>
        <Link href="/creditos" className="text-sm font-semibold text-blue-600 hover:underline">
          Volver a créditos
        </Link>
      </div>
    );
  }

  const isPaidOff = credit.status === "paid_off";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Barra Superior */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/creditos"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs font-mono font-bold text-blue-600 uppercase">
              {credit.creditNumber}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {credit.customerName}
            </h1>
          </div>
        </div>

        {!isPaidOff && (
          <button
            onClick={() => {
              // Preseleccionar la cuota más próxima
              const nextDue = credit.nextDueInstallment;
              if (nextDue) {
                setAmount(String(nextDue.expectedAmount - nextDue.paidAmount));
              }
              setShowPayModal(true);
            }}
            className="flex items-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
          >
            <HandCoins className="w-4 h-4" />
            <span>Registrar Abono</span>
          </button>
        )}
      </div>

      {/* Tarjeta de Resumen Financiero del Acuerdo */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs text-slate-500 block">Acuerdo Verbal Pactado</span>
            <span className="text-sm font-semibold text-slate-800">
              {credit.installmentsCount} cuotas ({credit.frequency === "monthly" ? "Mensual" : "Quincenal"})
            </span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isPaidOff ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
            }`}
          >
            {isPaidOff ? "Totalmente Saldado" : "Activo en Curso"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-slate-500 block">Total Original Venta</span>
            <span className="text-base font-bold font-mono text-slate-900">
              {formatCurrency(credit.totalAmount, credit.currency)}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Prima Inicial Entregada</span>
            <span className="text-base font-bold font-mono text-emerald-600">
              {formatCurrency(credit.downPayment, credit.currency)}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Total Financiado</span>
            <span className="text-base font-bold font-mono text-slate-900">
              {formatCurrency(credit.financedAmount, credit.currency)}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Saldo Pendiente Restante</span>
            <span className="text-lg font-bold font-mono text-blue-700">
              {formatCurrency(credit.balanceDue, credit.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* TABLA DE AMORTIZACIÓN PACTADA (Cuota por Cuota) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Tabla de Amortización de Cuotas</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Calculada automáticamente con Stored Procedure
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">Cuota</th>
                <th className="py-3 px-3">Fecha Vencimiento</th>
                <th className="py-3 px-3">Monto Cuota</th>
                <th className="py-3 px-3">Abonado</th>
                <th className="py-3 px-3">Saldo Cuota</th>
                <th className="py-3 px-3 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {credit.schedule?.map((inst) => {
                const isPaid = inst.status === "paid";
                const isPartial = inst.status === "partial";
                const remainingInst = Math.round((inst.expectedAmount - inst.paidAmount) * 100) / 100;
                const isOverdue = !isPaid && new Date(inst.dueDate) < new Date();

                return (
                  <tr key={inst.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      Cuota #{inst.installmentNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className={isOverdue ? "text-red-600 font-bold" : ""}>
                        {formatDate(inst.dueDate)} {isOverdue && "(Vencida)"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                      {formatCurrency(inst.expectedAmount, credit.currency)}
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-700 font-medium">
                      {formatCurrency(inst.paidAmount, credit.currency)}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {formatCurrency(remainingInst, credit.currency)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          isPaid
                            ? "bg-emerald-100 text-emerald-800"
                            : isPartial
                            ? "bg-blue-100 text-blue-800"
                            : isOverdue
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isPaid
                          ? "Pagada"
                          : isPartial
                          ? "Abono Parcial"
                          : isOverdue
                          ? "Vencida"
                          : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* HISTORIAL DE RECIBOS Y ABONOS DEL CRÉDITO */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">Recibos de Abonos Realizados</h2>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            No se han registrado abonos para este crédito todavía.
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50 text-sm"
              >
                <div>
                  <span className="font-mono font-bold text-xs text-slate-900 block">
                    {p.paymentNumber}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDate(p.paidAt)} • {p.paymentMethod === "cash" ? "Efectivo" : "Transferencia"}
                  </span>
                  {p.notes && <p className="text-xs text-slate-400 mt-0.5">{p.notes}</p>}
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-700 text-base">
                    +{formatCurrency(p.amount, p.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL PARA REGISTRAR ABONO RÁPIDO */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Registrar Abono</h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                {credit.currency}
              </span>
            </div>

            {payError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            <form onSubmit={handleAbonar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monto a Abonar ({credit.currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={credit.balanceDue}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                  autoFocus
                />

                {/* Atajos de Monto Rápido para Facilitar la Vida al Dueño */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {credit.nextDueInstallment && (
                    <button
                      type="button"
                      onClick={() =>
                        setAmount(
                          String(
                            credit.nextDueInstallment!.expectedAmount -
                              credit.nextDueInstallment!.paidAmount
                          )
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold"
                    >
                      Cuota Actual (
                      {formatCurrency(
                        credit.nextDueInstallment.expectedAmount -
                          credit.nextDueInstallment.paidAmount,
                        credit.currency
                      )}
                      )
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAmount(String(credit.balanceDue))}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold"
                  >
                    Liquidar Todo ({formatCurrency(credit.balanceDue, credit.currency)})
                  </button>
                </div>

                {/* Explicación en tiempo real de qué pasa con el abono */}
                {Number(amount) > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <span className="font-semibold text-slate-700 block">¿Cómo se aplicará este dinero?</span>
                    {Number(amount) < (credit.nextDueInstallment ? credit.nextDueInstallment.expectedAmount - credit.nextDueInstallment.paidAmount : 0) ? (
                      <p className="text-amber-800">
                        ⚠️ <strong>Abono menor a la cuota:</strong> Cubrirá {formatCurrency(Number(amount), credit.currency)} de la cuota actual, dejando un saldo pendiente de {formatCurrency((credit.nextDueInstallment!.expectedAmount - credit.nextDueInstallment!.paidAmount) - Number(amount), credit.currency)}.
                      </p>
                    ) : Number(amount) > (credit.nextDueInstallment ? credit.nextDueInstallment.expectedAmount - credit.nextDueInstallment.paidAmount : 0) ? (
                      <p className="text-emerald-800">
                        ✨ <strong>Abono mayor a la cuota (en cascada):</strong> Liquidará la cuota actual y el sobrante se aplicará automáticamente a las siguientes cuotas pactadas.
                      </p>
                    ) : (
                      <p className="text-blue-800">
                        ✅ <strong>Pago exacto:</strong> Liquidará la cuota actual en su totalidad.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Forma de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      paymentMethod === "cash"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Efectivo en Caja
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("transfer")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      paymentMethod === "transfer"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Transferencia
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notas / Referencia (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Pago quincena marzo"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all disabled:opacity-50"
                >
                  {paying ? "Procesando..." : "Confirmar Abono"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprobante / Recibo para enviar por WhatsApp */}
      <ComprobanteModal
        isOpen={!!comprobanteData}
        onClose={() => setComprobanteData(null)}
        paymentData={comprobanteData}
      />
    </div>
  );
}

export default function DetalleCreditoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-400">Cargando crédito...</div>}>
      <DetalleCreditoContent creditId={resolvedParams.id} />
    </Suspense>
  );
}
