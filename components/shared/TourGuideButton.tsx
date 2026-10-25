"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";

export function TourGuideButton() {
  function startTour() {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      nextBtnText: "Siguiente →",
      prevBtnText: "← Anterior",
      doneBtnText: "¡Entendido!",
      steps: [
        {
          element: "#tour-resumen-dinero",
          popover: {
            title: "💵 Dinero y Cartera",
            description:
              "Aquí ve cuánto ha cobrado hoy y cuánto le deben en total. Los córdobas (C$) y los dólares ($) están separados para que no haya confusiones de caja.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#tour-boton-venta",
          popover: {
            title: "🛒 Botón de Nueva Venta",
            description:
              "Presione aquí para hacer una venta. Puede vender de contado o al crédito acordando la cantidad de cuotas y si el cliente le da una prima.",
            side: "bottom",
            align: "end",
          },
        },
        {
          element: "#tour-boton-abono",
          popover: {
            title: "🤝 Registrar un Abono",
            description:
              "Cuando venga un cliente a pagar, toque aquí. Escriba el monto que le entregó y el sistema le dará un recibo listo para enviárselo por WhatsApp.",
            side: "bottom",
            align: "end",
          },
        },
        {
          element: "#tour-proximos-cobros",
          popover: {
            title: "📅 Próximos Cobros y WhatsApp",
            description:
              "Esta lista le recuerda a quién le toca pagar estos días. Con el botón verde de teléfono puede llamarlo o abrirle un mensaje de WhatsApp directo.",
            side: "top",
            align: "start",
          },
        },
        {
          element: "#tour-abonos-recientes",
          popover: {
            title: "🧾 Recibos Recientes",
            description:
              "Aquí queda guardado cada abono recibido con fecha, hora y si fue en efectivo o por transferencia bancaria.",
            side: "top",
            align: "start",
          },
        },
      ],
    });

    driverObj.drive();
  }

  // Si es la primera vez que entra en su navegador, mostrar sugerencia
  useEffect(() => {
    const hasSeen = localStorage.getItem("has_seen_crediventas_tour");
    if (!hasSeen) {
      localStorage.setItem("has_seen_crediventas_tour", "true");
      // Pequeño timeout para que la interfaz cargue
      const timer = setTimeout(() => {
        startTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <button
      onClick={startTour}
      className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300/80 text-xs font-bold transition-all shadow-xs"
      title="Ver cómo funciona el sistema paso a paso"
    >
      <HelpCircle className="w-4 h-4 text-amber-600" />
      <span>¿Cómo funciona? (Guía)</span>
    </button>
  );
}
