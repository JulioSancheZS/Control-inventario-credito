"use client";

import Link from "next/link";
import { Store, Package, BarChart3, Plus } from "lucide-react";

export function MobileHeader() {
  return (
    <header className="lg:hidden sticky top-0 inset-x-0 h-14 bg-slate-900 border-b border-slate-800 z-30 flex items-center justify-between px-4">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          <Store className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-white text-sm tracking-tight block">CrediVentas</span>
          <span className="text-[10px] text-blue-400 font-medium -mt-1 block">Nicaragua</span>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/inventario"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          title="Inventario"
        >
          <Package className="w-5 h-5" />
        </Link>
        <Link
          href="/reportes"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          title="Reportes"
        >
          <BarChart3 className="w-5 h-5" />
        </Link>
        <Link
          href="/pagos/nuevo"
          className="flex items-center gap-1 py-1.5 px-3 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Abono</span>
        </Link>
      </div>
    </header>
  );
}
