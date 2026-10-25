"use client";

import { useEffect, useState } from "react";
import { Download, Monitor, Smartphone, X } from "lucide-react";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 1. Registrar Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.log("SW registration failed", err);
      });
    }

    // 2. Verificar si ya está instalada o abierta como app
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    if (isStandalone) {
      return; // Ya está instalada, no mostrar nada
    }

    // Si el usuario ya cerró el aviso en esta sesión, no insistir
    const dismissed = sessionStorage.getItem("pwa_prompt_dismissed");
    if (dismissed) {
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobileDevice = /iphone|ipad|ipod|android|mobile/.test(userAgent);
    setIsMobile(isMobileDevice);

    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (isIosDevice) {
      setIsIos(true);
      setShowPrompt(true);
    }

    // 3. Evento nativo de instalación (Compatible con Chrome/Edge en PC y Android)
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowPrompt(false);
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed top-3 right-3 left-3 sm:left-auto sm:w-96 z-50 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-top-4 duration-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 text-white shadow-sm">
            {isMobile ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </div>
          <div>
            <p className="font-bold text-xs leading-snug">
              {isMobile ? "¿Instalar en su teléfono?" : "¿Instalar en su computadora?"}
            </p>
            <p className="text-[11px] text-slate-300">
              {isIos
                ? 'Toque "Compartir" y elija "Agregar a inicio"'
                : "Ábrala directo desde su escritorio sin navegador"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isIos && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-xs"
            >
              Instalar
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
