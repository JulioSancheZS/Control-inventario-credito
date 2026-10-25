"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShoppingCart, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Trash2,
  DollarSign
} from "lucide-react";
import { DataService } from "@/lib/data-service";
import { Product, Customer, Currency, PaymentFrequency, PaymentMethod } from "@/types";
import { formatCurrency } from "@/lib/utils";

function NuevaVentaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProductId = searchParams.get("productId");
  const preselectedCustomerId = searchParams.get("customerId");

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado del Formulario
  const [saleType, setSaleType] = useState<"credit" | "cash">("credit");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preselectedCustomerId || "");
  const [selectedProductId, setSelectedProductId] = useState<string>(preselectedProductId || "");
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  // Parámetros de Crédito
  const [downPayment, setDownPayment] = useState<number>(0);
  const [installmentsCount, setInstallmentsCount] = useState<number>(6);
  const [frequency, setFrequency] = useState<PaymentFrequency>("monthly");
  const [firstPaymentDate, setFirstPaymentDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estado de Búsqueda Rápida de Productos
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [unitDetail, setUnitDetail] = useState(""); // Ej: "Azul, IMEI final 4821"

  useEffect(() => {
    async function load() {
      const [pList, cList] = await Promise.all([
        DataService.getProducts(),
        DataService.getCustomers(),
      ]);
      setProducts(pList.filter((p) => p.stock > 0));
      setCustomers(cList);

      if (preselectedProductId) {
        const prod = pList.find((p) => p.id === preselectedProductId);
        if (prod) {
          setSelectedProductId(prod.id);
          setCurrency(prod.saleCurrency);
          setUnitPrice(saleType === "credit" ? prod.creditPrice : prod.cashPrice);
          setProductSearch(prod.name);
        }
      } else {
        // No preseleccionar ningún producto por defecto para que el usuario elija conscientemente
        setSelectedProductId("");
        setProductSearch("");
        setUnitPrice(0);
      }

      if (preselectedCustomerId) {
        setSelectedCustomerId(preselectedCustomerId);
      } else if (cList.length > 0) {
        setSelectedCustomerId(cList[0].id);
      }

      setLoading(false);
    }
    load();
  }, [preselectedProductId, preselectedCustomerId]);

  // Actualizar precio cuando cambia producto o tipo de venta
  function handleProductChange(prodId: string) {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setCurrency(prod.saleCurrency);
      setUnitPrice(saleType === "credit" ? prod.creditPrice : prod.cashPrice);
    }
  }

  function handleSaleTypeChange(type: "credit" | "cash") {
    setSaleType(type);
    const prod = products.find((p) => p.id === selectedProductId);
    if (prod) {
      setUnitPrice(type === "credit" ? prod.creditPrice : prod.cashPrice);
    }
  }

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const totalSaleAmount = Math.round(quantity * unitPrice * 100) / 100;
  const financedAmount = Math.max(0, Math.round((totalSaleAmount - (downPayment || 0)) * 100) / 100);
  const estimatedInstallment = installmentsCount > 0 ? Math.round((financedAmount / installmentsCount) * 100) / 100 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedProductId) {
      setErrorMsg("Debe seleccionar un producto del inventario.");
      return;
    }

    if (saleType === "credit" && !selectedCustomerId) {
      setErrorMsg("Debe seleccionar o registrar un cliente para ventas al crédito.");
      return;
    }

    if (quantity <= 0) {
      setErrorMsg("La cantidad debe ser mayor a 0.");
      return;
    }

    if (selectedProduct && quantity > selectedProduct.stock) {
      setErrorMsg(`Solo hay ${selectedProduct.stock} unidad(es) disponible(s) en inventario.`);
      return;
    }

    setSubmitting(true);

    try {
      if (saleType === "cash") {
        // Ejecución de SP Contado
        await DataService.realizarVentaContado({
          customerId: selectedCustomerId || undefined,
          currency,
          paymentMethod,
          notes,
          items: [{ productId: selectedProductId, quantity, unitPrice }],
        });
        router.push("/ventas");
      } else {
        // Ejecución de SP Crédito + Amortización
        const res = await DataService.realizarVentaCredito({
          customerId: selectedCustomerId,
          currency,
          downPayment: Number(downPayment) || 0,
          installmentsCount: Number(installmentsCount),
          frequency,
          firstPaymentDate,
          paymentMethod,
          notes,
          items: [{ productId: selectedProductId, quantity, unitPrice }],
        });
        router.push(`/creditos/${res.creditId}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar la venta.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Cargando asistente de venta...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/ventas"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nueva Venta</h1>
          <p className="text-xs text-slate-500">Selecciona producto, cliente y modalidad de cobro</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PASO 1: Modalidad (Contado vs Crédito) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            1. Tipo de Venta
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSaleTypeChange("credit")}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm border transition-all ${
                saleType === "credit"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Venta al Crédito</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaleTypeChange("cash")}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm border transition-all ${
                saleType === "cash"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Venta al Contado</span>
            </button>
          </div>
        </div>

        {/* PASO 2: Selección de Producto con Buscador Rápido */}
        <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-800">
              2. Seleccionar Producto del Inventario
            </label>
            <span className="text-xs font-semibold text-slate-500">
              {products.length} productos con stock
            </span>
          </div>

          {/* Buscador predictivo en vivo */}
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Escribe para buscar (ej: Samsung, PS5, Mabe)..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                className="w-full px-4 py-3 rounded-xl border-2 border-blue-500 text-base font-bold text-slate-900 bg-white shadow-xs focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Lista desplegable filtrada */}
            {showProductDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white rounded-2xl border-2 border-slate-300 shadow-xl z-30 divide-y divide-slate-100">
                {products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    No se encontraron productos con ese nombre.
                  </div>
                ) : (
                  products
                    .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          handleProductChange(p.id);
                          setProductSearch(p.name);
                          setShowProductDropdown(false);
                        }}
                        className="w-full text-left p-3.5 hover:bg-blue-50 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">{p.name}</span>
                          <span className="text-xs text-slate-500">
                            {p.categoryName || "General"} • {p.stock} disponibles
                          </span>
                        </div>
                        <span className="font-mono font-bold text-sm text-blue-700">
                          {formatCurrency(saleType === "credit" ? p.creditPrice : p.cashPrice, p.saleCurrency)}
                        </span>
                      </button>
                    ))
                )}
              </div>
            )}
          </div>

          {!selectedProductId && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold flex items-center gap-2">
              <span>👉 Escribe el nombre del producto arriba para seleccionarlo.</span>
            </div>
          )}

          {/* Campo para Diferenciar Unidades (IMEI, Color, Serie) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detalle / Color / IMEI / Serie de esta unidad (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Color Azul, IMEI termina en 4821, o Caja Sellada"
              value={unitDetail}
              onChange={(e) => setUnitDetail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 text-sm font-semibold text-slate-900 bg-white"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Sirve para identificar exactamente cuál de los 20 teléfonos se llevó el cliente.
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cantidad</label>
              <input
                type="number"
                min="1"
                max={selectedProduct?.stock || 99}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Precio Unitario</label>
              <input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 text-base font-mono font-bold text-slate-900 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Moneda</label>
              <div className="py-2.5 px-3 rounded-xl bg-slate-100 border-2 border-slate-200 text-base font-bold text-slate-800 text-center">
                {currency === "USD" ? "$ Dólar" : "C$ Córdobas"}
              </div>
            </div>
          </div>
        </div>

        {/* PASO 3: Selección de Cliente */}
        <div className="bg-white rounded-2xl border border-slate-300 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-800">
              3. Seleccionar Cliente
            </label>
            <Link
              href="/clientes"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Cliente</span>
            </Link>
          </div>

          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-base font-semibold text-slate-900 bg-white focus:border-blue-600 focus:ring-0 shadow-xs"
            required={saleType === "credit"}
          >
            {saleType === "cash" && <option value="">Cliente General (Venta de Mostrador)</option>}
            {customers.map((c) => (
              <option key={c.id} value={c.id} className="text-slate-900 py-2">
                {c.fullName} — Tel: {c.phone}
              </option>
            ))}
          </select>
        </div>

        {/* PASO 4: Condiciones de Crédito (Amortización) si aplica */}
        {saleType === "credit" && (
          <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-xs space-y-4 bg-blue-50/20">
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-700">
              4. Acuerdo de Crédito y Amortización
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Prima Inicial ({currency}) (Opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalSaleAmount - 1}
                  placeholder="0.00"
                  value={downPayment || ""}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 text-base font-mono font-bold text-slate-900 bg-white"
                />
                <span className="text-[11px] text-slate-600 mt-1 block">
                  Se cobra hoy en efectivo y baja el saldo adeudado.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Plazo / Número de Cuotas
                </label>
                <select
                  value={installmentsCount}
                  onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 text-base font-semibold text-slate-900 bg-white"
                >
                  <option value={2}>2 cuotas</option>
                  <option value={3}>3 cuotas (3 meses)</option>
                  <option value={4}>4 cuotas</option>
                  <option value={6}>6 cuotas (6 meses)</option>
                  <option value={8}>8 cuotas</option>
                  <option value={10}>10 cuotas</option>
                  <option value={12}>12 cuotas (1 año)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Frecuencia de Pago
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 text-base font-semibold text-slate-900 bg-white"
                >
                  <option value="monthly">Mensual (1 vez al mes)</option>
                  <option value="biweekly">Quincenal (Cada 15 días)</option>
                  <option value="weekly">Semanal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Fecha del Primer Pago
                </label>
                <input
                  type="date"
                  value={firstPaymentDate}
                  onChange={(e) => setFirstPaymentDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 text-base font-semibold text-slate-900 bg-white"
                  required
                />
              </div>
            </div>

            {/* Resumen Amortización */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between font-medium text-slate-600">
                <span>Total de la Venta:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(totalSaleAmount, currency)}</span>
              </div>
              <div className="flex justify-between font-medium text-slate-600">
                <span>Prima entregada:</span>
                <span className="font-mono font-bold text-emerald-600">-{formatCurrency(downPayment || 0, currency)}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-100 pt-2">
                <span>Total a Financiar en Cuotas:</span>
                <span className="font-mono font-bold text-blue-700">{formatCurrency(financedAmount, currency)}</span>
              </div>
              <div className="flex justify-between items-center bg-blue-50/70 p-2.5 rounded-lg text-blue-900 font-semibold mt-2">
                <span>Cuota estimada ({installmentsCount} cuotas):</span>
                <span className="font-mono text-sm font-bold">{formatCurrency(estimatedInstallment, currency)} / cuota</span>
              </div>
            </div>
          </div>
        )}

        {/* Método de pago de contado o de la prima */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            {saleType === "cash" ? "Forma de Cobro" : "Forma de Pago de la Prima"}
          </label>
          <div className="grid grid-cols-2 gap-3">
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
              Transferencia Bancaria
            </button>
          </div>
        </div>

        {/* Botón de Confirmación Principal */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-lg shadow-blue-600/30 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>
              {submitting
                ? "Procesando Venta y Stock..."
                : `Confirmar Venta (${formatCurrency(totalSaleAmount, currency)})`}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NuevaVentaPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-400">Cargando venta...</div>}>
      <NuevaVentaContent />
    </Suspense>
  );
}
