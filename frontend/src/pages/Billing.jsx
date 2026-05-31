import React, { useState } from 'react';
import { Plus, Download, Send, Eye, Search, Trash2 } from 'lucide-react';
import { invoicesAPI } from '../utils/api';
import { currency, fmtDate, downloadBlob } from '../utils/helpers';
import { StatusPill, EmptyState, SkeletonRows } from '../components/common/index.jsx';
import Modal from '../components/common/Modal.jsx';
import { usePagination, useDebounce } from '../hooks/useAsync';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const TERMS_OPTIONS = ['due_on_receipt','net_15','net_30','net_60','net_90'];
const EMPTY_FORM = {
  customer: { name:'', email:'', phone:'', company:'', address:'', taxId:'' },
  items: [{ description:'', quantity:1, unitPrice:0, discount:0, taxRate:10 }],
  paymentTerms: 'net_30',
  notes: '',
  terms: 'Payment is due within the agreed terms. Late payments may incur additional charges.',
};

function calcItem(item) {
  const gross    = item.unitPrice * item.quantity;
  const discount = gross * (item.discount / 100);
  const net      = gross - discount;
  return parseFloat(net.toFixed(2));
}

export default function Billing() {
  const { isManager } = useAuth();
  const [search,    setSearch]    = useState('');
  const [statusF,   setStatusF]   = useState('');
  const [modal,     setModal]     = useState(false);
  const [preview,   setPreview]   = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [dlLoading, setDlLoading] = useState(null);

  const dSearch = useDebounce(search, 350);
  const { data: invoices, loading, load } = usePagination(
    invoicesAPI.getAll, { search: dSearch, status: statusF }
  );

  // ── Invoice totals ──────────────────────────────────────
  const totals = (() => {
    const subtotal  = form.items.reduce((s,i) => s + i.unitPrice * i.quantity, 0);
    const discount  = form.items.reduce((s,i) => s + i.unitPrice * i.quantity * (i.discount/100), 0);
    const taxAmount = form.items.reduce((s,i) => {
      const net = i.unitPrice * i.quantity * (1 - i.discount/100);
      return s + net * (i.taxRate/100);
    }, 0);
    const total = subtotal - discount + taxAmount;
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };
  })();

  const setItem = (i, k, v) => setForm(f => ({
    ...f,
    items: f.items.map((it,j) => j===i ? {...it, [k]: parseFloat(v)||v} : it),
  }));
  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { description:'', quantity:1, unitPrice:0, discount:0, taxRate:10 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_,j) => j!==i) }));
  const setCust    = (k, v) => setForm(f => ({ ...f, customer: { ...f.customer, [k]: v } }));

  const openNew = () => { setForm(EMPTY_FORM); setModal(true); };

  const handleCreate = async () => {
    if (!form.customer.name) { toast.error('Customer name required'); return; }
    if (form.items.some(i => !i.description)) { toast.error('All items need a description'); return; }
    setSaving(true);
    try {
      await invoicesAPI.create({
        ...form,
        items: form.items.map(i => ({ ...i, amount: calcItem(i) })),
        ...totals,
      });
      toast.success('Invoice created');
      setModal(false);
      load(1);
    } catch { /* handled globally */ }
    finally { setSaving(false); }
  };

  const handleDownload = async (inv) => {
    setDlLoading(inv._id);
    try {
      const res = await invoicesAPI.downloadPDF(inv._id);
      downloadBlob(res.data, `${inv.invoiceNumber}.pdf`);
      toast.success('PDF downloaded');
    } catch { toast.error('PDF generation failed'); }
    finally { setDlLoading(null); }
  };

  const handleMarkSent = async (inv) => {
    try {
      await invoicesAPI.updateStatus(inv._id, 'sent');
      toast.success('Invoice marked as sent');
      load(1);
    } catch { /* handled globally */ }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices…" className="input pl-8" />
        </div>
        <select value={statusF} onChange={e => setStatusF(e.target.value)} className="input w-auto">
          <option value="">All statuses</option>
          {['draft','sent','paid','overdue','cancelled','void'].map(s =>
            <option key={s} value={s} className="capitalize">{s}</option>
          )}
        </select>
        <div className="ml-auto">
          <button onClick={openNew} className="btn btn-primary"><Plus size={14}/>New invoice</button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Invoice #</th><th>Customer</th><th>Subtotal</th><th>Tax</th><th>Total</th><th>Status</th><th>Due date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows rows={8} cols={8} /> :
               !invoices?.length ? (
                <tr><td colSpan={8}>
                  <EmptyState icon={Search} title="No invoices found"
                    action={<button onClick={openNew} className="btn btn-primary"><Plus size={14}/>Create invoice</button>} />
                </td></tr>
               ) : invoices.map(inv => (
                <tr key={inv._id}>
                  <td><span className="font-mono text-xs text-blue-600">{inv.invoiceNumber}</span></td>
                  <td>
                    <div className="font-medium">{inv.customer.name}</div>
                    {inv.customer.company && <div className="text-xs text-gray-400">{inv.customer.company}</div>}
                  </td>
                  <td className="text-gray-500">{currency(inv.subtotal)}</td>
                  <td className="text-gray-500">{currency(inv.taxAmount)}</td>
                  <td className="font-semibold">{currency(inv.total)}</td>
                  <td><StatusPill status={inv.status} /></td>
                  <td className={`text-xs ${inv.isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    {fmtDate(inv.dueDate)}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => setPreview(inv)} className="btn btn-sm btn-icon text-gray-500" title="View"><Eye size={13}/></button>
                      <button onClick={() => handleDownload(inv)} disabled={dlLoading===inv._id}
                        className="btn btn-sm btn-icon text-blue-600" title="Download PDF">
                        {dlLoading===inv._id ? '…' : <Download size={13}/>}
                      </button>
                      {inv.status === 'draft' && isManager && (
                        <button onClick={() => handleMarkSent(inv)} className="btn btn-sm btn-icon text-emerald-600" title="Mark sent"><Send size={13}/></button>
                      )}
                    </div>
                  </td>
                </tr>
               ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="New invoice"
        size="xl"
        footer={<>
          <button className="btn" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating…' : 'Create invoice'}
          </button>
        </>}
      >
        <div className="space-y-5">
          {/* Customer */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Bill to</div>
            <div className="grid grid-cols-2 gap-3">
              {[['name','Customer name *'],['company','Company'],['email','Email'],['phone','Phone'],['address','Address'],['taxId','Tax ID']].map(([k,label]) => (
                <div key={k} className={k==='address' ? 'col-span-2' : ''}>
                  <label className="input-label">{label}</label>
                  <input className="input" value={form.customer[k]} onChange={e => setCust(k, e.target.value)} placeholder={label.replace(' *','')} />
                </div>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="input-label">Payment terms</label>
              <select className="input" value={form.paymentTerms} onChange={e => setForm(f=>({...f,paymentTerms:e.target.value}))}>
                {TERMS_OPTIONS.map(t => <option key={t} value={t}>{t.replace(/_/g,' ').toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Line items</div>
              <button onClick={addItem} className="btn btn-sm"><Plus size={12}/>Add item</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left text-xs text-gray-400 py-2 pr-2 font-medium">Description</th>
                  <th className="text-right text-xs text-gray-400 py-2 px-2 font-medium w-16">Qty</th>
                  <th className="text-right text-xs text-gray-400 py-2 px-2 font-medium w-24">Unit price</th>
                  <th className="text-right text-xs text-gray-400 py-2 px-2 font-medium w-16">Disc%</th>
                  <th className="text-right text-xs text-gray-400 py-2 px-2 font-medium w-16">Tax%</th>
                  <th className="text-right text-xs text-gray-400 py-2 pl-2 font-medium w-20">Amount</th>
                  <th className="w-8" />
                </tr></thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2 pr-2"><input className="input text-xs" value={item.description} onChange={e => setItem(i,'description',e.target.value)} placeholder="Item description" /></td>
                      <td className="py-2 px-2"><input className="input text-xs text-right" type="number" min="1" value={item.quantity} onChange={e => setItem(i,'quantity',+e.target.value||1)} /></td>
                      <td className="py-2 px-2"><input className="input text-xs text-right" type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => setItem(i,'unitPrice',+e.target.value)} /></td>
                      <td className="py-2 px-2"><input className="input text-xs text-right" type="number" min="0" max="100" value={item.discount} onChange={e => setItem(i,'discount',+e.target.value)} /></td>
                      <td className="py-2 px-2"><input className="input text-xs text-right" type="number" min="0" max="100" value={item.taxRate} onChange={e => setItem(i,'taxRate',+e.target.value)} /></td>
                      <td className="py-2 pl-2 text-right font-medium text-xs">{currency(calcItem(item))}</td>
                      <td className="py-2 pl-1">
                        {form.items.length > 1 && (
                          <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Totals */}
            <div className="flex justify-end mt-3">
              <div className="w-52 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{currency(totals.subtotal)}</span></div>
                {totals.discount>0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-{currency(totals.discount)}</span></div>}
                {totals.taxAmount>0 && <div className="flex justify-between text-gray-500"><span>Tax</span><span>{currency(totals.taxAmount)}</span></div>}
                <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-2">
                  <span>Total</span><span>{currency(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="form-row">
            <label className="input-label">Notes</label>
            <textarea className="input h-16 resize-none py-2 text-sm" value={form.notes}
              onChange={e => setForm(f=>({...f,notes:e.target.value}))} placeholder="Any additional notes for the customer…" />
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      {preview && (
        <Modal open={!!preview} onClose={() => setPreview(null)} title={preview.invoiceNumber} size="lg"
          footer={<>
            <button className="btn" onClick={() => setPreview(null)}>Close</button>
            <button className="btn btn-primary" onClick={() => handleDownload(preview)}>
              <Download size={14}/>Download PDF
            </button>
          </>}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1 font-medium">Bill to</div>
                <div className="font-semibold">{preview.customer.name}</div>
                {preview.customer.company && <div className="text-gray-500">{preview.customer.company}</div>}
                {preview.customer.email   && <div className="text-gray-500">{preview.customer.email}</div>}
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1 font-medium">Invoice details</div>
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">Issued</span><span>{fmtDate(preview.issueDate)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Due</span><span>{fmtDate(preview.dueDate)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Status</span><StatusPill status={preview.status} /></div>
                </div>
              </div>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead><tr className="bg-gray-50">
                <th className="text-left p-3 font-medium text-gray-500">Description</th>
                <th className="text-right p-3 font-medium text-gray-500">Qty</th>
                <th className="text-right p-3 font-medium text-gray-500">Unit</th>
                <th className="text-right p-3 font-medium text-gray-500">Amount</th>
              </tr></thead>
              <tbody>
                {preview.items.map((item,i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="p-3">{item.description}</td>
                    <td className="p-3 text-right text-gray-500">{item.quantity}</td>
                    <td className="p-3 text-right text-gray-500">{currency(item.unitPrice)}</td>
                    <td className="p-3 text-right font-medium">{currency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end">
              <div className="w-48 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{currency(preview.subtotal)}</span></div>
                {preview.taxAmount>0 && <div className="flex justify-between text-gray-500"><span>Tax</span><span>{currency(preview.taxAmount)}</span></div>}
                <div className="flex justify-between font-bold text-gray-900 border-t pt-2"><span>Total</span><span>{currency(preview.total)}</span></div>
                {preview.amountPaid>0 && <div className="flex justify-between text-emerald-600"><span>Paid</span><span>-{currency(preview.amountPaid)}</span></div>}
                {preview.balanceDue>0 && <div className="flex justify-between font-bold text-red-600"><span>Balance due</span><span>{currency(preview.balanceDue)}</span></div>}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
