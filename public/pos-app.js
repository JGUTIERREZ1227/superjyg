/**
 * ============================================================================
 * SUPER J Y G - SISTEMA DE PUNTO DE VENTA (POS) Y GESTIÓN CORPORATIVA
 * ============================================================================
 * Arquitectura de Software: Vanilla JavaScript Modular (ES6+)
 * Localización: Costa Rica (DGT - Impuesto sobre el Valor Agregado Ley 9635)
 * Moneda: Colones costarricenses (₡ CRC)
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. CONFIGURACIÓN OFICIAL DE FIREBASE: SUPER J Y G
// ----------------------------------------------------------------------------
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDjOCZC3fo762AsFC24DmeuYWndZmCjer0",
  authDomain: "super-j-y-g.firebaseapp.com",
  projectId: "super-j-y-g",
  storageBucket: "super-j-y-g.firebasestorage.app",
  messagingSenderId: "1083199282335",
  appId: "1:1083199282335:web:d84c89a4728acd55d3d6aa",
  measurementId: "G-EZ94G2H0HW"
};

const POS_CONFIG = {
  companyName: "SUPER J Y G",
  legalId: "3-101-789456",
  location: "San José, Costa Rica",
  phone: "+506 2222-8899",
  currencySymbol: "₡",
  taxRates: {
    CANASTA_BASICA: 0.01, // 1% Ley Alivio Fiscal
    MEDICAMENTOS: 0.02,   // 2%
    GENERAL: 0.13,        // 13% Tarifa General DGT
    EXENTO: 0.00          // 0%
  }
};

// Estado reactivo en memoria
const AppState = {
  currentUser: {
    uid: "cajero_01",
    displayName: "Justin Murillo",
    email: "caja1@superjyg.cr",
    role: "cajero" // 'cajero' | 'admin'
  },
  currentShift: {
    id: "TURNO-2026-0042",
    status: "ABIERTO",
    openingAmount: 50000,
    cashSales: 0,
    cardSales: 0,
    sinpeSales: 0,
    creditSales: 0,
    openedAt: new Date().toISOString()
  },
  selectedClient: {
    id: "CLIENTE_GENERAL",
    fullName: "CLIENTE GENERAL",
    identification: "0-0000-0000",
    creditLimit: 0,
    currentDebt: 0
  },
  cart: [],
  selectedPaymentMethod: "EFECTIVO", // EFECTIVO, TARJETA, SINPE_MOVIL, CREDITO
  products: [
    { id: "P001", barcode: "74410012001", name: "Arroz Tío Pelón Grano Entero 1.8kg", category: "Abarrotes", costPrice: 1200, salePrice: 1550, ivaRate: 0.01, stock: 45, unit: "UNIDAD" },
    { id: "P002", barcode: "74410012002", name: "Frijoles Negros Don Pedro 900g", category: "Abarrotes", costPrice: 950, salePrice: 1250, ivaRate: 0.01, stock: 32, unit: "UNIDAD" },
    { id: "P003", barcode: "74410012003", name: "Leche Dos Pinos Semidescremada 1L", category: "Lácteos", costPrice: 850, salePrice: 1050, ivaRate: 0.01, stock: 60, unit: "UNIDAD" },
    { id: "P004", barcode: "74410012004", name: "Café 1820 Clásico Molido 500g", category: "Abarrotes", costPrice: 2400, salePrice: 3100, ivaRate: 0.13, stock: 20, unit: "UNIDAD" },
    { id: "P005", barcode: "74410012005", name: "Salsa Lizano Botella Original 700ml", category: "Abarrotes", costPrice: 1500, salePrice: 1950, ivaRate: 0.13, stock: 18, unit: "UNIDAD" },
    { id: "P006", barcode: "74410012006", name: "Pan Cuadrado Bimbo Blanco Grande", category: "Abarrotes", costPrice: 1300, salePrice: 1700, ivaRate: 0.13, stock: 14, unit: "UNIDAD" },
    { id: "P007", barcode: "74410012007", name: "Huevos de Granja Blancos Cartón 15u", category: "Lácteos", costPrice: 1800, salePrice: 2300, ivaRate: 0.01, stock: 25, unit: "PAQUETE" },
    { id: "P008", barcode: "74410012008", name: "Detergente OMO Concentrado 2kg", category: "Limpieza", costPrice: 3200, salePrice: 4200, ivaRate: 0.13, stock: 15, unit: "UNIDAD" },
    { id: "P009", barcode: "74410012009", name: "Agua Pura Cristal 600ml (Exenta)", category: "Bebidas", costPrice: 400, salePrice: 650, ivaRate: 0.00, stock: 50, unit: "UNIDAD" }
  ],
  clients: [
    { id: "C001", fullName: "Doña Elena Rojas Solís", identification: "1-1122-0334", phone: "8899-1122", creditLimit: 75000, currentDebt: 18500, isActive: true },
    { id: "C002", fullName: "Soda y Pulpería Los Almendros", identification: "3-102-554433", phone: "8765-4321", creditLimit: 250000, currentDebt: 94000, isActive: true },
    { id: "C003", fullName: "Carlos Villalobos Mora", identification: "2-0456-0789", phone: "8333-7766", creditLimit: 50000, currentDebt: 0, isActive: true }
  ],
  salesHistory: [],
  mermas: []
};

// ----------------------------------------------------------------------------
// 2. FORMATEO MONETARIO Y MATEMÁTICA FINANCIERA SEGURA
// ----------------------------------------------------------------------------
/**
 * Formatea un número al estándar monetario de Colones (₡ #,##0.00)
 */
