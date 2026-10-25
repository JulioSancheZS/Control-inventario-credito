-- ============================================================================
-- ESQUEMA COMPLETO Y STORED PROCEDURES PARA SUPABASE
-- Sistema de Gestión Comercial y Ventas al Crédito (Nicaragua)
-- Todas las reglas de negocio, tablas de amortización e inventario en SPs
-- ============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: Categorías de productos
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. TABLA: Productos (Control ágil por stock numérico)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    cost_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
    cost_currency VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (cost_currency IN ('NIO', 'USD')),
    cash_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (cash_price >= 0),
    credit_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (credit_price >= 0),
    sale_currency VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (sale_currency IN ('NIO', 'USD')),
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. TABLA: Clientes
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    address TEXT,
    notes TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. TABLA: Ventas
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    sale_type VARCHAR(10) NOT NULL CHECK (sale_type IN ('cash', 'credit')),
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('NIO', 'USD')),
    total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount > 0),
    status VARCHAR(15) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. TABLA: Detalle de Venta
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
    total NUMERIC(14,2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. TABLA: Créditos Acordados
CREATE TABLE IF NOT EXISTS public.credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_number TEXT UNIQUE NOT NULL,
    sale_id UUID UNIQUE NOT NULL REFERENCES public.sales(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('NIO', 'USD')),
    total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount > 0),
    down_payment NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (down_payment >= 0),
    financed_amount NUMERIC(14,2) NOT NULL CHECK (financed_amount >= 0),
    installments_count INTEGER NOT NULL CHECK (installments_count > 0),
    frequency VARCHAR(15) NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
    first_payment_date DATE NOT NULL,
    status VARCHAR(15) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. TABLA: Amortización (Cuotas Pactadas)
CREATE TABLE IF NOT EXISTS public.amortization_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_id UUID NOT NULL REFERENCES public.credits(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL CHECK (installment_number > 0),
    due_date DATE NOT NULL,
    expected_amount NUMERIC(14,2) NOT NULL CHECK (expected_amount > 0),
    paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    status VARCHAR(15) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_credit_installment UNIQUE (credit_id, installment_number)
);

-- 8. TABLA: Pagos y Recibos
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    credit_id UUID REFERENCES public.credits(id) ON DELETE RESTRICT,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('NIO', 'USD')),
    paid_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'other')),
    notes TEXT,
    status VARCHAR(15) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'reversed')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. TABLA: Asignación de Pagos
