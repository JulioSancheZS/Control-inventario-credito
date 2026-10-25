"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  CreditCard, 
  Users, 
  Plus, 
  Receipt
} from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  const links = [
    { name: "Inicio", href: "/", icon: LayoutDashboard },
    { name: "Ventas", href: "/ventas", icon: ShoppingCart },
    { name: "Créditos", href: "/creditos", icon: CreditCard },
    { name: "Abonos", href: "/pagos", icon: Receipt },
    { name: "Clientes", href: "/clientes", icon: Users },
  ];

  return (
    <>
      {/* Botón Flotante Central para Venta Rápida (Ergonomía de Pulgar Móvil) */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <Link
          href="/ventas/nueva"
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold shadow-xl shadow-blue-600/40 active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">Venta</span>
        </Link>
      </div>

      {/* Barra Inferior Fija para Móvil */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-slate-900 border-t border-slate-800 z-30 flex items-center justify-around px-2">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center justify-center w-14 h-full py-1 gap-1 transition-colors ${
                isActive ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