function formatCRC(amount) {
  if (isNaN(amount) || amount === null) return "₡ 0.00";
  return POS_CONFIG.currencySymbol + " " + Number(amount).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Sanitiza valores de entrada para prevenir inyección en el DOM
 */
function sanitizeHTML(str) {
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}

// ----------------------------------------------------------------------------
// 3. MOTOR DE CÁLCULO DE IMPUESTOS (IVA COSTA RICA)
// ----------------------------------------------------------------------------
function calculateCartTotals() {
  let subtotal = 0;
  let iva1 = 0;
  let iva13 = 0;
  let exento = 0;

  AppState.cart.forEach(item => {
    const lineNet = item.price * item.quantity;
    subtotal += lineNet;

    if (item.ivaRate === 0.01) {
      iva1 += lineNet * 0.01;
    } else if (item.ivaRate === 0.13) {
      iva13 += lineNet * 0.13;
    } else if (item.ivaRate === 0) {
      exento += lineNet;
    }
  });

  // Redondeo bancario a 2 decimales para evitar problemas de precisión flotante
  subtotal = Math.round(subtotal * 100) / 100;
  iva1 = Math.round(iva1 * 100) / 100;
  iva13 = Math.round(iva13 * 100) / 100;
  exento = Math.round(exento * 100) / 100;
  const totalIva = iva1 + iva13;
  const grandTotal = Math.round((subtotal + totalIva) * 100) / 100;

  return { subtotal, iva1, iva13, exento, totalIva, grandTotal };
}

// ----------------------------------------------------------------------------
// 4. GESTIÓN DEL CARRITO DE COMPRAS
// ----------------------------------------------------------------------------
function addToCart(product, quantity = 1) {
  // Verificación de stock disponible
  const existingItem = AppState.cart.find(item => item.productId === product.id);
  const currentInCart = existingItem ? existingItem.quantity : 0;

  if (currentInCart + quantity > product.stock) {
    alert(`Stock insuficiente para "${product.name}". Existencias actuales: ${product.stock}`);
    return;
  }

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    AppState.cart.push({
      productId: product.id,
      barcode: product.barcode,
      name: product.name,
      price: product.salePrice,
      ivaRate: product.ivaRate,
      quantity: quantity
    });
  }

  renderCart();
}

function updateCartQuantity(productId, newQty) {
  const itemIndex = AppState.cart.findIndex(item => item.productId === productId);
  if (itemIndex === -1) return;

  const product = AppState.products.find(p => p.id === productId);
  if (!product) return;

  if (newQty <= 0) {
    AppState.cart.splice(itemIndex, 1);
  } else if (newQty > product.stock) {
    alert(`La cantidad requerida supera el stock disponible (${product.stock} unidades).`);
  } else {
    AppState.cart[itemIndex].quantity = newQty;
  }

  renderCart();
}

