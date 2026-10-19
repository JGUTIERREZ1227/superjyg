import React, { useState } from 'react';
import { CashShift, SaleRecord } from '../types/pos';
import { formatColones } from '../data/mockDatabase';
import { Vault, Banknote, CreditCard, Smartphone, BookOpen, AlertTriangle, CheckCircle, Calculator, Printer } from 'lucide-react';

interface CashShiftManagerProps {
  currentShift: CashShift;
  sales: SaleRecord[];
  onCloseShift: (actualCash: number, difference: number, notes?: string) => void;
  onOpenNewShift: (openingAmount: number) => void;
}

export const CashShiftManager: React.FC<CashShiftManagerProps> = ({
  currentShift,
  sales,
  onCloseShift,
  onOpenNewShift,
}) => {
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [newOpeningAmount, setNewOpeningAmount] = useState<string>('50000');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  // Filtrar ventas de este turno
  const shiftSales = sales.filter(s => s.shiftId === currentShift.id);

  const cashSalesTotal = shiftSales
    .filter(s => s.paymentMethod === 'EFECTIVO' && s.status === 'COMPLETADA')
    .reduce((acc, s) => acc + s.total, 0);

  const cardSalesTotal = shiftSales
    .filter(s => s.paymentMethod === 'TARJETA' && s.status === 'COMPLETADA')
    .reduce((acc, s) => acc + s.total, 0);

  const sinpeSalesTotal = shiftSales
    .filter(s => s.paymentMethod === 'SINPE_MOVIL' && s.status === 'COMPLETADA')
    .reduce((acc, s) => acc + s.total, 0);

  const creditSalesTotal = shiftSales
    .filter(s => s.paymentMethod === 'CREDITO' && s.status === 'COMPLETADA')
    .reduce((acc, s) => acc + s.total, 0);

  const grandSalesTotal = cashSalesTotal + cardSalesTotal + sinpeSalesTotal + creditSalesTotal;
  const expectedCashInDrawer = currentShift.openingAmount + cashSalesTotal;

  const actualCashNumber = parseFloat(actualCashInput) || 0;
  const cashDifference = actualCashNumber - expectedCashInDrawer;

  const handleExecuteClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualCashInput) {
      alert('Debe digitar el conteo de efectivo para el arqueo ciego.');
      return;
    }

    if (window.confirm('¿Está seguro de cerrar el turno actual? Esta acción consolidará las ventas y bloqueará el turno.')) {
      onCloseShift(actualCashNumber, cashDifference, notes);
      setIsAuditing(false);
      setActualCashInput('');
      setNotes('');
    }
  };

  const handleExecuteNewShift = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newOpeningAmount) || 0;
    if (amount < 0) {
      alert('El fondo inicial no puede ser negativo.');
      return;
    }
    onOpenNewShift(amount);
  };

  return (
    <div className="space-y-4">
      
      {/* Estado del Turno Actual */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
            <Vault className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">Control de Caja y Turnos</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                currentShift.status === 'ABIERTO' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {currentShift.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Turno: <strong>{currentShift.id}</strong> | Cajero: {currentShift.cashierName}
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Apertura: <strong>{new Date(currentShift.openedAt).toLocaleString('es-CR')}</strong>
        </div>
      </div>

      {/* Métricas del Arqueo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/90">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
            <span>Fondo Inicial</span>
            <Banknote className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black font-mono text-slate-900 mt-2">
            {formatColones(currentShift.openingAmount)}
          </div>
          <span className="text-[10px] text-slate-400">Efectivo inicial en gaveta</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/90">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
            <span>Ventas Efectivo</span>
            <Banknote className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-700 mt-2">
            {formatColones(cashSalesTotal)}
          </div>
          <span className="text-[10px] text-slate-400">Total recaudado en colones</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/90">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
            <span>Ventas Digitales</span>
            <Smartphone className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-black font-mono text-teal-800 mt-2">
            {formatColones(cardSalesTotal + sinpeSalesTotal)}
          </div>
          <span className="text-[10px] text-slate-400">Datafono + SINPE Móvil</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/90">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
            <span>Efectivo Esperado</span>
            <Calculator className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-xl font-black font-mono text-teal-950 mt-2">
            {formatColones(expectedCashInDrawer)}
          </div>
          <span className="text-[10px] text-slate-400">Fondo Inicial + Efectivo Ventas</span>
        </div>

      </div>

      {/* Desglose de Transacciones por Método */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5">
        <h3 className="font-bold text-sm text-slate-900 mb-3">Consolidado de Ventas en el Turno</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
              <Banknote className="w-4 h-4 text-emerald-600" /> Efectivo
            </div>
            <div className="text-base font-black font-mono text-slate-900">{formatColones(cashSalesTotal)}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
              <CreditCard className="w-4 h-4 text-blue-600" /> Tarjeta (Datafono)
            </div>
            <div className="text-base font-black font-mono text-slate-900">{formatColones(cardSalesTotal)}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
              <Smartphone className="w-4 h-4 text-amber-600" /> SINPE Móvil
            </div>
            <div className="text-base font-black font-mono text-slate-900">{formatColones(sinpeSalesTotal)}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
              <BookOpen className="w-4 h-4 text-purple-600" /> Crédito Cartera
            </div>
            <div className="text-base font-black font-mono text-slate-900">{formatColones(creditSalesTotal)}</div>
          </div>

        </div>
      </div>

      {/* Módulo de Arqueo Ciego y Cierre de Caja */}
      {currentShift.status === 'ABIERTO' ? (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-6 max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Arqueo Ciego de Gaveta</h3>
              <p className="text-xs text-slate-400">Cuadre de caja al cierre del turno</p>
            </div>
            <Calculator className="w-5 h-5 text-teal-800" />
          </div>

          <form onSubmit={handleExecuteClose} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Conteo Total de Billetes y Monedas (₡):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-500">₡</span>
                <input
                  type="number"
                  value={actualCashInput}
                  onChange={(e) => {
                    setActualCashInput(e.target.value);
                    setIsAuditing(true);
                  }}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-300 font-mono font-bold text-xl text-slate-900 focus:ring-2 focus:ring-teal-600"
                  required
                />
              </div>
            </div>

            {/* Resultado de la Auditoría */}
            {isAuditing && actualCashInput !== '' && (
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                cashDifference === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : cashDifference > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block">
                    {cashDifference === 0 ? 'Cuadre Perfecto' : cashDifference > 0 ? 'Sobrante de Caja' : 'Faltante de Caja'}
                  </span>
                  <span className="text-[11px] opacity-80">
                    Esperado: {formatColones(expectedCashInDrawer)} | Contado: {formatColones(actualCashNumber)}
                  </span>
                </div>
                <div className="text-xl font-black font-mono">
                  {cashDifference > 0 ? `+${formatColones(cashDifference)}` : formatColones(cashDifference)}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones / Notas de Entrega:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Indicar detalles de billetes deteriorados, salidas extraordinarias, etc."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs h-18 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-sm shadow-md transition"
            >
              Finalizar y Cerrar Turno
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-6 max-w-md mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">El Turno ha sido Cerrado</h3>
            <p className="text-xs text-slate-500 mt-1">
              Diferencia registrada: <strong>{formatColones(currentShift.difference || 0)}</strong>
            </p>
          </div>

          <form onSubmit={handleExecuteNewShift} className="pt-3 border-t border-slate-100 space-y-3">
            <label className="block text-xs font-bold text-slate-700 text-left">
              Fondo Inicial para Nuevo Turno (₡):
            </label>
            <input
              type="number"
              value={newOpeningAmount}
              onChange={(e) => setNewOpeningAmount(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-base"
              required
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs"
            >
              Abrir Nuevo Turno de Caja
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
