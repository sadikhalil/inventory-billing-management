import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Barcode, Package, Receipt, BarChart2, Layers, Users,
  Shield, Zap, Globe, ChevronRight, Check, Eye, EyeOff,
  ArrowRight, Star, TrendingUp, ShoppingCart, AlertTriangle,
  Menu, X, DollarSign,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ── Demo credentials ──────────────────────────────────────
const DEMO_ACCOUNTS = [
  { role: 'Admin',   email: 'admin@invotrack.com',   password: 'Admin@1234',   color: 'bg-blue-100 text-blue-700' },
  { role: 'Manager', email: 'manager@invotrack.com', password: 'Manager@1234', color: 'bg-emerald-100 text-emerald-700' },
  { role: 'Cashier', email: 'cashier@invotrack.com', password: 'Cashier@1234', color: 'bg-amber-100 text-amber-700' },
];

// ── Features data ─────────────────────────────────────────
const FEATURES = [
  {
    icon: Package,
    title: 'Product Management',
    desc: 'Full CRUD for products with SKU, barcode, categories, pricing, and real-time stock tracking.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: ShoppingCart,
    title: 'Order Management',
    desc: 'Create and manage orders with automatic stock deduction, status tracking, and payment updates.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: Receipt,
    title: 'Invoice & Billing',
    desc: 'Generate professional invoices with PDF export, payment terms, and overdue tracking.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: BarChart2,
    title: 'Sales Analytics',
    desc: 'Revenue trends, top products, sales by category, and inventory value reports.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Layers,
    title: 'Inventory Control',
    desc: 'Stock movement logs, reorder alerts, adjustments, and complete audit trail.',
    color: 'bg-red-50 text-red-600',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    desc: 'Admin, Manager, Cashier, and Viewer roles with fine-grained permissions on every route.',
    color: 'bg-pink-50 text-pink-600',
  },
  {
    icon: Barcode,
    title: 'Barcode Scanner',
    desc: 'Look up products instantly by scanning or entering barcodes and SKUs.',
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    icon: Zap,
    title: 'REST API',
    desc: 'Full REST API with JWT auth, validation, rate limiting, and proper HTTP status codes.',
    color: 'bg-orange-50 text-orange-600',
  },
];

// ── Stats ─────────────────────────────────────────────────
const STATS = [
  { label: 'API Endpoints', value: '35+', icon: Globe },
  { label: 'Products Managed', value: '10K+', icon: Package },
  { label: 'Invoice Generated', value: '500+', icon: Receipt },
  { label: 'Uptime', value: '99.9%', icon: TrendingUp },
];

// ── How it works steps ────────────────────────────────────
const STEPS = [
  { step: '01', title: 'Add Products', desc: 'Set up your product catalog with pricing, stock levels, and barcodes.' },
  { step: '02', title: 'Create Orders', desc: 'Manage customer orders — stock updates automatically on every sale.' },
  { step: '03', title: 'Generate Invoices', desc: 'Create professional invoices and export them as PDF with one click.' },
  { step: '04', title: 'Track Analytics', desc: 'Monitor revenue, top products, and inventory value in real time.' },
];

