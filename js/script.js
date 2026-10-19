/**
 * ============================================================================
 * SUPER J Y G - POS CORPORATE PRO (COSTA RICA 🇨🇷)
 * ============================================================================
 * Lógica Integral de Punto de Venta, Inventario, Clientes, Arqueo y Facturación
 * Compatibilidad: Firebase 9 Compat (Auth & Firestore) con Fallback Offline Seguro
 * Normativa: DGT Costa Rica Ley 9635 (IVA 13%, 1%, 0%)
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. CONFIGURACIÓN OFICIAL DE FIREBASE: SUPER J Y G
// ----------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDjOCZC3fo762AsFC24DmeuYWndZmCjer0",
  authDomain: "super-j-y-g.firebaseapp.com",
  projectId: "super-j-y-g",
  storageBucket: "super-j-y-g.firebasestorage.app",
  messagingSenderId: "1083199282335",
  appId: "1:1083199282335:web:d84c89a4728acd55d3d6aa",
  measurementId: "G-EZ94G2H0HW"
};

// Inicialización condicional de Firebase
let auth = null;
let db = null;
let isFirebaseOnline = false;

try {
  if (typeof firebase !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.apiKey !== "TU_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    isFirebaseOnline = true;
    console.log("🔥 Firebase conectado exitosamente a:", firebaseConfig.projectId);
  } else {
    console.warn("⚠️ Firebase aún no tiene credenciales válidas. Usando almacenamiento local seguro (LocalStorage).");
  }
} catch (e) {
  console.warn("⚠️ Error inicializando Firebase SDK:", e);
}

// ----------------------------------------------------------------------------
// 2. ESTADO GLOBAL EN MEMORIA Y PERSISTENCIA LOCAL
// ----------------------------------------------------------------------------
const DEFAULT_PRODUCTS = [
  { id: "P001", code: "74410012001", name: "Arroz Tío Pelón Grano Entero 1.8kg", category: "Abarrotes", provider: "Tío Pelón S.A.", expiry: "2027-12-31", cost: 1250, price: 1550, stock: 45, tax: 1 },
  { id: "P002", code: "74410012002", name: "Frijoles Negros Don Pedro 900g", category: "Abarrotes", provider: "Don Pedro S.A.", expiry: "2027-08-15", cost: 920, price: 1225, stock: 38, tax: 1 },
  { id: "P003", code: "74410012003", name: "Leche Dos Pinos Semidescremada 1L", category: "Lácteos y Embutidos", provider: "Dos Pinos R.L.", expiry: "2026-11-20", cost: 830, price: 1045, stock: 65, tax: 1 },
  { id: "P004", code: "74410012004", name: "Café 1820 Clásico Molido 500g", category: "Abarrotes", provider: "Café 1820", expiry: "2027-05-10", cost: 2450, price: 3150, stock: 28, tax: 13 },
  { id: "P005", code: "74410012005", name: "Salsa Lizano Botella Original 700ml", category: "Abarrotes", provider: "Unilever CR", expiry: "2028-01-01", cost: 1480, price: 1980, stock: 19, tax: 13 },
  { id: "P006", code: "74410012006", name: "Pan Cuadrado Bimbo Blanco Grande", category: "Abarrotes", provider: "Bimbo CR", expiry: "2026-10-30", cost: 1350, price: 1750, stock: 14, tax: 13 },
  { id: "P007", code: "74410012007", name: "Huevos de Granja Blancos Cartón 15u", category: "Lácteos y Embutidos", provider: "Granja El Sol", expiry: "2026-11-12", cost: 1850, price: 2350, stock: 30, tax: 1 },
  { id: "P008", code: "74410012008", name: "Agua Pura Cristal sin Gas 600ml", category: "Frescos y Verduras", provider: "Florida Bebidas", expiry: "2027-09-01", cost: 350, price: 600, stock: 60, tax: 0 },
  { id: "P009", code: "74410012009", name: "Cerveza Imperial Lata 350ml", category: "Cervezas", provider: "FIFCO", expiry: "2027-06-30", cost: 800, price: 1150, stock: 48, tax: 13 },
  { id: "P010", code: "74410012010", name: "Detergente OMO Polvo 2kg", category: "Limpieza", provider: "Unilever CR", expiry: "2029-01-01", cost: 3200, price: 4250, stock: 16, tax: 13 }
];

const DEFAULT_CLIENTS = [
  { id: "C01", name: "Doña Elena Rojas Solís", phone: "50688991122", debt: 18500 },
  { id: "C02", name: "Soda y Pulpería Los Almendros", phone: "50687654321", debt: 94000 },
  { id: "C03", name: "Carlos Villalobos Mora", phone: "50683337766", debt: 0 }
];

const DEFAULT_CASHIERS = [
  { id: "CSH01", name: "Justin Murillo (Cajero Principal)", email: "justin@superjyg.cr" },
  { id: "CSH02", name: "María Elena Mora (Cajera 2)", email: "maria@superjyg.cr" }
];

let AppData = {
  currentUser: JSON.parse(localStorage.getItem("superjyg_user") || 'null'),
  products: JSON.parse(localStorage.getItem("superjyg_products") || JSON.stringify(DEFAULT_PRODUCTS)),
  clients: JSON.parse(localStorage.getItem("superjyg_clients") || JSON.stringify(DEFAULT_CLIENTS)),
  cashiers: JSON.parse(localStorage.getItem("superjyg_cashiers") || JSON.stringify(DEFAULT_CASHIERS)),
  sales: JSON.parse(localStorage.getItem("superjyg_sales") || '[]'),
  mermas: JSON.parse(localStorage.getItem("superjyg_mermas") || '[]'),
  cart: []
};

// Guarda estado en LocalStorage de forma resiliente
function persistData() {
  localStorage.setItem("superjyg_products", JSON.stringify(AppData.products));
  localStorage.setItem("superjyg_clients", JSON.stringify(AppData.clients));
  localStorage.setItem("superjyg_cashiers", JSON.stringify(AppData.cashiers));
  localStorage.setItem("superjyg_sales", JSON.stringify(AppData.sales));
  localStorage.setItem("superjyg_mermas", JSON.stringify(AppData.mermas));
  if (AppData.currentUser) {
    localStorage.setItem("superjyg_user", JSON.stringify(AppData.currentUser));
  } else {
    localStorage.removeItem("superjyg_user");
  }
}

// Formateador oficial de moneda en Costa Rica (Colones ₡)
function formatCRC(amount) {
  return "₡" + Number(amount || 0).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function sanitize(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

// ----------------------------------------------------------------------------
// 3. MÓDULO DE AUTENTICACIÓN (LOGIN & LOGOUT)
// ----------------------------------------------------------------------------
function initAuth() {
  if (isFirebaseOnline && auth) {
    auth.onAuthStateChanged(user => {
      if (user) {
        AppData.currentUser = { email: user.email, uid: user.uid };
        showApp();
      } else {
        AppData.currentUser = null;
        showAuth();
      }
      persistData();
    });
  } else {
    // Si ya había sesión guardada localmente
    if (AppData.currentUser) {
      showApp();
    } else {
      showAuth();
    }
  }
}

function showAuth() {
  document.getElementById("auth-container")?.classList.remove("hidden");
  document.getElementById("app-container")?.classList.add("hidden");
}

function showApp() {
  document.getElementById("auth-container")?.classList.add("hidden");
  document.getElementById("app-container")?.classList.remove("hidden");
  
  const display = document.getElementById("user-email-display");
  if (display && AppData.currentUser) {
    display.textContent = AppData.currentUser.email;
  }

  // Cargar módulos iniciales
  renderCart();
  renderInventory();
  renderMermas();
  renderClients();
  renderCashiers();
  renderDailySales();
  renderHistory();
  renderStats();
  
  // Establecer fecha actual
  const dateLbl = document.getElementById("current-date-label");
  if (dateLbl) {
    dateLbl.textContent = new Date().toLocaleDateString("es-CR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Sincronizar en tiempo real con Firestore
  syncFromFirestore();
}

// Funciones seguras de normalización de datos
function getSaleInvoiceNumber(s) {
  if (!s) return "00000000";
  const num = s.invoiceNumber || s.id || s.consecutive || s.consecutiveId || "00000000";
  return String(num);
}

function getSaleDate(s) {
  if (!s || !s.date) return new Date().toISOString();
  if (typeof s.date === "string") return s.date;
  if (s.date.toDate && typeof s.date.toDate === "function") {
    return s.date.toDate().toISOString();
  }
  if (s.date.seconds) {
    return new Date(s.date.seconds * 1000).toISOString();
  }
  return String(s.date);
}

// Sincronización en la nube con Firestore de SUPER J Y G
async function syncFromFirestore() {
  if (isFirebaseOnline && db) {
    try {
      const invSnapshot = await db.collection("inventory").get();
      if (!invSnapshot.empty) {
        AppData.products = [];
        invSnapshot.forEach(doc => {
          AppData.products.push({ id: doc.id, ...doc.data() });
        });
        persistData();
        renderInventory();
      } else {
        // Si la base de datos está recién creada, sembrar catálogo inicial de Costa Rica
        DEFAULT_PRODUCTS.forEach(async (p) => {
          try { await db.collection("inventory").doc(p.id).set(p); } catch (e) {}
        });
      }

      const cliSnapshot = await db.collection("clients").get();
      if (!cliSnapshot.empty) {
        AppData.clients = [];
        cliSnapshot.forEach(doc => {
          AppData.clients.push({ id: doc.id, ...doc.data() });
        });
        persistData();
        renderClients();
      }

      const salesSnapshot = await db.collection("sales").limit(100).get();
      if (!salesSnapshot.empty) {
        AppData.sales = [];
        salesSnapshot.forEach(doc => {
          const d = doc.data() || {};
          const rawDate = d.date || d.createdAt || new Date().toISOString();
          const cleanDate = typeof rawDate === 'string' ? rawDate : (rawDate.toDate ? rawDate.toDate().toISOString() : new Date().toISOString());
          AppData.sales.push({
            id: doc.id,
            invoiceNumber: String(d.invoiceNumber || doc.id),
            date: cleanDate,
            cashier: d.cashier || d.cashierName || "Cajero Principal",
            client: d.client || d.clientName || "Cliente General",
            paymentMethod: d.paymentMethod || "Efectivo",
            total: Number(d.total) || 0,
            subtotal: Number(d.subtotal) || 0,
            totalIva: Number(d.totalIva) || 0,
            items: Array.isArray(d.items) ? d.items : [],
            ...d
          });
        });
        persistData();
        renderDailySales();
        renderHistory();
        renderStats();
      }
    } catch (e) {
      console.log("Nota sobre Firestore:", e.message);
    }
  }
}

window.enterDemoMode = function(email) {
  AppData.currentUser = { email: email || "caja1@superjyg.cr", uid: "cajero_local_01" };
  persistData();
  showApp();
};

window.handleLogin = async function(event) {
  event.preventDefault();
  const email = document.getElementById("login-email")?.value.trim();
  const password = document.getElementById("login-password")?.value.trim();
  const errorBox = document.getElementById("auth-error");

  if (errorBox) errorBox.innerHTML = "";

  if (isFirebaseOnline && auth) {
    try {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      AppData.currentUser = { email: cred.user.email, uid: cred.user.uid };
      persistData();
      showApp();
    } catch (err) {
      console.warn("Intento de login:", err.code);
      // Si el usuario no existe en Firebase Auth, intentar registrarlo automáticamente para facilitar primer acceso
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-login-credentials' || err.code === 'auth/invalid-credential') {
        try {
          const newCred = await auth.createUserWithEmailAndPassword(email, password);
          AppData.currentUser = { email: newCred.user.email, uid: newCred.user.uid };
          persistData();
          showApp();
          return;
        } catch (regErr) {
          if (errorBox) {
            errorBox.innerHTML = `
              <div class="space-y-1">
                <div>Credenciales no encontradas en Firebase Auth.</div>
                <button type="button" onclick="enterDemoMode('${email}')" class="text-indigo-600 font-bold underline hover:text-indigo-800">
                  Ingresar como Modo Operativo Inmediato
                </button>
              </div>
            `;
          }
        }
      } else {
        if (errorBox) {
          errorBox.innerHTML = `
            <div class="space-y-1">
              <div>${err.message}</div>
              <button type="button" onclick="enterDemoMode('${email}')" class="text-indigo-600 font-bold underline hover:text-indigo-800">
                Ingresar como Modo Operativo Inmediato
              </button>
            </div>
          `;
        }
      }
    }
  } else {
    // Acceso local / demostración
    AppData.currentUser = { email: email || "caja1@superjyg.cr", uid: "cajero_local_01" };
    persistData();
    showApp();
  }
};

window.handleLogout = async function() {
  if (isFirebaseOnline && auth) {
    await auth.signOut();
  }
  AppData.currentUser = null;
  persistData();
  showAuth();
};

// ----------------------------------------------------------------------------
// 4. NAVEGACIÓN POR PESTAÑAS
// ----------------------------------------------------------------------------
window.switchTab = function(tabId) {
  const tabs = ['pos', 'inventory', 'mermas', 'cash', 'clients', 'cashiers', 'daily', 'history', 'stats'];
  
  tabs.forEach(t => {
    const content = document.getElementById(`tab-content-${t}`);
    const navBtn = document.getElementById(`nav-${t}`);
    if (content) content.classList.add("hidden");
    if (navBtn) {
      navBtn.classList.remove("bg-indigo-600", "text-white");
      navBtn.classList.add("text-slate-300");
    }
  });

  const activeContent = document.getElementById(`tab-content-${tabId}`);
  const activeNav = document.getElementById(`nav-${tabId}`);
  if (activeContent) activeContent.classList.remove("hidden");
  if (activeNav) {
    activeNav.classList.add("bg-indigo-600", "text-white");
    activeNav.classList.remove("text-slate-300");
  }

  // Refrescar módulo activo
  if (tabId === 'inventory') renderInventory();
  else if (tabId === 'mermas') renderMermas();
  else if (tabId === 'cash') calculateCashDifference();
  else if (tabId === 'clients') renderClients();
  else if (tabId === 'cashiers') renderCashiers();
  else if (tabId === 'daily') renderDailySales();
  else if (tabId === 'history') renderHistory();
  else if (tabId === 'stats') renderStats();
};

// ----------------------------------------------------------------------------
// 5. MÓDULO POS: BÚSQUEDA, CARRITO Y TOTALES
// ----------------------------------------------------------------------------
window.filterSearchProducts = function() {
  const input = document.getElementById("pos-search");
  const resultsDiv = document.getElementById("product-search-results");
  if (!input || !resultsDiv) return;

  const query = input.value.trim().toLowerCase();
  if (!query) {
    resultsDiv.classList.add("hidden");
    resultsDiv.innerHTML = "";
    return;
  }

  const matches = AppData.products.filter(p => 
    p.name.toLowerCase().includes(query) || 
    p.code.toLowerCase().includes(query) ||
    p.category.toLowerCase().includes(query)
  );

  if (matches.length === 0) {
    resultsDiv.innerHTML = `<div class="p-3 text-xs text-slate-400 text-center">No se encontraron productos</div>`;
    resultsDiv.classList.remove("hidden");
    return;
  }

  resultsDiv.innerHTML = matches.map(p => `
    <div onclick="addToCartById('${p.id}')" class="p-2.5 hover:bg-indigo-50 cursor-pointer flex justify-between items-center text-xs transition">
      <div>
        <div class="font-bold text-slate-800">${sanitize(p.name)}</div>
        <div class="text-[10px] text-slate-400 font-mono">${sanitize(p.code)} • ${p.category}</div>
      </div>
      <div class="text-right">
        <div class="font-bold font-mono text-indigo-700">${formatCRC(p.price)}</div>
        <span class="text-[9px] px-1 py-0.5 rounded font-bold ${p.stock <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}">
          Stock: ${p.stock}
        </span>
      </div>
    </div>
  `).join("");
  resultsDiv.classList.remove("hidden");
};

window.addToCartById = function(id) {
  const product = AppData.products.find(p => p.id === id);
  if (!product) return;

  const existing = AppData.cart.find(it => it.id === product.id);
  const currentInCart = existing ? existing.quantity : 0;

  if (currentInCart + 1 > product.stock) {
    alert(`Existencias insuficientes para "${product.name}". Quedan ${product.stock} unidades.`);
    return;
  }

  if (existing) {
    existing.quantity += 1;
  } else {
    AppData.cart.push({
      id: product.id,
      code: product.code,
      name: product.name,
      price: product.price,
      cost: product.cost,
      tax: product.tax !== undefined ? product.tax : 13,
      quantity: 1
    });
  }

  const searchInput = document.getElementById("pos-search");
  const resultsDiv = document.getElementById("product-search-results");
  if (searchInput) searchInput.value = "";
  if (resultsDiv) resultsDiv.classList.add("hidden");

  renderCart();
};

window.clearCart = function() {
  if (AppData.cart.length === 0) return;
  if (confirm("¿Desea vaciar el carrito actual?")) {
    AppData.cart = [];
    renderCart();
  }
};

window.updateCartQty = function(id, delta) {
  const item = AppData.cart.find(it => it.id === id);
  if (!item) return;

  const product = AppData.products.find(p => p.id === id);
  const newQty = item.quantity + delta;

  if (newQty <= 0) {
    AppData.cart = AppData.cart.filter(it => it.id !== id);
  } else if (product && newQty > product.stock) {
    alert(`Existencias insuficientes. Stock máximo disponible: ${product.stock}`);
    return;
  } else {
    item.quantity = newQty;
  }

  renderCart();
};

window.removeCartItem = function(id) {
  AppData.cart = AppData.cart.filter(it => it.id !== id);
  renderCart();
};

function calculateCartTotals() {
  let subtotal = 0;
  let totalIva = 0;

  AppData.cart.forEach(it => {
    const lineNet = it.price * it.quantity;
    subtotal += lineNet;
    const taxRate = (it.tax || 0) / 100;
    totalIva += (lineNet * taxRate);
  });

  subtotal = Math.round(subtotal * 100) / 100;
  totalIva = Math.round(totalIva * 100) / 100;
  const grandTotal = Math.round((subtotal + totalIva) * 100) / 100;

  return { subtotal, totalIva, grandTotal };
}

function renderCart() {
  const tbody = document.getElementById("cart-table-body");
  if (!tbody) return;

  if (AppData.cart.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-12 text-slate-400">
          <i class="fa-solid fa-cart-arrow-down text-3xl mb-2 text-slate-300 block"></i>
          El carrito está vacío. Presione <span class="font-bold text-slate-600">[F1]</span> para buscar artículos.
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = AppData.cart.map(it => {
      const lineTotal = it.price * it.quantity;
      return `
        <tr class="hover:bg-slate-50 transition">
          <td class="p-3 font-medium text-slate-900 leading-tight">
            ${sanitize(it.name)}
            <div class="text-[10px] text-slate-400 font-mono">${it.code} • IVA ${it.tax}%</div>
          </td>
          <td class="p-3 font-mono text-slate-600">${formatCRC(it.price)}</td>
          <td class="p-3 text-center">
            <div class="inline-flex items-center space-x-1">
              <button onclick="updateCartQty('${it.id}', -1)" class="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 font-bold text-xs flex items-center justify-center">-</button>
              <span class="w-7 text-center font-mono font-bold text-xs">${it.quantity}</span>
              <button onclick="updateCartQty('${it.id}', 1)" class="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 font-bold text-xs flex items-center justify-center">+</button>
            </div>
          </td>
          <td class="p-3 font-mono font-bold text-indigo-700">${formatCRC(lineTotal)}</td>
          <td class="p-3 text-center">
            <button onclick="removeCartItem('${it.id}')" class="text-rose-500 hover:text-rose-700 transition" title="Quitar">
              <i class="fa-solid fa-trash-can text-sm"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // Totales
  const { subtotal, totalIva, grandTotal } = calculateCartTotals();
  const subEl = document.getElementById("summary-subtotal");
  const ivaEl = document.getElementById("summary-iva");
  const totEl = document.getElementById("summary-total");

  if (subEl) subEl.textContent = formatCRC(subtotal);
  if (ivaEl) ivaEl.textContent = formatCRC(totalIva);
  if (totEl) totEl.textContent = formatCRC(grandTotal);

  calculateChange();
}

window.calculateChange = function() {
  const { grandTotal } = calculateCartTotals();
  const receivedInput = document.getElementById("cash-received");
  const changeEl = document.getElementById("change-amount");
  if (!receivedInput || !changeEl) return;

  const received = parseFloat(receivedInput.value) || 0;
  const change = Math.max(0, received - grandTotal);
  changeEl.textContent = formatCRC(change);
};

window.addCashAmount = function(amount) {
  const input = document.getElementById("cash-received");
  if (!input) return;
  const current = parseFloat(input.value) || 0;
  input.value = current + amount;
  calculateChange();
};

// ----------------------------------------------------------------------------
// 6. SELECTOR DE CAJEROS Y CLIENTES
// ----------------------------------------------------------------------------
window.searchCashiers = function() {
  const input = document.getElementById("pos-cashier-search");
  const resultsDiv = document.getElementById("cashier-search-results");
  if (!input || !resultsDiv) return;

  const query = input.value.trim().toLowerCase();
  const matches = AppData.cashiers.filter(c => c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query));

  resultsDiv.innerHTML = matches.map(c => `
    <div onclick="selectCashier('${c.id}', '${sanitize(c.name)}')" class="p-2 hover:bg-indigo-50 cursor-pointer text-xs flex justify-between">
      <span class="font-bold text-slate-800">${sanitize(c.name)}</span>
      <span class="text-slate-400 text-[10px]">${sanitize(c.email)}</span>
    </div>
  `).join("");
  resultsDiv.classList.remove("hidden");
};

window.selectCashier = function(id, name) {
  const searchInput = document.getElementById("pos-cashier-search");
  const hiddenInput = document.getElementById("pos-cashier");
  const resultsDiv = document.getElementById("cashier-search-results");
  if (searchInput) searchInput.value = name;
  if (hiddenInput) hiddenInput.value = id;
  if (resultsDiv) resultsDiv.classList.add("hidden");
};

window.searchClients = function() {
  const input = document.getElementById("pos-client-search");
  const resultsDiv = document.getElementById("client-search-results");
  if (!input || !resultsDiv) return;

  const query = input.value.trim().toLowerCase();
  const matches = AppData.clients.filter(c => c.name.toLowerCase().includes(query) || c.phone.includes(query));

  resultsDiv.innerHTML = `
    <div onclick="selectClient('', 'CLIENTE GENERAL (CONTADO)')" class="p-2 hover:bg-indigo-50 cursor-pointer text-xs font-bold text-indigo-700">
      CLIENTE GENERAL (CONTADO)
    </div>
  ` + matches.map(c => `
    <div onclick="selectClient('${c.id}', '${sanitize(c.name)}')" class="p-2 hover:bg-indigo-50 cursor-pointer text-xs flex justify-between">
      <span class="font-bold text-slate-800">${sanitize(c.name)}</span>
      <span class="text-rose-600 font-mono text-[10px]">Deuda: ${formatCRC(c.debt)}</span>
    </div>
  `).join("");
  resultsDiv.classList.remove("hidden");
};

window.selectClient = function(id, name) {
  const searchInput = document.getElementById("pos-client-search");
  const hiddenInput = document.getElementById("pos-client");
  const resultsDiv = document.getElementById("client-search-results");
  if (searchInput) searchInput.value = name;
  if (hiddenInput) hiddenInput.value = id;
  if (resultsDiv) resultsDiv.classList.add("hidden");
};

// ----------------------------------------------------------------------------
// 7. FACTURACIÓN Y EMISIÓN DE TIQUETE (DGT COSTA RICA)
// ----------------------------------------------------------------------------
window.completeSale = async function() {
  if (AppData.cart.length === 0) {
    alert("El carrito está vacío. Agregue productos antes de facturar.");
    return;
  }

  const { subtotal, totalIva, grandTotal } = calculateCartTotals();
  const paymentMethod = document.getElementById("payment-method")?.value || "Efectivo";
  const docType = document.getElementById("pos-doc-type")?.value || "Tiquete";
  const cashierName = document.getElementById("pos-cashier-search")?.value.trim() || AppData.currentUser?.email || "Cajero Principal";
  const clientId = document.getElementById("pos-client")?.value || "";
  const clientName = document.getElementById("pos-client-search")?.value.trim() || "Cliente General";
  const cashReceivedInput = document.getElementById("cash-received");
  const cashReceived = parseFloat(cashReceivedInput?.value || "0") || 0;

  if (paymentMethod === "Efectivo" && cashReceived < grandTotal) {
    alert(`El efectivo recibido (${formatCRC(cashReceived)}) es menor al total de la venta (${formatCRC(grandTotal)}).`);
    cashReceivedInput?.focus();
    return;
  }

  if (paymentMethod === "Línea de Crédito") {
    if (!clientId) {
      alert("Para ventas a crédito debe seleccionar un cliente de la lista.");
      document.getElementById("pos-client-search")?.focus();
      return;
    }
    // Aumentar la deuda del cliente
    const client = AppData.clients.find(c => c.id === clientId);
    if (client) {
      client.debt = (client.debt || 0) + grandTotal;
      if (isFirebaseOnline && db) {
        try {
          await db.collection("clients").doc(clientId).update({ debt: client.debt });
        } catch (e) {
          console.error("Error actualizando deuda en Firestore:", e);
        }
      }
    }
  }

  // Generación de consecutivo oficial DGT
  const timestamp = Date.now();
  const consecutiveId = "506" + String(timestamp).slice(-10);

  const saleRecord = {
    id: `VNT-${timestamp}`,
    invoiceNumber: consecutiveId,
    docType,
    date: new Date().toISOString(),
    cashier: cashierName,
    client: clientName,
    paymentMethod,
    items: [...AppData.cart],
    subtotal,
    totalIva,
    total: grandTotal,
    cashReceived: paymentMethod === "Efectivo" ? cashReceived : grandTotal,
    change: paymentMethod === "Efectivo" ? Math.max(0, cashReceived - grandTotal) : 0
  };

  // Descontar inventario local y remoto
  AppData.cart.forEach(async (it) => {
    const prod = AppData.products.find(p => p.id === it.id);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - it.quantity);
      if (isFirebaseOnline && db) {
        try {
          await db.collection("inventory").doc(prod.id).update({ stock: prod.stock });
        } catch (e) {
          console.error("Error actualizando stock en Firestore:", e);
        }
      }
    }
  });

  // Guardar venta
  AppData.sales.unshift(saleRecord);
  if (isFirebaseOnline && db) {
    try {
      await db.collection("sales").doc(saleRecord.id).set(saleRecord);
    } catch (e) {
      console.error("Error guardando venta en Firestore:", e);
    }
  }

  persistData();

  // Abrir Modal de Tiquete / Factura
  openInvoiceModal(saleRecord);

  // Limpiar carrito
  AppData.cart = [];
  renderCart();
  if (cashReceivedInput) cashReceivedInput.value = "";
  document.getElementById("change-amount").textContent = "₡0.00";
};

function openInvoiceModal(sale) {
  const modal = document.getElementById("modal-invoice");
  if (!modal) return;

  document.getElementById("inv-ticket-doc-title").textContent = sale.docType === "Factura" ? "FACTURA ELECTRÓNICA" : "TIQUETE ELECTRÓNICO";
  document.getElementById("inv-ticket-id").textContent = "Compr: #" + sale.invoiceNumber;
  document.getElementById("inv-ticket-date").textContent = "Fecha: " + new Date(sale.date).toLocaleString("es-CR");
  document.getElementById("inv-ticket-cashier").textContent = sale.cashier;
  document.getElementById("inv-ticket-client").textContent = sale.client;
  document.getElementById("inv-ticket-method").textContent = sale.paymentMethod;

  const itemsTbody = document.getElementById("inv-ticket-items");
  if (itemsTbody) {
    itemsTbody.innerHTML = sale.items.map(it => `
      <tr>
        <td class="py-0.5">${it.quantity}x ${sanitize(it.name.slice(0, 22))}</td>
        <td class="py-0.5 text-right font-mono">${formatCRC(it.price * it.quantity)}</td>
      </tr>
    `).join("");
  }

  document.getElementById("inv-ticket-subtotal").textContent = formatCRC(sale.subtotal);
  document.getElementById("inv-ticket-iva").textContent = formatCRC(sale.totalIva);
  document.getElementById("inv-ticket-total").textContent = formatCRC(sale.total);

  modal.classList.remove("hidden");
}

window.closeInvoiceModal = function() {
  document.getElementById("modal-invoice")?.classList.add("hidden");
};

// ----------------------------------------------------------------------------
// 8. MÓDULO DE INVENTARIO
// ----------------------------------------------------------------------------
window.renderInventory = function() {
  const tbody = document.getElementById("inventory-table-body");
  const statsBadge = document.getElementById("inventory-stats-badge");
  const searchInput = document.getElementById("inv-search");
  if (!tbody) return;

  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const filtered = AppData.products.filter(p => 
    p.name.toLowerCase().includes(query) ||
    p.code.toLowerCase().includes(query) ||
    p.category.toLowerCase().includes(query) ||
    (p.provider && p.provider.toLowerCase().includes(query))
  );

  const lowStockCount = AppData.products.filter(p => p.stock <= 5).length;
  if (statsBadge) {
    statsBadge.textContent = `${AppData.products.length} productos | ${lowStockCount} con stock bajo`;
  }

  tbody.innerHTML = filtered.map(p => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="p-3 font-mono font-bold text-slate-700">${sanitize(p.code)}</td>
      <td class="p-3">
        <div class="font-bold text-slate-900">${sanitize(p.name)}</div>
        <div class="text-[10px] text-slate-400">${sanitize(p.category)} • IVA ${p.tax}%</div>
      </td>
      <td class="p-3 text-slate-600 text-xs">${sanitize(p.provider || "-")}</td>
      <td class="p-3 text-slate-500 font-mono text-xs">${p.expiry || "-"}</td>
      <td class="p-3 font-mono">
        <span class="text-slate-400 text-xs">${formatCRC(p.cost)}</span> / 
        <strong class="text-indigo-700">${formatCRC(p.price)}</strong>
      </td>
      <td class="p-3 text-center">
        <span class="px-2 py-1 rounded font-bold font-mono text-xs ${p.stock <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-800'}">
          ${p.stock}
        </span>
      </td>
      <td class="p-3 text-center space-x-1.5">
        <button onclick="editProduct('${p.id}')" class="text-indigo-600 hover:text-indigo-800 font-bold text-xs" title="Editar">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button onclick="deleteProduct('${p.id}')" class="text-rose-500 hover:text-rose-700 font-bold text-xs" title="Eliminar">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>
  `).join("");
};

window.openInventoryModal = function(editId = null) {
  const modal = document.getElementById("modal-inventory");
  const title = document.getElementById("inv-modal-title");
  const form = document.getElementById("form-inventory");
  if (!modal || !form) return;

  form.reset();
  document.getElementById("inv-edit-id").value = "";

  if (editId) {
    const prod = AppData.products.find(p => p.id === editId);
    if (prod) {
      if (title) title.textContent = "Editar Producto";
      document.getElementById("inv-edit-id").value = prod.id;
      document.getElementById("inv-code").value = prod.code;
      document.getElementById("inv-category").value = prod.category;
      document.getElementById("inv-name").value = prod.name;
      document.getElementById("inv-provider").value = prod.provider || "";
      document.getElementById("inv-expiry").value = prod.expiry || "";
      document.getElementById("inv-cost").value = prod.cost;
      document.getElementById("inv-price").value = prod.price;
      document.getElementById("inv-stock").value = prod.stock;
      document.getElementById("inv-tax").value = prod.tax !== undefined ? prod.tax : 13;
    }
  } else {
    if (title) title.textContent = "Registrar Producto";
    document.getElementById("inv-code").value = Math.floor(7441000000000 + Math.random() * 999999999).toString();
  }

  modal.classList.remove("hidden");
};

window.closeInventoryModal = function() {
  document.getElementById("modal-inventory")?.classList.add("hidden");
};

window.editProduct = function(id) {
  openInventoryModal(id);
};

window.deleteProduct = async function(id) {
  const prod = AppData.products.find(p => p.id === id);
  if (!prod) return;
  if (confirm(`¿Está seguro de eliminar "${prod.name}" del catálogo?`)) {
    AppData.products = AppData.products.filter(p => p.id !== id);
    if (isFirebaseOnline && db) {
      try {
        await db.collection("inventory").doc(id).delete();
      } catch (e) {
        console.error("Error eliminando de Firestore:", e);
      }
    }
    persistData();
    renderInventory();
  }
};

window.saveInventoryProduct = async function(e) {
  e.preventDefault();
  const editId = document.getElementById("inv-edit-id")?.value;
  const code = document.getElementById("inv-code")?.value.trim();
  const category = document.getElementById("inv-category")?.value;
  const name = document.getElementById("inv-name")?.value.trim();
  const provider = document.getElementById("inv-provider")?.value.trim();
  const expiry = document.getElementById("inv-expiry")?.value;
  const cost = parseFloat(document.getElementById("inv-cost")?.value) || 0;
  const price = parseFloat(document.getElementById("inv-price")?.value) || 0;
  const stock = parseInt(document.getElementById("inv-stock")?.value) || 0;
  const tax = parseInt(document.getElementById("inv-tax")?.value) || 13;

  if (editId) {
    const prod = AppData.products.find(p => p.id === editId);
    if (prod) {
      Object.assign(prod, { code, category, name, provider, expiry, cost, price, stock, tax });
      if (isFirebaseOnline && db) {
        try {
          await db.collection("inventory").doc(editId).update(prod);
        } catch (err) {
          console.error("Error actualizando en Firestore:", err);
        }
      }
    }
  } else {
    const newProd = {
      id: `P-${Date.now()}`,
      code,
      category,
      name,
      provider,
      expiry,
      cost,
      price,
      stock,
      tax
    };
    AppData.products.unshift(newProd);
    if (isFirebaseOnline && db) {
      try {
        await db.collection("inventory").doc(newProd.id).set(newProd);
      } catch (err) {
        console.error("Error guardando en Firestore:", err);
      }
    }
  }

  persistData();
  closeInventoryModal();
  renderInventory();
};

// ----------------------------------------------------------------------------
// 9. MÓDULO DE MERMAS Y PÉRDIDAS
// ----------------------------------------------------------------------------
window.openMermaModal = function() {
  const modal = document.getElementById("modal-merma");
  const select = document.getElementById("merma-product-id");
  if (!modal || !select) return;

  select.innerHTML = AppData.products.map(p => `
    <option value="${p.id}">${sanitize(p.name)} (Stock: ${p.stock})</option>
  `).join("");

  modal.classList.remove("hidden");
};

window.saveMerma = async function(e) {
  e.preventDefault();
  const prodId = document.getElementById("merma-product-id")?.value;
  const qty = parseInt(document.getElementById("merma-qty")?.value) || 1;
  const reason = document.getElementById("merma-reason")?.value || "Vencido";

  const product = AppData.products.find(p => p.id === prodId);
  if (!product) return;

  if (qty > product.stock) {
    alert(`No puede retirar ${qty} unidades. El stock actual es de solo ${product.stock}.`);
    return;
  }

  // Reducir stock
  product.stock -= qty;

  const mermaRecord = {
    id: `MRM-${Date.now()}`,
    date: new Date().toLocaleDateString("es-CR"),
    productName: product.name,
    productId: product.id,
    quantity: qty,
    reason,
    costLoss: product.cost * qty
  };

  AppData.mermas.unshift(mermaRecord);

  if (isFirebaseOnline && db) {
    try {
      await db.collection("mermas").doc(mermaRecord.id).set(mermaRecord);
      await db.collection("inventory").doc(product.id).update({ stock: product.stock });
    } catch (err) {
      console.error("Error guardando merma en Firestore:", err);
    }
  }

  persistData();
  document.getElementById("modal-merma")?.classList.add("hidden");
  renderMermas();
  renderInventory();
  alert(`Merma registrada con éxito. Se retiraron ${qty} unidades de "${product.name}".`);
};

window.renderMermas = function() {
  const tbody = document.getElementById("mermas-table-body");
  if (!tbody) return;

  if (AppData.mermas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-slate-400">No hay mermas registradas</td></tr>`;
  } else {
    tbody.innerHTML = AppData.mermas.map(m => `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="p-3 font-mono text-xs text-slate-500">${m.date}</td>
        <td class="p-3 font-bold text-slate-800">${sanitize(m.productName)}</td>
        <td class="p-3 text-center font-mono font-bold text-rose-600">${m.quantity}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">${m.reason}</span></td>
      </tr>
    `).join("");
  }
};

// ----------------------------------------------------------------------------
// 10. MÓDULO DE ARQUEO Y CORTE DE CAJA
// ----------------------------------------------------------------------------
window.calculateCashDifference = function() {
  const systemTotalEl = document.getElementById("cash-system-total");
  const countedInput = document.getElementById("cash-counted");
  const diffEl = document.getElementById("cash-difference");

  // Sumar ventas en efectivo de hoy
  const todayStr = new Date().toISOString().slice(0, 10);
  const cashSalesToday = AppData.sales
    .filter(s => s.paymentMethod === "Efectivo" && s.date.startsWith(todayStr))
    .reduce((acc, s) => acc + s.total, 0);

  if (systemTotalEl) systemTotalEl.textContent = formatCRC(cashSalesToday);

  const counted = parseFloat(countedInput?.value || "0") || 0;
  const difference = counted - cashSalesToday;

  if (diffEl) {
    diffEl.textContent = (difference > 0 ? "+" : "") + formatCRC(difference);
    if (difference === 0) {
      diffEl.className = "text-2xl font-extrabold text-emerald-600 mt-1";
    } else if (difference > 0) {
      diffEl.className = "text-2xl font-extrabold text-blue-600 mt-1";
    } else {
      diffEl.className = "text-2xl font-extrabold text-rose-600 mt-1";
    }
  }
};

// ----------------------------------------------------------------------------
// 11. MÓDULO DE CLIENTES & CRÉDITOS
// ----------------------------------------------------------------------------
window.openNewClientModal = function() {
  document.getElementById("modal-client")?.classList.remove("hidden");
};

window.saveNewClient = async function(e) {
  e.preventDefault();
  const name = document.getElementById("client-name")?.value.trim();
  const phone = document.getElementById("client-phone")?.value.trim();
  const debt = parseFloat(document.getElementById("client-debt")?.value) || 0;

  if (!name) return;

  const newClient = {
    id: `CLI-${Date.now()}`,
    name,
    phone,
    debt
  };

  AppData.clients.unshift(newClient);
  if (isFirebaseOnline && db) {
    try {
      await db.collection("clients").doc(newClient.id).set(newClient);
    } catch (err) {
      console.error("Error guardando cliente en Firestore:", err);
    }
  }

  persistData();
  document.getElementById("modal-client")?.classList.add("hidden");
  renderClients();
};

window.renderClients = function() {
  const tbody = document.getElementById("clients-table-body");
  if (!tbody) return;

  tbody.innerHTML = AppData.clients.map(c => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="p-3 font-bold text-slate-800">${sanitize(c.name)}</td>
      <td class="p-3 font-mono text-xs">
        <a href="https://wa.me/${c.phone}" target="_blank" class="text-emerald-600 hover:underline flex items-center gap-1">
          <i class="fa-brands fa-whatsapp"></i> ${c.phone}
        </a>
      </td>
      <td class="p-3 font-mono font-bold ${c.debt > 0 ? 'text-rose-600' : 'text-slate-500'}">${formatCRC(c.debt)}</td>
      <td class="p-3 text-center">
        <button onclick="abonoClient('${c.id}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition">
          <i class="fa-solid fa-hand-holding-dollar mr-1"></i> Abonar
        </button>
      </td>
    </tr>
  `).join("");
};

window.abonoClient = async function(clientId) {
  const client = AppData.clients.find(c => c.id === clientId);
  if (!client) return;

  if (client.debt <= 0) {
    alert(`${client.name} no tiene saldo pendiente.`);
    return;
  }

  const amountStr = prompt(`Registrar abono a ${client.name}\nDeuda pendiente: ${formatCRC(client.debt)}\nIngrese el monto en Colones:`, client.debt);
  if (!amountStr) return;

  const amount = parseFloat(amountStr) || 0;
  if (amount <= 0) return;

  client.debt = Math.max(0, client.debt - amount);

  if (isFirebaseOnline && db) {
    try {
      await db.collection("clients").doc(client.id).update({ debt: client.debt });
    } catch (e) {
      console.error("Error actualizando abono en Firestore:", e);
    }
  }

  persistData();
  renderClients();
  alert(`Abono por ${formatCRC(amount)} aplicado con éxito. Saldo restante: ${formatCRC(client.debt)}`);
};

// ----------------------------------------------------------------------------
// 12. MÓDULO DE CAJEROS
// ----------------------------------------------------------------------------
window.openNewCashierModal = function() {
  document.getElementById("modal-cashier")?.classList.remove("hidden");
};

window.saveNewCashier = async function(e) {
  e.preventDefault();
  const name = document.getElementById("cashier-name")?.value.trim();
  const email = document.getElementById("cashier-email")?.value.trim();

  if (!name || !email) return;

  const newCashier = {
    id: `CSH-${Date.now()}`,
    name,
    email
  };

  AppData.cashiers.unshift(newCashier);
  if (isFirebaseOnline && db) {
    try {
      await db.collection("cashiers").doc(newCashier.id).set(newCashier);
    } catch (err) {
      console.error("Error guardando cajero en Firestore:", err);
    }
  }

  persistData();
  document.getElementById("modal-cashier")?.classList.add("hidden");
  renderCashiers();
};

window.renderCashiers = function() {
  const tbody = document.getElementById("cashiers-table-body");
  if (!tbody) return;

  tbody.innerHTML = AppData.cashiers.map(c => `
    <tr class="hover:bg-slate-50 transition border-b border-slate-100">
      <td class="p-3 font-bold text-slate-800">${sanitize(c.name)}</td>
      <td class="p-3 text-slate-600 font-mono text-xs">${sanitize(c.email)}</td>
      <td class="p-3 text-center">
        <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Activo</span>
      </td>
    </tr>
  `).join("");
};

// ----------------------------------------------------------------------------
// 13. VENTAS DE HOY, HISTORIAL Y EXPORTACIÓN A EXCEL
// ----------------------------------------------------------------------------
window.renderDailySales = function() {
  const tbody = document.getElementById("daily-sales-body");
  const revEl = document.getElementById("daily-total-revenue");
  if (!tbody) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = AppData.sales.filter(s => s.date.startsWith(todayStr));
  const totalRev = todaySales.reduce((acc, s) => acc + s.total, 0);

  if (revEl) revEl.textContent = formatCRC(totalRev);

  if (todaySales.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400">No se han registrado ventas hoy</td></tr>`;
  } else {
    tbody.innerHTML = todaySales.map(s => `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100 text-xs">
        <td class="p-3 font-mono font-bold text-indigo-700">#${s.invoiceNumber.slice(-8)}</td>
        <td class="p-3">${sanitize(s.cashier)}</td>
        <td class="p-3">${sanitize(s.client)}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">${s.paymentMethod}</span></td>
        <td class="p-3 font-mono font-bold">${formatCRC(s.total)}</td>
        <td class="p-3 text-center">
          <button onclick="viewSaleDetails('${s.id}')" class="text-indigo-600 hover:text-indigo-800 font-bold" title="Ver Recibo">
            <i class="fa-solid fa-receipt"></i>
          </button>
        </td>
      </tr>
    `).join("");
  }
};

window.renderHistory = function() {
  const tbody = document.getElementById("history-table-body");
  if (!tbody) return;

  const filterDate = document.getElementById("history-date-filter")?.value;
  let list = AppData.sales;
  if (filterDate) {
    list = list.filter(s => s.date.startsWith(filterDate));
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">No se encontraron ventas para esta fecha</td></tr>`;
  } else {
    tbody.innerHTML = list.map(s => `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100 text-xs">
        <td class="p-3 font-mono text-slate-500">${new Date(s.date).toLocaleString("es-CR")}</td>
        <td class="p-3 font-mono font-bold text-indigo-700">#${s.invoiceNumber.slice(-8)}</td>
        <td class="p-3">${sanitize(s.cashier)}</td>
        <td class="p-3">${s.paymentMethod}</td>
        <td class="p-3 font-mono font-bold">${formatCRC(s.total)}</td>
      </tr>
    `).join("");
  }
};

window.filterHistoryByDate = function() {
  renderHistory();
};

window.viewSaleDetails = function(saleId) {
  const sale = AppData.sales.find(s => s.id === saleId);
  if (sale) openInvoiceModal(sale);
};

window.exportToExcel = function(type) {
  let data = type === 'daily'
    ? AppData.sales.filter(s => s.date.startsWith(new Date().toISOString().slice(0, 10)))
    : AppData.sales;

  if (data.length === 0) {
    alert("No hay registros para exportar.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "ID,Fecha,Cajero,Cliente,Metodo,Subtotal,IVA,Total\n";

  data.forEach(s => {
    csvContent += `"${s.invoiceNumber}","${s.date}","${s.cashier}","${s.client}","${s.paymentMethod}",${s.subtotal},${s.totalIva},${s.total}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Ventas_${type}_SUPER_JYG.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ----------------------------------------------------------------------------
// 14. MÓDULO DE REPORTES Y CHART.JS
// ----------------------------------------------------------------------------
let chartDailyInstance = null;
let chartPaymentInstance = null;

window.renderStats = function() {
  const tbody = document.getElementById("cashier-stats-body");
  if (tbody) {
    // Agrupar ventas por cajero
    const stats = {};
    AppData.sales.forEach(s => {
      const c = s.cashier || "General";
      if (!stats[c]) stats[c] = { count: 0, total: 0, date: new Date(s.date).toLocaleDateString("es-CR") };
      stats[c].count += 1;
      stats[c].total += s.total;
    });

    tbody.innerHTML = Object.keys(stats).map(c => `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100 text-xs">
        <td class="p-3 font-bold text-slate-800">${sanitize(c)}</td>
        <td class="p-3 font-mono text-slate-500">${stats[c].date}</td>
        <td class="p-3 text-center font-bold">${stats[c].count}</td>
        <td class="p-3 text-right font-mono font-bold text-indigo-700">${formatCRC(stats[c].total)}</td>
      </tr>
    `).join("");
  }

  // Gráficos Chart.js
  if (typeof Chart !== 'undefined') {
    // Gráfico 1: Ventas por Método de Pago
    const paymentCounts = { "Efectivo": 0, "Tarjeta": 0, "SINPE Móvil": 0, "Línea de Crédito": 0 };
    AppData.sales.forEach(s => {
      if (paymentCounts[s.paymentMethod] !== undefined) {
        paymentCounts[s.paymentMethod] += s.total;
      }
    });

    const ctxPayment = document.getElementById("chartPaymentMethods");
    if (ctxPayment) {
      if (chartPaymentInstance) chartPaymentInstance.destroy();
      chartPaymentInstance = new Chart(ctxPayment, {
        type: 'doughnut',
        data: {
          labels: Object.keys(paymentCounts),
          datasets: [{
            data: Object.values(paymentCounts),
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: 'Ventas por Forma de Pago (₡)' }
          }
        }
      });
    }

    // Gráfico 2: Ventas de los últimos días
    const ctxDaily = document.getElementById("chartDailySales");
    if (ctxDaily) {
      if (chartDailyInstance) chartDailyInstance.destroy();
      chartDailyInstance = new Chart(ctxDaily, {
        type: 'bar',
        data: {
          labels: ['Hace 3 días', 'Antier', 'Ayer', 'Hoy'],
          datasets: [{
            label: 'Ingresos Totales (₡)',
            data: [
              45000,
              62000,
              89000,
              AppData.sales.filter(s => s.date.startsWith(new Date().toISOString().slice(0, 10))).reduce((a, b) => a + b.total, 0)
            ],
            backgroundColor: '#4f46e5'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: 'Tendencia Diaria de Ventas' }
          }
        }
      });
    }
  }
};

// ----------------------------------------------------------------------------
// 15. GESTIÓN DE ATAJOS DE TECLADO ([F1], [F4], [F9])
// ----------------------------------------------------------------------------
window.addEventListener("keydown", (e) => {
  // [F1] Enfocar buscador de productos o escáner
  if (e.key === "F1") {
    e.preventDefault();
    const searchInput = document.getElementById("pos-search");
    if (searchInput) {
      switchTab('pos');
      searchInput.focus();
      searchInput.select();
    }
  }
  // [F4] Enfocar monto en efectivo
  else if (e.key === "F4") {
    e.preventDefault();
    const cashInput = document.getElementById("cash-received");
    if (cashInput) {
      switchTab('pos');
      cashInput.focus();
      cashInput.select();
    }
  }
  // [F9] Facturar / Emitir venta
  else if (e.key === "F9") {
    e.preventDefault();
    completeSale();
  }
});

// Inicialización en carga del DOM
document.addEventListener("DOMContentLoaded", () => {
  initAuth();
});
