# Documento de Análisis: Selección de Productos y Diferenciación de Unidades

## Sistema de Gestión Comercial y Ventas al Crédito — Nicaragua

---

### 1. El Dilema Real: ¿Cómo diferencio 20 Samsung Galaxy A55?

Si el señor tiene 20 teléfonos del mismo modelo, en la vida real pueden ocurrir tres cosas:
1. **Diferenciación por Atributos Comerciales Simples**:
   - Color: *(Negro, Azul, Blanco, Morado)*.
   - Estado: *(Nuevo sellado, Semi-nuevo, De vitrina)*.
   - Capacidad: *(128GB vs 256GB)*.
2. **Diferenciación por IMEI / Número de Serie**:
   - En celulares se usa el **IMEI** (15 dígitos).
   - En refrigeradoras/TVs se usa el **Número de Serie de fábrica**.
   - *El problema*: Si obligamos al señor a escribir un IMEI de 15 dígitos cada vez que compra o vende, el sistema se vuelve lento y frustrante.
3. **Solución Pragmática Recomendada (Identificador Opcional / Nota de Unidad)**:
   - El inventario sigue siendo ágil por modelo general.
   - Al momento de hacer la venta, el sistema le da un campo opcional:
     - **«Detalle de la unidad (Color / IMEI / Serie)»**:
     - Ej: *"Color Azul, IMEI terminado en 4821"* o *"Caja sellada negra"*.
   - **Beneficio**: Si el señor tiene prisa, simplemente vende y descuenta 1 unidad del stock. Si quiere dejar constancia para la garantía del cliente, anota el color o los últimos 4 dígitos del IMEI. ¡Cero fricción!

---

### 2. Mejora del Selector de Productos: Búsqueda Rápida en Vivo

En lugar de un `<select>` nativo que se vuelve incómodo cuando hay 30 o 50 productos:
1. **Buscador predictivo en vivo**:
   - Un campo de texto grande con ícono de lupa:
     `[🔍 Escribe para buscar: ej. "Samsung" o "PS5" o "Mabe"]`
   - Conforme escribe, se filtran los productos inmediatamente.
2. **Tarjetas de Selección con 1 Toque**:
   - Muestra el producto, las unidades disponibles en verde y el precio bien claro.
   - Al tocar el producto, queda seleccionado automáticamente.
