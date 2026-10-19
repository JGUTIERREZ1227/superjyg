import React, { useState } from 'react';
import { Client, UserRole } from '../types/pos';
import { formatColones } from '../data/mockDatabase';
import { UserPlus, CreditCard, DollarSign, CheckCircle2, AlertCircle, Phone, Mail, FileText } from 'lucide-react';

interface ClientsManagerProps {
  clients: Client[];
  userRole: UserRole;
  onAddClient: (client: Client) => void;
  onRecordPayment: (clientId: string, amount: number) => void;
}

export const ClientsManager: React.FC<ClientsManagerProps> = ({
  clients,
  userRole,
  onAddClient,
  onRecordPayment,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClientForPayment, setSelectedClientForPayment] = useState<Client | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  // Form state para nuevo cliente
  const [formName, setFormName] = useState('');
  const [formId, setFormId] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCreditLimit, setFormCreditLimit] = useState<number>(50000);

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formId.trim()) {
      alert('Nombre completo y cédula son obligatorios.');
      return;
    }

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      fullName: formName.trim(),
      identification: formId.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim() || undefined,
      creditLimit: Number(formCreditLimit),
      currentDebt: 0,
      isActive: true,
    };

    onAddClient(newClient);
    setIsAddModalOpen(false);
    setFormName('');
    setFormId('');
    setFormPhone('');
    setFormEmail('');
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForPayment) return;

    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) {
      alert('El monto del abono debe ser mayor a cero.');
      return;
    }

    if (amount > selectedClientForPayment.currentDebt) {
      alert(`El abono (${formatColones(amount)}) no puede ser mayor a la deuda pendiente (${formatColones(selectedClientForPayment.currentDebt)}).`);
      return;
    }

    onRecordPayment(selectedClientForPayment.id, amount);
    alert(`Abono por ${formatColones(amount)} registrado exitosamente para ${selectedClientForPayment.fullName}.`);
    setSelectedClientForPayment(null);
    setPaymentAmount('');
  };

  const totalPortfolioDebt = clients.reduce((acc, c) => acc + c.currentDebt, 0);
  const totalCreditLimit = clients.reduce((acc, c) => acc + c.creditLimit, 0);

  return (
    <div className="space-y-4">
      
      {/* Resumen de Cartera de Créditos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cuentas por Cobrar Total</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-600">
            {formatColones(totalPortfolioDebt)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Saldo total pendiente en la pulpería/supermercado</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Línea de Crédito Otorgada</span>
            <CreditCard className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {formatColones(totalCreditLimit)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Límite global máximo autorizado a clientes</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clientes de Cartera</span>
            <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {clients.length} registrados
            </span>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-3 w-full bg-teal-800 hover:bg-teal-900 text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Nuevo Cliente</span>
          </button>
        </div>

      </div>

      {/* Tarjetas de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {clients.map(cli => {
          const available = cli.creditLimit - cli.currentDebt;
          const usagePercent = Math.min(100, Math.round((cli.currentDebt / cli.creditLimit) * 100));

          return (
            <div key={cli.id} className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{cli.fullName}</h3>
                    <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                      <FileText className="w-3 h-3" />
                      <span>{cli.identification}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    cli.currentDebt > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {cli.currentDebt > 0 ? 'Con Saldo' : 'Al Día'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-500 my-3">
                  {cli.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cli.phone}</span>
                    </div>
                  )}
                  {cli.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{cli.email}</span>
                    </div>
                  )}
                </div>

                {/* Barra de uso de crédito */}
                <div className="space-y-1.5 my-3">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Deuda: {formatColones(cli.currentDebt)}</span>
                    <span className="text-slate-500">Límite: {formatColones(cli.creditLimit)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        usagePercent > 80 ? 'bg-rose-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-teal-600'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Disponible:</span>
                    <strong className="font-mono text-emerald-700">{formatColones(available)}</strong>
                  </div>
                </div>
              </div>

              {/* Botón de Abonar Deuda */}
              <button
                onClick={() => {
                  setSelectedClientForPayment(cli);
                  setPaymentAmount(cli.currentDebt > 0 ? Math.min(cli.currentDebt, 10000).toString() : '0');
                }}
                disabled={cli.currentDebt <= 0}
                className="mt-3 w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:pointer-events-none"
              >
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Registrar Abono a Cuenta</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal para Registrar Abono */}
      {selectedClientForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="bg-teal-800 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Registrar Abono a Cuenta</h3>
                <p className="text-[11px] text-teal-200">{selectedClientForPayment.fullName}</p>
              </div>
              <button onClick={() => setSelectedClientForPayment(null)} className="text-teal-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleExecutePayment} className="p-5 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between font-mono">
                <span className="text-slate-500">Deuda Actual:</span>
                <strong className="text-rose-600">{formatColones(selectedClientForPayment.currentDebt)}</strong>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Monto del Abono en Colones (₡):</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 font-mono font-bold text-lg text-emerald-800 focus:ring-2 focus:ring-teal-600"
                  max={selectedClientForPayment.currentDebt}
                  autoFocus
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentAmount(selectedClientForPayment.currentDebt.toString())}
                  className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                >
                  Cancelar Totalidad
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentAmount((selectedClientForPayment.currentDebt / 2).toFixed(0))}
                  className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                >
                  50% Deuda
                </button>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClientForPayment(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold"
                >
                  Aplicar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Crear Nuevo Cliente */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-teal-800 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">Registrar Nuevo Cliente de Crédito</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-teal-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateClient} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo o Razón Social:</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Pulpería El Cruce / María Morales"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cédula Física / Jurídica:</label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="1-0000-0000"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono:</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="8888-0000"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo Electrónico (Facturación):</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="cliente@correo.cr"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Límite de Crédito Autorizado (₡):</label>
                <input
                  type="number"
                  value={formCreditLimit}
                  onChange={(e) => setFormCreditLimit(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  min="0"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold"
                >
                  Crear Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
