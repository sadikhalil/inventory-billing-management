import React, { useEffect, useState } from 'react';
import { AlertTriangle, Plus, ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';
import { inventoryAPI, productsAPI } from '../utils/api';
import { currency, fmtDateTime } from '../utils/helpers';
import { StatusPill, EmptyState, SkeletonRows, Spinner } from '../components/common/index.jsx';
import Modal from '../components/common/Modal.jsx';
import { usePagination } from '../hooks/useAsync';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const MOVEMENT_TYPES = ['purchase','adjustment','return','damage','transfer'];

export default function Inventory() {
  const { isManager } = useAuth();
  const [summary,   setSummary]   = useState(null);
  const [sumLoading,setSumLoading]= useState(true);
  const [modal,     setModal]     = useState(false);
  const [products,  setProducts]  = useState([]);
  const [form,      setForm]      = useState({ productId:'', type:'purchase', quantity:'', note:'', unitCost:'' });
  const [saving,    setSaving]    = useState(false);
  const [typeFilter,setTypeFilter]= useState('');

  const { data: movements, loading, load } = usePagination(
    inventoryAPI.getMovements, { type: typeFilter }
  );

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const res = await inventoryAPI.getSummary();
        setSummary(res.data.data);
      } catch { /* handled */ }
      finally { setSumLoading(false); }
    };
    loadSummary();
  }, []);

  const openAdjust = async () => {
    const res = await productsAPI.getAll({ limit: 100, isActive: true });
    setProducts(res.data.data);
    setForm({ productId:'', type:'purchase', quantity:'', note:'', unitCost:'' });
    setModal(true);
  };

  const handleAdjust = async () => {
    if (!form.productId || !form.quantity) { toast.error('Select product and enter quantity'); return; }
    setSaving(true);
    try {
      await inventoryAPI.adjust(form);
      toast.success('Stock adjusted');
      setModal(false);
      load(1);
      // Refresh summary
      const res = await inventoryAPI.getSummary();
      setSummary(res.data.data);
    } catch { /* handled globally */ }
    finally { setSaving(false); }
  };

  const movIcon = (type) => {
    if (['purchase','return','opening'].includes(type)) return <ArrowUpCircle size={14} className="text-emerald-500" />;
    if (['damage','sale'].includes(type)) return <ArrowDownCircle size={14} className="text-red-500" />;
    return <MinusCircle size={14} className="text-amber-500" />;
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sumLoading
          ? Array(4).fill(0).map((_,i)=><div key={i} className="stat-card"><div className="skeleton h-3 w-24 mb-3"/><div className="skeleton h-7 w-16"/></div>)
          : [
            { label: 'In stock',      value: summary?.summary.inStock     || 0, color: 'text-emerald-600' },
            { label: 'Low stock',     value: summary?.summary.lowStock     || 0, color: 'text-amber-600'  },
            { label: 'Out of stock',  value: summary?.summary.outOfStock   || 0, color: 'text-red-600'    },
            { label: 'Total units',   value: summary?.summary.totalUnits   || 0, color: 'text-gray-800'   },
          ].map((c,i) => (
            <div key={i} className="stat-card">
              <div className="stat-label">{c.label}</div>
              <div className={`stat-value ${c.color}`}>{c.value}</div>
            </div>
          ))
        }
      </div>

      {/* Low stock alerts */}
      {summary?.lowStockItems?.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-800">Reorder alerts</h2>
            <span className="pill pill-yellow">{summary.lowStockItems.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.lowStockItems.map(p => (
              <div key={p._id} className="flex items-center justify-between bg-amber-50 rounded-lg p-3 border border-amber-100">
                <div>
                  <div className="text-sm font-medium text-gray-800">{p.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{p.sku}</div>
                  <div className="text-xs text-amber-600 mt-0.5">
                    Stock: {p.stock} · Min: {p.reorderPoint}
                  </div>
                </div>
                <StatusPill status={p.stockStatus} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movements table */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Stock movement log</h2>
          <div className="flex gap-2">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input w-auto">
              <option value="">All types</option>
              {['purchase','sale','adjustment','return','transfer','damage','opening'].map(t =>
                <option key={t} value={t} className="capitalize">{t}</option>
              )}
            </select>
            {isManager && (
              <button onClick={openAdjust} className="btn btn-primary btn-sm"><Plus size={13}/>Adjust stock</button>
            )}
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Product</th><th>Type</th><th>Qty change</th><th>Before</th><th>After</th><th>Reference</th><th>By</th><th>Date</th></tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows rows={10} cols={8} /> :
               !movements?.length ? (
                <tr><td colSpan={8}><EmptyState icon={AlertTriangle} title="No movements found" /></td></tr>
               ) : movements.map(m => (
                <tr key={m._id}>
                  <td>
                    <div className="font-medium text-sm">{m.product?.name || '—'}</div>
                    <div className="text-xs text-gray-400 font-mono">{m.product?.sku}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {movIcon(m.type)}
                      <span className="capitalize text-xs font-medium">{m.type}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`font-mono font-medium text-sm ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </span>
                  </td>
                  <td className="text-gray-500 font-mono text-xs">{m.stockBefore}</td>
                  <td className="text-gray-500 font-mono text-xs">{m.stockAfter}</td>
                  <td><span className="font-mono text-xs text-gray-400">{m.reference || '—'}</span></td>
                  <td className="text-gray-400 text-xs">{m.createdBy?.name || '—'}</td>
                  <td className="text-gray-400 text-xs whitespace-nowrap">{fmtDateTime(m.createdAt)}</td>
                </tr>
               ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Stock adjustment"
        footer={<>
          <button className="btn" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdjust} disabled={saving}>
            {saving ? 'Saving…' : 'Record movement'}
          </button>
        </>}
      >
        <div className="space-y-4">
          <div className="form-row">
            <label className="input-label">Product *</label>
            <select className="input" value={form.productId} onChange={e => setForm(f=>({...f,productId:e.target.value}))}>
              <option value="">Select product…</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku}) — stock: {p.stock}</option>)}
            </select>
          </div>
          <div className="form-grid-2">
            <div className="form-row">
              <label className="input-label">Movement type *</label>
              <select className="input" value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>
                {MOVEMENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="input-label">Quantity *</label>
              <input className="input" type="number" min="1" value={form.quantity} onChange={e => setForm(f=>({...f,quantity:e.target.value}))} placeholder="e.g. 50" />
            </div>
          </div>
          <div className="form-row">
            <label className="input-label">Unit cost ($)</label>
            <input className="input" type="number" min="0" step="0.01" value={form.unitCost} onChange={e => setForm(f=>({...f,unitCost:e.target.value}))} placeholder="Optional" />
          </div>
          <div className="form-row">
            <label className="input-label">Note / reason</label>
            <textarea className="input h-20 resize-none py-2" value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} placeholder="Reason for adjustment…" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