export default function Landing() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [modal,    setModal]    = useState(null); // 'login' | 'signup'
  const [mobileNav,setMobileNav]= useState(false);

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showPass,  setShowPass]  = useState(false);
  const [loginLoad, setLoginLoad] = useState(false);
  const [loginErr,  setLoginErr]  = useState('');

  // Signup form
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [signupLoad, setSignupLoad] = useState(false);
  const [signupErr,  setSignupErr]  = useState('');
  const [showPass2,  setShowPass2]  = useState(false);

  // ── Handlers ─────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) { setLoginErr('Please fill in all fields.'); return; }
    setLoginLoad(true); setLoginErr('');
    try {
      await login(loginForm.email.trim(), loginForm.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      setLoginErr(err?.response?.data?.message || 'Invalid email or password.');
    } finally { setLoginLoad(false); }
  };

  const fillDemo = (acc) => {
    setLoginForm({ email: acc.email, password: acc.password });
    setLoginErr('');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      setSignupErr('All fields are required.'); return;
    }
    if (signupForm.password !== signupForm.confirm) {
      setSignupErr('Passwords do not match.'); return;
    }
    if (signupForm.password.length < 8) {
      setSignupErr('Password must be at least 8 characters.'); return;
    }
    setSignupLoad(true); setSignupErr('');
    try {
      const { authAPI } = await import('../utils/api');
      await authAPI.register({
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
      });
      toast.success('Account created! Please log in.');
      setModal('login');
      setLoginForm({ email: signupForm.email, password: '' });
      setSignupForm({ name: '', email: '', password: '', confirm: '' });
    } catch (err) {
      setSignupErr(err?.response?.data?.message || 'Registration failed. Try again.');
    } finally { setSignupLoad(false); }
  };

  const closeModal = () => {
    setModal(null);
    setLoginErr(''); setSignupErr('');
  };

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Barcode size={16} className="text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-lg">InvoTrack</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#demo" className="hover:text-gray-900 transition-colors">Demo</a>
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setModal('login')}
              className="px-4 h-9 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => setModal('signup')}
              className="px-4 h-9 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Get started
            </button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileNav && (
          <div className="md:hidden bg-white border-t border-gray-100 px-5 py-4 space-y-3">
            <a href="#features" className="block text-sm text-gray-600 py-1" onClick={() => setMobileNav(false)}>Features</a>
            <a href="#how-it-works" className="block text-sm text-gray-600 py-1" onClick={() => setMobileNav(false)}>How it works</a>
            <a href="#demo" className="block text-sm text-gray-600 py-1" onClick={() => setMobileNav(false)}>Demo</a>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setModal('login'); setMobileNav(false); }}
                className="flex-1 h-9 rounded-lg text-sm font-medium border border-gray-200 text-gray-700">
                Sign in
              </button>
              <button onClick={() => { setModal('signup'); setMobileNav(false); }}
                className="flex-1 h-9 rounded-lg text-sm font-medium bg-blue-600 text-white">
                Get started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-5 bg-gradient-to-b from-blue-50/60 to-white">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Star size={11} fill="currentColor" />
            Smart Inventory & Billing Management System
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Manage inventory &<br />
            <span className="text-blue-600">billing in one place</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            A professional platform for managing products, orders, invoices, and analytics.
            Built with Node.js, MongoDB, and React — complete with REST APIs and role-based access control.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setModal('signup')}
              className="flex items-center gap-2 px-6 h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-200"
            >
              Get started free <ArrowRight size={15} />
            </button>
            <button
              onClick={() => setModal('login')}
              className="flex items-center gap-2 px-6 h-11 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors border border-gray-200 shadow-sm"
            >
              Sign in to dashboard
            </button>
          </div>

          {/* Trust line */}
          <p className="text-xs text-gray-400 mt-6">
            No credit card required · Free to use · Full source code included
          </p>
        </div>

        {/* Hero dashboard preview */}
        <div className="max-w-5xl mx-auto mt-16">
          <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200 border border-gray-100 overflow-hidden">
            {/* Fake browser bar */}
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white border border-gray-200 rounded-md h-6 flex items-center px-3">
                <span className="text-xs text-gray-400">localhost:3000/dashboard</span>
              </div>
            </div>
            {/* Dashboard mockup */}
            <div className="p-5 bg-gray-50">
              {/* Metrics */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Revenue', value: '$84,290', icon: DollarSign, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Orders', value: '1,247', icon: ShoppingCart, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Products', value: '18', icon: Package, color: 'text-violet-600 bg-violet-50' },
                  { label: 'Low Stock', value: '3', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
                ].map((m, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{m.label}</span>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${m.color}`}>
                        <m.icon size={11} />
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{m.value}</div>
                  </div>
                ))}
              </div>
              {/* Chart placeholder */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm border border-gray-100 h-32 flex items-end gap-1.5">
                  {[40, 65, 45, 80, 60, 90, 75, 95, 70, 85, 100, 88].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `rgba(37,99,235,${0.2 + i * 0.06})` }} />
                  ))}
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 h-32 flex flex-col justify-center gap-2">
                  {[['Electronics', 45, '#2563EB'], ['Storage', 25, '#10B981'], ['Office', 18, '#F59E0B'], ['Other', 12, '#EF4444']].map(([label, pct, color]) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-[10px] text-gray-500 flex-1">{label}</span>
                      <span className="text-[10px] font-semibold text-gray-700">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────── */}
      <section className="py-14 border-y border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">{s.value}</div>
                <div className="text-sm text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section id="features" className="py-20 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Features</div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to run your business
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              From product management to analytics — all modules are built and ready to use.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-md rounded-2xl p-5 transition-all duration-200 cursor-default">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon size={18} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-5 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">How it works</div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Up and running in minutes</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Follow these 4 simple steps to start managing your inventory and billing.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gray-200 z-0" style={{ width: 'calc(100% - 48px)', left: '48px' }} />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO ACCOUNTS ──────────────────────────────────── */}
      <section id="demo" className="py-20 px-5 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Demo</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Try it right now</h2>
            <p className="text-gray-500">Use any of these demo accounts to explore the system. Each role has different permissions.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {DEMO_ACCOUNTS.map((acc, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold mb-4 ${acc.color}`}>
                  {acc.role}
                </div>
                <div className="space-y-2 text-xs text-gray-500 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-16">Email</span>
                    <span className="font-mono text-gray-700 truncate">{acc.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-16">Password</span>
                    <span className="font-mono text-gray-700">{acc.password}</span>
                  </div>
                </div>
                <button
                  onClick={() => { fillDemo(acc); setModal('login'); }}
                  className="w-full h-8 rounded-lg bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  Login as {acc.role} <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Permissions table */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Role permissions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-medium text-gray-400">Permission</th>
                    {['Admin','Manager','Cashier','Viewer'].map(r => (
                      <th key={r} className="text-center py-2 px-3 font-medium text-gray-600">{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Manage products',    true,  true,  false, false],
                    ['Create orders',      true,  true,  true,  false],
                    ['Create invoices',    true,  true,  true,  false],
                    ['View analytics',     true,  true,  false, true ],
                    ['Adjust inventory',   true,  true,  false, false],
                    ['Manage users',       true,  false, false, false],
                    ['Delete records',     true,  true,  false, false],
                    ['View only',          true,  true,  true,  true ],
                  ].map(([label, ...perms]) => (
                    <tr key={label} className="border-b border-gray-100">
                      <td className="py-2.5 pr-4 text-gray-600">{label}</td>
                      {perms.map((has, j) => (
                        <td key={j} className="py-2.5 px-3 text-center">
                          {has
                            ? <Check size={13} className="text-emerald-500 mx-auto" />
                            : <span className="text-gray-300 text-base leading-none mx-auto block text-center">—</span>
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to manage your inventory?
          </h2>
          <p className="text-blue-200 mb-8 text-lg">
            Create your account or sign in to get started immediately.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setModal('signup')}
              className="px-8 h-12 rounded-xl bg-white text-blue-700 font-semibold text-sm hover:bg-blue-50 transition-colors shadow-lg"
            >
              Create free account
            </button>
            <button
              onClick={() => setModal('login')}
              className="px-8 h-12 rounded-xl border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="py-8 px-5 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Barcode size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">InvoTrack</span>
          </div>
          <p className="text-xs text-gray-400">
            Smart Inventory & Billing Management System · Built with Node.js, MongoDB & React
          </p>
          <div className="flex gap-5 text-xs text-gray-400">
            <a href="#features" className="hover:text-gray-600">Features</a>
            <a href="#how-it-works" className="hover:text-gray-600">How it works</a>
            <a href="#demo" className="hover:text-gray-600">Demo</a>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════ */}
      {/* LOGIN MODAL                                        */}
      {/* ═══════════════════════════════════════════════════ */}
      {modal === 'login' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Welcome back</h2>
                <p className="text-xs text-gray-400 mt-0.5">Sign in to your account</p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleLogin} className="px-6 py-5 space-y-4">
              {loginErr && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2.5">
                  {loginErr}
                </div>
              )}
              <div>
                <label className="input-label">Email address</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="input"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    className="input pr-10"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loginLoad}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                {loginLoad
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><ArrowRight size={15} /> Sign in</>
                }
              </button>

              {/* Demo accounts */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[11px] text-gray-400 text-center mb-2">Quick demo login</p>
                <div className="grid grid-cols-3 gap-2">
                  {DEMO_ACCOUNTS.map(acc => (
                    <button key={acc.role} type="button" onClick={() => fillDemo(acc)}
                      className={`py-1.5 rounded-lg text-[11px] font-medium transition-colors ${acc.color} hover:opacity-80`}>
                      {acc.role}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            {/* Switch to signup */}
            <div className="px-6 pb-5 text-center text-xs text-gray-400">
              Don't have an account?{' '}
              <button onClick={() => setModal('signup')} className="text-blue-600 font-semibold hover:underline">
                Create one
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* SIGNUP MODAL                                       */}
      {/* ═══════════════════════════════════════════════════ */}
      {modal === 'signup' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Create account</h2>
                <p className="text-xs text-gray-400 mt-0.5">Start managing your inventory</p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSignup} className="px-6 py-5 space-y-4">
              {signupErr && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2.5">
                  {signupErr}
                </div>
              )}
              <div>
                <label className="input-label">Full name</label>
                <input
                  type="text"
                  value={signupForm.name}
                  onChange={e => setSignupForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  className="input"
                />
              </div>
              <div>
                <label className="input-label">Email address</label>
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="input"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <input
                    type={showPass2 ? 'text' : 'password'}
                    value={signupForm.password}
                    onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 8 characters"
                    className="input pr-10"
                  />
                  <button type="button" onClick={() => setShowPass2(!showPass2)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass2 ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="input-label">Confirm password</label>
                <input
                  type="password"
                  value={signupForm.confirm}
                  onChange={e => setSignupForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="Repeat password"
                  className="input"
                />
              </div>

              {/* Features list */}
              <div className="bg-blue-50 rounded-xl p-3 space-y-1.5">
                {['Free account · No credit card','Full access to all modules','Role-based permissions included'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-blue-700">
                    <Check size={11} className="text-blue-500 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <button type="submit" disabled={signupLoad}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                {signupLoad
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><ArrowRight size={15} /> Create account</>
                }
              </button>
            </form>

            {/* Switch to login */}
            <div className="px-6 pb-5 text-center text-xs text-gray-400">
              Already have an account?{' '}
              <button onClick={() => setModal('login')} className="text-blue-600 font-semibold hover:underline">
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
