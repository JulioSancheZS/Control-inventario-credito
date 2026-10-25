# Documento de Análisis: Manejo de Abonos Irregulares (Menores o Mayores a la Cuota)

## Sistema de Gestión Comercial y Ventas al Crédito — Nicaragua

---

### 1. La Realidad Comercial en Nicaragua

En ventas al crédito con acuerdos verbales y personales, es muy común que el cliente **no siempre entregue el monto exacto de la cuota pactada**:
- **Caso A (Abona MENOS de la cuota)**: La cuota es de `$100.00`, pero el cliente solo tiene `$60.00` hoy y promete los otros `$40.00` la próxima semana.
- **Caso B (Abona MÁS de la cuota / Pago Adelantado)**: La cuota es de `$100.00`, pero al cliente le pagaron su quincena o aguinaldo y llega con `$250.00` en mano para salir más rápido de la deuda.
- **Caso C (Abona el Total Restante / Cancelación Anticipada)**: El cliente decide liquidar todo su saldo pendiente de una sola vez.

---

### 2. Comportamiento Matemático y Transaccional (Algoritmo en Cascada)

Nuestra regla de negocio centralizada en el Stored Procedure (`sp_registrar_abono` y en el `DataService`) resuelve estos tres escenarios de manera **atómica y automática**:

#### Escenario 1: El cliente abona MENOS de la cuota (Abono Parcial)
* **Ejemplo**: Cuota 1 = `$100.00`. Cliente entrega `$60.00`.
* **Lo que hace el sistema**:
  1. Registra el cobro por los `$60.00` exactos que entraron a caja.
  2. En la tabla de amortización:
     - `Cuota 1.paid_amount` pasa de `$0.00` a `$60.00`.
     - `Cuota 1.status` pasa a `'partial'` (Abono Parcial).
     - El saldo restante de esa cuota queda en `$40.00`.
  3. El saldo total del crédito disminuye en `$60.00`.
  4. Cuando el cliente vuelva a abonar, el sistema primero terminará de liquidar esos `$40.00` pendientes antes de tocar la Cuota 2.

#### Escenario 2: El cliente abona MÁS de la cuota (Efecto Cascada / Desborde)
* **Ejemplo**: Cuota 1 = `$100.00`, Cuota 2 = `$100.00`, Cuota 3 = `$100.00`. Cliente entrega `$250.00`.
* **Lo que hace el sistema (Cascada de Cuotas)**:
  1. Toma los `$250.00` y empieza por la cuota pendiente más antigua:
     - **Cuota 1**: Le faltaban `$100.00` $\rightarrow$ Le asigna `$100.00`, queda en `$100.00` y pasa a `'paid'` (Pagada). Quedan `$150.00` del abono.
     - **Cuota 2**: Le faltaban `$100.00` $\rightarrow$ Le asigna `$100.00`, queda en `$100.00` y pasa a `'paid'` (Pagada). Quedan `$50.00` del abono.
     - **Cuota 3**: Le faltaban `$100.00` $\rightarrow$ Le asigna los `$50.00` restantes, pasa a `'partial'` (Abono Parcial con saldo restante de `$50.00`).
  2. En el recibo de WhatsApp se refleja:
     - *«Se cubrió Cuota #1, Cuota #2 y abono parcial a Cuota #3. Saldo restante: $50.00»*.
  3. No se pierde un solo centavo y el cliente no tiene que hacer 3 pagos separados.

#### Escenario 3: ¿Qué pasa si entrega MÁS del saldo total de la deuda?
* **Regla de Validación Estricta**:
  - Si el cliente debe en total `$400.00` y el dueño intenta registrar un pago de `$450.00`, el sistema **bloquea la operación** con una alerta clara:
  - *«El abono de $450.00 supera el saldo pendiente total adeudado ($400.00). Ingrese un monto máximo de $400.00 o devuelva el cambio.»*

---

### 3. Mejora Visual para el Dueño al Cobrar (UX)

Para que el dueño no tenga que hacer cálculos mentales de qué cuotas está cubriendo:
1. **Botones de Monto Rápido en la pantalla de abono**:
   - `[Pagar Cuota Exacta ($100)]`
   - `[Pagar 2 Cuotas ($200)]`
   - `[Liquidar Todo ($466.67)]`
   - O campo libre para escribir cualquier cantidad (ej. `$45.00` o `$130.00`).
2. **Previsualización de Impacto en Vivo**:
   - Si el dueño escribe `$150.00`, abajo se le muestra en tiempo real antes de guardar:
     - *«Este abono liquidará la Cuota #2 y cubrirá $50.00 de la Cuota #3»*.
