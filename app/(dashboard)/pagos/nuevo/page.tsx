"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, HandCoins, CheckCircle2, AlertCircle } from "lucide-react";
import { DataService } from "@/lib/data-service";
import { Credit, Currency, PaymentMethod } from "@/types";
import { formatCurrency } from "@/lib/utils";

function NuevoPagoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCreditId = searchParams.get("creditId");

  const [credits, setCredits] = useState<Credit[]>([]);
  const [selectedCreditId, setSelectedCreditId] = useState(preselectedCreditId || "");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const cr = await DataService.getCredits();
      const active = cr.filter((c) => c.status === "active");
      setCredits(active);

      if (preselectedCreditId) {
        setSelectedCreditId(preselectedCreditId);
        const cred = active.find((c) => c.id === preselectedCreditId);
        if (cred?.nextDueInstallment) {
          setAmount(String(cred.nextDueInstallment.expectedAmount - cred.nextDueInstallment.paidAmount));
        }
      } else if (active.length > 0) {
        setSelectedCreditId(active[0].id);
        if (active[0].nextDueInstallment) {
          setAmount(String(active[0].nextDueInstallment.expectedAmount - active[0].nextDueInstallment.paidAmount));
        }
      }
      setLoading(false);
    }
    load();
  }, [preselectedCreditId]);

  const selectedCredit = credits.find((c) => c.id === selectedCreditId);

  function handleCreditChange(id: string) {
    setSelectedCreditId(id);
    const cred = credits.find((c) => c.id === id);
    if (cred?.nextDueInstallment) {
      setAmount(String(cred.nextDueInstallment.expectedAmount - cred.nextDueInstallment.paidAmount));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCredit) return;
    setErrorMsg(null);
    setSaving(true);

    try {
      await DataService.registrarAbono({
        creditId: selectedCredit.id,
        amount: Number(amount),
        currency: selectedCredit.currency,
        paymentMethod,
        notes,
      });
      router.push(`/creditos/${selectedCredit.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al registrar el cobro.");
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Cargando créditos activos...</div>;
  }

  if (credits.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">¡Al día!</h2>
        <p className="text-sm text-slate-600">No hay créditos activos con saldo pendiente por cobrar.</p>
        <Link href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">
          Ir al Inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/pagos"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Registrar Cobro / Abono</h1>
          <p className="text-xs text-slate-500">Aplica abonos en cascada a las cuotas del cliente</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Seleccionar Crédito / Cliente *
          </label>
          <select
            value={selectedCreditId}
            onChange={(e) => handleCreditChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white focus:ring-2 focus:ring-blue-500"
          >
            {credits.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customerName} — Saldo: {formatCurrency(c.balanceDue, c.currency)} ({c.creditNumber})
              </option>
            ))}
          </select>
        </div>

        {selectedCredit && (
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Moneda del Crédito:</span>
              <span className="font-bold text-slate-900">{selectedCredit.currency}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Saldo Pendiente Total:</span>
              <span className="font-mono font-bold text-blue-700 text-sm">
                {formatCurrency(selectedCredit.balanceDue, selectedCredit.currency)}
              </span>
            </div>
            {selectedCredit.nextDueInstallment && (
              <div className="flex justify-between text-slate-600 border-t border-blue-200/50 pt-1 mt-1">
                <span>Cuota Sugerida (#{selectedCredit.nextDueInstallment.installmentNumber}):</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrency(
                    selectedCredit.nextDueInstallment.expectedAmount - selectedCredit.nextDueInstallment.paidAmount,
                    selectedCredit.currency
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Monto a Cobrar ({selectedCredit?.currency}) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={selectedCredit?.balanceDue}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Método de Pago
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-colors ${
                paymentMethod === "cash"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              Efectivo en Mano
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("transfer")}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-colors ${
                paymentMethod === "transfer"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              Transferencia LAFISE / BAC / Banpro
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Notas / Referencia
          </label>
          <input
            type="text"
            placeholder="Ej: Depósito en sucursal o pago en tienda"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !selectedCredit}
          className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{saving ? "Registrando Abono..." : "Emitir Recibo y Aplicar Abono"}</span>
        </button>
      </form>
    </div>
  );
}

export default function NuevoPagoPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-400">Cargando formulario...</div>}>
      <NuevoPagoContent />
    </Suspense>
  );
}
