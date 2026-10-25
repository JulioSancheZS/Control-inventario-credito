---
name: solutions-architect-senior-dev
description: >-
  Use this skill when designing application architecture, defining patterns,
  reviewing TypeScript/Next.js code, planning domain logic, ensuring zero-loss state,
  handling multi-currency integrity, and coordinating frontend-backend contracts.
---

# Solutions Architect & Senior Software Engineer

Esta skill define los estándares de arquitectura, calidad de código y diseño de soluciones para aplicaciones modernas en Next.js App Router, TypeScript y arquitecturas orientadas a dominio.

## 1. Principios de Arquitectura de Solución

1. **Separación de Responsabilidades (SoC)**:
   - **Capa de Dominio / Negocio (`features/*`)**: Lógica pura, cálculo de amortización, validaciones de saldo, reglas de negocio. No depende del framework de UI.
   - **Capa de Datos / Repositorio (`lib/db/*`)**: Abstracción del acceso a datos. Permite cambiar sin fricción entre un proveedor en memoria/LocalStorage (Modo Demo) y un cliente real de Supabase / PostgreSQL.
   - **Capa de Presentación (`components/*`, `app/*`)**: Componentes React funcionales, limpios, sin cálculos financieros dispersos ni mutaciones sin control.
2. **Tipado Estricto de Dominio**:
   - Utilizar tipos de TypeScript explícitos y discriminados para estados (`type SaleStatus = 'draft' | 'confirmed' | 'cancelled'`).
   - Evitar `any` bajo cualquier circunstancia. Emplear `unknown` con type guards o esquemas de Zod para validación en tiempo de ejecución.
3. **Manejo de Monedas y Precisión**:
   - Evitar problemas de redondeo de punto flotante en JavaScript usando enteros (centavos) o funciones matemáticas controladas (`Math.round((amount + Number.EPSILON) * 100) / 100`).
   - El objeto o función de cálculo de saldos debe recibir y devolver siempre la divisa explícita (`{ amount: number; currency: 'NIO' | 'USD' }`).

## 2. Patrón de Repositorio Desacoplado (Demo vs Producción)

Para permitir que el sistema funcione autónomamente como MVP navegable sin configuración externa:
- Definir contratos TypeScript claros (Interfaces):
  ```typescript
  export interface IInventoryRepository {
    getUnits(filter?: InventoryFilter): Promise<InventoryUnit[]>;
    createUnit(data: CreateUnitDTO): Promise<InventoryUnit>;
    updateStatus(id: string, status: UnitStatus): Promise<void>;
  }
  ```
- Implementar dos adaptadores:
  1. `DemoStorageAdapter`: Persiste en memoria y `localStorage` con semillas realistas de prueba.
  2. `SupabaseStorageAdapter`: Ejecuta consultas y mutaciones en PostgreSQL mediante el cliente de Supabase.

## 3. Resiliencia, Idempotencia y Manejo de Errores

- **Idempotencia en Operaciones Financieras**:
  - Toda solicitud de confirmación de venta o pago debe llevar un identificador de idempotencia o clave de referencia para evitar duplicación por doble clic o reintentos de red.
- **Validación Defensiva (Dual Validation)**:
  - Validación en frontend con esquemas Zod (para feedback instantáneo al usuario).
  - Validación idéntica en la capa de servicios o funciones del servidor antes de persistir.
- **Sin Borrado Físico de Transacciones**:
  - Los pagos y ventas confirmadas jamás se ejecutan con `DELETE`. Se marcan con `status = 'cancelled'` o `status = 'reversed'`, manteniendo la trazabilidad histórica completa.
