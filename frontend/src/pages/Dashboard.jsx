import React, { useEffect, useState } from 'react';
import {
  DollarSign, ShoppingCart, Package, AlertTriangle,
  TrendingUp, TrendingDown, ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title,
} from 'chart.js';
import { analyticsAPI, ordersAPI } from '../utils/api';
import { currency, fmtDate } from '../utils/helpers';
import { StatusPill, SkeletonRows } from '../components/common/index.jsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats,    setStats]    = useState(null);
  const [sales,    setSales]    = useState([]);
  const [catData,  setCatData]  = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, salesRes, catRes, ordersRes] = await Promise.all([
          analyticsAPI.getDashboard(),
          analyticsAPI.getSales({ period: '6months' }),
          analyticsAPI.getSalesByCategory({ period: '30days' }),
          ordersAPI.getAll({ limit: 5, sort: '-createdAt' }),
        ]);
        setStats(statsRes.data.data);
        setSales(salesRes.data.data);
        setCatData(catRes.data.data);
        setOrders(ordersRes.data.data);
      } catch { /* errors shown via toast */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const revenueChart = {
    labels: sales.map(s => `${MONTHS[(s._id.month || 1) - 1]} ${s._id.year}`),
    datasets: [{
      data: sales.map(s => s.revenue),
      backgroundColor: 'rgba(37,99,235,0.15)',
      borderColor: '#2563EB',
      borderWidth: 2,
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const catColors = ['#2563EB','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899'];
  const catChart = {
    labels: catData.map(c => c._id || 'Other'),
    datasets: [{
      data: catData.map(c => c.revenue),
      backgroundColor: catColors,
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { ticks: { callback: v => `$${(v/1000).toFixed(0)}k`, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.04)' } },
      x: { ticks: { font: { size: 11 } }, grid: { display: false } },
    },
  };

  const metrics = stats ? [
    {
      label: 'Revenue (this month)',
      value: currency(stats.revenue.current),
      delta: stats.revenue.growth,
      icon: DollarSign,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Orders (this month)',
      value: stats.orders.current,
      delta: stats.orders.growth,
      icon: ShoppingCart,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Total products',
      value: stats.products.total,
      sub: `${stats.products.lowStock} low stock`,
      icon: Package,
      color: 'text-violet-600 bg-violet-50',
    },
    {
      label: 'Pending invoices',
      value: stats.invoices.pending,
      sub: 'Awaiting payment',
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50',
    },
  ] : [];

  return (
    <div className="space-y-5">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array(4).fill(0).map((_, i) => (
            <div key={i} className="stat-card">
              <div className="skeleton h-3 w-24 mb-3" />
              <div className="skeleton h-7 w-28" />
            </div>
          ))
          : metrics.map((m, i) => (
            <div key={i} className="stat-card">
              <div className="flex items-start justify-between">
                <span className="stat-label">{m.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.color}`}>
                  <m.icon size={15} />
                </div>
              </div>
              <div className="stat-value">{m.value}</div>
              {m.delta != null && (
                <div className={`flex items-center gap-1 text-xs font-medium ${parseFloat(m.delta) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {parseFloat(m.delta) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(m.delta)}% vs last month
                </div>
              )}
              {m.sub && <div className="text-xs text-gray-400">{m.sub}</div>}
            </div>
          ))
        }
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue bar chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Revenue — last 6 months</h2>
          </div>
          <div className="h-52">
            {loading
              ? <div className="skeleton h-full rounded-lg" />
              : <Bar data={revenueChart} options={chartOpts} />
            }
          </div>
        </div>

        {/* Category donut */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Sales by category</h2>
          <div className="h-40">
            {loading || !catData.length
              ? <div className="skeleton h-full rounded-lg" />
              : <Doughnut data={catChart} options={{ ...chartOpts, scales: undefined, cutout: '65%' }} />
            }
          </div>
          <div className="mt-4 space-y-1.5">
            {catData.slice(0, 4).map((c, i) => (
              <div key={c._id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: catColors[i] }} />
                  <span className="text-gray-600">{c._id || 'Other'}</span>
                </div>
                <span className="font-medium text-gray-800">{currency(c.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Recent orders</h2>
          <button onClick={() => navigate('/orders')} className="btn btn-sm text-blue-600 border-0 pr-0">
            View all <ArrowRight size={13} />
          </button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th><th>Customer</th><th>Items</th>
                <th>Total</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <SkeletonRows rows={4} cols={6} />
                : orders.map(o => (
                  <tr key={o._id} className="cursor-pointer" onClick={() => navigate('/orders')}>
                    <td><span className="font-mono text-xs text-blue-600">{o.orderNumber}</span></td>
                    <td className="font-medium">{o.customer.name}</td>
                    <td className="text-gray-500">{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</td>
                    <td className="font-medium">{currency(o.total)}</td>
                    <td><StatusPill status={o.status} /></td>
                    <td className="text-gray-400 text-xs">{fmtDate(o.createdAt)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
