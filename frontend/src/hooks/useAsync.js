import { useState, useEffect, useCallback, useRef } from 'react';

// ── useAsync ──────────────────────────────────────────────
export function useAsync(asyncFn, deps = [], immediate = true) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError]   = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const run = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await asyncFn(...args);
      if (mounted.current) setData(res.data?.data ?? res.data ?? res);
      return res;
    } catch (err) {
      if (mounted.current) setError(err?.response?.data?.message || err.message);
      throw err;
    } finally {
      if (mounted.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps]);

  return { data, loading, error, run, setData };
}

// ── usePagination ─────────────────────────────────────────
// Handles both paginated responses { data, total, totalPages }
// and simple list responses { data, count }
export function usePagination(fetchFn, params = {}) {
  const [page,    setPage]    = useState(1);
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);

  // Serialize params so useCallback updates when params change
  const paramsKey = JSON.stringify(params);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      // Build clean params — remove empty strings
      const cleanParams = {};
      const parsed = JSON.parse(paramsKey);
      Object.entries(parsed).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) {
          cleanParams[k] = v;
        }
      });

      const res = await fetchFn({ ...cleanParams, page: p, limit: 20 });
      const body = res.data;

      // Handle both response shapes
      const items      = body.data  ?? [];
      const totalCount = body.total ?? body.count ?? items.length;
      const totalPages = body.totalPages ?? Math.ceil(totalCount / 20) ?? 1;

      setData(Array.isArray(items) ? items : []);
      setTotal(totalCount);
      setPages(totalPages);
      setPage(p);
    } catch (err) {
      // Error already handled by axios interceptor (toast shown)
      setData([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    load(1);
  }, [load]);

  return { data, total, pages, page, loading, load, setData };
}

// ── useDebounce ───────────────────────────────────────────
export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── useLocalStorage ───────────────────────────────────────
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initial;
    } catch { return initial; }
  });
  const set = (v) => {
    setValue(v);
    localStorage.setItem(key, JSON.stringify(v));
  };
  return [value, set];
}
