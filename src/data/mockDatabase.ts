import { Product, Client, CashShift, SaleRecord, MermaRecord } from '../types/pos';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    barcode: '7441001200101',
    name: 'Arroz Tío Pelón Grano Entero 99% (1.8 kg)',
    category: 'Abarrotes',
    costPrice: 1250,
    salePrice: 1550,
    ivaRate: 0.01, // 1% Canasta Básica
    stock: 54,
    minStock: 15,
    unit: 'UNIDAD',
    isActive: true,
  },
  {
    id: 'prod-002',
    barcode: '7441001200202',
    name: 'Frijoles Negros Don Pedro Seleccionados (900 g)',
    category: 'Abarrotes',
    costPrice: 920,
    salePrice: 1225,
    ivaRate: 0.01, // 1% Canasta Básica
    stock: 38,
    minStock: 12,
    unit: 'UNIDAD',
    isActive: true,
  },
  {
    id: 'prod-003',
    barcode: '7441001200303',
    name: 'Leche Dos Pinos Semidescremada 2% (1 Litro)',
    category: 'Lácteos',
    costPrice: 830,
    salePrice: 1045,
    ivaRate: 0.01, // 1% Canasta Básica
    stock: 65,
    minStock: 20,
    unit: 'UNIDAD',
    isActive: true,
  },
  {
    id: 'prod-004',
    barcode: '7441001200404',
    name: 'Café 1820 Clásico Tueste Oscuro Molido (500 g)',
    category: 'Abarrotes',
    costPrice: 2450,
    salePrice: 3150,
    ivaRate: 0.13, // 13% Tarifa General
    stock: 28,
    minStock: 10,
    unit: 'UNIDAD',
    isActive: true,
  },
  {
    id: 'prod-005',
    barcode: '7441001200505',
    name: 'Salsa Lizano Botella Tradicional (700 ml)',
    category: 'Abarrotes',
    costPrice: 1480,
    salePrice: 1980,
    ivaRate: 0.13, // 13% General
    stock: 19,
    minStock: 8,
    unit: 'UNIDAD',
    isActive: true,
  },
  {
    id: 'prod-006',
    barcode: '7441001200606',
    name: 'Pan Cuadrado Bimbo Blanco Grande (560 g)',
    category: 'Abarrotes',
    costPrice: 1350,
    salePrice: 1750,
    ivaRate: 0.13, // 13% General
    stock: 14,
    minStock: 6,
    unit: 'UNIDAD',
    isActive: true,
  },
  {
    id: 'prod-007',
    barcode: '7441001200707',
    name: 'Huevos de Granja Blancos Cartón (15 Unidades)',
    category: 'Lácteos',
    costPrice: 1850,
    salePrice: 2350,
    ivaRate: 0.01, // 1% Canasta Básica
    stock: 30,
    minStock: 10,
    unit: 'PAQUETE',
    isActive: true,
  },
  {
    id: 'prod-008',
    barcode: '7441001200808',
    name: 'Aceite Vegetal Clover Multiuso (1 Litro)',
    category: 'Abarrotes',
    costPrice: 1650,
    salePrice: 2150,
    ivaRate: 0.01, // 1% Canasta Básica
    stock: 22,
    minStock: 8,
    unit: 'UNIDAD',
    isActive: true,
  },
  {
    id: 'prod-009',
    barcode: '7441001200909',
    name: 'Detergente OMO Multiacción Polvo (2 kg)',
    category: 'Limpieza',
    costPrice: 3200,
    salePrice: 4250,
    ivaRate: 0.13, // 13% General
    stock: 16,
    minStock: 5,
    unit: 'UNIDAD',
    isActive: true,
  },
  {
    id: 'prod-010',
    barcode: '7441001201010',
    name: 'Jabón Líquido para Platos Axion Limón (750 ml)',
    category: 'Limpieza',
    costPrice: 1100,
    salePrice: 1550,
    ivaRate: 0.13, // 13% General
    stock: 24,
    minStock: 6,
    unit: 'UNIDAD',
    isActive: true,
  },
  {
    id: 'prod-011',
    barcode: '7441001201111',
    name: 'Agua Pura Cristal sin Gas Botella (600 ml)',
    category: 'Bebidas',
    costPrice: 350,
    salePrice: 600,
    ivaRate: 0.00, // 0% Exenta
    stock: 60,
    minStock: 15,
    unit: 'UNIDAD',
    isActive: true,
  },
  {
    id: 'prod-012',
    barcode: '7441001201212',
    name: 'Bolsa de Snacks Tronaditas Queso Jacks (120 g)',
    category: 'Snacks',
    costPrice: 650,
    salePrice: 950,
    ivaRate: 0.13, // 13% General
    stock: 35,
    minStock: 10,
    unit: 'UNIDAD',
    isActive: true,
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-001',
    fullName: 'Doña Elena Rojas Solís',
    identification: '1-1122-0334',
    phone: '8899-1122',
    email: 'elena.rojas@gmail.com',
    creditLimit: 75000,
    currentDebt: 18500,
    isActive: true,
  },
  {
    id: 'cli-002',
    fullName: 'Soda y Pulpería Los Almendros',
    identification: '3-102-554433',
    phone: '8765-4321',
    email: 'almendros.cr@outlook.com',
    creditLimit: 250000,
    currentDebt: 94000,
    isActive: true,
  },
  {
    id: 'cli-003',
    fullName: 'Carlos Villalobos Mora',
    identification: '2-0456-0789',
    phone: '8333-7766',
    email: 'carlos.vmora@hotmail.com',
    creditLimit: 50000,
    currentDebt: 0,
    isActive: true,
  }
];