function clearCart() {
  if (AppState.cart.length > 0) {
    if (confirm("¿Desea cancelar y limpiar todos los productos de la venta actual?")) {
      AppState.cart = [];
      renderCart();
    }
  }
}

// ----------------------------------------------------------------------------
// 5. ESCÁNER DE CÓDIGO DE BARRAS & TECLADO
// ----------------------------------------------------------------------------
function handleBarcodeScan(barcode) {
  const cleanCode = barcode.trim();
  if (!cleanCode) return;

  const product = AppState.products.find(p => p.barcode === cleanCode);
  if (product) {
    addToCart(product, 1);
    const barcodeInput = document.getElementById("pos-barcode-input");
    if (barcodeInput) {
      barcodeInput.value = "";
      barcodeInput.focus();
    }
  } else {
    alert(`No se encontró ningún producto con el código de barras: ${cleanCode}`);
  }
}

// ----------------------------------------------------------------------------
// 6. RENDERIZADO DEL INTERFAZ DEL POS
// ----------------------------------------------------------------------------
function renderQuickProducts() {
  const container = document.getElementById("pos-quick-products");
  if (!container) return;

  const filter = document.getElementById("pos-category-filter")?.value || "ALL";

  const filtered = AppState.products.filter(p => {
    return filter === "ALL" || p.category === filter;
  });

  container.innerHTML = filtered.map(p => {
    const isLow = p.stock <= 5;
    return `
      <div 
        class="bg-white p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-md cursor-pointer transition flex flex-col justify-between select-none"
        onclick="window.posApp.addProductById('${p.id}')"
      >
        <div>
          <div class="flex justify-between items-start mb-1">
            <span class="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              ${sanitizeHTML(p.category)}
            </span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${isLow ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-slate-100 text-slate-600'}">
              Stock: ${p.stock}
            </span>
          </div>
          <h4 class="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">${sanitizeHTML(p.name)}</h4>
          <span class="text-[10px] font-mono text-slate-400 mt-0.5 block">${sanitizeHTML(p.barcode)}</span>
        </div>
        <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs font-black font-mono text-teal-700">${formatCRC(p.salePrice)}</span>
          <span class="text-[10px] text-slate-400 font-semibold">${p.ivaRate === 0.13 ? '+13% IVA' : p.ivaRate === 0.01 ? '+1% CB' : 'Exento'}</span>
        </div>
      </div>
    `;
  }).join("");
}

function renderCart() {
  const container = document.getElementById("cart-items-container");
  const countBadge = document.getElementById("cart-item-count");
  if (!container) return;

  if (AppState.cart.length === 0) {
    container.innerHTML = `
      <div id="cart-empty-state" class="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
        <i class="fa-solid fa-basket-shopping text-4xl mb-2 text-slate-300"></i>
        <p class="text-sm font-medium">El carrito está vacío</p>
        <p class="text-xs text-slate-400 mt-1">Escanee un código de barras o seleccione un producto de la izquierda</p>
      </div>
    `;
    if (countBadge) countBadge.textContent = "0";
  } else {
    let totalItems = 0;
    container.innerHTML = AppState.cart.map(item => {
      totalItems += item.quantity;
      const lineTotal = item.price * item.quantity;
      return `
        <div class="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 transition">
          <div class="flex-1 pr-2">
            <h5 class="text-xs font-bold text-slate-800 leading-tight">${sanitizeHTML(item.name)}</h5>
            <div class="text-[11px] font-mono text-slate-500 mt-0.5">
              ${formatCRC(item.price)} × ${item.quantity} = <strong class="text-slate-700">${formatCRC(lineTotal)}</strong>
              <span class="ml-1 text-[10px] px-1 bg-slate-100 rounded text-slate-600">IVA ${(item.ivaRate * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <button 
              class="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center"
              onclick="window.posApp.changeCartQty('${item.productId}', ${item.quantity - 1})"
            >-</button>
            <span class="w-6 text-center text-xs font-bold font-mono">${item.quantity}</span>
            <button 
              class="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center"
              onclick="window.posApp.changeCartQty('${item.productId}', ${item.quantity + 1})"
            >+</button>
            <button 
              class="w-6 h-6 rounded text-rose-500 hover:bg-rose-50 ml-1 flex items-center justify-center"
              onclick="window.posApp.changeCartQty('${item.productId}', 0)"
            >
              <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
          </div>
        </div>
      `;
    }).join("");

    if (countBadge) countBadge.textContent = totalItems.toString();
  }

  // Actualizar totales y desgloses
  const totals = calculateCartTotals();
  document.getElementById("pos-summary-subtotal").textContent = formatCRC(totals.subtotal);
  document.getElementById("pos-summary-iva1").textContent = formatCRC(totals.iva1);
  document.getElementById("pos-summary-iva13").textContent = formatCRC(totals.iva13);
  document.getElementById("pos-summary-exento").textContent = formatCRC(totals.exento);
  document.getElementById("pos-summary-total").textContent = formatCRC(totals.grandTotal);
}

