import React, { useEffect, useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { analyticsAPI } from '../utils/api';
import { currency } from '../utils/helpers';
import { Spinner } from '../components/common/index.jsx';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PERIODS = [
  { label: '7 days',   value: '7days' },
  { label: '30 days',  value: '30days' },
  { label: '3 months', value: '3months' },
  { label: '6 months', value: '6months' },
  { label: '1 year',   value: '1year' },
];

export default function Analytics() {
  const [period,   setPeriod]   = useState('6months');
  const [sales,    setSales]    = useState([]);
  const [topProds, setTopProds] = useState([]);
  const [invVal,   setInvVal]   = useState({ data: [], totals: {} });
  const [catData,  setCatData]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [salesRes, topRes, invRes, catRes] = await Promise.all([
          analyticsAPI.getSales({ period }),
          analyticsAPI.getTopProducts({ period, limit: 8 }),
          analyticsAPI.getInventoryValue(),
          analyticsAPI.getSalesByCategory({ period }),
        ]);
        setSales(salesRes.data.data);
        setTopProds(topRes.data.data);
        setInvVal({ data: invRes.data.data, totals: invRes.data.totals });
        setCatData(catRes.data.data);
      } catch { /* handled globally */ }
      finally { setLoading(false); }
    };
    load();
  }, [period]);

  const lineData = {
    labels: sales.map(s => `${MONTHS[(s._id.month||1)-1]}`),
    datasets: [{
      label: 'Revenue',
      data: sales.map(s => s.revenue),
      borderColor: '#2563EB',
      backgroundColor: 'rgba(37,99,235,0.08)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointBackgroundColor: '#2563EB',
    }],
  };

  const topData = {
    labels: topProds.map(p => p.productName || 'Unknown'),
    datasets: [{
      data: topProds.map(p => p.totalRevenue),
      backgroundColor: '#2563EB',
      borderRadius: 4,
      borderSkipped: false,
    }],
  };

  const CAT_COLORS = ['#2563EB','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899'];
  const catChart = {
    labels: catData.map(c => c._id || 'Other'),
    datasets: [{
      data: catData.map(c => c.revenue),
      backgroundColor: CAT_COLORS,
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  const chartBase = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };
  const yMoney = { y: { ticks: { callback: v=>`$${(v/1000).toFixed(0)}k`, font:{size:11} }, grid:{color:'rgba(0,0,0,.04)'} }, x:{ticks:{font:{size:11}},grid:{display:false}} };

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>
  );

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 mr-1">Period:</span>
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className={`btn btn-sm ${period===p.value ? 'btn-primary' : ''}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Inventory summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total products', value: invVal.totals?.productCount || 0 },
          { label: 'Total units',    value: invVal.totals?.totalUnits || 0 },
          { label: 'Stock cost value', value: currency(invVal.totals?.totalCostValue || 0) },
          { label: 'Retail value',     value: currency(invVal.totals?.totalSellingValue || 0) },
        ].map((c,i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue line chart */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Revenue trend</h2>
        <div className="h-60">
          <Line data={lineData} options={{ ...chartBase, scales: yMoney }} />
        </div>
      </div>

      {/* 2-col charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top products */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Top products by revenue</h2>
          <div className="h-56">
            <Bar data={topData} options={{ ...chartBase, indexAxis: 'y', scales: {
              x: { ticks:{ callback:v=>`$${(v/1000).toFixed(0)}k`, font:{size:11}}, grid:{color:'rgba(0,0,0,.04)'} },
              y: { ticks:{font:{size:11}}, grid:{display:false} },
            }}} />
          </div>
        </div>

        {/* Sales by category */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Sales by category</h2>
          <div className="h-40">
            <Doughnut data={catChart} options={{ ...chartBase, cutout:'65%' }} />
          </div>
          <div className="mt-4 space-y-2">
            {catData.slice(0,5).map((c,i) => (
              <div key={c._id} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[i] }} />
                <span className="flex-1 text-gray-600">{c._id || 'Other'}</span>
                <span className="font-medium text-gray-800">{currency(c.revenue)}</span>
                <span className="text-gray-400">{c.quantity} units</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory by category */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Inventory value by category</h2>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Category</th><th>Products</th><th>Units</th><th>Cost value</th><th>Retail value</th><th>Potential profit</th></tr>
            </thead>
            <tbody>
              {invVal.data.map(row => (
                <tr key={row._id}>
                  <td className="font-medium">{row._id || 'Uncategorised'}</td>
                  <td className="text-gray-500">{row.productCount}</td>
                  <td className="text-gray-500">{row.totalUnits}</td>
                  <td>{currency(row.totalCostValue)}</td>
                  <td className="font-medium">{currency(row.totalSellingValue)}</td>
                  <td className="text-emerald-600 font-medium">{currency(row.totalSellingValue - row.totalCostValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
