# Sistema de Gestión Comercial y Ventas al Crédito — Nicaragua

Demo funcional de una Progressive Web App (PWA) diseñada para el dueño de un pequeño negocio de electrodomésticos, consolas de videojuegos y tecnología en Nicaragua.

Permite gestionar ventas de contado y ventas al crédito basadas en **acuerdos verbales entre personas**, con generación automática de **tablas de amortización**, control ágil de inventario por stock físico, y separación estricta multimoneda (**C$ Córdobas** y **$ Dólares**).

---

## 1. Características Principales

- **Diseño Mobile-First (PWA)**: Optimizado para usarse con un solo pulgar desde un teléfono inteligente Android o iOS, o desde la laptop del negocio.
- **Sin burocracia de inventario**: No obliga a registrar códigos de serie complejos. Administra directamente el stock numérico disponible de consolas (ej. PS5), teléfonos y electrodomésticos.
- **Acuerdos de Crédito Flexibles**:
  - Plazos configurables (2, 3, 6, 12 cuotas).
  - Frecuencia mensual o quincenal.
  - Prima inicial opcional (que amortiza el saldo de inmediato).
  - Fecha de primer cobro personalizada.
- **Tabla de Amortización Automática**:
  - Calcula las cuotas con exactitud al centavo.
  - Los abonos se aplican **en cascada** a las cuotas más antiguas pendientes.
- **Multimoneda Estricta (NIO / USD)**:
  - Jamás suma córdobas con dólares ni realiza conversiones arbitrarias.
  - Tarjetas de resumen y reportes con balances duales independientes.
- **Reglas de Negocio en Stored Procedures (PostgreSQL / Supabase)**:
  - Todo el flujo financiero y de inventario está escrito en funciones PL/pgSQL atómicas en `supabase/migrations/01_initial_schema_and_sp.sql`.
- **Modo Demo Autónomo**:
  - Funciona de forma 100% interactiva en el navegador (persistencia reactiva en `localStorage`) con datos de prueba realistas de Nicaragua (Managua, Masaya, Granada).

---

## 2. Requisitos Previos y Ejecución

- **Node.js**: Versión 18, 20 o 22 (recomendado v22.14.0).
- **npm** o **pnpm**.

### Paso 1: Clonar y Acceder
```bash
cd control-inventario-credito
```

### Paso 2: Instalar Dependencias
```bash
npm install
```

### Paso 3: Iniciar Servidor de Desarrollo
```bash
npm run dev
```

Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

### Paso 4: Probar la Compilación de Producción
```bash
npm run build
npm start
```

---

## 3. Conexión a Supabase (Producción)

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ve al **SQL Editor** de Supabase y copia el contenido del archivo:
   `supabase/migrations/01_initial_schema_and_sp.sql`
3. Ejecuta la consulta para crear las tablas, índices y los siguientes **Stored Procedures**:
   - `sp_realizar_venta_contado`
   - `sp_realizar_venta_credito`
   - `sp_registrar_abono`
   - `sp_obtener_metricas_dashboard`
4. Renombra `.env.example` a `.env.local` y coloca las llaves de tu proyecto:
   ```env
   NEXT_PUBLIC_APP_ENV=production
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

---

## 4. Skills de Especialidad Creadas en el Proyecto

En la carpeta `.agents/skills/` se encuentran las directrices técnicas del sistema:
- `ux-ui-designer`: Ergonomía PWA, paletas, contraste y manejo de pulgar móvil.
- `sql-database-architect`: Tipado `NUMERIC(14,2)`, restricciones `CHECK` y Stored Procedures atómicos.
- `solutions-architect`: Patrón repositorio, tipado estricto en TypeScript y separación por dominios.