CREATE TABLE IF NOT EXISTS public.payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    credit_id UUID NOT NULL REFERENCES public.credits(id) ON DELETE RESTRICT,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS (STORED PROCEDURES / FUNCIONES PL/PGSQL)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SP 1: sp_realizar_venta_contado
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sp_realizar_venta_contado(
    p_customer_id UUID,
    p_currency VARCHAR(3),
    p_payment_method VARCHAR(20),
    p_notes TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sale_id UUID;
    v_sale_number TEXT;
    v_payment_id UUID;
    v_payment_number TEXT;
    v_total_amount NUMERIC(14,2) := 0;
    v_item RECORD;
    v_product_stock INTEGER;
    v_product_name TEXT;
    v_line_total NUMERIC(14,2);
BEGIN
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'La venta debe contener al menos un producto.';
    END IF;

    -- Validar stock de cada ítem antes de modificar nada
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INTEGER, unit_price NUMERIC)
    LOOP
        SELECT stock, name INTO v_product_stock, v_product_name FROM public.products WHERE id = v_item.product_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Producto con ID % no encontrado.', v_item.product_id;
        END IF;
        IF v_product_stock < v_item.quantity THEN
            RAISE EXCEPTION 'Stock insuficiente para el producto "%". Disponible: %, Solicitado: %', 
                v_product_name, v_product_stock, v_item.quantity;
        END IF;

        v_line_total := ROUND(v_item.quantity * v_item.unit_price, 2);
        v_total_amount := v_total_amount + v_line_total;
    END LOOP;

    -- Generar número de venta correlativo
    v_sale_number := 'VTA-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    -- Insertar Cabecera de Venta
    INSERT INTO public.sales (sale_number, customer_id, sale_type, currency, total_amount, status, notes)
    VALUES (v_sale_number, p_customer_id, 'cash', p_currency, v_total_amount, 'confirmed', p_notes)
    RETURNING id INTO v_sale_id;

    -- Insertar Detalles y Descontar Stock
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INTEGER, unit_price NUMERIC)
    LOOP
        v_line_total := ROUND(v_item.quantity * v_item.unit_price, 2);
        
        INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, total)
        VALUES (v_sale_id, v_item.product_id, v_item.quantity, v_item.unit_price, v_line_total);

        UPDATE public.products 
        SET stock = stock - v_item.quantity, updated_at = now()
        WHERE id = v_item.product_id;
    END LOOP;

    -- Registrar Pago de Contado Inmediato
    v_payment_number := 'REC-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    INSERT INTO public.payments (payment_number, customer_id, amount, currency, payment_method, notes, status)
    VALUES (v_payment_number, p_customer_id, v_total_amount, p_currency, p_payment_method, 'Pago total de venta al contado ' || v_sale_number, 'confirmed')
    RETURNING id INTO v_payment_id;

    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'sale_number', v_sale_number,
        'payment_id', v_payment_id,
        'payment_number', v_payment_number,
        'total_amount', v_total_amount,
        'currency', p_currency
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- SP 2: sp_realizar_venta_credito (con generación automática de amortización)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sp_realizar_venta_credito(
    p_customer_id UUID,
    p_currency VARCHAR(3),
    p_down_payment NUMERIC(14,2),
    p_installments_count INTEGER,
    p_frequency VARCHAR(15),
    p_first_payment_date DATE,
    p_payment_method VARCHAR(20),
    p_notes TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sale_id UUID;
    v_sale_number TEXT;
    v_credit_id UUID;
    v_credit_number TEXT;
    v_payment_id UUID;
    v_payment_number TEXT;
    v_total_amount NUMERIC(14,2) := 0;
    v_financed_amount NUMERIC(14,2);
    v_base_installment NUMERIC(14,2);
    v_accumulated NUMERIC(14,2) := 0;
    v_installment_amount NUMERIC(14,2);
    v_due_date DATE;
    v_item RECORD;
    v_product_stock INTEGER;
    v_product_name TEXT;
    v_line_total NUMERIC(14,2);
    i INTEGER;
BEGIN
    IF p_customer_id IS NULL THEN
        RAISE EXCEPTION 'Para una venta al crédito es obligatorio registrar el cliente.';
    END IF;
    IF p_installments_count <= 0 THEN
        RAISE EXCEPTION 'El número de cuotas debe ser mayor a 0.';
    END IF;
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'La venta debe contener al menos un producto.';
    END IF;

    -- Validar stock de cada ítem
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INTEGER, unit_price NUMERIC)
    LOOP
        SELECT stock, name INTO v_product_stock, v_product_name FROM public.products WHERE id = v_item.product_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Producto con ID % no encontrado.', v_item.product_id;
        END IF;
        IF v_product_stock < v_item.quantity THEN
            RAISE EXCEPTION 'Stock insuficiente para "%". Disponible: %, Solicitado: %', 
                v_product_name, v_product_stock, v_item.quantity;
        END IF;

        v_line_total := ROUND(v_item.quantity * v_item.unit_price, 2);
        v_total_amount := v_total_amount + v_line_total;
    END LOOP;

    IF p_down_payment >= v_total_amount THEN
        RAISE EXCEPTION 'La prima no puede ser igual o mayor al total de la venta (debe ser venta al contado).';
    END IF;

    v_financed_amount := v_total_amount - COALESCE(p_down_payment, 0);

    -- 1. Crear Venta
    v_sale_number := 'VTA-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    INSERT INTO public.sales (sale_number, customer_id, sale_type, currency, total_amount, status, notes)
    VALUES (v_sale_number, p_customer_id, 'credit', p_currency, v_total_amount, 'confirmed', p_notes)
    RETURNING id INTO v_sale_id;

    -- 2. Insertar Detalles y Descontar Stock
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INTEGER, unit_price NUMERIC)
    LOOP
        v_line_total := ROUND(v_item.quantity * v_item.unit_price, 2);
        INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, total)
        VALUES (v_sale_id, v_item.product_id, v_item.quantity, v_item.unit_price, v_line_total);

        UPDATE public.products 
        SET stock = stock - v_item.quantity, updated_at = now()
        WHERE id = v_item.product_id;
    END LOOP;

    -- 3. Crear Crédito Acordado
    v_credit_number := 'CRE-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    INSERT INTO public.credits (
        credit_number, sale_id, customer_id, currency, total_amount,
        down_payment, financed_amount, installments_count, frequency,
        first_payment_date, status, notes
    )
    VALUES (
        v_credit_number, v_sale_id, p_customer_id, p_currency, v_total_amount,
        COALESCE(p_down_payment, 0), v_financed_amount, p_installments_count, p_frequency,
        p_first_payment_date, 'active', p_notes
    )
    RETURNING id INTO v_credit_id;

    -- 4. Generar Tabla de Amortización con Precisión Exacta al Centavo
    v_base_installment := ROUND(v_financed_amount / p_installments_count, 2);

    FOR i IN 1..p_installments_count LOOP
        -- Cálculo de fecha según frecuencia
        IF p_frequency = 'weekly' THEN
            v_due_date := p_first_payment_date + ((i - 1) * 7);
        ELSIF p_frequency = 'biweekly' THEN
            v_due_date := p_first_payment_date + ((i - 1) * 15);
        ELSE
            -- mensual (por defecto)
            v_due_date := p_first_payment_date + ((i - 1) * INTERVAL '1 month')::INTERVAL;
        END IF;

        -- La última cuota absorbe cualquier diferencia de centavos por redondeo
        IF i = p_installments_count THEN
            v_installment_amount := v_financed_amount - v_accumulated;
        ELSE
            v_installment_amount := v_base_installment;
            v_accumulated := v_accumulated + v_base_installment;
        END IF;

        INSERT INTO public.amortization_schedule (
            credit_id, installment_number, due_date, expected_amount, paid_amount, status
        )
        VALUES (
            v_credit_id, i, v_due_date, v_installment_amount, 0, 'pending'
        );
    END LOOP;

    -- 5. Si hubo prima, registrar el cobro y la asignación
    IF COALESCE(p_down_payment, 0) > 0 THEN
        v_payment_number := 'REC-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        INSERT INTO public.payments (
            payment_number, customer_id, credit_id, amount, currency, payment_method, notes, status
        )
        VALUES (
            v_payment_number, p_customer_id, v_credit_id, p_down_payment, p_currency, 
            COALESCE(p_payment_method, 'cash'), 'Prima inicial de venta al crédito ' || v_credit_number, 'confirmed'
        )
        RETURNING id INTO v_payment_id;

        INSERT INTO public.payment_allocations (payment_id, credit_id, amount)
        VALUES (v_payment_id, v_credit_id, p_down_payment);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'sale_number', v_sale_number,
        'credit_id', v_credit_id,
        'credit_number', v_credit_number,
        'total_amount', v_total_amount,
        'down_payment', COALESCE(p_down_payment, 0),
        'financed_amount', v_financed_amount,
        'currency', p_currency
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- SP 3: sp_registrar_abono (Aplica abono en cascada sobre cuotas pendientes)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sp_registrar_abono(
    p_credit_id UUID,
    p_amount NUMERIC(14,2),
    p_currency VARCHAR(3),
    p_payment_method VARCHAR(20),
    p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_credit RECORD;
    v_payment_id UUID;
    v_payment_number TEXT;
    v_remaining_payment NUMERIC(14,2);
    v_installment RECORD;
    v_needed NUMERIC(14,2);
    v_to_apply NUMERIC(14,2);
    v_total_paid NUMERIC(14,2);
    v_pending_installments_count INTEGER;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'El monto del abono debe ser mayor a 0.';
    END IF;

    -- Obtener y validar el crédito
    SELECT * INTO v_credit FROM public.credits WHERE id = p_credit_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Crédito no encontrado.';
    END IF;
    IF v_credit.status <> 'active' THEN
        RAISE EXCEPTION 'No se pueden registrar abonos a un crédito con estado "%".', v_credit.status;
    END IF;
    IF v_credit.currency <> p_currency THEN
        RAISE EXCEPTION 'Moneda incompatible. El crédito está en %, pero el abono se envió en %.', 
            v_credit.currency, p_currency;
    END IF;

    -- Validar que no se exceda el saldo deudor
    SELECT COALESCE(SUM(paid_amount), 0) INTO v_total_paid 
    FROM public.amortization_schedule 
    WHERE credit_id = p_credit_id;

    IF (v_total_paid + p_amount) > v_credit.financed_amount THEN
        RAISE EXCEPTION 'El abono de % % supera el saldo pendiente restante (% %).',
            p_amount, p_currency, (v_credit.financed_amount - v_total_paid), p_currency;
    END IF;

    -- 1. Insertar Recibo de Pago
    v_payment_number := 'REC-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    INSERT INTO public.payments (
        payment_number, customer_id, credit_id, amount, currency, payment_method, notes, status
    )
    VALUES (
        v_payment_number, v_credit.customer_id, p_credit_id, p_amount, p_currency,
        p_payment_method, COALESCE(p_notes, 'Abono a cuota de crédito ' || v_credit.credit_number), 'confirmed'
    )
    RETURNING id INTO v_payment_id;

    -- 2. Insertar Asignación
    INSERT INTO public.payment_allocations (payment_id, credit_id, amount)
    VALUES (v_payment_id, p_credit_id, p_amount);

    -- 3. Aplicar en Cascada a las Cuotas Pendientes
    v_remaining_payment := p_amount;

    FOR v_installment IN 
        SELECT * FROM public.amortization_schedule 
        WHERE credit_id = p_credit_id AND status IN ('pending', 'partial', 'overdue')
        ORDER BY installment_number ASC
    LOOP
        EXIT WHEN v_remaining_payment <= 0;

        v_needed := v_installment.expected_amount - v_installment.paid_amount;

        IF v_remaining_payment >= v_needed THEN
            v_to_apply := v_needed;
            v_remaining_payment := v_remaining_payment - v_needed;

            UPDATE public.amortization_schedule 
            SET paid_amount = expected_amount, status = 'paid'
            WHERE id = v_installment.id;
        ELSE
            v_to_apply := v_remaining_payment;
            v_remaining_payment := 0;

            UPDATE public.amortization_schedule 
            SET paid_amount = paid_amount + v_to_apply, status = 'partial'
            WHERE id = v_installment.id;
        END IF;
    END LOOP;

    -- 4. Si ya no quedan cuotas pendientes, marcar el crédito como saldado ('paid_off')
    SELECT COUNT(*) INTO v_pending_installments_count
    FROM public.amortization_schedule
    WHERE credit_id = p_credit_id AND status <> 'paid';

    IF v_pending_installments_count = 0 THEN
        UPDATE public.credits SET status = 'paid_off' WHERE id = p_credit_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'payment_number', v_payment_number,
        'amount_applied', p_amount,
        'currency', p_currency,
        'is_paid_off', (v_pending_installments_count = 0)
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- SP 4: sp_obtener_metricas_dashboard
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sp_obtener_metricas_dashboard()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_collected_today_nio NUMERIC(14,2) := 0;
    v_collected_today_usd NUMERIC(14,2) := 0;
    v_collected_month_nio NUMERIC(14,2) := 0;
    v_collected_month_usd NUMERIC(14,2) := 0;
    v_sales_month_nio NUMERIC(14,2) := 0;
    v_sales_month_usd NUMERIC(14,2) := 0;
    v_total_receivable_nio NUMERIC(14,2) := 0;
    v_total_receivable_usd NUMERIC(14,2) := 0;
    v_overdue_count INTEGER := 0;
    v_upcoming_count INTEGER := 0;
    v_low_stock_count INTEGER := 0;
