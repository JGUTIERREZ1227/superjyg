/**
 * Definiciones de Tipos de Datos TypeScript
 * SUPER J Y G - Costa Rica POS
 */

export type UserRole = 'admin' | 'cajero' | 'auditor';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  employeeCode: string;
  avatarUrl?: string;
}

export type TaxRate = 0 | 0.01 | 0.02 | 0.13;

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: 'Abarrotes' | 'Lácteos' | 'Bebidas' | 'Carnicería' | 'Limpieza' | 'Snacks';
  costPrice: number;    // Precio de costo en ₡
  salePrice: number;    // Precio de venta neto en ₡
  ivaRate: TaxRate;     // 0%, 1% Canasta Básica, 2%, 13% General
  stock: number;
  minStock: number;
  unit: 'UNIDAD' | 'KG' | 'LITRO' | 'PAQUETE';
  isActive: boolean;
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'SINPE_MOVIL' | 'CREDITO';

export interface Client {
  id: string;
  fullName: string;
  identification: string; // Cédula física (9 dígitos) o jurídica (10 dígitos)
  phone: string;
  email?: string;
  creditLimit: number;    // Límite autorizado en ₡
  currentDebt: number;    // Saldo adeudado actual en ₡
  isActive: boolean;
}

export interface SaleRecord {
  id: string;
  invoiceNumber: string; // Clave numérica de 50 dígitos DGT
  createdAt: string;
  cashierId: string;
  cashierName: string;
  clientId: string;
  clientName: string;
  clientDoc: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  items: {
    productId: string;
    barcode: string;
    name: string;
    unitPrice: number;
    ivaRate: TaxRate;
    quantity: number;
    lineSubtotal: number;
    lineIva: number;
    lineTotal: number;
  }[];
  subtotal: number;
  iva1: number;
  iva13: number;
  exento: number;
  totalIva: number;
  total: number;
  amountPaid: number;
  change: number;
  status: 'COMPLETADA' | 'ANULADA';
  shiftId: string;
}

export interface CashShift {
  id: string;
  cashierId: string;
  cashierName: string;
  status: 'ABIERTO' | 'CERRADO';
  openingAmount: number;   // Fondo inicial en ₡
  expectedCash: number;    // Fondo inicial + ventas efectivo
  actualCash?: number;     // Efectivo contado en arqueo ciego
  difference?: number;     // Sobrante (+) o Faltante (-)
  openedAt: string;
  closedAt?: string;
  notes?: string;
  salesSummary: {
    cashTotal: number;
    cardTotal: number;
    sinpeTotal: number;
    creditTotal: number;
    totalTransactions: number;
  };
}

export type MermaReason = 'VENCIMIENTO' | 'EMPAQUE_DANADO' | 'CONSUMO_INTERNO' | 'ROBO_EXTRAVIO' | 'DESCONGELAMIENTO';

export interface MermaRecord {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: MermaReason;
  lossCost: number;       // Costo total de pérdida en ₡
  reportedBy: string;
  authorizedBy?: string;
  createdAt: string;
}
