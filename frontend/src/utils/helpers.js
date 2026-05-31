// ── Currency ──────────────────────────────────────────────
export const currency = (n, symbol = '$') =>
  `${symbol}${(+n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

// ── Date formatting ───────────────────────────────────────
export const fmtDate = (d, opts = {}) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', ...opts,
  });
};

export const fmtDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const timeAgo = (d) => {
  const seconds = Math.floor((Date.now() - new Date(d)) / 1000);
  if (seconds < 60)    return `${seconds}s ago`;
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// ── Number helpers ────────────────────────────────────────
export const pct = (n) => `${(+n || 0).toFixed(1)}%`;

export const compact = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

// ── Text helpers ──────────────────────────────────────────
export const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export const truncate = (s, max = 40) =>
  s?.length > max ? `${s.slice(0, max)}…` : s;

export const initials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

// ── Download helpers ──────────────────────────────────────
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Debounce ──────────────────────────────────────────────
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// ── Build query string ────────────────────────────────────
export const buildQuery = (params) =>
  Object.entries(params)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

// ── Stock status label ────────────────────────────────────
export const stockStatus = (stock, reorder) => {
  if (stock <= 0)       return 'out_of_stock';
  if (stock <= reorder) return 'low_stock';
  return 'in_stock';
};
