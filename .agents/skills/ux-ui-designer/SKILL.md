---
name: ui-ux-design-specialist
description: >-
  Use this skill whenever designing, reviewing, or implementing user interfaces,
  user experience flows, responsive layouts (PWA mobile-first), design systems,
  color palettes, touch targets, and ergonomic patterns for commercial web applications.
---

# UI/UX Design Specialist & PWA Ergonomics

Esta skill define los principios, estándares visuales y patrones de interacción para aplicaciones comerciales SaaS y móviles (PWA).

## 1. Filosofía de Diseño: SaaS Minimalista y Funcional

- **Superficies y Contraste**:
  - Fondo neutro principal (`#F8FAFC` o `#F9FAFB`).
  - Tarjetas y contenedores en blanco puro (`#FFFFFF`) con bordes sutiles (`border border-slate-200`) y sombras suaves (`shadow-sm`).
  - Textos de alta legibilidad: títulos oscuros (`text-slate-900`), etiquetas (`text-slate-700`), metadata secundaria (`text-slate-500`).
- **Paleta de Acentos**:
  - Color primario de acción comercial: Azul índigo sobrio (`#2563EB` o `#1D4ED8`) o Verde esmeralda financiero (`#059669` / `#047857`) para cobros y saldos a favor.
  - Alerta de morosidad / compromisos vencidos: Rojo ámbar (`#DC2626` / `#B91C1C`).
  - Compromisos próximos: Amarillo/Ámbar de advertencia (`#D97706`).
- **Iconografía**:
  - Uso estricto de Lucide React con trazo consistente (`stroke-width={1.75}` o `2`).
  - **Prohibido** usar emojis informales como sustitutos de íconos en la interfaz.

## 2. Ergonomía Móvil y PWA (Mobile-First)

El usuario principal es el dueño del negocio operando desde su teléfono celular:
1. **Zona de Pulgar (Thumb Zone)**:
   - Acciones críticas (ej. `+ Nueva Venta`, `Registrar Pago`) deben ser accesibles en la parte inferior o flotantes (`bottom-nav` o `floating action button`).
   - Botones táctiles con un tamaño mínimo de toque de **44px × 44px**.
2. **Navegación Adaptable**:
   - **Escritorio**: Sidebar lateral estática fija a la izquierda con enlaces claros e íconos.
   - **Móvil**: Barra superior limpia con logo y botón de búsqueda/filtro + Barra inferior compacta fija (`bottom-0 w-full`) con las 4-5 vistas más frecuentes.
3. **Tablas vs Tarjetas**:
   - En pantallas `>= 768px` (escritorio/tablet): Tablas tabulares densas con encabezados fijos.
   - En pantallas `< 768px` (móvil): Tarjetas apilables (*Cards*) con tipografía clara y botones de acción rápida.

## 3. Manejo Visual de Multimoneda (Nicaragua: C$ y US$)

- **Diferenciación Inmediata**:
  - Emplear badges o códigos visuales consistentes para la moneda:
    - Córdobas (NIO): Badge neutral/azul (ej. `C$ 1,250.00`).
    - Dólares (USD): Badge verde distintivo (ej. `$ 125.00`).
- **Regla Cardinal**:
  - Jamás presentar un total consolidado sumando ambas divisas sin una conversión explícita.
  - Mostrar siempre el desglose dual en tarjetas de KPI:
    ```
    ┌────────────────────────┐
    │ Ventas del Mes         │
    │ C$ 45,200.00  (NIO)    │
    │ $ 1,350.00    (USD)    │
    └────────────────────────┘
    ```

## 4. Estados de Interfaz y Retroalimentación

- **Estados Vacíos (*Empty States*)**: Explicar qué falta y ofrecer un botón de acción primario (ej. "Aún no hay clientes registrados. [+ Agregar Cliente]").
- **Indicadores de Carga**: Skeletons discretos en vez de spinners invasivos que salten en la pantalla.
- **Acciones Destructivas**: Modales de confirmación claros antes de cancelar ventas o revertir pagos.
