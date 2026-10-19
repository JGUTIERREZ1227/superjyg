import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Code, 
  FileCode2, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Lock, 
  Cpu, 
  Layers, 
  Printer, 
  KeyRound,
  ExternalLink
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'html' | 'css' | 'js' | 'rules'>('architecture');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (key: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ARCHITECTURE_DOC = `# DIRECTRICES DE ARQUITECTURA Y CIBERSEGURIDAD
SUPER J Y G - SISTEMA POS Y GESTIÓN CORPORATIVA (COSTA RICA)

1. PRINCIPIOS DE ARQUITECTURA ZERO-TRUST Y RBAC (ROLE-BASED ACCESS CONTROL)
-----------------------------------------------------------------------------
- Separación de Privilegios:
  * Cajero: Solo puede consultar inventario, emitir ventas (con su propio UID verificado), registrar abonos y cerrar su propio turno de caja. No puede cambiar precios unitarios de catálogo, ni anular comprobantes ya consolidados, ni editar el stock directamente sin una transacción de venta.
  * Administrador: Acceso total para crear y modificar productos, costos, límites de crédito de clientes, anulación de ventas con motivo de auditoría y gestión de empleados.

2. SEGURIDAD EN EL CLIENTE & PREVENCIÓN DE VULNERABILIDADES
-----------------------------------------------------------------------------
- Nunca confiar en cálculos del cliente:
  El backend o las reglas de Firestore validan que los montos totales correspondan al subtotal + IVA (13%, 1%, 2% o 0%).
- Sanitización de Entradas (Anti-XSS):
  Validación estricta de cadenas (longitud máxima y caracteres seguros) en nombres de productos, códigos de barra y notas.
- Teclado y Escáner Rápido:
  Buffer de escaneo para terminales USB/Bluetooth que previene interferencia con inputs de texto normales.

3. NORMATIVA TRIBUTARIA DE COSTA RICA (DGT LEY 9635)
-----------------------------------------------------------------------------
- Desglose Fiscal en cada tiquete:
  * Tarifa General: 13%
  * Canasta Básica Tributaria (CBT): 1%
  * Bienes y Servicios Exentos: 0%
- Clave Numérica de 50 Dígitos:
  Estructurada con código de país (506), fecha, cédula de 12 dígitos, consecutivo de 20 dígitos y código de seguridad de 8 dígitos.

4. SEGURIDAD Y RESTRICCIONES EN CLOUD FIRESTORE
-----------------------------------------------------------------------------
- Default-Deny: Bloqueo de todas las lecturas y escrituras por defecto.
- Inmutabilidad de Ventas: Una vez creada con estado 'COMPLETADA', no se pueden alterar sus líneas ni montos.
- Prevención de 'Denial of Wallet':
  Límites estrictos de tamaño (.size() <= 128 en strings, colecciones controladas).`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Encabezado */}
        <div className="bg-slate-900 text-white p-4.5 sm:px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/30 text-teal-400 border border-teal-500/40 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight">Auditoría de Arquitectura & Código Fuente</h2>
              <p className="text-xs text-slate-400">Entregables oficiales para desarrollo y despliegue seguro en producción</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Pestañas de Navegación de Entregables */}
        <div className="bg-slate-100 p-2 sm:px-6 border-b border-slate-200 flex space-x-1.5 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-2 px-3.5 rounded-xl flex items-center gap-2 transition ${
              activeTab === 'architecture'
                ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Layers className="w-4 h-4 text-teal-700" />
            <span>1. Directrices de Arquitectura</span>
          </button>

          <button
            onClick={() => setActiveTab('html')}
            className={`py-2 px-3.5 rounded-xl flex items-center gap-2 transition ${
              activeTab === 'html'
                ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <FileCode2 className="w-4 h-4 text-orange-600" />
            <span>2. HTML Semántico</span>
          </button>

          <button
            onClick={() => setActiveTab('css')}
            className={`py-2 px-3.5 rounded-xl flex items-center gap-2 transition ${
              activeTab === 'css'
                ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>3. CSS & Térmica 80mm</span>
          </button>

          <button
            onClick={() => setActiveTab('js')}
            className={`py-2 px-3.5 rounded-xl flex items-center gap-2 transition ${
              activeTab === 'js'
                ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Code className="w-4 h-4 text-amber-600" />
            <span>4. JavaScript Modular [F1,F4,F9]</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`py-2 px-3.5 rounded-xl flex items-center gap-2 transition ${
              activeTab === 'rules'
                ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>5. Firestore Security Rules</span>
          </button>
        </div>

        {/* Contenido Dinámico por Pestaña */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50">
          
          {/* TAB 1: ARQUITECTURA */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900">Directrices de Arquitectura y Seguridad Aplicadas</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy('arch', ARCHITECTURE_DOC)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition"
                    >
                      {copiedKey === 'arch' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'arch' ? 'Copiado' : 'Copiar Texto'}</span>
                    </button>
                    <button
                      onClick={() => handleDownloadFile('arquitectura-pos-seguridad.md', ARCHITECTURE_DOC, 'text/markdown')}
                      className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-xs font-bold text-white flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar .MD</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-teal-700" /> 1. Autenticación y Control de Roles (RBAC)
                    </h4>
                    <p className="text-slate-600 leading-relaxed">
                      Implementa sesiones seguras con Firebase Auth (<code className="font-mono bg-white px-1 rounded">signInWithEmailAndPassword</code>) y observadores de sesión (<code className="font-mono bg-white px-1 rounded">onAuthStateChanged</code>).
                      El rol no se confía a nivel de cliente ni tokens manipulables, sino que se valida contra el documento protegido del usuario en Firestore.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-teal-700" /> 2. Seguridad en Cloud Firestore (Zero-Trust)
                    </h4>
                    <p className="text-slate-600 leading-relaxed">
                      Reglas matemáticas estrictas impiden a cajeros alterar precios de inventario o modificar ventas pasadas. Las ventas tienen estado terminal bloqueado (<code className="font-mono bg-white px-1 rounded">status == 'COMPLETADA'</code>) y solo un administrador con credenciales auditadas puede anularlas.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-teal-700" /> 3. Sanitización y Validación de Datos
                    </h4>
                    <p className="text-slate-600 leading-relaxed">
                      Límites explícitos sobre montos monetarios en Colones (no negativos, redondeo a 2 decimales para evitar fugas de coma flotante) y validación de tipos impositivos admitidos por Hacienda (13%, 1%, 0%).
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                      <Printer className="w-4 h-4 text-teal-700" /> 4. Impresión Térmica ESC/POS (80mm)
                    </h4>
                    <p className="text-slate-600 leading-relaxed">
                      Estilos optimizados con <code className="font-mono bg-white px-1 rounded">@media print</code> para rollos de 80mm y 58mm comunes en Costa Rica. Incluye clave numérica de 50 dígitos DGT, código de barras y corte de papel automático.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HTML SEMÁNTICO */}
          {activeTab === 'html' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-mono">Archivo: public/pos-vanilla.html</span>
                <a
                  href="/pos-vanilla.html"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-xs font-bold text-white flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Versión Vanilla Pura</span>
                </a>
              </div>
              <pre className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[500px]">
{`<!-- Archivo disponible en /public/pos-vanilla.html -->
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>SUPER J Y G | Sistema POS y Gestión Corporativa</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="./pos-styles.css">
</head>
<body class="bg-slate-100 antialiased min-h-screen">
  <!-- Estructura semántica con Header, POS, Inventario, Cartera, Arqueo y Tiquetes -->
  ...
</body>
</html>`}
              </pre>
            </div>
          )}

          {/* TAB 3: CSS & REGLAS DE IMPRESIÓN */}
          {activeTab === 'css' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-mono">Archivo: public/pos-styles.css</span>
                <button
                  onClick={() => handleDownloadFile('pos-styles.css', '/* CSS */', 'text/css')}
                  className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-xs font-bold text-white flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar CSS</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[500px]">
{`/* REGLAS ESTRICTAS DE IMPRESIÓN TÉRMICA (@media print) */
@media print {
  body * {
    visibility: hidden;
  }
  #thermal-receipt, #thermal-receipt * {
    visibility: visible;
  }
  #thermal-receipt {
    position: absolute;
    left: 0;
    top: 0;
    width: 78mm !important;
    margin: 0 !important;
    padding: 2mm 3mm !important;
    background: #ffffff !important;
    color: #000000 !important;
    font-family: 'Courier New', Courier, monospace !important;
    font-size: 11px !important;
    line-height: 1.25 !important;
  }
  @page {
    size: 80mm auto;
    margin: 0mm;
  }
}`}
              </pre>
            </div>
          )}

          {/* TAB 4: JAVASCRIPT MODULAR */}
          {activeTab === 'js' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-mono">Archivo: public/pos-app.js</span>
                <button
                  onClick={() => handleDownloadFile('pos-app.js', '// JS Code', 'application/javascript')}
                  className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-xs font-bold text-white flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar JS</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[500px]">
{`// Atajos de teclado del Cajero [F1], [F4], [F9]
window.addEventListener("keydown", (e) => {
  if (e.key === "F1") {
    e.preventDefault();
    openPaymentModal();
  } else if (e.key === "F4") {
    e.preventDefault();
    document.getElementById("pos-barcode-input")?.focus();
  } else if (e.key === "F9") {
    e.preventDefault();
    clearCart();
  }
});

// Motor de Cálculo IVA Costa Rica (13%, 1%, 0%)
function calculateCartTotals() {
  let subtotal = 0, iva1 = 0, iva13 = 0, exento = 0;
  AppState.cart.forEach(item => {
    const net = item.price * item.quantity;
    subtotal += net;
    if (item.ivaRate === 0.01) iva1 += net * 0.01;
    else if (item.ivaRate === 0.13) iva13 += net * 0.13;
    else if (item.ivaRate === 0) exento += net;
  });
  return { subtotal, iva1, iva13, exento, grandTotal: subtotal + iva1 + iva13 };
}`}
              </pre>
            </div>
          )}

          {/* TAB 5: FIRESTORE RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-mono">Archivo: firestore.rules</span>
                <button
                  onClick={() => handleDownloadFile('firestore.rules', '// Rules', 'text/plain')}
                  className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-xs font-bold text-white flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar firestore.rules</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[500px]">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // Global Safety Net
    }

    function isSignedIn() { return request.auth != null; }
    function isAdmin() {
      return isSignedIn() &&
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Ventas Inmutables: Cajeros crean con su UID; nadie borra; solo admin anula
    match /sales/{saleId} {
      allow get, list: if isSignedIn();
      allow create: if isSignedIn() && incoming().cashierId == request.auth.uid;
      allow update: if isAdmin() &&
        existing().status == 'COMPLETADA' &&
        incoming().diff(existing()).affectedKeys().hasOnly(['status', 'cancellationReason', 'cancelledAt', 'cancelledBy']) &&
        incoming().status == 'ANULADA';
      allow delete: if false;
    }
  }
}`}
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-xs"
          >
            Cerrar Panel de Auditoría
          </button>
        </div>

      </div>
    </div>
  );
};
