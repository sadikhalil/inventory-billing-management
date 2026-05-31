// Spinner.jsx
import React from 'react';

export function Spinner({ size = 20, className = '' }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`border-2 border-blue-600 border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
}

// ─────────────────────────────────────────────────────────
// EmptyState.jsx
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Icon size={24} className="text-gray-400" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ConfirmDialog.jsx
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = false }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box max-w-sm">
        <div className="px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900 mb-2">{title}</h2>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => { onConfirm(); onClose(); }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Skeleton rows for tables
export function SkeletonRows({ rows = 5, cols = 5 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="py-3.5 px-4 border-b border-gray-50">
          <div className="skeleton h-4 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  ));
}

// ─────────────────────────────────────────────────────────
// Status pill helper
const STATUS_MAP = {
  // order statuses
  pending:    'pill-yellow',
  processing: 'pill-blue',
  shipped:    'pill-purple',
  delivered:  'pill-green',
  cancelled:  'pill-red',
  refunded:   'pill-gray',
  // payment
  paid:       'pill-green',
  unpaid:     'pill-red',
  partial:    'pill-yellow',
  // invoice
  draft:      'pill-gray',
  sent:       'pill-blue',
  overdue:    'pill-red',
  void:       'pill-gray',
  // stock
  in_stock:   'pill-green',
  low_stock:  'pill-yellow',
  out_of_stock: 'pill-red',
  // user
  active:     'pill-green',
  inactive:   'pill-red',
};

export function StatusPill({ status }) {
  const cls = STATUS_MAP[status?.toLowerCase()] || 'pill-gray';
  const label = status?.replace(/_/g, ' ') || '—';
  return <span className={`pill ${cls} capitalize`}>{label}</span>;
}
