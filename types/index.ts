// Definición de tipos de dominio estrictos para el sistema comercial y ventas al crédito

export type Currency = 'NIO' | 'USD';

export type SaleType = 'cash' | 'credit';

export type SaleStatus = 'confirmed' | 'cancelled';

export type CreditStatus = 'active' | 'paid_off' | 'cancelled';

export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly';

export type InstallmentStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export type PaymentMethod = 'cash' | 'transfer' | 'other';

export type PaymentStatus = 'confirmed' | 'reversed';

// 1. Categoría de Productos
export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

// 2. Producto (Control ágil por stock)
export interface Product {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  stock: number;
  costPrice: number;
  costCurrency: Currency;
  cashPrice: number;
  creditPrice: number;
  saleCurrency: Currency;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// 3. Cliente
export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

// 4. Ítem de Venta
export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: string;
}

// 5. Venta
export interface Sale {
  id: string;
  saleNumber: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  saleType: SaleType;
  currency: Currency;
  totalAmount: number;
  status: SaleStatus;
  notes?: string;
  createdAt: string;
  items?: SaleItem[];
  creditId?: string;
}

// 6. Cuota de Amortización
export interface AmortizationInstallment {
  id: string;
  creditId: string;
  installmentNumber: number;
  dueDate: string; // YYYY-MM-DD
  expectedAmount: number;
  paidAmount: number;
  status: InstallmentStatus;
  createdAt: string;
}

// 7. Crédito Acordado
export interface Credit {
  id: string;
  creditNumber: string;
  saleId: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  currency: Currency;
  totalAmount: number;     // Precio total venta crédito
  downPayment: number;     // Prima entregada
  financedAmount: number;  // totalAmount - downPayment
  installmentsCount: number;
  frequency: PaymentFrequency;
  firstPaymentDate: string;
  status: CreditStatus;
  notes?: string;
  createdAt: string;
  // Campos calculados para UI
  totalPaid: number;
  balanceDue: number;
  nextDueInstallment?: AmortizationInstallment;
  schedule?: AmortizationInstallment[];
}

// 8. Pago / Recibo de Cobro
export interface Payment {
  id: string;
  paymentNumber: string;
  customerId: string;
  customerName?: string;
  creditId?: string;
  creditNumber?: string;
  amount: number;
  currency: Currency;
  paidAt: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  status: PaymentStatus;
  createdAt: string;
}

// 9. Asignación de Pago
export interface PaymentAllocation {
  id: string;
  paymentId: string;
  creditId: string;
  amount: number;
  createdAt: string;
}

// 10. DTOs de Entrada para Stored Procedures (RPCs)
export interface VentaContadoDTO {
  customerId?: string;
  currency: Currency;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface VentaCreditoDTO {
  customerId: string;
  currency: Currency;
  downPayment: number;
  installmentsCount: number;
  frequency: PaymentFrequency;
  firstPaymentDate: string; // YYYY-MM-DD
  paymentMethod?: PaymentMethod; // Para la prima
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface RegistrarAbonoDTO {
  creditId: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  notes?: string;
}

// 11. Métricas de Dashboard (Estrictamente separadas por divisa)
export interface DashboardMetrics {
  collectedToday: {
    nio: number;
    usd: number;
  };
  collectedMonth: {
    nio: number;
    usd: number;
  };
  salesMonth: {
    nio: number;
    usd: number;
  };
  totalReceivable: {
    nio: number;
    usd: number;
  };
  overdueInstallmentsCount: number;
  upcomingInstallmentsCount: number; // Próximos 7 días
  lowStockProductsCount: number;
}