// ----------------------------------------------------------------------------
// 7. MODAL DE PAGO Y FACTURACIÓN ELECTRÓNICA
// ----------------------------------------------------------------------------
function openPaymentModal() {
  if (AppState.cart.length === 0) {
    alert("El carrito está vacío. Agregue productos antes de cobrar.");
    return;
  }

  const totals = calculateCartTotals();
  const modal = document.getElementById("modal-payment");
  const totalDisplay = document.getElementById("modal-payment-total");
  const amountPaidInput = document.getElementById("input-amount-paid");

  if (totalDisplay) totalDisplay.textContent = formatCRC(totals.grandTotal);
  if (amountPaidInput) {
    amountPaidInput.value = totals.grandTotal.toString();
    calculateChange();
  }

  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    if (amountPaidInput) amountPaidInput.focus();
  }
}

function closePaymentModal() {
  const modal = document.getElementById("modal-payment");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

function calculateChange() {
  const totals = calculateCartTotals();
  const paidInput = document.getElementById("input-amount-paid");
  const changeDisplay = document.getElementById("display-change-amount");

  const paid = parseFloat(paidInput ? paidInput.value : "0") || 0;
  const change = Math.max(0, paid - totals.grandTotal);

  if (changeDisplay) {
    changeDisplay.textContent = formatCRC(change);
  }
}

// ----------------------------------------------------------------------------
// 8. FINALIZACIÓN DE VENTA & GENERACIÓN DE TIQUETE TÉRMICO ESC/POS
// ----------------------------------------------------------------------------
function completeSale() {
  const totals = calculateCartTotals();
  const paidInput = document.getElementById("input-amount-paid");
  const paid = parseFloat(paidInput ? paidInput.value : "0") || 0;

  if (AppState.selectedPaymentMethod === "EFECTIVO" && paid < totals.grandTotal) {
    alert(`Monto insuficiente. El total a pagar es de ${formatCRC(totals.grandTotal)}.`);
    return;
  }

  if (AppState.selectedPaymentMethod === "CREDITO") {
    if (AppState.selectedClient.id === "CLIENTE_GENERAL") {
      alert("Para ventas a crédito, debe seleccionar un cliente con crédito autorizado.");
      return;
    }
    const maxAllowed = AppState.selectedClient.creditLimit - AppState.selectedClient.currentDebt;
    if (totals.grandTotal > maxAllowed) {
      alert(`El crédito disponible para ${AppState.selectedClient.fullName} es de solo ${formatCRC(maxAllowed)}.`);
      return;
    }
  }

  // Generación de Clave Numérica de Factura Electrónica (DGT Costa Rica: 50 dígitos)
  const consecutivo = "0010000204" + String(Date.now()).slice(-10);
  const saleRecord = {
    invoiceNumber: consecutivo,
    date: new Date().toLocaleString("es-CR"),
    cashierName: AppState.currentUser.displayName,
    client: AppState.selectedClient.fullName,
    clientDoc: AppState.selectedClient.identification,
    paymentMethod: AppState.selectedPaymentMethod,
    items: [...AppState.cart],
    subtotal: totals.subtotal,
    iva1: totals.iva1,
    iva13: totals.iva13,
    exento: totals.exento,
    totalIva: totals.totalIva,
    total: totals.grandTotal,
    amountPaid: paid,
    change: Math.max(0, paid - totals.grandTotal)
  };

  // Decrementar inventario local y actualizar caja
  AppState.cart.forEach(item => {
    const prod = AppState.products.find(p => p.id === item.productId);
    if (prod) prod.stock = Math.max(0, prod.stock - item.quantity);
  });

  if (AppState.selectedPaymentMethod === "EFECTIVO") {
    AppState.currentShift.cashSales += totals.grandTotal;
  }

  AppState.salesHistory.unshift(saleRecord);

  // Inyectar contenido en el contenedor de impresión térmica
  generateThermalReceiptHTML(saleRecord);

  // Cerrar modal y limpiar
  closePaymentModal();
  AppState.cart = [];
  renderCart();
  renderQuickProducts();

  // Llamar al driver de impresión del navegador
  setTimeout(() => {
    window.print();
  }, 250);
}

function generateThermalReceiptHTML(sale) {
  const receiptEl = document.getElementById("thermal-receipt");
  if (!receiptEl) return;

  receiptEl.innerHTML = `
    <div class="receipt-center receipt-bold" style="font-size: 14px;">${POS_CONFIG.companyName}</div>
    <div class="receipt-center">Céd. Jurídica: ${POS_CONFIG.legalId}</div>
    <div class="receipt-center">${POS_CONFIG.location}</div>
    <div class="receipt-center">Tel: ${POS_CONFIG.phone}</div>
    <div class="receipt-divider"></div>
    <div class="receipt-center receipt-bold">TIQUETE ELECTRÓNICO</div>
    <div style="font-size: 9.5px; word-break: break-all;">Clave: ${sale.invoiceNumber}</div>
    <div>Fecha: ${sale.date}</div>
    <div>Cajero: ${sanitizeHTML(sale.cashierName)}</div>
    <div>Cliente: ${sanitizeHTML(sale.client)} (${sanitizeHTML(sale.clientDoc)})</div>
    <div>Pago: ${sale.paymentMethod}</div>
    <div class="receipt-divider"></div>
    
    <table class="receipt-table">
      <thead>
        <tr>
          <th>Cant.</th>
          <th>Descripción</th>
          <th class="receipt-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${sale.items.map(it => `
          <tr>
            <td>${it.quantity}</td>
            <td>${sanitizeHTML(it.name)}</td>
            <td class="receipt-right">${formatCRC(it.price * it.quantity)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="receipt-divider"></div>
    <div class="receipt-right">Subtotal Neto: ${formatCRC(sale.subtotal)}</div>
    <div class="receipt-right">IVA Canasta Básica (1%): ${formatCRC(sale.iva1)}</div>
    <div class="receipt-right">IVA Tarifa General (13%): ${formatCRC(sale.iva13)}</div>
    <div class="receipt-right receipt-bold" style="font-size: 13px; margin-top: 3px;">
      TOTAL A PAGAR: ${formatCRC(sale.total)}
    </div>
    <div class="receipt-right">Entregado: ${formatCRC(sale.amountPaid)}</div>
    <div class="receipt-right receipt-bold">Vuelto: ${formatCRC(sale.change)}</div>
    <div class="receipt-double-divider"></div>
    
    <div class="receipt-center" style="font-size: 9px; margin-top: 4px;">
      Autorizada mediante resolución de la DGT<br>
      N° DGT-R-033-2019 de Costa Rica.<br>
      ¡Muchas gracias por su preferencia!
    </div>
    <div class="receipt-barcode">*${sale.invoiceNumber.slice(-10)}*</div>
    <div style="height: 12mm;"></div> <!-- Espacio para corte de papel -->
  `;
}

// ----------------------------------------------------------------------------
// 9. GESTOR DE ATAJOS DE TECLADO ([F1], [F4], [F9], ESC)
// ----------------------------------------------------------------------------
function initKeyboardShortcuts() {
  window.addEventListener("keydown", (e) => {
    // F1: Cobrar / Abrir modal de cobro
    if (e.key === "F1") {
      e.preventDefault();
      openPaymentModal();
    }
    // F4: Enfocar buscador o seleccionar cliente
    else if (e.key === "F4") {
      e.preventDefault();
      const barcodeInput = document.getElementById("pos-barcode-input");
      if (barcodeInput) {
        barcodeInput.focus();
        barcodeInput.select();
      }
    }
    // F9: Cancelar / Limpiar carrito
    else if (e.key === "F9") {
      e.preventDefault();
      clearCart();
    }
    // Escape: Cerrar modales abiertos
    else if (e.key === "Escape") {
      closePaymentModal();
    }
  });

  // Listener para input de código de barras
  const barcodeInput = document.getElementById("pos-barcode-input");
  if (barcodeInput) {
    barcodeInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleBarcodeScan(barcodeInput.value);
      }
    });
  }
}

// ----------------------------------------------------------------------------
// 10. INICIALIZACIÓN GLOBAL
// ----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  renderQuickProducts();
  renderCart();
  initKeyboardShortcuts();

  // Event Listeners de botones principales
  document.getElementById("btn-checkout")?.addEventListener("click", openPaymentModal);
  document.getElementById("btn-clear-cart")?.addEventListener("click", clearCart);
  document.getElementById("btn-close-payment-modal")?.addEventListener("click", closePaymentModal);
  document.getElementById("btn-confirm-sale")?.addEventListener("click", completeSale);
  document.getElementById("input-amount-paid")?.addEventListener("input", calculateChange);

  // Pestañas de método de pago
  document.querySelectorAll(".payment-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".payment-tab").forEach(t => {
        t.classList.remove("active", "border-teal-600", "bg-teal-50", "text-teal-800");
        t.classList.add("border-slate-200", "text-slate-600");
      });
      tab.classList.add("active", "border-teal-600", "bg-teal-50", "text-teal-800");
      AppState.selectedPaymentMethod = tab.getAttribute("data-method");

      const cashCalc = document.getElementById("section-cash-calc");
      const refInput = document.getElementById("section-ref-input");

      if (AppState.selectedPaymentMethod === "EFECTIVO") {
        if (cashCalc) cashCalc.classList.remove("hidden");
        if (refInput) refInput.classList.add("hidden");
      } else {
        if (cashCalc) cashCalc.classList.add("hidden");
        if (refInput) refInput.classList.remove("hidden");
      }
    });
  });

  // Filtro de categorías
  document.getElementById("pos-category-filter")?.addEventListener("change", renderQuickProducts);

  // Manejo de cambio de pestañas del sistema POS
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.remove("active", "text-white", "bg-teal-700");
        b.classList.add("text-teal-200");
      });
      btn.classList.add("active", "text-white", "bg-teal-700");
      btn.classList.remove("text-teal-200");

      document.querySelectorAll("main > section").forEach(sec => sec.classList.add("hidden"));
      const targetView = document.getElementById(`view-${targetTab}`);
      if (targetView) targetView.classList.remove("hidden");

      if (targetTab === "inventory") renderInventoryTable();
      else if (targetTab === "clients") renderClientsCards();
      else if (targetTab === "shifts") renderShiftsView();
      else if (targetTab === "mermas") renderMermasTable();
    });
  });
});

// Renderizado de tabla de inventario en Vanilla
function renderInventoryTable() {
  const tbody = document.getElementById("inventory-table-body");
  if (!tbody) return;
  tbody.innerHTML = AppState.products.map(p => `
    <tr class="hover:bg-slate-50 border-b border-slate-100">
      <td class="py-3 px-4 font-mono font-bold">${sanitizeHTML(p.barcode)}</td>
      <td class="py-3 px-4 font-semibold text-slate-800">${sanitizeHTML(p.name)}</td>
      <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold">${sanitizeHTML(p.category)}</span></td>
      <td class="py-3 px-4 text-right font-mono text-slate-500">${formatCRC(p.costPrice)}</td>
      <td class="py-3 px-4 text-right font-mono font-bold text-teal-700">${formatCRC(p.salePrice)}</td>
      <td class="py-3 px-4 text-center font-bold text-[10px]">${p.ivaRate === 0.13 ? '13% IVA' : p.ivaRate === 0.01 ? '1% Canasta B.' : 'Exento'}</td>
      <td class="py-3 px-4 text-center font-mono font-bold ${p.stock <= 5 ? 'text-rose-600' : 'text-slate-800'}">${p.stock}</td>
      <td class="py-3 px-4 text-center text-slate-400">Activo</td>
    </tr>
  `).join("");
}

// Renderizado de clientes en Vanilla
function renderClientsCards() {
  const container = document.getElementById("clients-cards-container");
  if (!container) return;
  container.innerHTML = AppState.clients.map(c => `
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex justify-between items-start mb-1">
          <h4 class="font-bold text-xs text-slate-900">${sanitizeHTML(c.fullName)}</h4>
          <span class="text-[10px] px-1.5 py-0.5 rounded ${c.currentDebt > 0 ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-emerald-100 text-emerald-800 font-bold'}">
            ${c.currentDebt > 0 ? 'Con Saldo' : 'Al Día'}
          </span>
        </div>
        <div class="text-[11px] font-mono text-slate-500">Cédula: ${sanitizeHTML(c.identification)}</div>
        <div class="text-[11px] text-slate-500">Teléfono: ${sanitizeHTML(c.phone)}</div>
      </div>
      <div class="mt-3 pt-2 border-t border-slate-100 font-mono text-xs flex justify-between">
        <span class="text-slate-500">Deuda: <strong class="text-rose-600">${formatCRC(c.currentDebt)}</strong></span>
        <span class="text-slate-500">Límite: ${formatCRC(c.creditLimit)}</span>
      </div>
    </div>
  `).join("");
}

// Renderizado de arqueo de caja en Vanilla
function renderShiftsView() {
  const openingEl = document.getElementById("shift-display-opening");
  const cashSalesEl = document.getElementById("shift-display-cash-sales");
  const expectedEl = document.getElementById("shift-display-expected");
  if (openingEl) openingEl.textContent = formatCRC(AppState.currentShift.openingAmount);
  if (cashSalesEl) cashSalesEl.textContent = formatCRC(AppState.currentShift.cashSales);
  if (expectedEl) expectedEl.textContent = formatCRC(AppState.currentShift.openingAmount + AppState.currentShift.cashSales);
}

// Renderizado de mermas en Vanilla
function renderMermasTable() {
  const tbody = document.getElementById("mermas-table-body");
  if (!tbody) return;
  if (AppState.mermas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400">No hay mermas registradas</td></tr>`;
  } else {
    tbody.innerHTML = AppState.mermas.map(m => `
      <tr class="hover:bg-slate-50 border-b border-slate-100">
        <td class="py-2.5 px-4 font-mono text-slate-500">${new Date(m.createdAt).toLocaleDateString('es-CR')}</td>
        <td class="py-2.5 px-4 font-bold">${sanitizeHTML(m.productName)}</td>
        <td class="py-2.5 px-4 text-center font-bold font-mono text-rose-600">${m.quantity}</td>
        <td class="py-2.5 px-4"><span class="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800 font-bold">${m.reason}</span></td>
        <td class="py-2.5 px-4 text-right font-mono font-bold">${formatCRC(m.lossCost)}</td>
        <td class="py-2.5 px-4 text-slate-600">${sanitizeHTML(m.reportedBy)}</td>
      </tr>
    `).join("");
  }
}

// Exportar funciones para llamadas en línea
window.posApp = {
  addProductById: (id) => {
    const prod = AppState.products.find(p => p.id === id);
    if (prod) addToCart(prod, 1);
  },
  changeCartQty: (id, qty) => updateCartQuantity(id, qty),
  clearCart
};
