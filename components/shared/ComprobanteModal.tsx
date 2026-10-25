"use client";

import { CheckCircle2, Share2, Printer, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Currency } from "@/types";

interface ComprobanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: {
    paymentNumber: string;
    customerName: string;
    customerPhone?: string;
    amount: number;
    currency: Currency;
    paidAt: string;
    paymentMethod: string;
    concept: string;
    creditNumber?: string;
    balanceRemaining?: number;
    isPaidOff?: boolean;
  } | null;
}

export function ComprobanteModal({ isOpen, onClose, paymentData }: ComprobanteModalProps) {
  if (!isOpen || !paymentData) return null;

  // Generar texto para compartir por WhatsApp
  const shareText = `*COMPROBANTE DE PAGO* 🧾\n` +
    `*Recibo:* ${paymentData.paymentNumber}\n` +
    `*Fecha:* ${formatDate(paymentData.paidAt)}\n` +
    `*Cliente:* ${paymentData.customerName}\n` +
    `*Monto Recibido:* ${formatCurrency(paymentData.amount, paymentData.currency)}\n` +
    `*Forma de Pago:* ${paymentData.paymentMethod === "cash" ? "Efectivo" : "Transferencia"}\n` +
    `*Concepto:* ${paymentData.concept}\n` +
    (paymentData.creditNumber ? `*Crédito:* ${paymentData.creditNumber}\n` : "") +
    (paymentData.balanceRemaining !== undefined
      ? `*Saldo Restante:* ${formatCurrency(paymentData.balanceRemaining, paymentData.currency)}\n`
      : "") +
    (paymentData.isPaidOff ? `🎉 *ESTADO: CRÉDITO SALDADO EN SU TOTALIDAD*\n` : "") +
    `\n_¡Muchas gracias por su pago puntual!_`;

  const whatsappUrl = paymentData.customerPhone
    ? `https://wa.me/505${paymentData.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(shareText)}`
    : `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera Éxito */}
        <div className="text-center space-y-1">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">¡Abono Registrado!</h2>
          <p className="text-xs text-slate-500">Recibo generado exitosamente</p>
        </div>

        {/* Tarjeta de Recibo Estilo Ticket */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 font-sans text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-mono">
            <span className="text-slate-500 font-semibold">RECIBO Nº</span>
            <span className="font-bold text-slate-900">{paymentData.paymentNumber}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Cliente:</span>
              <span className="font-semibold text-slate-900 text-right">{paymentData.customerName}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Fecha y Hora:</span>
              <span className="font-medium">{formatDate(paymentData.paidAt)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Método:</span>
              <span className="font-medium uppercase">
                {paymentData.paymentMethod === "cash" ? "Efectivo" : "Transferencia"}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700">Monto Cobrado:</span>
            <span className="text-lg font-mono font-black text-emerald-700">
              {formatCurrency(paymentData.amount, paymentData.currency)}
            </span>
          </div>

          {paymentData.balanceRemaining !== undefined && (
            <div className="flex justify-between items-center pt-1 text-[11px] text-slate-500">
              <span>Nuevo Saldo Pendiente:</span>
              <span className="font-mono font-bold text-blue-700">
                {formatCurrency(paymentData.balanceRemaining, paymentData.currency)}
              </span>
            </div>
          )}

          {paymentData.isPaidOff && (
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-center text-xs">
              🎉 ¡CRÉDITO TOTALMENTE SALDADO!
            </div>
          )}
        </div>

        {/* Acciones: Compartir por WhatsApp o Cerrar */}
        <div className="space-y-2 pt-1">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Enviar Recibo por WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            Listo, volver
          </button>
        </div>

      </div>
    </div>
  );
}
