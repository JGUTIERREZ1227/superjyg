import React, { useState, useEffect } from 'react';
import { Product, Client, CashShift, SaleRecord, MermaRecord, UserProfile, UserRole } from './types/pos';
import { INITIAL_PRODUCTS, INITIAL_CLIENTS, INITIAL_SHIFT, INITIAL_MERMAS } from './data/mockDatabase';
import { POSScreen } from './components/POSScreen';
import { InventoryManager } from './components/InventoryManager';
import { ClientsManager } from './components/ClientsManager';
import { CashShiftManager } from './components/CashShiftManager';
import { MermasManager } from './components/MermasManager';
import { ReportsScreen } from './components/ReportsScreen';
import { ReceiptModal } from './components/ReceiptModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import {
  ShoppingBag,
  Boxes,
  Users,
  Vault,
  FileSpreadsheet,
  LineChart,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export default function App() {
  // Estado de navegación
  const [currentTab, setCurrentTab] = useState<'pos' | 'inventory' | 'clients' | 'shifts' | 'mermas' | 'reports'>('pos');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Perfil del Usuario Activo & Conmutador de Roles para prueba de RBAC
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    return {
      uid: 'usr-caja-01',
      email: 'caja1@superjyg.cr',
      displayName: 'Justin Murillo',
      role: 'cajero',
      employeeCode: 'EMP-742',
    };
  });

  // Base de datos reactiva con persistencia local
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('superjyg_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('superjyg_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [currentShift, setCurrentShift] = useState<CashShift>(() => {
    const saved = localStorage.getItem('superjyg_shift');
    return saved ? JSON.parse(saved) : INITIAL_SHIFT;
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem('superjyg_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [mermas, setMermas] = useState<MermaRecord[]>(() => {
    const saved = localStorage.getItem('superjyg_mermas');
    return saved ? JSON.parse(saved) : INITIAL_MERMAS;
  });

  const [lastCompletedSale, setLastCompletedSale] = useState<SaleRecord | null>(null);

  // Sincronizar en localStorage
  useEffect(() => {
    localStorage.setItem('superjyg_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('superjyg_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('superjyg_shift', JSON.stringify(currentShift));
  }, [currentShift]);

  useEffect(() => {
    localStorage.setItem('superjyg_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('superjyg_mermas', JSON.stringify(mermas));
  }, [mermas]);

  // Manejadores de eventos
  const handleCompleteSale = (sale: SaleRecord) => {
    setSales(prev => [sale, ...prev]);
    setLastCompletedSale(sale);

    // Si fue a crédito, aumentar saldo del cliente
    if (sale.paymentMethod === 'CREDITO') {
      setClients(prev => prev.map(c => {
        if (c.id === sale.clientId) {
          return { ...c, currentDebt: c.currentDebt + sale.total };
        }
        return c;
      }));
    }

    // Actualizar resumen del turno
    setCurrentShift(prev => {
      const summary = { ...prev.salesSummary };
      if (sale.paymentMethod === 'EFECTIVO') summary.cashTotal += sale.total;
      else if (sale.paymentMethod === 'TARJETA') summary.cardTotal += sale.total;
      else if (sale.paymentMethod === 'SINPE_MOVIL') summary.sinpeTotal += sale.total;
      else if (sale.paymentMethod === 'CREDITO') summary.creditTotal += sale.total;
      summary.totalTransactions += 1;

      return {
        ...prev,
        expectedCash: prev.openingAmount + summary.cashTotal,
        salesSummary: summary,
      };
    });
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
  };

  const handleAddProduct = (prod: Product) => {
    setProducts(prev => [prod, ...prev]);
  };

  const handleUpdateProduct = (prod: Product) => {
    setProducts(prev => prev.map(p => p.id === prod.id ? prod : p));
  };

  const handleAddClient = (client: Client) => {
    setClients(prev => [client, ...prev]);
  };

  const handleRecordClientPayment = (clientId: string, amount: number) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        return { ...c, currentDebt: Math.max(0, c.currentDebt - amount) };
      }
      return c;
    }));
  };

  const handleRecordMerma = (merma: MermaRecord) => {
    setMermas(prev => [merma, ...prev]);
    // Decrementar existencias
    handleUpdateStock(merma.productId, Math.max(0, (products.find(p => p.id === merma.productId)?.stock || 0) - merma.quantity));
  };

  const handleCloseShift = (actualCash: number, difference: number, notes?: string) => {
    setCurrentShift(prev => ({
      ...prev,
      status: 'CERRADO',
      actualCash,
      difference,
      notes,
      closedAt: new Date().toISOString(),
    }));
  };

  const handleOpenNewShift = (openingAmount: number) => {
    const nextNumber = Math.floor(1000 + Math.random() * 9000);
    setCurrentShift({
      id: `TURNO-2026-${nextNumber}`,
      cashierId: currentUser.uid,
      cashierName: currentUser.displayName,
      status: 'ABIERTO',
      openingAmount,
      expectedCash: openingAmount,
      openedAt: new Date().toISOString(),
      salesSummary: {
        cashTotal: 0,
        cardTotal: 0,
        sinpeTotal: 0,
        creditTotal: 0,
        totalTransactions: 0,
      }
    });
  };

  const handleResetData = () => {
    if (window.confirm('¿Desea restaurar los datos de fábrica de SUPER J Y G (productos, turnos, clientes)?')) {
      localStorage.clear();
      setProducts(INITIAL_PRODUCTS);
      setClients(INITIAL_CLIENTS);
      setCurrentShift(INITIAL_SHIFT);
      setSales([]);
      setMermas(INITIAL_MERMAS);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 flex flex-col font-sans select-none">
      
      {/* =====================================================================
          1. HEADER CORPORATIVO SUPER J Y G
          ===================================================================== */}
      <header className="bg-teal-900 text-white shadow-md sticky top-0 z-40 border-b border-teal-800">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo y Razón Social */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700/80 border border-teal-500/40 flex items-center justify-center font-black text-xl tracking-tight shadow-xs">
              J&G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight leading-tight">SUPER J Y G</h1>
                <span className="text-[10px] bg-teal-800 text-teal-200 border border-teal-600/50 px-2 py-0.5 rounded-full font-bold">
                  POS v2.4 Costa Rica
                </span>
              </div>
              <p className="text-[11px] text-teal-300 font-medium">
                Cédula Jurídica: 3-101-789456 | DGT Ley 9635 (IVA 13%, 1%, 0%)
              </p>
            </div>
          </div>

          {/* Barra de Estado, Turno y Conmutador de Roles */}
          <div className="flex items-center gap-3 text-xs">
            
            {/* Estado del Turno */}
            <div className="bg-teal-950/60 px-3 py-1.5 rounded-xl border border-teal-800/80 flex items-center gap-2 font-mono">
              <span className={`w-2.5 h-2.5 rounded-full ${currentShift.status === 'ABIERTO' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>{currentShift.id}</span>
              <span className="text-teal-500">|</span>
              <span className="text-teal-200 font-sans font-medium">{currentShift.status}</span>
            </div>

            {/* Selector de Rol en Caliente (RBAC Live Testing) */}
            <div className="flex items-center bg-teal-950/70 p-0.5 rounded-xl border border-teal-800">
              <button
                onClick={() => setCurrentUser(prev => ({ ...prev, role: 'cajero', displayName: 'Justin Murillo (Cajero)' }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  currentUser.role === 'cajero'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-teal-300 hover:text-white'
                }`}
                title="Cambiar a rol Cajero para probar restricciones"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Cajero</span>
              </button>
              <button
                onClick={() => setCurrentUser(prev => ({ ...prev, role: 'admin', displayName: 'Gerente J&G (Admin)' }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  currentUser.role === 'admin'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-teal-300 hover:text-white'
                }`}
                title="Cambiar a rol Administrador para acceso total"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>

            {/* Botón de Auditoría de Código y Arquitectura */}
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Código & Seguridad</span>
            </button>

            {/* Resetear Sandbox */}
            <button
              onClick={handleResetData}
              className="p-1.5 text-teal-300 hover:text-white hover:bg-teal-800 rounded-lg transition"
              title="Restaurar datos de prueba iniciales"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Barra de Navegación por Pestañas */}
        <nav className="bg-teal-950/90 px-4 border-t border-teal-800/60">
          <div className="max-w-7xl mx-auto flex space-x-1 text-xs font-bold overflow-x-auto py-1">
            {[
              { id: 'pos', label: 'Terminal POS (Caja)', icon: ShoppingBag },
              { id: 'inventory', label: 'Inventario & Precios', icon: Boxes },
              { id: 'clients', label: 'Clientes & Créditos', icon: Users },
              { id: 'shifts', label: 'Arqueo de Turno', icon: Vault },
              { id: 'mermas', label: 'Mermas & Bajas', icon: FileSpreadsheet },
              { id: 'reports', label: 'Reportes Fiscales DGT', icon: LineChart },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-teal-300 hover:text-white hover:bg-teal-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* =====================================================================
          2. CONTENIDO PRINCIPAL POR VISTAS
          ===================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-5">
        {currentTab === 'pos' && (
          <POSScreen
            products={products}
            clients={clients}
            currentShift={currentShift}
            currentUser={currentUser}
            onCompleteSale={handleCompleteSale}
            onUpdateStock={handleUpdateStock}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryManager
            products={products}
            userRole={currentUser.role}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
          />
        )}

        {currentTab === 'clients' && (
          <ClientsManager
            clients={clients}
            userRole={currentUser.role}
            onAddClient={handleAddClient}
            onRecordPayment={handleRecordClientPayment}
          />
        )}

        {currentTab === 'shifts' && (
          <CashShiftManager
            currentShift={currentShift}
            sales={sales}
            onCloseShift={handleCloseShift}
            onOpenNewShift={handleOpenNewShift}
          />
        )}

        {currentTab === 'mermas' && (
          <MermasManager
            mermas={mermas}
            products={products}
            currentUser={currentUser}
            onRecordMerma={handleRecordMerma}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsScreen
            sales={sales}
          />
        )}
      </main>

      {/* Modal de Tiquete Térmico Post-Venta */}
      <ReceiptModal
        sale={lastCompletedSale}
        onClose={() => setLastCompletedSale(null)}
      />

      {/* Modal de Auditoría de Código y Arquitectura para el Usuario */}
      <ArchitectureModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      {/* Contenedor Oculto para Impresión Térmica ESC/POS (80mm) */}
      <div id="thermal-receipt" className="hidden"></div>

      {/* Pie de Página */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-center text-xs text-slate-400">
        SUPER J Y G © 2026 - San José, Costa Rica. Plataforma POS Empresarial con Facturación Electrónica e IVA DGT.
      </footer>

    </div>
  );
}
