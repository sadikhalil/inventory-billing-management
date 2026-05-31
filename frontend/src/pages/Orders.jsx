import React, { useState } from 'react';
import { Plus, Search, Eye, ChevronDown } from 'lucide-react';
import { ordersAPI, productsAPI } from '../utils/api';
import { currency, fmtDate } from '../utils/helpers';
import { StatusPill, EmptyState, SkeletonRows } from '../components/common/index.jsx';
import Modal from '../components/common/Modal.jsx';
import { usePagination, useDebounce } from '../hooks/useAsync';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STATUS_FLOW = {
  pending:    ['processing','cancelled'],
  processing: ['shipped','cancelled'],
  shipped:    ['delivered','cancelled'],
  delivered:  ['refunded'],
};

export default function Orders() {
  const { isManager } = useAuth();
  const [search,     setSearch]     = useState('');
  const [statusF,    setStatusF]    = useState('');
  const [viewOrder,  setViewOrder]  = useState(null);
  const [newModal,   setNewModal]   = useState(false);
  const [products,   setProducts]   = useState([]);
  const [lineItems,  setLineItems]  = useState([{ productId:'', qty:1 }]);
  const [custForm,   setCustForm]   = useState({ name:'', email:'', phone:'', company:'' });
  const [saving,     setSaving]     = useState(false);

  const dSearch = useDebounce(search, 350);
  const { data: orders, loading, load } = usePagination(
    ordersAPI.getAll, { search: dSearch, status: statusF }
  );

  const openNew = async () => {
    const res = await productsAPI.getAll({ limit: 100 });
    setProducts(res.data.data.filter(p => p.isActive && p.stock > 0));
    setLineItems([{ productId:'', qty:1 }]);
    setCustForm({ name:'', email:'', phone:'', company:'' });
    setNewModal(true);
  };

  const addLine  = () => setLineItems(l => [...l, { productId:'', qty:1 }]);
  const removeLine = (i) => setLineItems(l => l.filter((_,j) => j !== i));
  const setLine  = (i, k, v) => setLineItems(l => l.map((li,j) => j===i ? {...li,[k]:v} : li));

  const calcTotal = () => {
    return lineItems.reduce((sum, li) => {
      const p = products.find(p => p._id === li.productId);
      return sum + (p ? p.sellingPrice * li.qty : 0);
    }, 0);
  };

  const handleCreate = async () => {
    if (!custForm.name) { toast.error('Customer name required'); return; }
    if (lineItems.some(l => !l.productId)) { toast.error('Select a product for all items'); return; }
    setSaving(true);
    try {
      await ordersAPI.create({
        customer: custForm,
        items: lineItems.map(l => ({ product: l.productId, quantity: l.qty })),
      });
      toast.success('Order created');
      setNewModal(false);
      load(1);
    } catch { /* handled globally */ }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (order, newStatus) => {
    try {
      await ordersAPI.updateStatus(order._id, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      load(1);
      setViewOrder(null);
    } catch { /* handled globally */ }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders…" className="input pl-8" />
        </div>
        <select value={statusF} onChange={e => setStatusF(e.target.value)} className="input w-auto">
          <option value="">All statuses</option>
          {['pending','processing','shipped','delivered','cancelled','refunded'].map(s =>
            <option key={s} value={s} className="capitalize">{s}</option>
          )}
        </select>
        <div className="ml-auto">
          <button onClick={openNew} className="btn btn-primary"><Plus size={14}/>New order</button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows rows={8} cols={8} /> :
               !orders?.length ? (
                <tr><td colSpan={8}>
                  <EmptyState icon={Search} title="No orders found" description="Create your first order to get started" />
                </td></tr>
               ) : orders.map(o => (
                <tr key={o._id}>
                  <td><span className="font-mono text-xs text-blue-600">{o.orderNumber}</span></td>
                  <td>
                    <div className="font-medium">{o.customer.name}</div>
                    {o.customer.company && <div className="text-xs text-gray-400">{o.customer.company}</div>}
                  </td>
                  <td className="text-gray-500">{o.items?.length} item{o.items?.length!==1?'s':''}</td>
                  <td className="font-medium">{currency(o.total)}</td>
                  <td><StatusPill status={o.paymentStatus} /></td>
                  <td><StatusPill status={o.status} /></td>
                  <td className="text-gray-400 text-xs">{fmtDate(o.createdAt)}</td>
                  <td>
                    <button onClick={() => setViewOrder(o)} className="btn btn-sm btn-icon text-gray-500"><Eye size={13}/></button>
                  </td>
                </tr>
               ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* View Order Modal */}
      {viewOrder && (
        <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={`Order ${viewOrder.orderNumber}`} size="lg">
          <div className="space-y-5">
            {/* Customer */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer</div>
              <div className="font-medium text-gray-900">{viewOrder.customer.name}</div>
              {viewOrder.customer.email && <div className="text-sm text-gray-500">{viewOrder.customer.email}</div>}
              {viewOrder.customer.company && <div className="text-sm text-gray-500">{viewOrder.customer.company}</div>}
            </div>
            {/* Items */}
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Items</div>
              <div className="space-y-2">
                {viewOrder.items.map((item,i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <div className="text-sm font-medium">{item.productSnapshot?.name || 'Product'}</div>
                      <div className="text-xs text-gray-400">Qty: {item.quantity} × {currency(item.unitPrice)}</div>
                    </div>
                    <div className="font-medium">{currency(item.unitPrice * item.quantity)}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-3">
                <span>Total</span><span>{currency(viewOrder.total)}</span>
              </div>
            </div>
            {/* Status update */}
            {isManager && STATUS_FLOW[viewOrder.status]?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Update status</div>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_FLOW[viewOrder.status].map(s => (
                    <button key={s} onClick={() => handleStatusChange(viewOrder, s)}
                      className={`btn btn-sm capitalize ${s === 'cancelled' ? 'text-red-600 border-red-200 hover:bg-red-50' : 'btn-primary'}`}>
                      Mark as {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* New Order Modal */}
      <Modal
        open={newModal}
        onClose={() => setNewModal(false)}
        title="New order"
        size="lg"
        footer={<>
          <button className="btn" onClick={() => setNewModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating…' : 'Create order'}
          </button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Customer info</div>
            <div className="form-grid-2">
              <div className="form-row">
                <label className="input-label">Name *</label>
                <input className="input" value={custForm.name} onChange={e => setCustForm(f=>({...f,name:e.target.value}))} placeholder="Full name" />
              </div>
              <div className="form-row">
                <label className="input-label">Company</label>
                <input className="input" value={custForm.company} onChange={e => setCustForm(f=>({...f,company:e.target.value}))} placeholder="Company name" />
              </div>
              <div className="form-row">
                <label className="input-label">Email</label>
                <input className="input" type="email" value={custForm.email} onChange={e => setCustForm(f=>({...f,email:e.target.value}))} placeholder="email@company.com" />
              </div>
              <div className="form-row">
                <label className="input-label">Phone</label>
                <input className="input" value={custForm.phone} onChange={e => setCustForm(f=>({...f,phone:e.target.value}))} placeholder="+1-555-0000" />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Items</div>
              <button onClick={addLine} className="btn btn-sm"><Plus size={12}/>Add item</button>
            </div>
            <div className="space-y-2">
              {lineItems.map((li, i) => {
                const selProd = products.find(p => p._id === li.productId);
                return (
                  <div key={i} className="flex gap-2 items-start">
                    <select className="input flex-1" value={li.productId} onChange={e => setLine(i,'productId',e.target.value)}>
                      <option value="">Select product…</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>{p.name} — {currency(p.sellingPrice)} (stock: {p.stock})</option>
                      ))}
                    </select>
                    <input type="number" min="1" max={selProd?.stock || 999}
                      className="input w-20" value={li.qty}
                      onChange={e => setLine(i,'qty',parseInt(e.target.value)||1)} />
                    {selProd && <div className="text-sm font-medium text-gray-700 w-20 pt-2">{currency(selProd.sellingPrice * li.qty)}</div>}
                    {lineItems.length > 1 && (
                      <button onClick={() => removeLine(i)} className="btn btn-sm btn-icon text-red-500 mt-0.5">×</button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end pt-3 border-t border-gray-100 mt-3">
              <span className="font-semibold text-gray-900">Total: {currency(calcTotal())}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
