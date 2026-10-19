import React, { useState } from 'react';
import { MermaRecord, MermaReason, Product, UserProfile } from '../types/pos';
import { formatColones } from '../data/mockDatabase';
import { AlertOctagon, Plus, Calendar, User, TrendingDown } from 'lucide-react';

interface MermasManagerProps {
  mermas: MermaRecord[];
  products: Product[];
  currentUser: UserProfile;
  onRecordMerma: (merma: MermaRecord) => void;
}

export const MermasManager: React.FC<MermasManagerProps> = ({
  mermas,
  products,
  currentUser,
  onRecordMerma,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<MermaReason>('VENCIMIENTO');

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const estimatedLoss = selectedProduct ? selectedProduct.costPrice * quantity : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (quantity <= 0) {
      alert('La cantidad debe ser mayor a 0.');
      return;
    }

    if (quantity > selectedProduct.stock) {
      alert(`No puede registrar más unidades (${quantity}) que las disponibles en stock (${selectedProduct.stock}).`);
      return;
    }

    const newMerma: MermaRecord = {
      id: `merma-${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      reason,
      lossCost: estimatedLoss,
      reportedBy: currentUser.displayName,
      authorizedBy: currentUser.role === 'admin' ? currentUser.displayName : 'Gerencia SUPER J Y G',
      createdAt: new Date().toISOString(),
    };

    onRecordMerma(newMerma);
    setIsModalOpen(false);
    setQuantity(1);
  };

  const totalLossCost = mermas.reduce((acc, m) => acc + m.lossCost, 0);
  const totalUnitsLost = mermas.reduce((acc, m) => acc + m.quantity, 0);

  return (
    <div className="space-y-4">
      
      {/* Resumen de Mermas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pérdida Total en Costo</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-600">
            {formatColones(totalLossCost)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Costo de adquisición de productos dados de baja</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unidades Mermadas</span>
            <AlertOctagon className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {totalUnitsLost} artículos
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total de bajas registradas en inventario</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registro y Control</span>
            <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Auditoría
            </span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-3 w-full bg-rose-600 hover:bg-rose-700 text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nueva Merma</span>
          </button>
        </div>

      </div>

      {/* Historial de Mermas */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900">Historial de Mermas y Bajas de Mercadería</h3>
          <p className="text-xs text-slate-400">Auditoría con trazabilidad de usuario y justificación</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4 text-center">Cantidad</th>
                <th className="py-3 px-4">Motivo de Merma</th>
                <th className="py-3 px-4 text-right">Pérdida en Costo (₡)</th>
                <th className="py-3 px-4">Reportado Por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mermas.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {new Date(m.createdAt).toLocaleDateString('es-CR')}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{m.productName}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-rose-600">
                    {m.quantity}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {m.reason}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatColones(m.lossCost)}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {m.reportedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Registrar Merma */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-rose-700 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">Registrar Bajas de Inventario (Merma)</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-rose-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Seleccionar Producto:</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cantidad a Dar de Baja:</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Motivo:</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as MermaReason)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="VENCIMIENTO">Vencimiento</option>
                    <option value="EMPAQUE_DANADO">Empaque Dañado</option>
                    <option value="CONSUMO_INTERNO">Consumo Interno</option>
                    <option value="ROBO_EXTRAVIO">Robo / Extravío</option>
                    <option value="DESCONGELAMIENTO">Descongelamiento</option>
                  </select>
                </div>
              </div>

              {/* Pérdida calculada */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center font-mono">
                <span className="text-slate-500 font-sans text-xs">Pérdida Estimada en Costo:</span>
                <strong className="text-rose-600 text-sm">{formatColones(estimatedLoss)}</strong>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Registrar Merma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
