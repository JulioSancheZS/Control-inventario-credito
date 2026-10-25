"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  CreditCard, 
  Users, 
  Package, 
  Receipt, 
  BarChart3, 
  PlusCircle, 
  HandCoins,
  Store
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Ventas", href: "/ventas", icon: ShoppingCart },
  { name: "Créditos", href: "/creditos", icon: CreditCard },
  { name: "Cobros y Pagos", href: "/pagos", icon: Receipt },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Inventario", href: "/inventario", icon: Package },
  { name: "Reportes", href: "/reportes", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-900 border-r border-slate-800 z-30">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight block">CrediVentas</span>
          <span className="text-xs text-blue-400 font-medium tracking-wide">Nicaragua • Demo</span>
        </div>
      </div>

      {/* Acciones Rápidas Destacadas */}
      <div className="p-4 space-y-2 border-b border-slate-800/80">
        <Link
          href="/ventas/nueva"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-sm shadow-blue-600/30 active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nueva Venta</span>
        </Link>
        <Link
          href="/pagos/nuevo"
          className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium text-sm transition-all border border-slate-700/60"
        >
          <HandCoins className="w-4 h-4" />
          <span>Registrar Abono</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                isActive
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30 text-xs text-slate-400 space-y-1">
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <span>Modo Demo</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <p className="text-[11px] text-slate-500">Reglas simuladas de Stored Procedures Supabase</p>
      </div>
    </aside>
  );
}
