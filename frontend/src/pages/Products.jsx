import React, { useState, useCallback } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Barcode, RefreshCw } from 'lucide-react';
import { productsAPI } from '../utils/api';
import { currency, stockStatus, fmtDate } from '../utils/helpers';
import { StatusPill, EmptyState, SkeletonRows, ConfirmDialog } from '../components/common/index.jsx';
import Modal from '../components/common/Modal.jsx';
import { usePagination, useDebounce } from '../hooks/useAsync';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Electronics','Office','Storage','Networking','Accessories','Furniture','Other'];
const UNITS      = ['piece','kg','litre','box','pack','metre','set'];

const EMPTY_FORM = {
  name:'', sku:'', barcode:'', description:'', category:'Electronics', unit:'piece',
  costPrice:'', sellingPrice:'', taxRate:0, stock:'', reorderPoint:10, maxStock:'',
  supplier:'', location:'',
};

export default function Products() {
  const { isManager } = useAuth();
  const [search,    setSearch]    = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(null);

  const dSearch = useDebounce(search, 350);

  const params = { search: dSearch, category: catFilter };
  const { data: products, loading, load, setData } = usePagination(productsAPI.getAll, params);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, sku: p.sku, barcode: p.barcode || '',
      description: p.description || '', category: p.category, unit: p.unit,
      costPrice: p.costPrice, sellingPrice: p.sellingPrice, taxRate: p.taxRate || 0,
      stock: p.stock, reorderPoint: p.reorderPoint, maxStock: p.maxStock || '',
      supplier: p.supplier || '', location: p.location || '',
    });
    setModal(true);
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name || !form.sku || !form.costPrice || !form.sellingPrice) {
      toast.error('Please fill in all required fields'); return;
    }
    setSaving(true);
    try {
      if (editing) {
        await productsAPI.update(editing._id, form);
        toast.success('Product updated');
      } else {
        await productsAPI.create(form);
        toast.success('Product created');
      }
      setModal(false);
      load(1);
    } catch { /* handled globally */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await productsAPI.delete(id);
      toast.success('Product removed');
      setData(prev => prev.filter(p => p._id !== id));
    } catch { /* handled globally */ }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              className="input pl-8"
            />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input w-auto">
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load(1)} className="btn">
            <RefreshCw size={14} /> Refresh
          </button>
          {isManager && (
            <button onClick={openAdd} className="btn btn-primary">
              <Plus size={14} /> Add product
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th><th>Product</th><th>Category</th>
                <th>Cost</th><th>Price</th><th>Stock</th>
                <th>Status</th><th>Supplier</th>
                {isManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows rows={8} cols={isManager ? 9 : 8} /> :
               products?.length === 0 ? (
                <tr><td colSpan={isManager ? 9 : 8}>
                  <EmptyState icon={Package} title="No products found"
                    description="Add your first product to get started"
                    action={isManager && <button onClick={openAdd} className="btn btn-primary"><Plus size={14}/>Add product</button>} />
                </td></tr>
               ) : products?.map(p => {
                const ss = stockStatus(p.stock, p.reorderPoint);
                return (
                  <tr key={p._id}>
                    <td><span className="font-mono text-xs text-gray-500">{p.sku}</span></td>
                    <td>
                      <div className="font-medium text-gray-900">{p.name}</div>
                      {p.barcode && <div className="text-xs text-gray-400 font-mono">{p.barcode}</div>}
                    </td>
                    <td><span className="pill pill-blue">{p.category}</span></td>
                    <td className="text-gray-500">{currency(p.costPrice)}</td>
                    <td className="font-medium">{currency(p.sellingPrice)}</td>
                    <td>
                      <span className={`font-medium ${p.stock === 0 ? 'text-red-600' : p.stock <= p.reorderPoint ? 'text-amber-600' : 'text-gray-800'}`}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td><StatusPill status={ss} /></td>
                    <td className="text-gray-400 text-xs">{p.supplier || '—'}</td>
                    {isManager && (
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(p)} className="btn btn-sm btn-icon text-gray-500"><Edit2 size={13}/></button>
                          <button onClick={() => setDeleting(p._id)} className="btn btn-sm btn-icon text-red-500"><Trash2 size={13}/></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit product' : 'Add product'}
        size="lg"
        footer={<>
          <button className="btn" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
          </button>
        </>}
      >
        <div className="space-y-4">
          <div className="form-grid-2">
            <div className="form-row">
              <label className="input-label">Product name *</label>
              <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Wireless Keyboard" />
            </div>
            <div className="form-row">
              <label className="input-label">SKU *</label>
              <input className="input" value={form.sku} onChange={set('sku')} placeholder="e.g. WK-001" />
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-row">
              <label className="input-label">Category *</label>
              <select className="input" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="input-label">Unit</label>
              <select className="input" value={form.unit} onChange={set('unit')}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-row">
              <label className="input-label">Cost price ($) *</label>
              <input className="input" type="number" min="0" step="0.01" value={form.costPrice} onChange={set('costPrice')} placeholder="0.00" />
            </div>
            <div className="form-row">
              <label className="input-label">Selling price ($) *</label>
              <input className="input" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={set('sellingPrice')} placeholder="0.00" />
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-row">
              <label className="input-label">Stock quantity *</label>
              <input className="input" type="number" min="0" value={form.stock} onChange={set('stock')} placeholder="0" />
            </div>
            <div className="form-row">
              <label className="input-label">Reorder point</label>
              <input className="input" type="number" min="0" value={form.reorderPoint} onChange={set('reorderPoint')} />
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-row">
              <label className="input-label">Barcode</label>
              <input className="input" value={form.barcode} onChange={set('barcode')} placeholder="Scan or enter barcode" />
            </div>
            <div className="form-row">
              <label className="input-label">Tax rate (%)</label>
              <input className="input" type="number" min="0" max="100" value={form.taxRate} onChange={set('taxRate')} />
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-row">
              <label className="input-label">Supplier</label>
              <input className="input" value={form.supplier} onChange={set('supplier')} placeholder="Supplier name" />
            </div>
            <div className="form-row">
              <label className="input-label">Location</label>
              <input className="input" value={form.location} onChange={set('location')} placeholder="e.g. Shelf A1" />
            </div>
          </div>
          <div className="form-row">
            <label className="input-label">Description</label>
            <textarea className="input h-20 resize-none py-2" value={form.description} onChange={set('description')} placeholder="Product description…" />
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => handleDelete(deleting)}
        title="Remove product"
        message="This product will be deactivated. Existing orders and invoices will not be affected."
        danger
      />
    </div>
  );
}
