import React from 'react';
import { SaleRecord } from '../types/pos';
import { formatColones } from '../data/mockDatabase';
import { BarChart3, PieChart, TrendingUp, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface ReportsScreenProps {
  sales: SaleRecord[];
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ sales }) => {
  const completedSales = sales.filter(s => s.status === 'COMPLETADA');

  const totalNetSubtotal = completedSales.reduce((acc, s) => acc + s.subtotal, 0);
  const totalIva1 = completedSales.reduce((acc, s) => acc + s.iva1, 0);
  const totalIva13 = completedSales.reduce((acc, s) => acc + s.iva13, 0);
  const totalExento = completedSales.reduce((acc, s) => acc + s.exento, 0);
  const totalGrand = completedSales.reduce((acc, s) => acc + s.total, 0);

  // Desglose por método de pago
  const cashSales = completedSales.filter(s => s.paymentMethod === 'EFECTIVO').reduce((a, b) => a + b.total, 0);
  const cardSales = completedSales.filter(s => s.paymentMethod === 'TARJETA').reduce((a, b) => a + b.total, 0);
  const sinpeSales = completedSales.filter(s => s.paymentMethod === 'SINPE_MOVIL').reduce((a, b) => a + b.total, 0);
  const creditSales = completedSales.filter(s => s.paymentMethod === 'CREDITO').reduce((a, b) => a + b.total, 0);

  const getPercentage = (amount: number) => {
    if (totalGrand === 0) return 0;
    return Math.round((amount / totalGrand) * 100);
  };

  return (
    <div className="space-y-4">
      
      {/* Resumen Principal de Métricas Fiscales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Ventas Totales Brutas
          </span>
          <div className="text-2xl font-black font-mono text-teal-900">
            {formatColones(totalGrand)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {completedSales.length} transacciones emitidas
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Subtotal Neto Gravado y Exento
          </span>
          <div className="text-2xl font-black font-mono text-slate-800">
            {formatColones(totalNetSubtotal)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Base imponible total
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            IVA Tarifa General (13%)
          </span>
          <div className="text-2xl font-black font-mono text-blue-700">
            {formatColones(totalIva13)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Impuesto recaudado para Hacienda
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            IVA Canasta Básica (1%)
          </span>
          <div className="text-2xl font-black font-mono text-emerald-700">
            {formatColones(totalIva1)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Bienes de primera necesidad
          </span>
        </div>

      </div>

      {/* Gráficos Visuales de Distribución */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Gráfico de Métodos de Pago */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-teal-800" />
              <span>Distribución por Método de Pago</span>
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">{completedSales.length} comprobantes</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Efectivo', amount: cashSales, color: 'bg-emerald-500', barBg: 'bg-emerald-100' },
              { label: 'Tarjeta (Datafono)', amount: cardSales, color: 'bg-blue-500', barBg: 'bg-blue-100' },
              { label: 'SINPE Móvil', amount: sinpeSales, color: 'bg-amber-500', barBg: 'bg-amber-100' },
              { label: 'Crédito de Cartera', amount: creditSales, color: 'bg-purple-500', barBg: 'bg-purple-100' },
            ].map(item => {
              const pct = getPercentage(item.amount);
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{item.label} ({pct}%)</span>
                    <span className="font-mono font-bold text-slate-900">{formatColones(item.amount)}</span>
                  </div>
                  <div className={`w-full h-3 rounded-full ${item.barBg} overflow-hidden`}>
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Liquidación de Impuestos DGT Costa Rica */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-800" />
              <span>Liquidación Tributaria IVA (D-104)</span>
            </h3>
            <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">
              Ley 9635 CR
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Tarifa General (13%):</span>
              <strong className="text-slate-900">{formatColones(totalIva13)}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Canasta Básica Tributaria (1%):</span>
              <strong className="text-slate-900">{formatColones(totalIva1)}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Ventas Exentas (0%):</span>
              <strong className="text-slate-900">{formatColones(totalExento)}</strong>
            </div>
            <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between font-bold text-sm text-slate-900">
              <span>TOTAL DÉBITO FISCAL (IVA):</span>
              <span className="text-teal-800">{formatColones(totalIva1 + totalIva13)}</span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-teal-50 border border-teal-200/80 text-[11px] text-teal-900 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <strong>Cumplimiento DGT:</strong> Todos los comprobantes electrónicos generados en SUPER J Y G
              incluyen la clave numérica de 50 dígitos y los desgloses según los artículos de la Ley de Fortalecimiento de las Finanzas Públicas de Costa Rica.
            </div>
          </div>
        </div>

      </div>

      {/* Tabla de Últimas Ventas Emitidas */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Historial Reciente de Comprobantes</h3>
            <p className="text-xs text-slate-400">Tiquetes electrónicos y facturas autorizadas</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-4">Clave DGT (Consecutivo)</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">IVA</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {completedSales.slice(0, 10).map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-sans text-slate-500">
                    {new Date(s.createdAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800 text-[11px]">
                    ...{s.invoiceNumber.slice(-12)}
                  </td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-700">
                    {s.clientName}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {s.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">{formatColones(s.subtotal)}</td>
                  <td className="py-3 px-4 text-right text-slate-600">{formatColones(s.totalIva)}</td>
                  <td className="py-3 px-4 text-right font-black text-teal-800">{formatColones(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
