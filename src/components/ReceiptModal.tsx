import React from 'react';
import { SaleRecord } from '../types/pos';
import { formatColones } from '../data/mockDatabase';
import { Printer, X, Download, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  sale: SaleRecord | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    // Generar el bloque en el div thermal-receipt del DOM para impresión nativa
    const receiptContainer = document.getElementById('thermal-receipt');
    if (receiptContainer) {
      receiptContainer.innerHTML = document.getElementById('printable-thermal-area')?.innerHTML || '';
    }
    window.print();
  };

  const handleDownloadCopy = () => {
    const textData = `
========================================
             SUPER J Y G
       Céd. Jurídica: 3-101-789456
        San José, Costa Rica
         Tel: +506 2222-8899
========================================
TIQUETE ELECTRÓNICO (DGT COSTA RICA)
Clave Numérica:
${sale.invoiceNumber}
Fecha/Hora: ${new Date(sale.createdAt).toLocaleString('es-CR')}
Cajero: ${sale.cashierName}
Cliente: ${sale.clientName} (${sale.clientDoc})
Método de Pago: ${sale.paymentMethod}
----------------------------------------
CANT. DESCRIPCIÓN               TOTAL
----------------------------------------
${sale.items.map(it => `${it.quantity.toString().padEnd(5)} ${it.name.slice(0, 22).padEnd(23)} ${formatColones(it.lineTotal)}`).join('\n')}
----------------------------------------
Subtotal Neto:              ${formatColones(sale.subtotal)}
IVA Canasta Básica (1%):     ${formatColones(sale.iva1)}
IVA Tarifa General (13%):    ${formatColones(sale.iva13)}
Ventas Exentas (0%):         ${formatColones(sale.exento)}
----------------------------------------
TOTAL A PAGAR:              ${formatColones(sale.total)}
Monto Recibido:             ${formatColones(sale.amountPaid)}
Vuelto / Cambio:            ${formatColones(sale.change)}
========================================
Autorizada mediante resolución de la DGT
N° DGT-R-033-2019 de Costa Rica.
¡Muchas gracias por su compra en SUPER J Y G!
    `.trim();

    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tiquete_${sale.invoiceNumber.slice(-8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Encabezado del diálogo */}
        <div className="bg-teal-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm tracking-wide">Venta Emitida con Éxito</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-teal-200 hover:text-white transition p-1 rounded-lg hover:bg-teal-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vista previa simulada de rollo de papel térmico (80mm) */}
        <div className="p-4 bg-slate-100 flex justify-center max-h-[480px] overflow-y-auto">
          <div 
            id="printable-thermal-area" 
            className="w-full max-w-[310px] bg-white p-4 shadow-sm border border-slate-300 font-mono text-[11px] leading-tight text-slate-900 rounded-sm"
          >
            <div className="text-center font-bold text-sm text-slate-950">SUPER J Y G</div>
            <div className="text-center text-[10px] text-slate-600">Cédula Jurídica: 3-101-789456</div>
            <div className="text-center text-[10px] text-slate-600">San José, Costa Rica</div>
            <div className="text-center text-[10px] text-slate-600">Tel: +506 2222-8899</div>
            
            <div className="border-t border-dashed border-slate-400 my-2"></div>

            <div className="text-center font-bold text-xs uppercase tracking-wider">TIQUETE ELECTRÓNICO</div>
            <div className="text-[9px] text-slate-500 break-all text-center mt-0.5">
              Clave DGT: {sale.invoiceNumber}
            </div>
            <div className="mt-1 flex justify-between text-[10px]">
              <span>Fecha:</span>
              <span>{new Date(sale.createdAt).toLocaleDateString('es-CR')} {new Date(sale.createdAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Cajero:</span>
              <span className="font-semibold">{sale.cashierName}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Cliente:</span>
              <span className="truncate max-w-[140px]">{sale.clientName}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Identificación:</span>
              <span>{sale.clientDoc}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Medio de Pago:</span>
              <span className="font-bold">{sale.paymentMethod}</span>
            </div>

            <div className="border-t border-dashed border-slate-400 my-2"></div>

            {/* Tabla de Artículos */}
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="border-b border-slate-900">
                  <th className="py-1">Cant</th>
                  <th className="py-1">Artículo</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items.map((it, idx) => (
                  <tr key={idx} className="py-1">
                    <td className="align-top py-1 font-bold">{it.quantity}</td>
                    <td className="align-top py-1 pr-1">
                      <div>{it.name}</div>
                      <div className="text-[8.5px] text-slate-500">
                        {formatColones(it.unitPrice)} c/u (IVA {(it.ivaRate * 100).toFixed(0)}%)
                      </div>
                    </td>
                    <td className="align-top py-1 text-right font-semibold whitespace-nowrap">
                      {formatColones(it.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-dashed border-slate-400 my-2"></div>

            {/* Desglose Tributario DGT */}
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal Neto:</span>
                <span>{formatColones(sale.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[9.5px]">
                <span>IVA Canasta Básica (1%):</span>
                <span>{formatColones(sale.iva1)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[9.5px]">
                <span>IVA Tarifa General (13%):</span>
                <span>{formatColones(sale.iva13)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[9.5px]">
                <span>Ventas Exentas (0%):</span>
                <span>{formatColones(sale.exento)}</span>
              </div>
              <div className="border-t border-slate-800 pt-1 flex justify-between font-black text-xs text-slate-950">
                <span>TOTAL PAGADO:</span>
                <span>{formatColones(sale.total)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>Monto Entregado:</span>
                <span>{formatColones(sale.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-bold text-[10px]">
                <span>Vuelto:</span>
                <span>{formatColones(sale.change)}</span>
              </div>
            </div>

            <div className="border-t border-double border-slate-900 my-2"></div>

            <div className="text-center text-[8.5px] text-slate-500 leading-tight">
              Autorizada mediante resolución de la DGT Costa Rica N° DGT-R-033-2019.<br />
              ¡Gracias por preferir a SUPER J Y G!
            </div>

            {/* Código de barras simulado en CSS */}
            <div className="mt-2 text-center border border-slate-800 py-1.5 font-mono font-bold tracking-widest text-[11px] bg-slate-50">
              *{sale.invoiceNumber.slice(-10)}*
            </div>
          </div>
        </div>

        {/* Acciones del Modal */}
        <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
          <button
            onClick={handleDownloadCopy}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Descargar Copia</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Térmica (80mm)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