BEGIN
    -- Cobros de hoy
    SELECT 
        COALESCE(SUM(CASE WHEN currency = 'NIO' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN currency = 'USD' THEN amount ELSE 0 END), 0)
    INTO v_collected_today_nio, v_collected_today_usd
    FROM public.payments
    WHERE status = 'confirmed' AND paid_at::DATE = CURRENT_DATE;

    -- Cobros del mes
    SELECT 
        COALESCE(SUM(CASE WHEN currency = 'NIO' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN currency = 'USD' THEN amount ELSE 0 END), 0)
    INTO v_collected_month_nio, v_collected_month_usd
    FROM public.payments
    WHERE status = 'confirmed' 
      AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE);

    -- Ventas del mes
    SELECT 
        COALESCE(SUM(CASE WHEN currency = 'NIO' THEN total_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN currency = 'USD' THEN total_amount ELSE 0 END), 0)
    INTO v_sales_month_nio, v_sales_month_usd
    FROM public.sales
    WHERE status = 'confirmed' 
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);

    -- Cartera total por cobrar (separada estrictamente por moneda)
    SELECT 
        COALESCE(SUM(CASE WHEN c.currency = 'NIO' THEN (a.expected_amount - a.paid_amount) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN c.currency = 'USD' THEN (a.expected_amount - a.paid_amount) ELSE 0 END), 0)
    INTO v_total_receivable_nio, v_total_receivable_usd
    FROM public.amortization_schedule a
    JOIN public.credits c ON a.credit_id = c.id
    WHERE c.status = 'active' AND a.status IN ('pending', 'partial', 'overdue');

    -- Conteo de cuotas vencidas (due_date < hoy y con saldo pendiente)
    SELECT COUNT(*) INTO v_overdue_count
    FROM public.amortization_schedule a
    JOIN public.credits c ON a.credit_id = c.id
    WHERE c.status = 'active' 
      AND a.due_date < CURRENT_DATE 
      AND a.paid_amount < a.expected_amount;

    -- Conteo de cuotas próximas (en los próximos 7 días)
    SELECT COUNT(*) INTO v_upcoming_count
    FROM public.amortization_schedule a
    JOIN public.credits c ON a.credit_id = c.id
    WHERE c.status = 'active' 
      AND a.due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + 7)
      AND a.paid_amount < a.expected_amount;

    -- Productos con stock bajo (menor o igual a 2 unidades)
    SELECT COUNT(*) INTO v_low_stock_count
    FROM public.products
    WHERE active = true AND stock <= 2;

    RETURN jsonb_build_object(
        'collectedToday', jsonb_build_object('nio', v_collected_today_nio, 'usd', v_collected_today_usd),
        'collectedMonth', jsonb_build_object('nio', v_collected_month_nio, 'usd', v_collected_month_usd),
        'salesMonth', jsonb_build_object('nio', v_sales_month_nio, 'usd', v_sales_month_usd),
        'totalReceivable', jsonb_build_object('nio', v_total_receivable_nio, 'usd', v_total_receivable_usd),
        'overdueInstallmentsCount', v_overdue_count,
        'upcomingInstallmentsCount', v_upcoming_count,
        'lowStockProductsCount', v_low_stock_count
    );
END;
$$;
