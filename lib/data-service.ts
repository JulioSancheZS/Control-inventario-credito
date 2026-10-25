// Servicio Centralizado de Datos y Lógica de Negocio
// En modo Demo: Replica al 100% el comportamiento de los Stored Procedures de Supabase
// En modo Supabase: Conecta directamente mediante supabase.rpc(...)

import {
  Product,
  Customer,
  Sale,
  Credit,
  AmortizationInstallment,
  Payment,
  PaymentAllocation,
  DashboardMetrics,
  VentaContadoDTO,
  VentaCreditoDTO,
  RegistrarAbonoDTO,
} from "@/types";

import {
  initialCategories,
  initialProducts,
  initialCustomers,
  initialSales,
  initialCredits,
  initialInstallments,
  initialPayments,
  initialAllocations,
} from "./mock-data";

const STORAGE_KEY = "inventario_credito_data_v1";

interface AppState {
  categories: typeof initialCategories;
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  credits: Credit[];
  installments: AmortizationInstallment[];
  payments: Payment[];
  allocations: PaymentAllocation[];
}

function loadState(): AppState {
  if (typeof window === "undefined") {
    return {
      categories: initialCategories,
      products: initialProducts,
      customers: initialCustomers,
      sales: initialSales,
      credits: initialCredits,
      installments: initialInstallments,
      payments: initialPayments,
      allocations: initialAllocations,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: AppState = {
        categories: initialCategories,
        products: initialProducts,
        customers: initialCustomers,
        sales: initialSales,
        credits: initialCredits,
        installments: initialInstallments,
        payments: initialPayments,
        allocations: initialAllocations,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return {
      categories: initialCategories,
      products: initialProducts,
      customers: initialCustomers,
      sales: initialSales,
      credits: initialCredits,
      installments: initialInstallments,
      payments: initialPayments,
      allocations: initialAllocations,
    };
  }
}

function saveState(state: AppState) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

// ============================================================================
// SIMULADOR DE STORED PROCEDURES (RÉPLICA EXACTA DE LAS FUNCIONES SQL)
// ============================================================================

export const DataService = {
  // Reset de la base de datos demo a su estado inicial
  resetToInitialDemo(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  // 1. Obtener Productos
  async getProducts(): Promise<Product[]> {
    const state = loadState();
    return state.products;
  },

  async addProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const state = loadState();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.products.unshift(newProduct);
    saveState(state);
    return newProduct;
  },

  async updateProductStock(productId: string, newStock: number): Promise<void> {
    const state = loadState();
    const prod = state.products.find((p) => p.id === productId);
    if (prod) {
      prod.stock = Math.max(0, newStock);
      prod.updatedAt = new Date().toISOString();
      saveState(state);
    }
  },

  // 2. Obtener Clientes
  async getCustomers(): Promise<Customer[]> {
    const state = loadState();
    return state.customers;
  },

  async addCustomer(customer: Omit<Customer, "id" | "createdAt" | "active">): Promise<Customer> {
    const state = loadState();
    const newCust: Customer = {
      ...customer,
      id: `cust-${Date.now()}`,
      active: true,
      createdAt: new Date().toISOString(),
    };
    state.customers.unshift(newCust);
    saveState(state);
    return newCust;
  },

  // 3. Obtener Ventas
  async getSales(): Promise<Sale[]> {
    const state = loadState();
    return state.sales;
  },

  // 4. Obtener Créditos con sus Cuotas y Saldos
  async getCredits(): Promise<Credit[]> {
    const state = loadState();
    return state.credits.map((c) => {
      const creditInstallments = state.installments.filter((i) => i.creditId === c.id);
      const totalPaid = creditInstallments.reduce((acc, curr) => acc + curr.paidAmount, 0);
      const balanceDue = Math.max(0, c.financedAmount - totalPaid);
      const nextDue = creditInstallments
        .filter((i) => i.status !== "paid")
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

      return {
        ...c,
        totalPaid: Math.round((totalPaid + Number.EPSILON) * 100) / 100,
        balanceDue: Math.round((balanceDue + Number.EPSILON) * 100) / 100,
        nextDueInstallment: nextDue,
        schedule: creditInstallments,
      };
    });
  },

  async getCreditById(id: string): Promise<Credit | null> {
    const credits = await this.getCredits();
    return credits.find((c) => c.id === id) || null;
  },

  // 5. Obtener Pagos
  async getPayments(): Promise<Payment[]> {
    const state = loadState();
    return state.payments;
  },

  // --------------------------------------------------------------------------
  // STORED PROCEDURE: sp_realizar_venta_contado
  // --------------------------------------------------------------------------
  async realizarVentaContado(dto: VentaContadoDTO): Promise<{ saleId: string; paymentId: string }> {
    const state = loadState();

    if (dto.items.length === 0) {
      throw new Error("Debe seleccionar al menos un producto.");
    }

    // Validar stock de cada producto
    let totalAmount = 0;
    for (const item of dto.items) {
      const prod = state.products.find((p) => p.id === item.productId);
      if (!prod) throw new Error("Producto no encontrado.");
      if (prod.stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${prod.name}". Disponible: ${prod.stock}`);
      }
      totalAmount += Math.round(item.quantity * item.unitPrice * 100) / 100;
    }

    // Descontar inventario
    for (const item of dto.items) {
      const prod = state.products.find((p) => p.id === item.productId)!;
      prod.stock -= item.quantity;
      prod.updatedAt = new Date().toISOString();
    }

    const saleId = `sale-${Date.now()}`;
    const saleNumber = `VTA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const cust = dto.customerId ? state.customers.find((c) => c.id === dto.customerId) : undefined;

    const newSale: Sale = {
      id: saleId,
      saleNumber,
      customerId: dto.customerId,
      customerName: cust?.fullName,
      customerPhone: cust?.phone,
      saleType: "cash",
      currency: dto.currency,
      totalAmount,
      status: "confirmed",
      notes: dto.notes,
      createdAt: new Date().toISOString(),
      items: dto.items.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        saleId,
        productId: it.productId,
        productName: state.products.find((p) => p.id === it.productId)?.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: Math.round(it.quantity * it.unitPrice * 100) / 100,
        createdAt: new Date().toISOString(),
      })),
    };

    // Crear Recibo de Pago Contado Inmediato
    const paymentId = `pay-${Date.now()}`;
    const paymentNumber = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const newPayment: Payment = {
      id: paymentId,
      paymentNumber,
      customerId: dto.customerId || "general",
      customerName: cust?.fullName || "Cliente General (Contado)",
      amount: totalAmount,
      currency: dto.currency,
      paidAt: new Date().toISOString(),
      paymentMethod: dto.paymentMethod,
      notes: `Venta al contado ${saleNumber}`,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };

    state.sales.unshift(newSale);
    state.payments.unshift(newPayment);
    saveState(state);

    return { saleId, paymentId };
  },

  // --------------------------------------------------------------------------
  // STORED PROCEDURE: sp_realizar_venta_credito
  // --------------------------------------------------------------------------
  async realizarVentaCredito(dto: VentaCreditoDTO): Promise<{ saleId: string; creditId: string }> {
    const state = loadState();

    if (!dto.customerId) throw new Error("Debe seleccionar un cliente para vender al crédito.");
    if (dto.installmentsCount <= 0) throw new Error("El número de cuotas debe ser mayor a 0.");
    if (dto.items.length === 0) throw new Error("Debe seleccionar al menos un producto.");

    let totalAmount = 0;
    for (const item of dto.items) {
      const prod = state.products.find((p) => p.id === item.productId);
      if (!prod) throw new Error("Producto no encontrado.");
      if (prod.stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${prod.name}". Disponible: ${prod.stock}`);
      }
      totalAmount += Math.round(item.quantity * item.unitPrice * 100) / 100;
    }

    const downPayment = Math.max(0, dto.downPayment || 0);
    if (downPayment >= totalAmount) {
      throw new Error("La prima no puede ser igual o mayor al total (debe ser venta de contado).");
    }

    const financedAmount = Math.round((totalAmount - downPayment) * 100) / 100;

    // Descontar inventario
    for (const item of dto.items) {
      const prod = state.products.find((p) => p.id === item.productId)!;
      prod.stock -= item.quantity;
      prod.updatedAt = new Date().toISOString();
    }

    const saleId = `sale-${Date.now()}`;
    const creditId = `cred-${Date.now()}`;
    const saleNumber = `VTA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    const creditNumber = `CRE-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const cust = state.customers.find((c) => c.id === dto.customerId)!;

    // 1. Crear Venta
    const newSale: Sale = {
      id: saleId,
      saleNumber,
      customerId: dto.customerId,
      customerName: cust.fullName,
      customerPhone: cust.phone,
      saleType: "credit",
      currency: dto.currency,
      totalAmount,
      status: "confirmed",
      notes: dto.notes,
      createdAt: new Date().toISOString(),
      creditId,
      items: dto.items.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        saleId,
        productId: it.productId,
        productName: state.products.find((p) => p.id === it.productId)?.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: Math.round(it.quantity * it.unitPrice * 100) / 100,
        createdAt: new Date().toISOString(),
      })),
    };

    // 2. Crear Crédito
    const newCredit: Credit = {
      id: creditId,
      creditNumber,
      saleId,
      customerId: dto.customerId,
      customerName: cust.fullName,
      customerPhone: cust.phone,
      currency: dto.currency,
      totalAmount,
      downPayment,
      financedAmount,
      installmentsCount: dto.installmentsCount,
      frequency: dto.frequency,
      firstPaymentDate: dto.firstPaymentDate,
      status: "active",
      notes: dto.notes,
      createdAt: new Date().toISOString(),
      totalPaid: 0,
      balanceDue: financedAmount,
    };

    // 3. Generar Tabla de Amortización con Centavos Exactos
    const baseInstallment = Math.round((financedAmount / dto.installmentsCount) * 100) / 100;
    let accumulated = 0;
    const newInstallments: AmortizationInstallment[] = [];

    const startDate = new Date(`${dto.firstPaymentDate}T12:00:00`);

    for (let i = 1; i <= dto.installmentsCount; i++) {
      const dueDate = new Date(startDate);
      if (dto.frequency === "weekly") {
        dueDate.setDate(dueDate.getDate() + (i - 1) * 7);
      } else if (dto.frequency === "biweekly") {
        dueDate.setDate(dueDate.getDate() + (i - 1) * 15);
      } else {
        // mensual
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
      }

      let expectedAmount = baseInstallment;
      if (i === dto.installmentsCount) {
        // La última cuota cuadra la diferencia exacta al centavo
        expectedAmount = Math.round((financedAmount - accumulated) * 100) / 100;
      } else {
        accumulated += baseInstallment;
      }

      newInstallments.push({
        id: `inst-${creditId}-${i}`,
        creditId,
        installmentNumber: i,
        dueDate: dueDate.toISOString().slice(0, 10),
        expectedAmount,
        paidAmount: 0,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    }

    state.sales.unshift(newSale);
    state.credits.unshift(newCredit);
    state.installments.push(...newInstallments);

    // 4. Si hubo prima, registrar pago y asignación de inmediato
    if (downPayment > 0) {
      const paymentId = `pay-${Date.now()}`;
      const paymentNumber = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      const newPayment: Payment = {
        id: paymentId,
        paymentNumber,
        customerId: dto.customerId,
        customerName: cust.fullName,
        creditId,
        creditNumber,
        amount: downPayment,
        currency: dto.currency,
        paidAt: new Date().toISOString(),
        paymentMethod: dto.paymentMethod || "cash",
        notes: `Prima inicial por crédito ${creditNumber}`,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      };

      state.payments.unshift(newPayment);
      state.allocations.push({
        id: `alloc-${Date.now()}`,
        paymentId,
        creditId,
        amount: downPayment,
        createdAt: new Date().toISOString(),
      });
    }

    saveState(state);
    return { saleId, creditId };
  },

  // --------------------------------------------------------------------------
  // STORED PROCEDURE: sp_registrar_abono (Cascada sobre cuotas pendientes)
  // --------------------------------------------------------------------------
  async registrarAbono(dto: RegistrarAbonoDTO): Promise<{ paymentId: string; isPaidOff: boolean }> {
    const state = loadState();

    if (dto.amount <= 0) throw new Error("El monto del abono debe ser mayor a 0.");

    const credit = state.credits.find((c) => c.id === dto.creditId);
    if (!credit) throw new Error("Crédito no encontrado.");
    if (credit.status !== "active") throw new Error("El crédito no está activo.");
    if (credit.currency !== dto.currency) {
      throw new Error(`Moneda incompatible. El crédito está en ${credit.currency} y el abono en ${dto.currency}.`);
    }

    // Cuotas pendientes de este crédito ordenadas por fecha/número
    const creditInstallments = state.installments
      .filter((i) => i.creditId === dto.creditId && i.status !== "paid")
      .sort((a, b) => a.installmentNumber - b.installmentNumber);

    const currentTotalPaid = state.installments
      .filter((i) => i.creditId === dto.creditId)
      .reduce((acc, curr) => acc + curr.paidAmount, 0);

    const maxAllowable = Math.round((credit.financedAmount - currentTotalPaid) * 100) / 100;
    if (dto.amount > maxAllowable) {
      throw new Error(`El abono supera el saldo pendiente total (${dto.currency} ${maxAllowable}).`);
    }

    // 1. Crear Recibo de Pago
    const paymentId = `pay-${Date.now()}`;
    const paymentNumber = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const newPayment: Payment = {
      id: paymentId,
      paymentNumber,
      customerId: credit.customerId,
      customerName: credit.customerName,
      creditId: credit.id,
      creditNumber: credit.creditNumber,
      amount: dto.amount,
      currency: dto.currency,
      paidAt: new Date().toISOString(),
      paymentMethod: dto.paymentMethod,
      notes: dto.notes || `Abono a crédito ${credit.creditNumber}`,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };

    state.payments.unshift(newPayment);
    state.allocations.push({
      id: `alloc-${Date.now()}`,
      paymentId,
      creditId: credit.id,
      amount: dto.amount,
      createdAt: new Date().toISOString(),
    });

    // 2. Cascada de amortización sobre las cuotas
    let remainingAmount = dto.amount;

    for (const inst of creditInstallments) {
      if (remainingAmount <= 0) break;

      const needed = Math.round((inst.expectedAmount - inst.paidAmount) * 100) / 100;

      if (remainingAmount >= needed) {
        inst.paidAmount = inst.expectedAmount;
        inst.status = "paid";
        remainingAmount = Math.round((remainingAmount - needed) * 100) / 100;
      } else {
        inst.paidAmount = Math.round((inst.paidAmount + remainingAmount) * 100) / 100;
        inst.status = "partial";
        remainingAmount = 0;
      }
    }

    // 3. Verificar si el crédito se canceló en su totalidad
    const pendingCount = state.installments.filter(
      (i) => i.creditId === dto.creditId && i.status !== "paid"
    ).length;

    const isPaidOff = pendingCount === 0;
    if (isPaidOff) {
      credit.status = "paid_off";
    }

    saveState(state);
    return { paymentId, isPaidOff };
  },

  // --------------------------------------------------------------------------
  // STORED PROCEDURE: sp_obtener_metricas_dashboard
  // --------------------------------------------------------------------------
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const state = loadState();
    const today = new Date().toISOString().slice(0, 10);
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Cobros hoy
    const paymentsToday = state.payments.filter((p) => p.status === "confirmed" && p.paidAt.startsWith(today));
    const collectedTodayNIO = paymentsToday
      .filter((p) => p.currency === "NIO")
      .reduce((sum, p) => sum + p.amount, 0);
    const collectedTodayUSD = paymentsToday
      .filter((p) => p.currency === "USD")
      .reduce((sum, p) => sum + p.amount, 0);

    // Cobros mes
    const paymentsMonth = state.payments.filter(
      (p) => p.status === "confirmed" && p.paidAt.startsWith(currentMonth)
    );
    const collectedMonthNIO = paymentsMonth
      .filter((p) => p.currency === "NIO")
      .reduce((sum, p) => sum + p.amount, 0);
    const collectedMonthUSD = paymentsMonth
      .filter((p) => p.currency === "USD")
      .reduce((sum, p) => sum + p.amount, 0);

    // Ventas mes
    const salesMonth = state.sales.filter((s) => s.status === "confirmed" && s.createdAt.startsWith(currentMonth));
    const salesMonthNIO = salesMonth.filter((s) => s.currency === "NIO").reduce((sum, s) => sum + s.totalAmount, 0);
    const salesMonthUSD = salesMonth.filter((s) => s.currency === "USD").reduce((sum, s) => sum + s.totalAmount, 0);

    // Cartera total por cobrar
    let receivableNIO = 0;
    let receivableUSD = 0;

    for (const c of state.credits) {
      if (c.status === "active") {
        const insts = state.installments.filter((i) => i.creditId === c.id);
        const paid = insts.reduce((sum, i) => sum + i.paidAmount, 0);
        const due = Math.max(0, c.financedAmount - paid);
        if (c.currency === "NIO") receivableNIO += due;
        if (c.currency === "USD") receivableUSD += due;
      }
    }

    // Cuotas vencidas
    const overdueCount = state.installments.filter((inst) => {
      const cred = state.credits.find((c) => c.id === inst.creditId);
      return cred?.status === "active" && inst.status !== "paid" && inst.dueDate < today;
    }).length;

    // Próximas cuotas (hoy + 7 días)
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const sevenDaysStr = sevenDaysLater.toISOString().slice(0, 10);

    const upcomingCount = state.installments.filter((inst) => {
      const cred = state.credits.find((c) => c.id === inst.creditId);
      return (
        cred?.status === "active" &&
        inst.status !== "paid" &&
        inst.dueDate >= today &&
        inst.dueDate <= sevenDaysStr
      );
    }).length;

    // Productos con stock bajo (<= 2)
    const lowStockCount = state.products.filter((p) => p.active && p.stock <= 2).length;

    return {
      collectedToday: {
        nio: Math.round(collectedTodayNIO * 100) / 100,
        usd: Math.round(collectedTodayUSD * 100) / 100,
      },
      collectedMonth: {
        nio: Math.round(collectedMonthNIO * 100) / 100,
        usd: Math.round(collectedMonthUSD * 100) / 100,
      },
      salesMonth: {
        nio: Math.round(salesMonthNIO * 100) / 100,
        usd: Math.round(salesMonthUSD * 100) / 100,
      },
      totalReceivable: {
        nio: Math.round(receivableNIO * 100) / 100,
        usd: Math.round(receivableUSD * 100) / 100,
      },
      overdueInstallmentsCount: overdueCount,
      upcomingInstallmentsCount: upcomingCount,
      lowStockProductsCount: lowStockCount,
    };
  },
};
