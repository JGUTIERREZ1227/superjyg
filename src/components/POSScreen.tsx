import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem, Client, PaymentMethod, SaleRecord, UserProfile, CashShift } from '../types/pos';
import { formatColones, generateDGTNumericKey } from '../data/mockDatabase';
import confetti from 'canvas-confetti';
import {
  Barcode,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Smartphone,
  BookOpen,
  UserCheck,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Check
} from 'lucide-react';

interface POSScreenProps {
  products: Product[];
  clients: Client[];
  currentShift: CashShift;
  currentUser: UserProfile;
  onCompleteSale: (sale: SaleRecord) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
}

export const POSScreen: React.FC<POSScreenProps> = ({
  products,
  clients,
  currentShift,
  currentUser,
  onCompleteSale,
  onUpdateStock,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedClient, setSelectedClient] = useState<Client>({
    id: 'CLIENTE_GENERAL',
    fullName: 'CLIENTE GENERAL (CONTADO)',
    identification: '0-0000-0000',
    phone: '',
    creditLimit: 0,
    currentDebt: 0,
    isActive: true,
  });

  // Modal de cobro y opciones de pago
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Cálculos tributarios según DGT Costa Rica (IVA 13%, 1%, 0%)
  const subtotalNeto = cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);
  
  const iva1CanastaBasica = cart.reduce((acc, item) => {
    if (item.product.ivaRate === 0.01) {
      return acc + (item.product.salePrice * item.quantity * 0.01);
    }
    return acc;
  }, 0);

  const iva13TarifaGeneral = cart.reduce((acc, item) => {
    if (item.product.ivaRate === 0.13) {
      return acc + (item.product.salePrice * item.quantity * 0.13);
    }
    return acc;
  }, 0);

  const ventasExentas = cart.reduce((acc, item) => {
    if (item.product.ivaRate === 0) {
      return acc + (item.product.salePrice * item.quantity);
    }
    return acc;
  }, 0);

  const totalIvaRecaudado = Math.round((iva1CanastaBasica + iva13TarifaGeneral) * 100) / 100;
  const grandTotal = Math.round((subtotalNeto + totalIvaRecaudado) * 100) / 100;

  const amountPaidNumber = parseFloat(amountPaidInput) || 0;
  const calculatedChange = Math.max(0, amountPaidNumber - grandTotal);

  // Atajos de teclado del Cajero [F1], [F4], [F9], [Escape]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        if (isPaymentModalOpen) {
          handleExecutePayment();
        } else if (cart.length > 0) {
          handleOpenPaymentModal();
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        setIsClientModalOpen(prev => !prev);
      } else if (e.key === 'F9') {
        e.preventDefault();
        handleClearCart();
      } else if (e.key === 'Escape') {
        setIsPaymentModalOpen(false);
        setIsClientModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isPaymentModalOpen, grandTotal, amountPaidNumber, paymentMethod, selectedClient]);

  // Manejo de escaneo de código de barras
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const found = products.find(p => p.barcode === code || p.id.toLowerCase() === code.toLowerCase());
    if (found) {
      handleAddToCart(found);
      setBarcodeInput('');
    } else {
      alert(`Código "${code}" no encontrado en el inventario.`);
    }
  };

  const handleAddToCart = (product: Product) => {
    if (!product.isActive) {
      alert('Este producto está marcado como inactivo.');
      return;
    }

    const currentInCart = cart.find(it => it.product.id === product.id)?.quantity || 0;
    if (currentInCart + 1 > product.stock) {
      alert(`Stock insuficiente. Solo quedan ${product.stock} unidades de ${product.name}.`);
      return;
    }

    setCart(prev => {
      const idx = prev.findIndex(it => it.product.id === product.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQty <= 0) {
      setCart(prev => prev.filter(it => it.product.id !== productId));
      return;
    }

    if (newQty > product.stock) {
      alert(`No puede agregar más de ${product.stock} unidades disponibles.`);
      return;
    }

    setCart(prev => prev.map(it => it.product.id === productId ? { ...it, quantity: newQty } : it));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('¿Desea limpiar todos los productos de la venta actual? [F9]')) {
      setCart([]);
    }
  };

  const handleOpenPaymentModal = () => {
    if (cart.length === 0) return;
    setAmountPaidInput(grandTotal.toString());
    setPaymentMethod('EFECTIVO');
    setIsPaymentModalOpen(true);
  };

  const handleExecutePayment = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'EFECTIVO' && amountPaidNumber < grandTotal) {
      alert(`El monto entregado (${formatColones(amountPaidNumber)}) es menor al total a pagar (${formatColones(grandTotal)}).`);
      return;
    }

    if (paymentMethod === 'CREDITO') {
      if (selectedClient.id === 'CLIENTE_GENERAL') {
        alert('Debe seleccionar un cliente con cuenta corriente registrada para facturar a Crédito.');
        setIsClientModalOpen(true);
        return;
      }
      const availableCredit = selectedClient.creditLimit - selectedClient.currentDebt;
      if (grandTotal > availableCredit) {
        alert(`Crédito insuficiente. Límite: ${formatColones(selectedClient.creditLimit)}, Saldo actual: ${formatColones(selectedClient.currentDebt)}. Crédito disponible: ${formatColones(availableCredit)}.`);
        return;
      }
    }

    // Generar registro inmutable de venta
    const consecutive = String(Date.now()).slice(-8);
    const invoiceKey = generateDGTNumericKey(consecutive);

    const saleRecord: SaleRecord = {
      id: `sale-${Date.now()}`,
      invoiceNumber: invoiceKey,
      createdAt: new Date().toISOString(),
      cashierId: currentUser.uid,
      cashierName: currentUser.displayName,
      clientId: selectedClient.id,
      clientName: selectedClient.fullName,
      clientDoc: selectedClient.identification,
      paymentMethod,
      paymentReference: paymentRef || undefined,
      items: cart.map(item => {
        const lineNet = item.product.salePrice * item.quantity;
        const lineTax = lineNet * item.product.ivaRate;
        return {
          productId: item.product.id,
          barcode: item.product.barcode,
          name: item.product.name,
          unitPrice: item.product.salePrice,
          ivaRate: item.product.ivaRate,
          quantity: item.quantity,
          lineSubtotal: lineNet,
          lineIva: lineTax,
          lineTotal: lineNet + lineTax,
        };
      }),
      subtotal: subtotalNeto,
      iva1: iva1CanastaBasica,
      iva13: iva13TarifaGeneral,
      exento: ventasExentas,
      totalIva: totalIvaRecaudado,
      total: grandTotal,
      amountPaid: paymentMethod === 'EFECTIVO' ? amountPaidNumber : grandTotal,
      change: paymentMethod === 'EFECTIVO' ? calculatedChange : 0,
      status: 'COMPLETADA',
      shiftId: currentShift.id,
    };

    // Descontar inventario
    cart.forEach(item => {
      onUpdateStock(item.product.id, item.product.stock - item.quantity);
    });

    // Notificar al componente padre
    onCompleteSale(saleRecord);

    // Animación de confeti
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // Ignorar si el canvas no está disponible
    }

    // Resetear formulario
    setCart([]);
    setIsPaymentModalOpen(false);
    setPaymentRef('');
    setSelectedClient({
      id: 'CLIENTE_GENERAL',
      fullName: 'CLIENTE GENERAL (CONTADO)',
      identification: '0-0000-0000',
      phone: '',
      creditLimit: 0,
      currentDebt: 0,
      isActive: true,
    });
  };

  // Filtrado de productos en catálogo
  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.barcode.includes(searchFilter);
    return matchCategory && matchSearch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      
      {/* ---------------------------------------------------------------------
          SECCIÓN IZQUIERDA: LECTOR DE CÓDIGOS, FILTROS Y CATÁLOGO TÁCTIL (7 col)
          --------------------------------------------------------------------- */}
      <div className="lg:col-span-7 flex flex-col gap-3">
        
        {/* Barra superior de Escaneo y Búsqueda */}
        <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col sm:flex-row gap-2.5">
          <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
            <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Pase código de barras o digite..."
              className="w-full pl-11 pr-20 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 font-mono text-sm tracking-wide bg-slate-50/50"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-teal-800 text-white rounded-lg text-xs font-bold hover:bg-teal-900 transition"
            >
              Enter
            </button>
          </form>

          <div className="relative sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filtrar por nombre..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 text-xs bg-slate-50/50"
            />
          </div>
        </div>

        {/* Categorías de Acceso Rápido */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {['ALL', 'Abarrotes', 'Lácteos', 'Bebidas', 'Limpieza', 'Snacks'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition border ${
                selectedCategory === cat
                  ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'Todos los Productos' : cat}
            </button>
          ))}
        </div>

        {/* Atajos de Teclado del Cajero */}
        <div className="bg-teal-50 border border-teal-200/70 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-teal-950 font-medium">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-teal-300 rounded font-mono font-bold text-[11px] shadow-2xs">[F1]</kbd>
              <span>Cobrar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-teal-300 rounded font-mono font-bold text-[11px] shadow-2xs">[F4]</kbd>
              <span>Cliente</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-teal-300 rounded font-mono font-bold text-[11px] shadow-2xs">[F9]</kbd>
              <span>Cancelar</span>
            </span>
          </div>
          <span className="text-[11px] text-teal-800 font-mono">DGT Costa Rica</span>
        </div>

        {/* Cuadrícula de Productos para Venta Rápida */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredProducts.map(product => {
            const isLowStock = product.stock <= product.minStock;
            return (
              <div
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className="bg-white p-3 rounded-2xl border border-slate-200/80 hover:border-teal-600 hover:shadow-md cursor-pointer transition flex flex-col justify-between select-none group"
              >
                <div>
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {product.category}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isLowStock ? 'bg-rose-100 text-rose-700 font-extrabold' : 'bg-slate-100 text-slate-600'
                    }`}>
                      Stock: {product.stock}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-teal-900 line-clamp-2 leading-snug">
                    {product.name}
                  </h4>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    {product.barcode}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black font-mono text-teal-800">
                    {formatColones(product.salePrice)}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-50 text-slate-500">
                    {product.ivaRate === 0.13 ? 'IVA 13%' : product.ivaRate === 0.01 ? 'IVA 1% CB' : 'Exento'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ---------------------------------------------------------------------
          SECCIÓN DERECHA: CARRITO, DESGLOSE DGT Y BOTÓN DE COBRO (5 col)
          --------------------------------------------------------------------- */}
      <div className="lg:col-span-5 bg-white rounded-2xl shadow-xs border border-slate-200/90 flex flex-col h-[670px]">
        
        {/* Cabecera del Carrito y Selección de Cliente */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-800">Detalle de Venta</span>
              <span className="ml-2 bg-teal-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {cart.reduce((a, b) => a + b.quantity, 0)} arts
              </span>
            </div>
          </div>

          {/* Botón de selección de cliente */}
          <button
            onClick={() => setIsClientModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold transition"
            title="Seleccionar cliente para venta al contado o a crédito [F4]"
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-700" />
            <span className="truncate max-w-[120px]">{selectedClient.fullName.split(' ')[0]}</span>
            <span className="text-[10px] text-teal-600 font-mono">[F4]</span>
          </button>
        </div>

        {/* Lista de productos en el carrito */}
        <div className="flex-1 overflow-y-auto p-2.5 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-3">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-700">El carrito está vacío</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Pase el lector sobre un código de barras o haga clic en un producto de la izquierda
              </p>
            </div>
          ) : (
            cart.map(item => {
              const lineTotal = (item.product.salePrice * item.quantity) * (1 + item.product.ivaRate);
              return (
                <div key={item.product.id} className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition">
                  <div className="flex-1 pr-2">
                    <h5 className="text-xs font-bold text-slate-900 leading-tight">
                      {item.product.name}
                    </h5>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{formatColones(item.product.salePrice)}</span>
                      <span>×</span>
                      <span className="font-bold text-slate-800">{item.quantity}</span>
                      <span>=</span>
                      <strong className="text-teal-800 font-black">{formatColones(lineTotal)}</strong>
                      <span className="text-[9.5px] px-1 rounded bg-slate-100 text-slate-600 font-semibold">
                        {(item.product.ivaRate * 100).toFixed(0)}% IVA
                      </span>
                    </div>
                  </div>

                  {/* Controles de cantidad */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center font-mono font-bold text-xs text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, 0)}
                      className="w-7 h-7 rounded-lg hover:bg-rose-50 text-rose-500 flex items-center justify-center ml-1 transition"
                      title="Eliminar del carrito"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desglose Tributario DGT Costa Rica */}
        <div className="bg-slate-50/80 p-3.5 border-t border-slate-200 text-xs font-mono space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal Neto:</span>
            <span>{formatColones(subtotalNeto)}</span>
          </div>
          <div className="flex justify-between text-slate-500 text-[11px]">
            <span>IVA Canasta Básica (1%):</span>
            <span>{formatColones(iva1CanastaBasica)}</span>
          </div>
          <div className="flex justify-between text-slate-500 text-[11px]">
            <span>IVA Tarifa General (13%):</span>
            <span>{formatColones(iva13TarifaGeneral)}</span>
          </div>
          <div className="flex justify-between text-slate-500 text-[11px]">
            <span>Ventas Exentas (0%):</span>
            <span>{formatColones(ventasExentas)}</span>
          </div>
          <div className="border-t border-dashed border-slate-300 pt-1.5 my-1 flex justify-between items-baseline">
            <span className="text-xs font-extrabold text-slate-900 uppercase">TOTAL A COBRAR:</span>
            <span className="text-xl font-black text-teal-800 font-mono tracking-tight">
              {formatColones(grandTotal)}
            </span>
          </div>
        </div>

        {/* Botones de Acción de Cajero */}
        <div className="p-3 bg-white border-t border-slate-200 rounded-b-2xl grid grid-cols-3 gap-2">
          <button
            onClick={handleClearCart}
            disabled={cart.length === 0}
            className="col-span-1 py-3 px-3 rounded-xl border border-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-slate-600 font-bold text-xs flex flex-col items-center justify-center transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>Cancelar</span>
            <span className="text-[10px] font-mono text-slate-400">[F9]</span>
          </button>

          <button
            onClick={handleOpenPaymentModal}
            disabled={cart.length === 0}
            className="col-span-2 py-3 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 active:scale-[0.99] text-white font-black text-sm tracking-wide shadow-md transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Banknote className="w-5 h-5" />
            <span>COBRAR <span className="text-xs font-mono opacity-80">[F1]</span></span>
          </button>
        </div>

      </div>

      {/* ---------------------------------------------------------------------
          MODAL DE PAGO Y FACTURACIÓN ELECTRÓNICA
          --------------------------------------------------------------------- */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="bg-teal-800 text-white p-4.5 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-base">Comprobante de Pago & Cobro</h3>
                <p className="text-xs text-teal-200">SUPER J Y G | Costa Rica</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-teal-200 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              
              {/* Pantalla del Total */}
              <div className="bg-teal-50 border border-teal-200/80 rounded-2xl p-4 text-center">
                <span className="text-xs font-bold uppercase text-teal-800 tracking-wider">Total a Cancelar</span>
                <div className="text-3xl font-black font-mono text-teal-900 mt-1">
                  {formatColones(grandTotal)}
                </div>
              </div>

              {/* Selector de Método de Pago */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Forma de Pago:</label>
                <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                  {[
                    { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                    { id: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
                    { id: 'SINPE_MOVIL', label: 'SINPE Móvil', icon: Smartphone },
                    { id: 'CREDITO', label: 'Crédito', icon: BookOpen },
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isSelected = paymentMethod === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setPaymentMethod(tab.id as PaymentMethod)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                          isSelected
                            ? 'bg-teal-800 text-white border-teal-800 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Formulario según método de pago */}
              {paymentMethod === 'EFECTIVO' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Monto Recibido del Cliente (₡):
                    </label>
                    <input
                      type="number"
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(e.target.value)}
                      className="w-full text-xl font-mono font-bold p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600"
                      autoFocus
                    />
                  </div>

                  {/* Billetes rápidos comunes en Costa Rica */}
                  <div className="flex flex-wrap gap-1.5">
                    {[1000, 2000, 5000, 10000, 20000].map(den => (
                      <button
                        key={den}
                        type="button"
                        onClick={() => setAmountPaidInput(den.toString())}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold transition"
                      >
                        +{formatColones(den)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAmountPaidInput(grandTotal.toString())}
                      className="px-2.5 py-1 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-800 font-mono text-xs font-bold transition"
                    >
                      Exacto
                    </button>
                  </div>

                  {/* Cálculo de Vuelto */}
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-900 uppercase">Vuelto / Cambio:</span>
                      <p className="text-[10px] text-emerald-700">Entregar al cliente</p>
                    </div>
                    <span className="text-2xl font-black font-mono text-emerald-900">
                      {formatColones(calculatedChange)}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'SINPE_MOVIL' && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <strong>Número SINPE del Negocio:</strong> 8899-1122 (SUPER J Y G)
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Número de Comprobante / Teléfono Emisor:
                    </label>
                    <input
                      type="text"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="Ej: Comprobante 498124 / 8888-9999"
                      className="w-full text-sm font-mono p-2.5 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'TARJETA' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Autorización de Datafono (POS):
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="Ej: AUTH-928371"
                    className="w-full text-sm font-mono p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              )}

              {paymentMethod === 'CREDITO' && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cliente Autorizado:</span>
                    <strong className="text-slate-800">{selectedClient.fullName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Límite de Crédito:</span>
                    <span className="font-mono">{formatColones(selectedClient.creditLimit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Saldo Pendiente:</span>
                    <span className="font-mono text-rose-600">{formatColones(selectedClient.currentDebt)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-1 flex justify-between font-bold">
                    <span>Crédito Disponible:</span>
                    <span className="font-mono text-emerald-700">
                      {formatColones(selectedClient.creditLimit - selectedClient.currentDebt)}
                    </span>
                  </div>
                </div>
              )}

              {/* Botón de Confirmación y Emisión */}
              <button
                type="button"
                onClick={handleExecutePayment}
                className="w-full py-3.5 px-4 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-black text-sm shadow-lg shadow-teal-900/10 transition flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>Confirmar Venta e Imprimir Comprobante</span>
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          MODAL DE SELECCIÓN DE CLIENTE (CARTERA / CRÉDITO)
          --------------------------------------------------------------------- */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-teal-800 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">Seleccionar Cliente para Facturación</h3>
              <button onClick={() => setIsClientModalOpen(false)} className="text-teal-200 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-2.5 max-h-[400px] overflow-y-auto">
              {/* Opción Cliente General */}
              <div
                onClick={() => {
                  setSelectedClient({
                    id: 'CLIENTE_GENERAL',
                    fullName: 'CLIENTE GENERAL (CONTADO)',
                    identification: '0-0000-0000',
                    phone: '',
                    creditLimit: 0,
                    currentDebt: 0,
                    isActive: true,
                  });
                  setIsClientModalOpen(false);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  selectedClient.id === 'CLIENTE_GENERAL'
                    ? 'border-teal-600 bg-teal-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs text-slate-800">CLIENTE GENERAL (CONTADO)</div>
                <div className="text-[11px] text-slate-500">Tiquete electrónico estándar sin crédito</div>
              </div>

              {clients.map(cli => (
                <div
                  key={cli.id}
                  onClick={() => {
                    setSelectedClient(cli);
                    setIsClientModalOpen(false);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    selectedClient.id === cli.id
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-slate-900">{cli.fullName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {cli.identification}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between font-mono">
                    <span>Límite: {formatColones(cli.creditLimit)}</span>
                    <span className="text-rose-600">Deuda: {formatColones(cli.currentDebt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
