import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { PwaInstallPrompt } from "@/components/shared/PwaInstallPrompt";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Banner de instalación PWA en teléfono */}
      <PwaInstallPrompt />

      {/* Sidebar fijo en Desktop */}
      <Suspense fallback={<aside className="hidden lg:flex lg:w-64 bg-slate-900 border-r border-slate-800" />}>
        <Sidebar />
      </Suspense>

      {/* Header en Móvil */}
      <MobileHeader />

      {/* Contenido Principal */}
      <main className="flex-1 lg:pl-64 flex flex-col pb-20 lg:pb-8">
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <Suspense fallback={<div className="text-center py-12 text-slate-400">Cargando...</div>}>
            {children}
          </Suspense>
        </div>
      </main>

      {/* Barra de Navegación Móvil Inferior */}
      <Suspense fallback={<div className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-slate-900" />}>
        <MobileNav />
      </Suspense>
    </div>
  );
}