export const INITIAL_SHIFT: CashShift = {
  id: 'TURNO-2026-0042',
  cashierId: 'caja-01',
  cashierName: 'Justin Murillo (Cajero 1)',
  status: 'ABIERTO',
  openingAmount: 50000,
  expectedCash: 50000,
  openedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  salesSummary: {
    cashTotal: 0,
    cardTotal: 0,
    sinpeTotal: 0,
    creditTotal: 0,
    totalTransactions: 0,
  }
};

export const INITIAL_MERMAS: MermaRecord[] = [
  {
    id: 'merma-01',
    productId: 'prod-003',
    productName: 'Leche Dos Pinos Semidescremada 2% (1 Litro)',
    quantity: 2,
    reason: 'VENCIMIENTO',
    lossCost: 1660,
    reportedBy: 'Justin Murillo',
    authorizedBy: 'Gerencia J&G',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'merma-02',
    productId: 'prod-007',
    productName: 'Huevos de Granja Blancos Cartón (15 Unidades)',
    quantity: 1,
    reason: 'EMPAQUE_DANADO',
    lossCost: 1850,
    reportedBy: 'Justin Murillo',
    authorizedBy: 'Gerencia J&G',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

/**
 * Formateador oficial de moneda en Colones de Costa Rica
 */
export function formatColones(amount: number): string {
  if (isNaN(amount) || amount === null) return '₡ 0.00';
  return '₡ ' + amount.toLocaleString('es-CR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Genera clave de 50 dígitos para tiquete electrónico según resolución DGT Costa Rica
 * Formato: 506 + DDMMYY + Cédula (12 digitos) + Consecutivo (20 dígitos) + Código Seguridad (8)
 */
export function generateDGTNumericKey(consecutiveNumber: string): string {
  const countryCode = '506';
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const companyCedula = '000310178945'; // 12 dígitos
  const paddedConsecutive = consecutiveNumber.padStart(20, '0').slice(-20);
  const securityCode = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `${countryCode}${day}${month}${year}${companyCedula}${paddedConsecutive}1${securityCode}`;
}
