import React, { useState } from 'react';
import { Product, TaxRate, UserRole } from '../types/pos';
import { formatColones } from '../data/mockDatabase';
import { Plus, Edit2, AlertCircle, PackageCheck, Search, Filter } from 'lucide-react';

interface InventoryManagerProps {
  products: Product[];
  userRole: UserRole;
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (prod: Product) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  userRole,
  onAddProduct,
  onUpdateProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategory, setFormCategory] = useState<Product['category']>('Abarrotes');
  const [formCostPrice, setFormCostPrice] = useState<number>(1000);
  const [formSalePrice, setFormSalePrice] = useState<number>(1300);
  const [formIvaRate, setFormIvaRate] = useState<TaxRate>(0.13);
  const [formStock, setFormStock] = useState<number>(20);
  const [formMinStock, setFormMinStock] = useState<number>(5);
  const [formUnit, setFormUnit] = useState<Product['unit']>('UNIDAD');

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormBarcode(Math.floor(7441000000000 + Math.random() * 999999999).toString());
    setFormCategory('Abarrotes');
    setFormCostPrice(1000);
    setFormSalePrice(1300);
    setFormIvaRate(0.13);
    setFormStock(20);
    setFormMinStock(5);
    setFormUnit('UNIDAD');
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormBarcode(prod.barcode);
    setFormCategory(prod.category);
    setFormCostPrice(prod.costPrice);
    setFormSalePrice(prod.salePrice);
    setFormIvaRate(prod.ivaRate);
    setFormStock(prod.stock);
    setFormMinStock(prod.minStock);
    setFormUnit(prod.unit);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBarcode.trim()) {
      alert('Nombre y código de barras son requeridos.');
      return;
    }

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name: formName.trim(),
        barcode: formBarcode.trim(),
        category: formCategory,
        costPrice: Number(formCostPrice),
        salePrice: Number(formSalePrice),
        ivaRate: formIvaRate,
        stock: Number(formStock),
        minStock: Number(formMinStock),
        unit: formUnit,
      });
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: formName.trim(),
        barcode: formBarcode.trim(),
        category: formCategory,
        costPrice: Number(formCostPrice),
        salePrice: Number(formSalePrice),
        ivaRate: formIvaRate,
        stock: Number(formStock),
        minStock: Number(formMinStock),
        unit: formUnit,
        isActive: true,
      };
      onAddProduct(newProd);
    }
    setIsModalOpen(false);
  };

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm);
    return matchCat && matchSearch;
  });

  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  return (
    <div className="space-y-4">
      
      {/* Barra Superior con Controles */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span>Inventario y Control de Existencias</span>
            {lowStockCount > 0 && (
              <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {lowStockCount} por reordenar
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500">
            Administración de precios, códigos de barra y tarifas de IVA (DGT Costa Rica)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userRole === 'admin' ? (
            <button
              onClick={openCreateModal}
              className="bg-teal-800 hover:bg-teal-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </button>
          ) : (
            <span className="text-[11px] bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl border border-slate-200">
              Modo Cajero: Solo lectura de inventario
            </span>
          )}
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descripción o código de barras..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white text-slate-700"
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="Abarrotes">Abarrotes</option>
            <option value="Lácteos">Lácteos</option>
            <option value="Bebidas">Bebidas</option>
            <option value="Limpieza">Limpieza</option>
            <option value="Snacks">Snacks</option>
          </select>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Costo (₡)</th>
                <th className="py-3 px-4 text-right">Precio Venta (₡)</th>
                <th className="py-3 px-4 text-center">IVA DGT</th>
                <th className="py-3 px-4 text-center">Stock Actual</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(p => {
                const isLow = p.stock <= p.minStock;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{p.barcode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {userRole === 'admin' ? formatColones(p.costPrice) : '••••••'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-teal-800">
                      {formatColones(p.salePrice)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.ivaRate === 0.13
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : p.ivaRate === 0.01
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.ivaRate === 0.13 ? '13% General' : p.ivaRate === 0.01 ? '1% Canasta B.' : 'Exento'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-lg font-mono font-bold text-xs ${
                        isLow ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {p.stock} {p.unit.toLowerCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {userRole === 'admin' ? (
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-800 hover:bg-teal-50 transition"
                          title="Editar producto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Crear/Editar Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-teal-800 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">
                {editingProduct ? 'Editar Producto de Inventario' : 'Registrar Nuevo Producto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-teal-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción Comercial:</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Frijoles Rojos Don Pedro 900g"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código de Barras:</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Abarrotes">Abarrotes</option>
                    <option value="Lácteos">Lácteos</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Limpieza">Limpieza</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Precio Costo (₡):</label>
                  <input
                    type="number"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Precio Venta (₡):</label>
                  <input
                    type="number"
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarifa IVA DGT:</label>
                  <select
                    value={formIvaRate}
                    onChange={(e) => setFormIvaRate(parseFloat(e.target.value) as TaxRate)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value={0.13}>13% General</option>
                    <option value={0.01}>1% Canasta B.</option>
                    <option value={0.00}>0% Exento</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Actual:</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Mínimo:</label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidad:</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="UNIDAD">UNIDAD</option>
                    <option value="PAQUETE">PAQUETE</option>
                    <option value="KG">KG</option>
                    <option value="LITRO">LITRO</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold shadow-sm"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
