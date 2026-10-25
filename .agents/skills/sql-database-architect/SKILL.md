---
name: sql-database-architect
description: >-
  Use this skill when designing, writing, reviewing, optimizing, or migrating
  PostgreSQL schemas, tables, constraints, foreign keys, indexes, triggers,
  views, RLS (Row Level Security) policies, and transactional SQL routines for Supabase.
---

# PostgreSQL & Supabase Database Architect

Esta skill guía la construcción y mantenimiento de bases de datos relacionales robustas, transaccionales y con integridad estricta en PostgreSQL / Supabase.

## 1. Principios de Modelado Financiero y Comercial

- **Tipos de Datos Monetarios**:
  - **PROHIBIDO** el uso de `FLOAT`, `DOUBLE PRECISION` o `REAL` para importes de dinero o inventario.
  - Usar siempre `NUMERIC(14,2)` o `NUMERIC(18,4)` si se manejan tipos de cambio de alta precisión.
- **Identificadores**:
  - Claves primarias con `UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
  - Códigos comerciales legibles para humanos con restricción `UNIQUE` (ej. `VEN-2026-0001`, `REC-2026-0001`).
- **Auditoría y Tiempos**:
  - Campos estándar obligatorios: `created_at TIMESTAMPTZ DEFAULT now() NOT NULL`, `updated_at TIMESTAMPTZ DEFAULT now() NOT NULL`.
  - Campo opcional de operador: `created_by UUID REFERENCES auth.users(id)`.

## 2. Integridad Referencial y Restricciones `CHECK`

- Validar estados mediante restricciones `CHECK` en lugar de strings arbitrarios:
  ```sql
  status VARCHAR(20) NOT NULL CHECK (status IN ('available', 'reserved', 'sold', 'returned', 'damaged'))
  currency VARCHAR(3) NOT NULL CHECK (currency IN ('NIO', 'USD'))
  ```
- No permitir importes negativos en operaciones de venta o cobro:
  ```sql
  CONSTRAINT check_positive_amount CHECK (amount >= 0)
  ```
- Restricción de unidad única por venta:
  ```sql
  CONSTRAINT unique_inventory_unit_per_sale UNIQUE (inventory_unit_id)
  ```

## 3. Transacciones y Atomicidad

Toda operación que involucre más de una tabla debe ejecutarse en una transacción explícita (`BEGIN ... COMMIT`) o mediante una función RPC de PostgreSQL (`SECURITY DEFINER`):
- **Venta Confirmada**:
  1. Insertar cabecera `sales`.
  2. Insertar items `sale_items`.
  3. Actualizar `inventory_units SET status = 'sold'`.
  4. Insertar kardex en `inventory_movements`.
  5. Si es crédito: Insertar `credits` y programar `payment_commitments`.
  6. Si hubo prima: Insertar `payments` y `payment_allocations`.
- Si cualquiera de los pasos falla, se debe abortar toda la transacción (`ROLLBACK`).

## 4. Políticas de Seguridad de Fila (RLS) en Supabase

- Habilitar RLS en **todas** las tablas públicas:
  ```sql
  ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
  ```
- Para un sistema de un solo propietario o multi-tenant por usuario autenticado:
  ```sql
  CREATE POLICY "Usuarios autenticados gestionan sus registros"
  ON public.sales
  FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);
  ```

## 5. Indexación Estratégica

- Crear índices para todas las claves foráneas (`REFERENCES`).
- Crear índices para filtros y búsquedas frecuentes:
  ```sql
  CREATE INDEX idx_inventory_units_status ON inventory_units(status);
  CREATE INDEX idx_credits_status_currency ON credits(status, currency);
  CREATE INDEX idx_payment_commitments_due_date ON payment_commitments(due_date) WHERE status = 'pending';
  ```
